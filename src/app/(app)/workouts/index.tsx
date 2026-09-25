import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

type WorkoutPlan = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  visibility: string | null;
};

export default function MyPlansScreen() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reload whenever the screen comes into focus (e.g. after creating/editing a plan).
  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [])
  );

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('You must be logged in to view your plans.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('workout_plans')
        .select('id, name, description, goal, difficulty, visibility')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message || 'Failed to load plans.');
      } else {
        setPlans(data ?? []);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

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
        <Pressable style={styles.retryButton} onPress={fetchPlans}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={plans.length === 0 ? styles.emptyContainer : styles.listContent}
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#007bff',
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
