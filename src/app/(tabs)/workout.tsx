import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PlanDummy } from '@/data/workout';
import type { WorkoutPlan } from '@/types/workout';

export default function WorkoutTabScreen() {
  const [plans] = useState<WorkoutPlan[]>(PlanDummy);

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={plans.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Workouts</Text>
            <Text style={styles.subtitle}>Select a plan or start your daily workout routine</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No workout plans yet.</Text>
            <Text style={styles.emptySubtitle}>
              Create your first plan to get started!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.planCard}
            onPress={() => router.push(`/(app)/workouts/${item.id}`)}
          >
            <Text style={styles.planName}>{item.name}</Text>
            {!!item.goal && (
              <Text style={styles.planMeta}>Goal: {item.goal}</Text>
            )}
            {!!item.difficulty && (
              <Text style={styles.planMeta}>Difficulty: {item.difficulty}</Text>
            )}
            {!!item.description && (
              <Text style={styles.planDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </Pressable>
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(app)/workouts/create')}
      >
        <Text style={styles.fabText}>+ Create Plan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
