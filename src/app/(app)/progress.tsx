import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import dayjs from 'dayjs';
import { DummyProgress } from '@/data/progress';
import type { ProgressStats, RecentWorkout } from '@/types/progress';

// Helper to format duration seconds into human friendly string
const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

export default function ProgressScreen() {
  const [stats] = useState<ProgressStats>(DummyProgress);

  const {
    totalWorkouts,
    totalDurationSeconds,
    totalVolumeKg,
    totalSets,
    currentStreakDays,
    recentWorkouts,
  } = stats;

  const renderRecentItem = ({ item }: { item: RecentWorkout }) => (
    <View style={styles.recentCard}>
      <Text style={styles.recentTitle}>{item.planName}</Text>
      <Text style={styles.recentSubtitle}>{item.dayName}</Text>
      <Text style={styles.recentMeta}>
        {dayjs(item.startedAt).format('MMMM D, YYYY')} • {formatDuration(item.durationSeconds)}
      </Text>
    </View>
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
          <Text style={styles.metricValue}>{currentStreakDays}</Text>
          <Text style={styles.metricLabel}>Current Streak (days)</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{totalVolumeKg.toLocaleString()} kg</Text>
          <Text style={styles.metricLabel}>Total Volume</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{formatDuration(totalDurationSeconds)}</Text>
          <Text style={styles.metricLabel}>Total Duration</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{totalSets}</Text>
          <Text style={styles.metricLabel}>Completed Sets</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Recent Workouts</Text>
      <FlatList
        scrollEnabled={false}
        data={recentWorkouts}
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
  header: { fontSize: 28, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#111' },
  subHeader: { fontSize: 22, fontWeight: '600', marginTop: 30, marginBottom: 10, color: '#333' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricBox: { width: '48%', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#007bff' },
  metricLabel: { fontSize: 14, color: '#555', marginTop: 4, textAlign: 'center' },
  recentCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  recentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#111' },
  recentSubtitle: { fontSize: 14, color: '#555', marginBottom: 4 },
  recentMeta: { fontSize: 12, color: '#888' },
  separator: { height: 10 },
  listContainer: { paddingBottom: 20 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
});
