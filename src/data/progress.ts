import type { ProgressStats } from '@/types/progress';

export const DummyProgress: ProgressStats = {
  totalWorkouts: 24,
  totalDurationSeconds: 79200, // 22 hours
  totalVolumeKg: 142500,
  totalSets: 312,
  currentStreakDays: 5,
  recentWorkouts: [
    {
      id: 'session_1',
      planName: 'Push Pull Legs (PPL)',
      dayName: 'Day 1: Push Focus',
      startedAt: '2026-11-08',
      durationSeconds: 3600,
    },
    {
      id: 'session_2',
      planName: 'Upper Lower Split',
      dayName: 'Day 2: Lower Power',
      startedAt: '2026-11-06',
      durationSeconds: 4200,
    },
    {
      id: 'session_3',
      planName: 'Full Body Workout',
      dayName: 'Day 1: Full Body A',
      startedAt: '2026-11-04',
      durationSeconds: 3300,
    },
    {
      id: 'session_4',
      planName: 'Full Body Workout',
      dayName: 'Day 2: Full Body B',
      startedAt: '2026-11-02',
      durationSeconds: 3450,
    },
    {
      id: 'session_5',
      planName: 'Full Body Workout',
      dayName: 'Day 3: Full Body C',
      startedAt: '2026-10-31',
      durationSeconds: 3720,
    },
  ],
};

