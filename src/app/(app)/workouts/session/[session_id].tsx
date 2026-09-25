import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  formatDurationLabel,
  getAuthenticatedUserId,
  type WorkoutSessionRow,
  type WorkoutSetRow,
} from '@/lib/workout-session';

export default function WorkoutSummaryScreen() {
  const { session_id: sessionId } = useLocalSearchParams<{ session_id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dayName, setDayName] = useState('');
  const [planName, setPlanName] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [completedSetCount, setCompletedSetCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const auth = await getAuthenticatedUserId();
      if (auth.userId === null) {
        setError(auth.error);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, user_id, plan_id, day_id, started_at, completed_at, duration_seconds, status')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) {
        console.error(sessionError);
        setError(sessionError.message || 'Unable to load workout summary.');
        return;
      }

      const session = sessionData as WorkoutSessionRow | null;
      if (!session) {
        setError('Workout session not found.');
        return;
      }

      if (session.user_id !== auth.userId) {
        setError('You cannot access this workout.');
        return;
      }

      const [{ data: planData }, { data: dayData, error: dayError }, { data: setRows, error: setsError }] =
        await Promise.all([
          supabase.from('workout_plans').select('name').eq('id', session.plan_id).maybeSingle(),
          supabase
            .from('workout_plan_days')
            .select(
              `name,
               workout_exercises (
                 exercise_id
               )`
            )
            .eq('id', session.day_id)
            .maybeSingle(),
          supabase
            .from('workout_sets')
            .select('id, session_id, exercise_id, set_number, weight, reps, completed')
            .eq('session_id', session.id),
        ]);

      if (dayError) {
        console.error(dayError);
        setError(dayError.message || 'Unable to load workout summary.');
        return;
      }
      if (setsError) {
        console.error(setsError);
        setError(setsError.message || 'Unable to load workout summary.');
        return;
      }

      const dayExercises = (dayData?.workout_exercises ?? []) as Array<{
        exercise_id: string;
      }>;

      const logged = (setRows ?? []) as WorkoutSetRow[];
      const completed = logged.filter((row) => !!row.completed);
      const volume = completed.reduce((sum, row) => {
        const weight = Number(row.weight ?? 0);
        const reps = Number(row.reps ?? 0);
        if (!Number.isFinite(weight) || !Number.isFinite(reps)) return sum;
        return sum + weight * reps;
      }, 0);

      const duration =
        session.duration_seconds ??
        (session.completed_at
          ? Math.floor(
              (Date.parse(session.completed_at) - Date.parse(session.started_at)) / 1000
            )
          : 0);

      setPlanName((planData?.name as string | undefined) ?? 'Workout');
      setDayName(dayData?.name ?? 'Workout day');
      setDurationSeconds(Number.isFinite(duration) ? Math.max(0, duration) : 0);
      setExerciseCount(dayExercises.length);
      setCompletedSetCount(completed.length);
      setTotalVolume(volume);
    } catch (err) {
      console.error(err);
      setError('Unable to load workout summary.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      if (sessionId) loadSummary();
    }, [sessionId, loadSummary])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={loadSummary}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(app)/workouts')}>
          <Text style={styles.secondaryButtonText}>Back to My Plans</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Workout Summary</Text>
      <Text style={styles.subtitle}>
        {planName}
        {dayName ? ` · ${dayName}` : ''}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Duration</Text>
        <Text style={styles.value}>{formatDurationLabel(durationSeconds)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Exercises</Text>
        <Text style={styles.value}>{exerciseCount}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Completed Sets</Text>
        <Text style={styles.value}>{completedSetCount}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Volume</Text>
        <Text style={styles.value}>
          {totalVolume.toLocaleString()} kg
        </Text>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.replace('/(app)/workouts')}
      >
        <Text style={styles.primaryButtonText}>Back to My Plans</Text>
      </Pressable>
    </ScrollView>
  );
}

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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#555',
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#444',
    fontWeight: '600',
  },
});
