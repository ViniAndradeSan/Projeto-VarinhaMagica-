import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { SpellDefinition } from "../types/wandState";

type VoicePanelProps = {
  spell: SpellDefinition;
  phase: "recognized" | "listening";
  onStartListening: () => void;
  onResult: (transcript: string) => void;
};

type VoiceStatus = "idle" | "requesting" | "recording" | "processing";

export function VoicePanel({ spell, phase, onStartListening, onResult }: VoicePanelProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResultRef = useRef(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  const isListening = phase === "listening";

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
      setStatus("recording");
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (status !== "processing") {
        setStatus("idle");
      }
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }

      cleanupRecording();
    };
  }, []);

  const handlePress = () => {
    if (status === "recording") {
      stopRecording();
      return;
    }

    if (status === "requesting" || status === "processing") {
      return;
    }

    requestMicrophoneAndStart();
  };

  const requestMicrophoneAndStart = async () => {
    try {
      setStatus("requesting");
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "O acesso ao microfone é necessário para gravar sua voz."
        );
        setStatus("idle");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        staysActiveInBackground: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setStatus("recording");
      onStartListening();
      hasResultRef.current = false;

      if (Platform.OS === "web") {
        startWebSpeechRecognition();
        return;
      }

      recognitionTimeoutRef.current = setTimeout(() => {
        if (!hasResultRef.current) {
          stopRecording();
        }
      }, 7000);
    } catch (error) {
      console.error("Falha ao iniciar gravação", error);
      cleanupRecording();
      setStatus("idle");

      if (Platform.OS !== "web") {
        promptForTranscript();
      } else {
        Alert.alert("Erro", "Não foi possível iniciar a gravação. Tente novamente.");
      }
    }
  };

  const handleSpeechResults = (event: any) => {
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    const transcript = Array.isArray(event.value)
      ? event.value.join(" ")
      : event.value?.[0] ?? "";
    hasResultRef.current = true;
    finishWithTranscript(transcript);
  };

  const handleSpeechError = (event: any) => {
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    console.warn("Speech recognition failed", event);
    cleanupRecording();
    setStatus("idle");
    promptForTranscript();
  };

  const handleSpeechEnd = () => {
    if (!hasResultRef.current) {
      setStatus("processing");
      promptForTranscript();
    }
  };

  const startWebSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results[0]).map((result: any) => result[0].transcript).join(" ");
      finishWithTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition failed", event);
      Alert.alert("Erro", "Não consegui ouvir. Por favor, tente novamente.");
      cleanupRecording();
      setStatus("idle");
      promptForTranscript();
    };

    recognition.onend = () => {
      if (!hasResultRef.current) {
        setStatus("processing");
        promptForTranscript();
      }
    };

    recognition.start();
  };

  const stopRecording = async () => {
    try {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }

      setStatus("processing");

      if (Platform.OS !== "web") {
        promptForTranscript();
      }
    } catch (error) {
      console.error("Falha ao parar gravação", error);
      Alert.alert("Erro", "Não foi possível parar a gravação. Tente novamente.");
      setStatus("idle");
    }
  };

  const cleanupRecording = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      recordingRef.current = null;
    }
  };

  const finishWithTranscript = (transcript: string) => {
    cleanupRecording();
    setStatus("idle");
    onResult(transcript.trim());
  };

  const promptForTranscript = () => {
    const promptMethod = (Alert as any).prompt;
    if (typeof promptMethod === "function") {
      promptMethod(
        "Digite a palavra mágica",
        `Gesto reconhecido: ${spell.name}`,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setStatus("idle"),
          },
          {
            text: "Confirmar",
            onPress: (text: string) => {
              if (text && text.trim()) {
                finishWithTranscript(text.trim());
              } else {
                setStatus("idle");
              }
            },
          },
        ],
        "plain-text"
      );
      return;
    }

    setFallbackText("");
    setShowTextFallback(true);
  };

  const submitFallbackText = () => {
    if (fallbackText.trim()) {
      finishWithTranscript(fallbackText.trim());
      setShowTextFallback(false);
      return;
    }

    setStatus("idle");
    setShowTextFallback(false);
  };

  const hintText =
    status === "requesting"
      ? "Solicitando permissão de microfone..."
      : status === "recording"
      ? "🎤 Gravando... toque novamente para parar"
      : status === "processing"
      ? "Processando..."
      : `Pressione e diga: "${spell.voiceCommand}"`;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: spell.color + "55" }]}> 
        <Text style={styles.gestureLabel}>Gesto reconhecido!</Text>
        <Text style={[styles.spellName, { color: spell.color }]}>{spell.name}</Text>
        <Text style={styles.hint}>{hintText}</Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              status === "recording" && styles.micButtonActive,
              { borderColor: spell.color },
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={styles.micIcon}>{status === "recording" ? "🎙️" : "🎤"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {status === "processing" && <Text style={styles.processing}>Processando...</Text>}
      </View>

      {showTextFallback && (
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Digite a palavra mágica</Text>
            <Text style={styles.promptMessage}>
              Gesto reconhecido: {spell.name}
            </Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Digite o comando..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={fallbackText}
              onChangeText={setFallbackText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitFallbackText}
            />
            <View style={styles.promptButtons}>
              <TouchableOpacity
                style={[styles.promptButton, styles.promptCancelButton]}
                onPress={() => {
                  setShowTextFallback(false);
                  setStatus("idle");
                }}
              >
                <Text style={styles.promptButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptButton, styles.promptConfirmButton]}
                onPress={submitFallbackText}
              >
                <Text style={styles.promptButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(10, 4, 30, 0.92)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  gestureLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  spellName: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  hint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  micIcon: {
    fontSize: 30,
  },
  processing: {
    marginTop: 12,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  promptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  promptCard: {
    width: "90%",
    backgroundColor: "rgba(20, 10, 40, 0.95)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  promptTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  promptMessage: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    marginBottom: 16,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    marginBottom: 16,
  },
  promptButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  promptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  promptCancelButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    marginRight: 12,
  },
  promptConfirmButton: {
    backgroundColor: "#7c3aed",
  },
  promptButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
