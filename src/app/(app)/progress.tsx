import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import dayjs from 'dayjs';

// Helper to format duration seconds into human friendly string
const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError('You must be logged in to view progress.');
        return;
      }
      const userId = authData.user.id;

      // Total completed workouts
      const { count: workoutsCount, error: wErr } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');
      if (wErr) throw wErr;
      setTotalWorkouts(workoutsCount as number);

      // Total duration seconds
      const { data: durationData, error: dErr } = await supabase
        .from('workout_sessions')
        .select('duration_seconds')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');
      if (dErr) throw dErr;
      const totalDur = (durationData ?? []).reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0);
      setTotalDuration(totalDur);

      // Total completed sets and volume
      const { data: setsData, error: sErr } = await supabase
        .from('workout_sets')
        .select('weight,reps,completed,session_id')
        .eq('completed', true);
      if (sErr) throw sErr;
      const { data: sessIds, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');
      if (sessErr) throw sessErr;
      const completedSessionIds = new Set<string>(sessIds?.map((s) => s.id) ?? []);
      const filteredSets = setsData?.filter((set) => completedSessionIds.has(set.session_id)) ?? [];
      setTotalSets(filteredSets.length);
      const volume = filteredSets.reduce((sum, set) => {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        return sum + w * r;
      }, 0);
      setTotalVolume(volume);

      // Recent workouts (latest 5)
      const { data: recentData, error: rErr } = await supabase
        .from('workout_sessions')
        .select('id,started_at,duration_seconds,workout_plan_id,workout_day_id')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('started_at', { ascending: false })
        .limit(5);
      if (rErr) throw rErr;
      setRecent(recentData ?? []);

      // Streak calculation
      const { data: datesData, error: dateErr } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');
      if (dateErr) throw dateErr;
      const dateSet = new Set<string>();
      datesData?.forEach((row) => {
        if (row.started_at) dateSet.add(dayjs(row.started_at).format('YYYY-MM-DD'));
      });
      const sortedDates = Array.from(dateSet).sort((a, b) => (a > b ? -1 : 1));
      let streakCount = 0;
      let cursor = dayjs();
      for (const d of sortedDates) {
        if (cursor.format('YYYY-MM-DD') === d) {
          streakCount++;
          cursor = cursor.subtract(1, 'day');
        } else break;
      }
      setStreak(streakCount);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
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
        <Pressable style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (totalWorkouts === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No completed workouts yet.</Text>
        <Pressable style={styles.ctaButton} onPress={() => router.push('/(app)/workouts')}>
          <Text style={styles.ctaButtonText}>Start your first workout</Text>
        </Pressable>
      </View>
    );
  }

  const renderRecentItem = ({ item }: { item: any }) => (
    <Pressable style={styles.recentCard} onPress={() => router.push(`/progress/session/${item.id}`)}>
      <Text style={styles.recentTitle}>Workout Session</Text>
      <Text>{dayjs(item.started_at).format('MMMM D, YYYY')}</Text>
      <Text>{formatDuration(item.duration_seconds)}</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Progress</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{totalWorkouts}</Text>
          <Text style={styles.metricLabel}>Completed Workouts</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{streak}</Text>
          <Text style={styles.metricLabel}>Current Streak (days)</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{totalVolume.toLocaleString()} kg</Text>
          <Text style={styles.metricLabel}>Total Volume</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{formatDuration(totalDuration)}</Text>
          <Text style={styles.metricLabel}>Total Duration</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{totalSets}</Text>
          <Text style={styles.metricLabel}>Completed Sets</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Recent Workouts</Text>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        renderItem={renderRecentItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptySubtitle}>No recent workouts.</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#111' },
  subHeader: { fontSize: 22, fontWeight: '600', marginTop: 30, marginBottom: 10, color: '#333' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricBox: { width: '48%', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#007bff' },
  metricLabel: { fontSize: 14, color: '#555', marginTop: 4, textAlign: 'center' },
  recentCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  recentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  separator: { height: 10 },
  listContainer: { paddingBottom: 20 },
  errorText: { color: '#c0392b', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#007bff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  ctaButton: { backgroundColor: '#28a745', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  ctaButtonText: { color: '#fff', fontWeight: '600' },
});
