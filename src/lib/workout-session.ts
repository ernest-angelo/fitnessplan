import { supabase } from '@/lib/supabase';

export type WorkoutSessionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  day_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  status: string;
};

export type WorkoutSetRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean | null;
};

export async function getAuthenticatedUserId(): Promise<
  { userId: string; error: null } | { userId: null; error: string }
> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { userId: null, error: error?.message || 'You must be logged in.' };
  }

  return { userId: user.id, error: null };
}

export async function ensureInProgressSession(
  planId: string,
  dayId: string
): Promise<{ session: WorkoutSessionRow; error: null } | { session: null; error: string }> {
  const auth = await getAuthenticatedUserId();
  if (auth.userId === null) {
    return { session: null, error: auth.error };
  }

  const { data: existing, error: existingError } = await supabase
    .from('workout_sessions')
    .select('id, user_id, plan_id, day_id, started_at, completed_at, duration_seconds, status')
    .eq('user_id', auth.userId)
    .eq('day_id', dayId)
    .eq('status', 'IN_PROGRESS')
    .order('started_at', { ascending: false })
    .limit(1);

  if (existingError) {
    console.error(existingError);
    return { session: null, error: existingError.message || 'Unable to start workout.' };
  }

  if (existing && existing.length > 0) {
    return { session: existing[0] as WorkoutSessionRow, error: null };
  }

  const startedAt = new Date().toISOString();
  const { data: created, error: insertError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: auth.userId,
      plan_id: planId,
      day_id: dayId,
      started_at: startedAt,
      status: 'IN_PROGRESS',
    })
    .select('id, user_id, plan_id, day_id, started_at, completed_at, duration_seconds, status')
    .single();

  if (insertError || !created) {
    console.error(insertError);
    return { session: null, error: insertError?.message || 'Unable to start workout.' };
  }

  return { session: created as WorkoutSessionRow, error: null };
}

export async function upsertWorkoutSet(params: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  existingId?: string;
}): Promise<{ id: string; error: null } | { id: null; error: string }> {
  if (params.setNumber <= 0) {
    return { id: null, error: 'Set number must be greater than 0.' };
  }
  if (params.weight < 0) {
    return { id: null, error: 'Weight must be 0 or greater.' };
  }
  if (params.reps < 0) {
    return { id: null, error: 'Reps must be 0 or greater.' };
  }

  const payload = {
    weight: params.weight,
    reps: params.reps,
    completed: params.completed,
  };

  if (params.existingId) {
    const { error } = await supabase
      .from('workout_sets')
      .update(payload)
      .eq('id', params.existingId);

    if (error) {
      console.error(error);
      return { id: null, error: error.message || 'Unable to save set.' };
    }

    return { id: params.existingId, error: null };
  }

  const { data: found, error: findError } = await supabase
    .from('workout_sets')
    .select('id')
    .eq('session_id', params.sessionId)
    .eq('exercise_id', params.exerciseId)
    .eq('set_number', params.setNumber)
    .limit(1);

  if (findError) {
    console.error(findError);
    return { id: null, error: findError.message || 'Unable to save set.' };
  }

  const existingId = found?.[0]?.id as string | undefined;

  if (existingId) {
    const { error } = await supabase.from('workout_sets').update(payload).eq('id', existingId);
    if (error) {
      console.error(error);
      return { id: null, error: error.message || 'Unable to save set.' };
    }
    return { id: existingId, error: null };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('workout_sets')
    .insert({
      session_id: params.sessionId,
      exercise_id: params.exerciseId,
      set_number: params.setNumber,
      ...payload,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error(insertError);
    return { id: null, error: insertError?.message || 'Unable to save set.' };
  }

  return { id: inserted.id as string, error: null };
}

export function parseNonNegativeNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function elapsedMs(startedAt: string, nowMs: number): number {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, nowMs - start);
}

export function formatTimer(startedAt: string, nowMs: number): string {
  const totalSeconds = Math.floor(elapsedMs(startedAt, nowMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatDurationLabel(durationSeconds: number): string {
  const safe = Math.max(0, Math.floor(durationSeconds));
  if (safe < 60) return `${safe}s`;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return seconds > 0 ? `${hours}h ${minutes} min` : `${hours}h ${minutes} min`;
  }
  return seconds > 0 ? `${minutes} min ${seconds}s` : `${minutes} min`;
}
