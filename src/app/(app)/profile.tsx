import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [noUser, setNoUser] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Get the currently authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setNoUser(true);
        setLoading(false);
        return;
      }

      // 2. If a user exists, query the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setErrorMsg(error.message || 'Failed to load profile data.');
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred while fetching the profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (noUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No authenticated user.</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profile not found.</Text>
      </View>
    );
  }

  const isComplete = 
    profile &&
    profile.goal != null &&
    profile.experience_level != null &&
    profile.workout_days_per_week != null &&
    profile.workout_duration_min != null &&
    profile.equipment != null &&
    Array.isArray(profile.equipment) &&
    profile.equipment.length > 0;

  if (!isComplete) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Complete your fitness profile</Text>
        <Text style={styles.subtitle}>Set your goals, experience level, workout schedule, and equipment.</Text>
        <Pressable style={styles.setupButton} onPress={() => router.replace('/(auth)/onboarding')}>
          <Text style={styles.setupButtonText}>Complete Setup</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Display Name:</Text>
        <Text style={styles.value}>{profile.display_name || 'N/A'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>@{profile.username || 'N/A'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Goal:</Text>
        <Text style={styles.value}>{profile.goal || 'N/A'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Experience Level:</Text>
        <Text style={styles.value}>{profile.experience_level || 'N/A'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Workout Days/Week:</Text>
        <Text style={styles.value}>{profile.workout_days_per_week || 'N/A'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Workout Duration (min):</Text>
        <Text style={styles.value}>{profile.workout_duration_min || 'N/A'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  setupButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
