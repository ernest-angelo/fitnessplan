import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

export default function SessionDetailScreen() {
  const { session_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [planName, setPlanName] = useState('');
  const [dayName, setDayName] = useState('');
  const [sets, setSets] = useState<any[]>([]);
  const [exercisesMap, setExercisesMap] = useState<Record<string, any>>({});
  const [totalVolume, setTotalVolume] = useState(0);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData.user) {
        setError('You must be logged in to view session details.');
        return;
      }
      const userId = authData.user.id;

      // Verify session belongs to user and is COMPLETED
      const { data: sess, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id,started_at,duration_seconds,workout_plan_id,workout_day_id,status')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single();
      if (sessErr) throw sessErr;
      if (!sess) {
        setError('Session not found.');
        return;
      }
      if (sess.status !== 'COMPLETED') {
        setError('Only completed sessions can be viewed.');
        return;
      }
      setSession(sess);

      // Fetch plan name
      const { data: planData, error: planErr } = await supabase
        .from('workout_plans')
        .select('name')
        .eq('id', sess.workout_plan_id)
        .single();
      if (!planErr && planData) setPlanName(planData.name);

      // Fetch day name (assuming workout_plan_days has a name column)
      const { data: dayData, error: dayErr } = await supabase
        .from('workout_plan_days')
        .select('name')
        .eq('id', sess.workout_day_id)
        .single();
      if (!dayErr && dayData) setDayName(dayData.name);

      // Fetch sets for this session
      const { data: setsData, error: setsErr } = await supabase
        .from('workout_sets')
        .select('weight,reps,completed,exercise_id,set_number')
        .eq('session_id', sess.id)
        .order('set_number', { ascending: true });
      if (setsErr) throw setsErr;
      setSets(setsData ?? []);

      // Fetch exercises used in these sets
      const exerciseIds = Array.from(new Set((setsData ?? []).map((s) => s.exercise_id)));
      if (exerciseIds.length > 0) {
        const { data: exData, error: exErr } = await supabase
          .from('exercises')
          .select('id,name')
          .in('id', exerciseIds);
        if (!exErr && exData) {
          const map: Record<string, any> = {};
          exData.forEach((ex) => (map[ex.id] = ex));
          setExercisesMap(map);
        }
      }

      // Calculate total volume (weight * reps) for completed sets
      const vol = (setsData ?? [])
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
      setTotalVolume(vol);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDetails();
    }, [session_id])
  );

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
        <Pressable style={styles.retryButton} onPress={fetchDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Session not found.</Text>
      </View>
    );
  }

  const renderExercise = (exerciseId: string) => {
    const relatedSets = sets.filter((s) => s.exercise_id === exerciseId);
    return (
      <View key={exerciseId} style={styles.exerciseBox}>
        <Text style={styles.exerciseName}>{exercisesMap[exerciseId]?.name || 'Exercise'}</Text>
        {relatedSets.map((s) => (
          <Text key={s.set_number} style={styles.setText}>
            Set {s.set_number}: {s.weight}kg × {s.reps}{' '}{s.completed ? '' : '(incomplete)'}
          </Text>
        ))}
      </View>
    );
  };

  const uniqueExerciseIds = Array.from(new Set(sets.map((s) => s.exercise_id)));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>{planName || 'Workout'} - {dayName || ''}</Text>
      <Text style={styles.date}>{dayjs(session.started_at).format('MMMM D, YYYY')}</Text>
      <Text style={styles.duration}>Duration: {formatDuration(session.duration_seconds)}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {uniqueExerciseIds.map(renderExercise)}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total Volume</Text>
        <Text style={styles.volumeText}>{totalVolume.toLocaleString()} kg</Text>
      </View>
    </ScrollView>
  );
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backButton: { marginBottom: 12 },
  backText: { color: '#007bff', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#111' },
  date: { fontSize: 16, color: '#555', marginBottom: 2 },
  duration: { fontSize: 16, color: '#555', marginBottom: 12 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: '#333' },
  exerciseBox: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 10 },
  exerciseName: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  setText: { fontSize: 14, color: '#444' },
  volumeText: { fontSize: 18, fontWeight: '600', color: '#007bff' },
  errorText: { color: '#c0392b', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#007bff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
});
