import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Dual-mode screen: Add Exercise (no workout_exercise_id param) or
 *                   Edit Exercise (workout_exercise_id param present).
 *
 * Add mode:  INSERT INTO workout_exercises
 * Edit mode: UPDATE workout_exercises SET ... WHERE id = workout_exercise_id
 *
 * The exercises catalog (exercises table) is NEVER modified here.
 * workout_exercises references exercises via exercise_id only.
 *
 * Validation:
 *   target_sets  >= 1
 *   target_reps  >= 1
 *   rest_seconds >= 0
 */

type CatalogExercise = {
  id: string;
  name: string;
};

type Step = 'pick' | 'config';

export default function AddExerciseScreen() {
  const { id: planId, day_id, workout_exercise_id } = useLocalSearchParams<{
    id: string;
    day_id: string;
    workout_exercise_id?: string;
  }>();

  const isEditMode = !!workout_exercise_id;

  // ── Step state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('pick');

  // ── Exercise picker state ─────────────────────────────────────────────────────
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [filteredCatalog, setFilteredCatalog] = useState<CatalogExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // ── Config form state ─────────────────────────────────────────────────────────
  const [targetSets, setTargetSets] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [restSeconds, setRestSeconds] = useState('');
  const [notes, setNotes] = useState('');

  // ── Shared state ─────────────────────────────────────────────────────────────
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Load catalog + pre-fill in edit mode ─────────────────────────────────────
  useEffect(() => {
    fetchCatalog();
    if (isEditMode && workout_exercise_id) {
      prefillExistingExercise(workout_exercise_id);
    }
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name', { ascending: true });

      if (fetchError) {
        setError(fetchError.message || 'Failed to load exercises.');
        return;
      }
      const list = data ?? [];
      setCatalog(list);
      setFilteredCatalog(list);
    } catch {
      setError('An unexpected error occurred loading exercises.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const prefillExistingExercise = async (weId: string) => {
    try {
      setLoadingInitial(true);
      const { data, error: fetchError } = await supabase
        .from('workout_exercises')
        .select('exercise_id, target_sets, target_reps, rest_seconds, notes, exercises(id, name)')
        .eq('id', weId)
        .single();

      if (fetchError || !data) {
        setError(fetchError?.message ?? 'Failed to load exercise configuration.');
        return;
      }

      // Pre-select the exercise from catalog
      const ex = data.exercises as unknown as CatalogExercise;
      if (ex) setSelectedExercise(ex);

      setTargetSets(String(data.target_sets ?? ''));
      setTargetReps(String(data.target_reps ?? ''));
      setRestSeconds(String(data.rest_seconds ?? ''));
      setNotes(data.notes ?? '');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoadingInitial(false);
    }
  };

  // ── Search filter ─────────────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCatalog(catalog);
    } else {
      const q = query.toLowerCase();
      setFilteredCatalog(catalog.filter((e) => e.name.toLowerCase().includes(q)));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateConfig = (): string | null => {
    const sets = parseInt(targetSets, 10);
    if (!targetSets.trim() || isNaN(sets) || sets < 1) {
      return 'Target sets must be a whole number ≥ 1.';
    }
    const reps = parseInt(targetReps, 10);
    if (!targetReps.trim() || isNaN(reps) || reps < 1) {
      return 'Target reps must be a whole number ≥ 1.';
    }
    const rest = parseInt(restSeconds, 10);
    if (!restSeconds.trim() || isNaN(rest) || rest < 0) {
      return 'Rest seconds must be a whole number ≥ 0.';
    }
    return null;
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    setError('');

    if (!selectedExercise) {
      setError('Please select an exercise first.');
      setStep('pick');
      return;
    }

    const validationError = validateConfig();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        // ── Edit mode: UPDATE existing workout_exercises row ──────────────────
        const { error: updateError } = await supabase
          .from('workout_exercises')
          .update({
            exercise_id: selectedExercise.id,
            target_sets: parseInt(targetSets, 10),
            target_reps: parseInt(targetReps, 10),
            rest_seconds: parseInt(restSeconds, 10),
            notes: notes.trim() || null,
          })
          .eq('id', workout_exercise_id);

        if (updateError) {
          setError(updateError.message || 'Failed to update exercise.');
          return;
        }
      } else {
        // ── Add mode: INSERT new workout_exercises row ─────────────────────────
        const { error: insertError } = await supabase
          .from('workout_exercises')
          .insert({
            day_id,
            exercise_id: selectedExercise.id,
            target_sets: parseInt(targetSets, 10),
            target_reps: parseInt(targetReps, 10),
            rest_seconds: parseInt(restSeconds, 10),
            notes: notes.trim() || null,
          });

        if (insertError) {
          setError(insertError.message || 'Failed to add exercise.');
          return;
        }
      }

      router.back();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading states ────────────────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // ── Step 1: Exercise Picker ───────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {isEditMode ? 'Change Exercise' : 'Select Exercise'}
        </Text>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {selectedExercise && (
          <View style={styles.selectedBanner}>
            <Text style={styles.selectedBannerText}>
              Selected: <Text style={styles.selectedBannerName}>{selectedExercise.name}</Text>
            </Text>
          </View>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises…"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />

        {loadingCatalog ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#007bff" />
          </View>
        ) : filteredCatalog.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No exercises found.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCatalog}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.exerciseItem,
                  selectedExercise?.id === item.id && styles.exerciseItemSelected,
                ]}
                onPress={() => {
                  setSelectedExercise(item);
                  setStep('config');
                }}
              >
                <Text
                  style={[
                    styles.exerciseItemText,
                    selectedExercise?.id === item.id && styles.exerciseItemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        )}

        {selectedExercise && (
          <Pressable style={styles.nextButton} onPress={() => setStep('config')}>
            <Text style={styles.nextButtonText}>Configure →</Text>
          </Pressable>
        )}

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // ── Step 2: Configuration Form ────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isEditMode ? 'Edit Exercise' : 'Configure Exercise'}
      </Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Selected exercise summary */}
      {selectedExercise && (
        <Pressable style={styles.selectedBanner} onPress={() => setStep('pick')}>
          <Text style={styles.selectedBannerText}>
            Exercise: <Text style={styles.selectedBannerName}>{selectedExercise.name}</Text>
          </Text>
          <Text style={styles.changeText}>Change ›</Text>
        </Pressable>
      )}

      {/* Sets */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Target Sets * (≥ 1)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4"
          value={targetSets}
          onChangeText={setTargetSets}
          keyboardType="number-pad"
          editable={!saving}
          returnKeyType="next"
        />
      </View>

      {/* Reps */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Target Reps * (≥ 1)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 8"
          value={targetReps}
          onChangeText={setTargetReps}
          keyboardType="number-pad"
          editable={!saving}
          returnKeyType="next"
        />
      </View>

      {/* Rest */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Rest (seconds) * (≥ 0)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 90"
          value={restSeconds}
          onChangeText={setRestSeconds}
          keyboardType="number-pad"
          editable={!saving}
          returnKeyType="next"
        />
      </View>

      {/* Notes */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any form cues or notes…"
          value={notes}
          onChangeText={setNotes}
          editable={!saving}
          multiline
          numberOfLines={3}
        />
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Save Changes' : 'Add Exercise'}
          </Text>
        )}
      </Pressable>

      <Pressable style={styles.backStepButton} onPress={() => setStep('pick')} disabled={saving}>
        <Text style={styles.cancelButtonText}>‹ Back to Exercise List</Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 16 },

  // Search
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    color: '#111',
  },

  // Catalog list
  listContent: { paddingBottom: 16 },
  exerciseItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseItemSelected: {
    backgroundColor: '#e8f0fe',
    borderColor: '#4285f4',
  },
  exerciseItemText: { fontSize: 15, color: '#222' },
  exerciseItemTextSelected: { color: '#1a56db', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#999' },

  // Selected exercise banner
  selectedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7d6ff',
  },
  selectedBannerText: { fontSize: 14, color: '#333' },
  selectedBannerName: { fontWeight: '700', color: '#1a56db' },
  changeText: { fontSize: 13, color: '#1a56db', fontWeight: '600' },

  // Config form
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

  // Buttons
  nextButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: '#a0c4ff' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backStepButton: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  cancelButton: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  cancelButtonText: { color: '#666', fontSize: 15 },

  // Error
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#fdecea',
    padding: 10,
    borderRadius: 6,
  },
});
