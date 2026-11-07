// src/types/db.ts
// Auto‑generated typings that mirror the Supabase database enums and table contracts.
// These types are used across the app to ensure strict alignment with the
// authoritative PostgreSQL schema (fitness_ecosystem_final_schema.sql).

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum FitnessGoal {
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  FAT_LOSS = 'FAT_LOSS',
  STRENGTH = 'STRENGTH',
  ENDURANCE = 'ENDURANCE',
  GENERAL_FITNESS = 'GENERAL_FITNESS',
}

export enum PlanVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum MuscleGroup {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  ARMS = 'ARMS',
  LEGS = 'LEGS',
  CORE = 'CORE',
  FULL_BODY = 'FULL_BODY',
}

export enum EquipmentType {
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  MACHINE = 'MACHINE',
  CABLE = 'CABLE',
  BODYWEIGHT = 'BODYWEIGHT',
  KETTLEBELL = 'KETTLEBELL',
  BANDS = 'BANDS',
  BENCH = 'BENCH',
  SMITH_MACHINE = 'SMITH_MACHINE',
  OTHER = 'OTHER',
}

export enum VerificationType {
  TRAINER = 'TRAINER',
  ATHLETE = 'ATHLETE',
  CREATOR = 'CREATOR',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// Interfaces matching table columns (only the fields used by the app).
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  experience_level: ExperienceLevel;
  goal: FitnessGoal;
  workout_days_per_week?: number | null;
  workout_duration_min?: number | null;
  equipment: EquipmentType[];
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string | null;
  goal: FitnessGoal;
  difficulty: ExperienceLevel;
  visibility: PlanVisibility;
}

export interface WorkoutSessionRow {
  id: string;
  user_id: string;
  workout_plan_id: string;
  workout_day_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  status: SessionStatus;
}

export interface WorkoutSetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
}
