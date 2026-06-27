import { StyleSheet, View } from 'react-native';
import { MotionHistory } from '@/features/sensors/types/motion';
import { color } from '@/constants/color';
import { POINT_SIZE, HALF_POINT, opacity } from '@/constants/world';

type TrailProps = {
    history: MotionHistory;
}

export function Trail({ history }: TrailProps) {
    return (
        <>
            {history.map((point, index) => (
  <View key={index} style={[styles.point, { left: point.x - HALF_POINT, top: point.y - HALF_POINT, opacity }]} />
))}
        </>
    );
}

const styles = StyleSheet.create({
    point: {
        position: 'absolute',
        width: POINT_SIZE,
        height: POINT_SIZE,
        borderRadius: HALF_POINT,
        backgroundColor: color.backgroundBranco, 
    },
});
