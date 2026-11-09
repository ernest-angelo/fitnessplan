import type { WorkoutPlan } from '@/types/workout';
import { MaterialIcons } from '@expo/vector-icons';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type WorkoutCardProps = {
    workout: WorkoutPlan;
    onPress: () => void;
};

export default function WorkoutCard({
    workout,
    onPress,
}: WorkoutCardProps) {
    return (
        <Pressable
            style={styles.planCard}
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={workout.icon as keyof typeof MaterialIcons.glyphMap}
                    size={28}
                    color="#000000ff"
                />
            </View>

            <Text style={styles.planName}>
                {workout.name}
            </Text>

            {!!workout.goal && (
                <Text style={styles.planMeta}>
                    Goal: {workout.goal}
                </Text>
            )}

            {!!workout.difficulty && (
                <Text style={styles.planMeta}>
                    Difficulty: {workout.difficulty}
                </Text>
            )}

            {!!workout.description && (
                <Text style={styles.planDescription} numberOfLines={2}>
                    {workout.description}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 10,
    },
    planName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    planMeta: {
        fontSize: 13,
        color: '#555',
        marginBottom: 2,
    },
    planDescription: {
        fontSize: 13,
        color: '#888',
        marginTop: 6,
    },
});