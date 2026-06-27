import { StyleSheet, View } from 'react-native';
import { MotionHistory } from '@/features/sensors/types/motion';
import { color } from '@/constants/color';
import { POINT_SIZE, HALF_POINT } from '@/constants/world';

type TrailProps = {
    history: MotionHistory;
}

export function Trail({ history }: TrailProps) {
    return (
        <>
            {history.map((point, index) => {
                const opacity = (index + 1) / history.length;

                return (
                    <View 
                        key={index}
                        style={[
                            styles.point,
                            {
                                left: point.x - HALF_POINT, 
                                top: point.y - HALF_POINT, 
                                opacity: opacity
                            }
                        ]}
                    />
                );
            })}
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
