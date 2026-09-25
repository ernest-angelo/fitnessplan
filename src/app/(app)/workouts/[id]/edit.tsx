import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const GOAL_OPTIONS = ['build_muscle', 'lose_weight', 'improve_endurance', 'increase_strength', 'general_fitness'] as const;
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
const VISIBILITY_OPTIONS = ['private', 'public'] as const;

type GoalValue = (typeof GOAL_OPTIONS)[number] | '';
type DifficultyValue = (typeof DIFFICULTY_OPTIONS)[number] | '';
type VisibilityValue = (typeof VISIBILITY_OPTIONS)[number] | '';

function OptionPicker<T extends string>({
  label,
  options,
  value,
  onSelect,
  disabled,
}: {
  label: string;
  options: readonly T[];
  value: T | '';
  onSelect: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.optionChip, value === opt && styles.optionChipSelected]}
            onPress={() => !disabled && onSelect(opt)}
            disabled={disabled}
          >
            <Text
              style={[styles.optionChipText, value === opt && styles.optionChipTextSelected]}
            >
              {opt.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function EditPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<GoalValue>('');
  const [difficulty, setDifficulty] = useState<DifficultyValue>('');
  const [visibility, setVisibility] = useState<VisibilityValue>('private');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoadingInitial(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('workout_plans')
        .select('name, description, goal, difficulty, visibility')
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setError(fetchError?.message ?? 'Failed to load plan.');
        return;
      }

      setName(data.name ?? '');
      setDescription(data.description ?? '');
      setGoal((data.goal as GoalValue) ?? '');
      setDifficulty((data.difficulty as DifficultyValue) ?? '');
      setVisibility((data.visibility as VisibilityValue) ?? 'private');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setError('');

    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('workout_plans')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          goal: goal || null,
          difficulty: difficulty || null,
          visibility: visibility || 'private',
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message || 'Failed to save changes.');
        return;
      }

      router.back();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Edit Plan</Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Plan Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={!saving}
          returnKeyType="next"
        />
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          editable={!saving}
          multiline
          numberOfLines={3}
        />
      </View>

      <OptionPicker label="Goal" options={GOAL_OPTIONS} value={goal} onSelect={setGoal} disabled={saving} />
      <OptionPicker label="Difficulty" options={DIFFICULTY_OPTIONS} value={difficulty} onSelect={setDifficulty} disabled={saving} />
      <OptionPicker label="Visibility" options={VISIBILITY_OPTIONS} value={visibility} onSelect={setVisibility} disabled={saving} />

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 20 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  optionChipSelected: { backgroundColor: '#007bff', borderColor: '#007bff' },
  optionChipText: { fontSize: 13, color: '#555', textTransform: 'capitalize' },
  optionChipTextSelected: { color: '#fff', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: '#a0c4ff' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButton: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#666', fontSize: 15 },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#fdecea',
    padding: 10,
    borderRadius: 6,
  },
});
