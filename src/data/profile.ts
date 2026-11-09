import type { Profile } from '@/types/db';
import { AccountStatus, EquipmentType, ExperienceLevel, FitnessGoal } from '@/types/db';

export const DummyProfile: Profile = {
  id: 'ernest.angelo01',
  username: 'ernestangelo',
  display_name: 'Ernest Angelo',
  bio: 'Halo, saya antusias dengan fitness dan latihan kekuatan.',
  avatar_url: null,
  age: 20,
  height: 183,
  weight: 88,
  experience_level: ExperienceLevel.ADVANCED,
  goal: FitnessGoal.GENERAL_FITNESS,
  workout_days_per_week: 5,
  workout_duration_min: 90,
  equipment: [
    EquipmentType.BARBELL,
    EquipmentType.DUMBBELL,
    EquipmentType.BODYWEIGHT,
  ],
  account_status: AccountStatus.ACTIVE,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
};

