export type RecentWorkout = {
  id: string;
  planName: string;
  dayName: string;
  startedAt: string;
  durationSeconds: number;
};

export type ProgressStats = {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  currentStreakDays: number;
  recentWorkouts: RecentWorkout[];
};

