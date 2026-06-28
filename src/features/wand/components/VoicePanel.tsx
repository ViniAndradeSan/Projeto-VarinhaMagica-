import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type { SpellDefinition } from "../types/wandState";

type VoicePanelProps = {
  spell: SpellDefinition;
  phase: "recognized" | "listening";
  voiceCaption: string | null;
  onStartListening: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
};

// HTML mínimo com Web Speech API — roda dentro do WebView invisível
function buildSpeechHtml(lang: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
<script>
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unsupported' }));
  } else {
    let hasFinalResult = false;
    let timeoutId = null;

    const rec = new Rec();
    rec.lang = '${lang}';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 5;

    function sendMessage(type, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
    }

    function startRecognition() {
      try {
        rec.start();
        timeoutId = window.setTimeout(() => {
          rec.stop();
        }, 5200);
      } catch (error) {
        sendMessage('error', error?.message || 'start_failed');
      }
    }

    rec.onresult = function(e) {
      const transcripts = [];
      for (let i = 0; i < e.results[0].length; i++) {
        transcripts.push(e.results[0][i].transcript);
      }
      const transcript = transcripts.join(' ');
      const isFinal = e.results[0].isFinal;
      sendMessage(isFinal ? 'result' : 'partial', transcript);
      if (isFinal) hasFinalResult = true;
    };

    rec.onerror = function(e) {
      sendMessage('error', e.error || 'unknown_error');
    };

    rec.onend = function() {
      if (!hasFinalResult) {
        sendMessage('noresult');
      } else {
        sendMessage('end');
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    window.addEventListener('message', function(msg) {
      try {
        if (msg.data === 'start') startRecognition();
        else if (msg.data === 'stop') rec.stop();
      } catch(e) {}
    });

    document.addEventListener('message', function(msg) {
      try {
        if (msg.data === 'start') startRecognition();
        else if (msg.data === 'stop') rec.stop();
      } catch(e) {}
    });
  }
</script>
</body>
</html>`;
}

export function VoicePanel({ spell, phase, voiceCaption, onStartListening, onResult }: VoicePanelProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const captionOpacity = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef<React.ElementRef<typeof WebView> | null>(null);
  const listeningRef = useRef(false);
  const resultReceivedRef = useRef(false);

  const isListening = phase === "listening";

  // Animação de pulso enquanto ouve
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 550, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  useEffect(() => {
    if (voiceCaption) {
      Animated.timing(captionOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(captionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [voiceCaption]);

  const startVoice = () => {
    if (listeningRef.current) return;
    listeningRef.current = true;
    resultReceivedRef.current = false;
    onStartListening();
    // Pequeno delay para o WebView estar pronto
    setTimeout(() => {
      webViewRef.current?.postMessage("start");
      window.setTimeout(() => {
        if (listeningRef.current) {
          webViewRef.current?.postMessage("stop");
        }
      }, 5200);
    }, 200);
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    let msg: { type: string; data?: string };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (msg.type === "result") {
      listeningRef.current = false;
      resultReceivedRef.current = true;
      onResult(msg.data || "", true);
    } else if (msg.type === "partial") {
      resultReceivedRef.current = true;
      onResult(msg.data || "", false);
    } else if (msg.type === "noresult") {
      listeningRef.current = false;
      onResult("", true);
    } else if (msg.type === "error") {
      listeningRef.current = false;
      onResult("", true);
    } else if (msg.type === "unsupported") {
      listeningRef.current = false;
      onResult("", true);
    } else if (msg.type === "end") {
      listeningRef.current = false;
      if (!resultReceivedRef.current) {
        onResult("", true);
      }
    }
  };

  const statusText = isListening
    ? `🎙️ Ouvindo... diga "${spell.voiceCommand}"`
    : `Pressione e diga:\n"${spell.voiceCommand}"`;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: spell.color + "55" }]}>
        <Text style={styles.gestureLabel}>Gesto reconhecido!</Text>
        <Text style={[styles.spellName, { color: spell.color }]}>{spell.name}</Text>
        <Text style={styles.description}>{spell.description}</Text>

        <Text style={styles.hint}>{statusText}</Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonActive,
              { borderColor: spell.color },
              isListening && { backgroundColor: spell.color + "30" },
            ]}
            onPress={startVoice}
            disabled={isListening}
            activeOpacity={0.8}
          >
            <Text style={styles.micIcon}>{isListening ? "🎙️" : "🎤"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {isListening && (
          <Text style={[styles.listeningLabel, { color: spell.color }]}>
            Ouvindo...
          </Text>
        )}

        {voiceCaption ? (
          <Animated.Text style={[styles.caption, { opacity: captionOpacity, color: spell.color }]}> 
            {voiceCaption}
          </Animated.Text>
        ) : null}
      </View>

      {/* WebView invisível com Web Speech API */}
      <View style={styles.hiddenWebView}>
        <WebView
          ref={webViewRef}
          source={{ html: buildSpeechHtml("pt-BR") }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          originWhitelist={["*"]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(10, 4, 30, 0.95)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  gestureLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  spellName: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  description: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginBottom: 18,
  },
  hint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  micIcon: {
    fontSize: 32,
  },
  listeningLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  caption: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
    opacity: 0,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
    position: "absolute",
  },
});
