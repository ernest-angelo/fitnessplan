import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const GOAL_OPTIONS = [
  { label: 'Build Muscle', value: 'MUSCLE_GAIN' },
  { label: 'Lose Fat', value: 'FAT_LOSS' },
  { label: 'Get Stronger', value: 'STRENGTH' },
  { label: 'Improve Endurance', value: 'ENDURANCE' },
  { label: 'General Fitness', value: 'GENERAL_FITNESS' },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

const DAYS_OPTIONS = [
  { label: '1 day', value: 1 },
  { label: '2 days', value: 2 },
  { label: '3 days', value: 3 },
  { label: '4 days', value: 4 },
  { label: '5 days', value: 5 },
  { label: '6 days', value: 6 },
  { label: '7 days', value: 7 },
];

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

const EQUIPMENT_OPTIONS = [
  { label: 'Dumbbell', value: 'DUMBBELL' },
  { label: 'Barbell', value: 'BARBELL' },
  { label: 'Machine', value: 'MACHINE' },
  { label: 'Cable', value: 'CABLE' },
  { label: 'Bodyweight', value: 'BODYWEIGHT' },
  { label: 'Kettlebell', value: 'KETTLEBELL' },
  { label: 'Bands', value: 'BANDS' },
  { label: 'Bench', value: 'BENCH' },
  { label: 'Smith Machine', value: 'SMITH_MACHINE' },
  { label: 'Other', value: 'OTHER' },
];

export default function OnboardingScreen() {
  const [goal, setGoal] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [workoutDays, setWorkoutDays] = useState<number | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setErrorMessage('');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setErrorMessage('User not authenticated.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is multiple (or no) rows returned when using single()
        console.error('Error fetching profile:', error);
      } else if (data) {
        if (data.goal) setGoal(data.goal);
        if (data.experience_level) setExperienceLevel(data.experience_level);
        if (data.workout_days_per_week) setWorkoutDays(data.workout_days_per_week);
        if (data.workout_duration_min) setWorkoutDuration(data.workout_duration_min);
        if (data.equipment) setEquipment(data.equipment);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to load profile.');
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleEquipment = (val: string) => {
    setEquipment((prev) => 
      prev.includes(val) ? prev.filter(e => e !== val) : [...prev, val]
    );
  };

  const handleContinue = async () => {
    if (loading) return;

    setErrorMessage('');

    if (!goal || !experienceLevel || !workoutDays || !workoutDuration || equipment.length === 0) {
      setErrorMessage('Please complete all fields before continuing.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setErrorMessage('User not authenticated.');
        setLoading(false);
        return;
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          goal,
          experience_level: experienceLevel,
          workout_days_per_week: workoutDays,
          workout_duration_min: workoutDuration,
          equipment,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setErrorMessage(error.message || 'Failed to update profile.');
        setLoading(false);
        return;
      }

      router.replace('/(app)/profile');
    } catch (e) {
      setErrorMessage('An unexpected error occurred.');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fitness Profile</Text>
      <Text style={styles.subtitle}>Let's personalize your workout experience.</Text>

      {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <Text style={styles.sectionTitle}>Goal</Text>
      <View style={styles.optionsContainer}>
        {GOAL_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionButton, goal === opt.value && styles.optionButtonSelected]}
            onPress={() => setGoal(opt.value)}
          >
            <Text style={[styles.optionText, goal === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Experience Level</Text>
      <View style={styles.optionsContainer}>
        {EXPERIENCE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionButton, experienceLevel === opt.value && styles.optionButtonSelected]}
            onPress={() => setExperienceLevel(opt.value)}
          >
            <Text style={[styles.optionText, experienceLevel === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Workout Days</Text>
      <View style={styles.optionsContainer}>
        {DAYS_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionButton, workoutDays === opt.value && styles.optionButtonSelected]}
            onPress={() => setWorkoutDays(opt.value)}
          >
            <Text style={[styles.optionText, workoutDays === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Workout Duration</Text>
      <View style={styles.optionsContainer}>
        {DURATION_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionButton, workoutDuration === opt.value && styles.optionButtonSelected]}
            onPress={() => setWorkoutDuration(opt.value)}
          >
            <Text style={[styles.optionText, workoutDuration === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Equipment</Text>
      <View style={styles.optionsContainer}>
        {EQUIPMENT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionButton, equipment.includes(opt.value) && styles.optionButtonSelected]}
            onPress={() => toggleEquipment(opt.value)}
          >
            <Text style={[styles.optionText, equipment.includes(opt.value) && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable 
        style={[styles.continueButton, loading && styles.continueButtonDisabled]} 
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  optionButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  optionText: {
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  continueButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
