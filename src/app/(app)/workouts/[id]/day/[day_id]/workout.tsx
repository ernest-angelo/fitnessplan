import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  elapsedMs,
  ensureInProgressSession,
  formatTimer,
  getAuthenticatedUserId,
  parseNonNegativeNumber,
  upsertWorkoutSet,
  type WorkoutSessionRow,
  type WorkoutSetRow,
} from '@/lib/workout-session';

type CatalogExercise = { id: string; name: string };

type DayExercise = {
  id: string;
  exercise_id: string;
  order_index: number | null;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
  notes: string | null;
  name: string;
};

type LocalSet = {
  id?: string;
  set_number: number;
  weight: string;
  reps: string;
  completed: boolean;
};

function asExercise(
  value: CatalogExercise | CatalogExercise[] | null | undefined
): CatalogExercise | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function confirmFinish(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm('Finish this workout?'));
  }
  return new Promise((resolve) => {
    Alert.alert('Finish this workout?', undefined, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Finish', onPress: () => resolve(true) },
    ]);
  });
}

export default function WorkoutExecutionScreen() {
  const {
    id: planId,
    day_id: dayId,
    session_id: sessionIdParam,
  } = useLocalSearchParams<{
    id: string;
    day_id: string;
    session_id?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dayName, setDayName] = useState('');
  const [session, setSession] = useState<WorkoutSessionRow | null>(null);
  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, LocalSet[]>>({});
  const [nowMs, setNowMs] = useState(Date.now());
  const [savingKey, setSavingKey] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [actionError, setActionError] = useState('');
  const setsRef = useRef<Record<string, LocalSet[]>>({});

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadWorkout = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setActionError('');

      const auth = await getAuthenticatedUserId();
      if (auth.userId === null) {
        setError(auth.error);
        return;
      }

      let activeSession: WorkoutSessionRow | null = null;

      if (sessionIdParam) {
        const { data, error: sessionError } = await supabase
          .from('workout_sessions')
          .select('id, user_id, plan_id, day_id, started_at, completed_at, duration_seconds, status')
          .eq('id', sessionIdParam)
          .maybeSingle();

        if (sessionError) {
          console.error(sessionError);
          setError(sessionError.message || 'Unable to load workout.');
          return;
        }

        activeSession = (data as WorkoutSessionRow | null) ?? null;
      } else {
        const ensured = await ensureInProgressSession(planId, dayId);
        if (ensured.error || !ensured.session) {
          setError(ensured.error || 'Unable to load workout.');
          return;
        }
        activeSession = ensured.session;
      }

      if (!activeSession) {
        setError('Unable to load workout.');
        return;
      }

      if (activeSession.user_id !== auth.userId) {
        setError('You cannot access this workout.');
        return;
      }

      if (activeSession.day_id !== dayId || activeSession.plan_id !== planId) {
        setError('This workout does not match the selected day.');
        return;
      }

      if (activeSession.status === 'COMPLETED') {
        router.replace(`/(app)/workouts/session/${activeSession.id}`);
        return;
      }

      const { data: dayData, error: dayError } = await supabase
        .from('workout_plan_days')
        .select(
          `id, name, day_number,
           workout_exercises (
             id, exercise_id, order_index, target_sets, target_reps, rest_seconds, notes,
             exercises ( id, name )
           )`
        )
        .eq('id', dayId)
        .single();

      if (dayError) {
        console.error(dayError);
        setError(dayError.message || 'Unable to load workout.');
        return;
      }

      const rawExercises = (dayData?.workout_exercises ?? []) as Array<{
        id: string;
        exercise_id: string;
        order_index: number | null;
        target_sets: number;
        target_reps: number;
        rest_seconds: number;
        notes: string | null;
        exercises: CatalogExercise | CatalogExercise[] | null;
      }>;

      const normalized: DayExercise[] = rawExercises
        .map((row) => ({
          id: row.id,
          exercise_id: row.exercise_id,
          order_index: row.order_index,
          target_sets: row.target_sets,
          target_reps: row.target_reps,
          rest_seconds: row.rest_seconds,
          notes: row.notes,
          name: asExercise(row.exercises)?.name ?? 'Exercise',
        }))
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

      const { data: setRows, error: setsError } = await supabase
        .from('workout_sets')
        .select('id, session_id, exercise_id, set_number, weight, reps, completed')
        .eq('session_id', activeSession.id)
        .order('set_number', { ascending: true });

      if (setsError) {
        console.error(setsError);
        setError(setsError.message || 'Unable to load workout.');
        return;
      }

      const logged = (setRows ?? []) as WorkoutSetRow[];
      const nextSets: Record<string, LocalSet[]> = {};

      for (const exercise of normalized) {
        const forExercise = logged
          .filter((row) => row.exercise_id === exercise.exercise_id)
          .sort((a, b) => a.set_number - b.set_number);

        const maxLogged = forExercise.reduce((max, row) => Math.max(max, row.set_number), 0);
        const count = Math.max(exercise.target_sets, maxLogged, 0);
        const rows: LocalSet[] = [];

        for (let n = 1; n <= count; n += 1) {
          const existing = forExercise.find((row) => row.set_number === n);
          rows.push({
            id: existing?.id,
            set_number: n,
            weight: existing?.weight != null ? String(existing.weight) : '',
            reps: existing?.reps != null ? String(existing.reps) : '',
            completed: !!existing?.completed,
          });
        }

        nextSets[exercise.exercise_id] = rows;
      }

      setDayName(dayData?.name ?? 'Workout');
      setSession(activeSession);
      setExercises(normalized);
      setsRef.current = nextSets;
      setSetsByExercise(nextSets);
      setNowMs(Date.now());
    } catch (err) {
      console.error(err);
      setError('Unable to load workout.');
    } finally {
      setLoading(false);
    }
  }, [planId, dayId, sessionIdParam]);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [loadWorkout])
  );

  const updateLocalSet = (
    exerciseId: string,
    setNumber: number,
    patch: Partial<LocalSet>
  ) => {
    const next = {
      ...setsRef.current,
      [exerciseId]: (setsRef.current[exerciseId] ?? []).map((row) =>
        row.set_number === setNumber ? { ...row, ...patch } : row
      ),
    };
    setsRef.current = next;
    setSetsByExercise(next);
  };

  const saveSet = async (exerciseId: string, setNumber: number, nextCompleted?: boolean) => {
    if (!session) return;
    const row = setsRef.current[exerciseId]?.find((item) => item.set_number === setNumber);
    if (!row) return;

    const completed = nextCompleted ?? row.completed;
    const weight = parseNonNegativeNumber(row.weight);
    const reps = parseNonNegativeNumber(row.reps);

    if (weight == null || reps == null) {
      if (completed) {
        setActionError('Enter a valid weight and reps (0 or greater) before marking a set done.');
      }
      return;
    }

    const key = `${exerciseId}:${row.set_number}`;
    setSavingKey(key);
    setActionError('');

    const result = await upsertWorkoutSet({
      sessionId: session.id,
      exerciseId,
      setNumber: row.set_number,
      weight,
      reps,
      completed,
      existingId: row.id,
    });

    setSavingKey('');

    if (result.error || !result.id) {
      setActionError(result.error || 'Unable to save set.');
      return;
    }

    updateLocalSet(exerciseId, row.set_number, {
      id: result.id,
      completed,
    });
  };

  const handleToggleComplete = async (exerciseId: string, setNumber: number) => {
    const row = setsRef.current[exerciseId]?.find((item) => item.set_number === setNumber);
    if (!row) return;
    const next = !row.completed;
    if (next) {
      const weight = parseNonNegativeNumber(row.weight);
      const reps = parseNonNegativeNumber(row.reps);
      if (weight == null || reps == null) {
        setActionError('Enter a valid weight and reps (0 or greater) before marking a set done.');
        return;
      }
    }
    await saveSet(exerciseId, setNumber, next);
  };

  const handleAddSet = async (exercise: DayExercise) => {
    if (!session) return;
    const current = setsRef.current[exercise.exercise_id] ?? [];
    const setNumber = current.length + 1;
    const key = `${exercise.exercise_id}:${setNumber}`;
    setSavingKey(key);
    setActionError('');

    const result = await upsertWorkoutSet({
      sessionId: session.id,
      exerciseId: exercise.exercise_id,
      setNumber,
      weight: 0,
      reps: 0,
      completed: false,
    });

    setSavingKey('');

    if (result.error || !result.id) {
      setActionError(result.error || 'Unable to save set.');
      return;
    }

    const next = {
      ...setsRef.current,
      [exercise.exercise_id]: [
        ...(setsRef.current[exercise.exercise_id] ?? []),
        {
          id: result.id,
          set_number: setNumber,
          weight: '0',
          reps: '0',
          completed: false,
        },
      ],
    };
    setsRef.current = next;
    setSetsByExercise(next);
  };

  const handleFinish = async () => {
    if (!session || finishing) return;

    const confirmed = await confirmFinish();
    if (!confirmed) return;

    setFinishing(true);
    setActionError('');

    try {
      const auth = await getAuthenticatedUserId();
      if (auth.userId === null) {
        setActionError(auth.error);
        return;
      }

      const completedAt = new Date();
      const durationSeconds = Math.floor(elapsedMs(session.started_at, completedAt.getTime()) / 1000);

      const { data: finished, error: finishError } = await supabase
        .from('workout_sessions')
        .update({
          status: 'COMPLETED',
          completed_at: completedAt.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', session.id)
        .eq('user_id', auth.userId)
        .eq('status', 'IN_PROGRESS')
        .select('id')
        .maybeSingle();

      if (finishError) {
        console.error(finishError);
        setActionError(finishError.message || 'Unable to finish workout.');
        return;
      }

      if (!finished) {
        setActionError('Unable to finish workout.');
        return;
      }

      router.replace(`/(app)/workouts/session/${session.id}`);
    } catch (err) {
      console.error(err);
      setActionError('Unable to finish workout.');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={loadWorkout}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load workout.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.dayTitle}>{dayName}</Text>
      <Text style={styles.timerLabel}>
        Workout Timer: {formatTimer(session.started_at, nowMs)}
      </Text>

      {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}

      {exercises.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No exercises on this day.</Text>
        </View>
      ) : (
        exercises.map((exercise) => {
          const rows = setsByExercise[exercise.exercise_id] ?? [];
          return (
            <View key={exercise.id} style={styles.card}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.targetText}>
                Target: {exercise.target_sets} × {exercise.target_reps}
                {` · ${exercise.rest_seconds}s rest`}
              </Text>
              {!!exercise.notes && <Text style={styles.notes}>{exercise.notes}</Text>}

              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.setCol]}>Set</Text>
                <Text style={[styles.headerCell, styles.inputCol]}>Weight</Text>
                <Text style={[styles.headerCell, styles.inputCol]}>Reps</Text>
                <Text style={[styles.headerCell, styles.doneCol]}>Done</Text>
              </View>

              {rows.map((row) => {
                const key = `${exercise.exercise_id}:${row.set_number}`;
                const busy = savingKey === key;
                return (
                  <View key={row.set_number} style={styles.tableRow}>
                    <Text style={[styles.setNumber, styles.setCol]}>{row.set_number}</Text>
                    <TextInput
                      style={[styles.input, styles.inputCol]}
                      value={row.weight}
                      onChangeText={(text) =>
                        updateLocalSet(exercise.exercise_id, row.set_number, { weight: text })
                      }
                      onBlur={() => saveSet(exercise.exercise_id, row.set_number)}
                      keyboardType={Platform.OS === 'web' ? 'numeric' : 'decimal-pad'}
                      placeholder="0"
                      editable={!busy && !finishing}
                    />
                    <TextInput
                      style={[styles.input, styles.inputCol]}
                      value={row.reps}
                      onChangeText={(text) =>
                        updateLocalSet(exercise.exercise_id, row.set_number, { reps: text })
                      }
                      onBlur={() => saveSet(exercise.exercise_id, row.set_number)}
                      keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                      placeholder="0"
                      editable={!busy && !finishing}
                    />
                    <Pressable
                      style={[styles.doneButton, row.completed && styles.doneButtonOn]}
                      onPress={() => handleToggleComplete(exercise.exercise_id, row.set_number)}
                      disabled={busy || finishing}
                    >
                      <Text style={[styles.doneText, row.completed && styles.doneTextOn]}>
                        {row.completed ? '✓' : ''}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}

              <Pressable
                style={styles.addSetButton}
                onPress={() => handleAddSet(exercise)}
                disabled={finishing || savingKey.startsWith(`${exercise.exercise_id}:`)}
              >
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          );
        })
      )}

      <Pressable
        style={[styles.finishButton, finishing && styles.finishButtonDisabled]}
        onPress={handleFinish}
        disabled={finishing}
      >
        {finishing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        )}
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
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  timerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  targetText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    gap: 8,
  },
  headerCell: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setCol: {
    width: 36,
  },
  inputCol: {
    flex: 1,
  },
  doneCol: {
    width: 44,
    textAlign: 'center',
  },
  setNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
    fontSize: 15,
  },
  doneButton: {
    width: 44,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  doneButtonOn: {
    backgroundColor: '#e8f5e9',
    borderColor: '#81c784',
  },
  doneText: {
    fontSize: 18,
    color: '#888',
  },
  doneTextOn: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  addSetButton: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c7d6ff',
  },
  addSetText: {
    color: '#2d5be3',
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  finishButtonDisabled: {
    opacity: 0.7,
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#444',
    fontWeight: '600',
  },
});
