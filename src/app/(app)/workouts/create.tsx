import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Valid enum values that must match the database schema.
const GOAL_OPTIONS = [
  { label: 'Build Muscle', value: 'MUSCLE_GAIN' },
  { label: 'Lose Weight', value: 'FAT_LOSS' },
  { label: 'Get Stronger', value: 'STRENGTH' },
  { label: 'Improve Endurance', value: 'ENDURANCE' },
  { label: 'General Fitness', value: 'GENERAL_FITNESS' }
] as const;

const DIFFICULTY_OPTIONS = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' }
] as const;

const VISIBILITY_OPTIONS = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Public', value: 'PUBLIC' }
] as const;

type GoalValue = (typeof GOAL_OPTIONS)[number]['value'] | '';
type DifficultyValue = (typeof DIFFICULTY_OPTIONS)[number]['value'] | '';
type VisibilityValue = (typeof VISIBILITY_OPTIONS)[number]['value'] | '';

function OptionPicker<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly { label: string; value: T }[];
  value: T | '';
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionChip, value === opt.value && styles.optionChipSelected]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[styles.optionChipText, value === opt.value && styles.optionChipTextSelected]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function CreatePlanScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<GoalValue>('');
  const [difficulty, setDifficulty] = useState<DifficultyValue>('');
  const [visibility, setVisibility] = useState<VisibilityValue>('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (loading) return;

    setError('');

    // Validation: name is required.
    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('You must be logged in to create a plan.');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('workout_plans')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          goal: goal || null,
          difficulty: difficulty || null,
          visibility: visibility || 'private',
        })
        .select('id')
        .single();

      if (insertError) {
        setError(insertError.message || 'Failed to create plan.');
        return;
      }

      // Navigate to the new plan's detail screen.
      router.replace(`/(app)/workouts/${data.id}`);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Workout Plan</Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Plan Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Push Pull Legs"
          value={name}
          onChangeText={setName}
          editable={!loading}
          returnKeyType="next"
        />
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional description…"
          value={description}
          onChangeText={setDescription}
          editable={!loading}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Goal */}
      <OptionPicker
        label="Goal"
        options={GOAL_OPTIONS}
        value={goal}
        onSelect={setGoal}
      />

      {/* Difficulty */}
      <OptionPicker
        label="Difficulty"
        options={DIFFICULTY_OPTIONS}
        value={difficulty}
        onSelect={setDifficulty}
      />

      {/* Visibility */}
      <OptionPicker
        label="Visibility"
        options={VISIBILITY_OPTIONS}
        value={visibility}
        onSelect={setVisibility}
      />

      <Pressable
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Create Plan</Text>
        )}
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000ff',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  optionChipSelected: {
    backgroundColor: '#000000ff',
    borderColor: '#000000ff',
  },
  optionChipText: {
    fontSize: 13,
    color: '#555',
    textTransform: 'capitalize',
  },
  optionChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#000000ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#000000ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#fdecea',
    padding: 10,
    borderRadius: 6,
  },
});
