import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ensureInProgressSession } from '@/lib/workout-session';

// ─── Types ────────────────────────────────────────────────────────────────────

type Exercise = {
  id: string;
  name: string;
};

type WorkoutExercise = {
  id: string;
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
  notes: string | null;
  exercises: Exercise;
};

type WorkoutPlanDay = {
  id: string;
  name: string;
  day_number: number;
  workout_exercises: WorkoutExercise[];
};

type WorkoutPlan = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  visibility: string | null;
  workout_plan_days: WorkoutPlanDay[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inProgressByDay, setInProgressByDay] = useState<Record<string, string>>({});
  const [startingDayId, setStartingDayId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchPlan();
    }, [id])
  );

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('workout_plans')
        .select(
          `id, name, description, goal, difficulty, visibility,
           workout_plan_days (
             id, name, day_number,
             workout_exercises (
               id, exercise_id, target_sets, target_reps, rest_seconds, notes,
               exercises ( id, name )
             )
           )`
        )
        .eq('id', id)
        .order('day_number', { referencedTable: 'workout_plan_days', ascending: true })
        .single();

      if (fetchError) {
        setError(fetchError.message || 'Failed to load plan.');
      } else {
        setPlan(data as unknown as WorkoutPlan);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: activeSessions, error: sessionError } = await supabase
          .from('workout_sessions')
          .select('id, day_id')
          .eq('user_id', user.id)
          .eq('plan_id', id)
          .eq('status', 'IN_PROGRESS');

        if (sessionError) {
          console.error(sessionError);
        } else {
          const map: Record<string, string> = {};
          for (const row of activeSessions ?? []) {
            map[row.day_id as string] = row.id as string;
          }
          setInProgressByDay(map);
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete Plan ─────────────────────────────────────────────────────────────

  const handleDeletePlan = () => {
    Alert.alert(
      'Delete Plan',
      `Delete "${plan?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeletePlan,
        },
      ]
    );
  };

  const confirmDeletePlan = async () => {
    try {
      // Single delete — FK cascade removes workout_plan_days and workout_exercises.
      const { error: deleteError } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', id);

      if (deleteError) {
        Alert.alert('Error', deleteError.message || 'Failed to delete plan.');
        return;
      }

      router.replace('/(app)/workouts');
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // ── Delete Exercise ─────────────────────────────────────────────────────────

  const handleDeleteExercise = (workoutExerciseId: string, exerciseName: string) => {
    Alert.alert(
      'Remove Exercise',
      `Remove "${exerciseName}" from this day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => confirmDeleteExercise(workoutExerciseId),
        },
      ]
    );
  };

  const handleStartWorkout = async (day: WorkoutPlanDay) => {
    if (!id || startingDayId) return;

    if (!day.workout_exercises.length) {
      Alert.alert('No exercises', 'Add at least one exercise before starting this workout.');
      return;
    }

    setStartingDayId(day.id);

    try {
      const { session, error: startError } = await ensureInProgressSession(id, day.id);
      if (startError || !session) {
        Alert.alert('Unable to start workout', startError || 'Please try again.');
        return;
      }

      router.push(
        `/(app)/workouts/${id}/day/${day.id}/workout?session_id=${session.id}`
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Unable to start workout', 'An unexpected error occurred.');
    } finally {
      setStartingDayId(null);
    }
  };

  const confirmDeleteExercise = async (workoutExerciseId: string) => {
    try {
      // Delete only from workout_exercises — never touches the exercises catalog.
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', workoutExerciseId);

      if (deleteError) {
        Alert.alert('Error', deleteError.message || 'Failed to remove exercise.');
        return;
      }

      // Refresh the plan to reflect the removal.
      fetchPlan();
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // ── Render states ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchPlan}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Plan not found.</Text>
      </View>
    );
  }

  const sortedDays = [...(plan.workout_plan_days ?? [])].sort(
    (a, b) => a.day_number - b.day_number
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* ── Plan Header ── */}
      <View style={styles.planHeader}>
        <View style={styles.planHeaderText}>
          <Text style={styles.planName}>{plan.name}</Text>
          {!!plan.goal && (
            <Text style={styles.planMeta}>Goal: {plan.goal.replace(/_/g, ' ')}</Text>
          )}
          {!!plan.difficulty && (
            <Text style={styles.planMeta}>Difficulty: {plan.difficulty}</Text>
          )}
          {!!plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}
        </View>
        <View style={styles.planActions}>
          <Pressable
            style={styles.editPlanButton}
            onPress={() => router.push(`/(app)/workouts/${id}/edit`)}
          >
            <Text style={styles.editPlanButtonText}>Edit Plan</Text>
          </Pressable>
          <Pressable style={styles.deletePlanButton} onPress={handleDeletePlan}>
            <Text style={styles.deletePlanButtonText}>Delete Plan</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Days ── */}
      {sortedDays.length === 0 ? (
        <View style={styles.emptyDays}>
          <Text style={styles.emptyDaysText}>No days added yet.</Text>
        </View>
      ) : (
        sortedDays.map((day) => (
          <View key={day.id} style={styles.dayCard}>
            {/* Day header */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                Day {day.day_number} — {day.name}
              </Text>
              <View style={styles.dayActions}>
                <Pressable
                  style={styles.dayActionButton}
                  onPress={() =>
                    router.push(`/(app)/workouts/${id}/add-day?day_id=${day.id}`)
                  }
                >
                  <Text style={styles.dayActionButtonText}>Edit Day</Text>
                </Pressable>
                <Pressable
                  style={[styles.dayActionButton, styles.addExerciseButton]}
                  onPress={() =>
                    router.push(`/(app)/workouts/${id}/day/${day.id}/add-exercise`)
                  }
                >
                  <Text style={[styles.dayActionButtonText, styles.addExerciseButtonText]}>
                    + Exercise
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Exercises */}
            {day.workout_exercises.length === 0 ? (
              <Text style={styles.noExercisesText}>No exercises added.</Text>
            ) : (
              day.workout_exercises.map((we) => (
                <View key={we.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{we.exercises?.name ?? '—'}</Text>
                    <Text style={styles.exerciseMeta}>
                      {we.target_sets} × {we.target_reps} · {we.rest_seconds}s rest
                    </Text>
                    {!!we.notes && (
                      <Text style={styles.exerciseNotes}>{we.notes}</Text>
                    )}
                  </View>
                  <View style={styles.exerciseActions}>
                    <Pressable
                      style={styles.exerciseEditButton}
                      onPress={() =>
                        router.push(
                          `/(app)/workouts/${id}/day/${day.id}/add-exercise?workout_exercise_id=${we.id}`
                        )
                      }
                    >
                      <Text style={styles.exerciseEditButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.exerciseDeleteButton}
                      onPress={() =>
                        handleDeleteExercise(we.id, we.exercises?.name ?? 'exercise')
                      }
                    >
                      <Text style={styles.exerciseDeleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            <Pressable
              style={[
                styles.startWorkoutButton,
                startingDayId === day.id && styles.startWorkoutButtonDisabled,
              ]}
              onPress={() => handleStartWorkout(day)}
              disabled={startingDayId === day.id}
            >
              <Text style={styles.startWorkoutButtonText}>
                {startingDayId === day.id
                  ? 'Starting...'
                  : inProgressByDay[day.id]
                    ? 'Continue Workout'
                    : 'Start Workout'}
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {/* ── Add Day button ── */}
      <Pressable
        style={styles.addDayButton}
        onPress={() => router.push(`/(app)/workouts/${id}/add-day`)}
      >
        <Text style={styles.addDayButtonText}>+ Add Day</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Plan Header
  planHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeaderText: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  planMeta: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  planDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editPlanButton: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d6ff',
  },
  editPlanButtonText: {
    color: '#2d5be3',
    fontWeight: '600',
    fontSize: 14,
  },
  deletePlanButton: {
    flex: 1,
    backgroundColor: '#fff0f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffc7c7',
  },
  deletePlanButtonText: {
    color: '#c0392b',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty days
  emptyDays: {
    padding: 24,
    alignItems: 'center',
  },
  emptyDaysText: {
    fontSize: 15,
    color: '#888',
  },

  // Day card
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  dayActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dayActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayActionButtonText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  addExerciseButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  addExerciseButtonText: {
    color: '#2e7d32',
  },
  noExercisesText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Exercise row
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#666',
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
  },
  exerciseEditButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  exerciseEditButtonText: {
    fontSize: 12,
    color: '#1565c0',
    fontWeight: '600',
  },
  exerciseDeleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  exerciseDeleteButtonText: {
    fontSize: 12,
    color: '#c0392b',
    fontWeight: '600',
  },

  startWorkoutButton: {
    marginTop: 12,
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startWorkoutButtonDisabled: {
    opacity: 0.7,
  },
  startWorkoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Add Day
  addDayButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addDayButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Shared
  errorText: {
    color: '#c0392b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
