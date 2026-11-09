import type { ProgressStats } from '@/types/progress';

export const DummyProgress: ProgressStats = {
  totalWorkouts: 24,
  totalDurationSeconds: 79200, // 22 hours
  totalVolumeKg: 142500,
  totalSets: 312,
  currentStreakDays: 5,
  recentWorkouts: [
    {
      id: 'sess_1',
      planName: 'Push Pull Legs (PPL)',
      dayName: 'Day 1: Push Focus',
      startedAt: '2026-11-08T08:30:00.000Z',
      durationSeconds: 3600,
    },
    {
      id: 'sess_2',
      planName: 'Upper Lower Split',
      dayName: 'Day 2: Lower Power',
      startedAt: '2026-11-06T09:15:00.000Z',
      durationSeconds: 4200,
    },
    {
      id: 'sess_3',
      planName: 'Full Body Workout',
      dayName: 'Day 1: Full Body A',
      startedAt: '2026-11-04T17:00:00.000Z',
      durationSeconds: 3300,
    },
    {
      id: 'sess_4',
      planName: 'Full Body Workout',
      dayName: 'Day 2: Full Body B',
      startedAt: '2026-11-02T16:45:00.000Z',
      durationSeconds: 3450,
    },
    {
      id: 'sess_5',
      planName: 'Full Body Workout',
      dayName: 'Day 3: Full Body C',
      startedAt: '2026-10-31T07:30:00.000Z',
      durationSeconds: 3720,
    },
  ],
};

