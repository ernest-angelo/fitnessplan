import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
/**
 * Dual-mode screen: Add Day (no day_id param) or Edit Day (day_id param present).
 *
 * Add mode:  INSERT INTO workout_plan_days
 * Edit mode: UPDATE workout_plan_days SET name=?, day_number=? WHERE id=day_id
 *
 * In both modes, plan ownership is enforced by RLS on workout_plan_days.
 */
export default function AddDayScreen() {
  const { id: planId, day_id } = useLocalSearchParams<{
    id: string;
    day_id?: string;
  }>();

  const isEditMode = !!day_id;

  const [name, setName] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // In edit mode, pre-fill fields from the existing row.
  useEffect(() => {
    if (isEditMode && day_id) {
      prefillDay(day_id);
    }
  }, [day_id]);

  const prefillDay = async (dayId: string) => {
    try {
      setLoadingInitial(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('workout_plan_days')
        .select('name, day_number')
        .eq('id', dayId)
        .single();

      if (fetchError || !data) {
        setError(fetchError?.message ?? 'Failed to load day.');
        return;
      }

      setName(data.name ?? '');
      setDayNumber(String(data.day_number ?? ''));
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Day name is required.';
    const num = parseInt(dayNumber, 10);
    if (!dayNumber.trim() || isNaN(num) || num < 1) {
      return 'Day number must be a whole number ≥ 1.';
    }
    return null;
  };

  const handleSave = async () => {
    if (saving) return;
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        // ── Edit mode: UPDATE existing row ──────────────────────────────────
        const { error: updateError } = await supabase
          .from('workout_plan_days')
          .update({
            name: name.trim(),
            day_number: parseInt(dayNumber, 10),
          })
          .eq('id', day_id);

        if (updateError) {
          setError(updateError.message || 'Failed to update day.');
          return;
        }
      } else {
        // ── Add mode: INSERT new row ────────────────────────────────────────
        const { error: insertError } = await supabase
          .from('workout_plan_days')
          .insert({
            plan_id: planId,
            name: name.trim(),
            day_number: parseInt(dayNumber, 10),
          });

        if (insertError) {
          setError(insertError.message || 'Failed to add day.');
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

  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{isEditMode ? 'Edit Day' : 'Add Day'}</Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Day Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Day Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Push Day"
          value={name}
          onChangeText={setName}
          editable={!saving}
          returnKeyType="next"
        />
      </View>

      {/* Day Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Day Number * (≥ 1)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1"
          value={dayNumber}
          onChangeText={setDayNumber}
          editable={!saving}
          keyboardType="number-pad"
          returnKeyType="done"
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
            {isEditMode ? 'Save Changes' : 'Add Day'}
          </Text>
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
