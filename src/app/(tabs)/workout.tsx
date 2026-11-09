import WorkoutCard from '@/components/workoutcard';
import { PlanDummy } from '@/data/workout';
import type { WorkoutPlan } from '@/types/workout';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function WorkoutTabScreen() {
  const [plans] = useState<WorkoutPlan[]>(PlanDummy);

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          plans.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Workouts</Text>

            <Text style={styles.subtitle}>
              Select a plan or start your daily workout routine
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              No workout plans yet.
            </Text>

            <Text style={styles.emptySubtitle}>
              Create your first plan to get started!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() =>
              router.push(`/(app)/workouts/${item.id}`)
            }
          />
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(app)/workouts/create')}
      >
        <Text style={styles.fabText}>
          + Create Plan
        </Text>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#000000ff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000000ff',
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