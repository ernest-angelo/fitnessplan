export type Exercise = {
  id: string;
  name: string;
};

export type WorkoutExercise = {
  id: string;
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
  notes: string | null;
  exercises: Exercise;
};

export type WorkoutPlanDay = {
  id: string;
  name: string;
  day_number: number;
  workout_exercises: WorkoutExercise[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  visibility: string | null;
  icon: string;
  workout_plan_days?: WorkoutPlanDay[];
};

