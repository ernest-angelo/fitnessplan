-- ============================================================
-- Fitness Ecosystem - Final Database Schema + RLS
-- Stack: Supabase + PostgreSQL
-- Version: 1.0
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ENUMS
-- ============================================================

do $$ begin
  create type public.experience_level as enum (
    'BEGINNER', 'INTERMEDIATE', 'ADVANCED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.fitness_goal as enum (
    'MUSCLE_GAIN', 'FAT_LOSS', 'STRENGTH', 'ENDURANCE', 'GENERAL_FITNESS'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.plan_visibility as enum (
    'PUBLIC', 'PRIVATE'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_status as enum (
    'IN_PROGRESS', 'COMPLETED', 'ABANDONED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.muscle_group as enum (
    'CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE', 'FULL_BODY'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.equipment_type as enum (
    'BARBELL',
    'DUMBBELL',
    'MACHINE',
    'CABLE',
    'BODYWEIGHT',
    'KETTLEBELL',
    'BANDS',
    'BENCH',
    'SMITH_MACHINE',
    'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_type as enum (
    'TRAINER', 'ATHLETE', 'CREATOR'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_status as enum (
    'PENDING', 'APPROVED', 'REJECTED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum (
    'ACTIVE', 'SUSPENDED', 'DELETED'
  );
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 2. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3. PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  username varchar(30) not null unique,
  display_name varchar(50) not null,
  bio text,
  avatar_url text,

  age smallint check (age between 10 and 100),
  height numeric(5,2) check (height > 0),
  weight numeric(5,2) check (weight > 0),

  experience_level public.experience_level not null default 'BEGINNER',
  goal public.fitness_goal not null default 'GENERAL_FITNESS',
  workout_days_per_week smallint check (workout_days_per_week between 1 and 7),
  workout_duration_min integer check (workout_duration_min > 0),
  equipment public.equipment_type[] not null default '{}',

  account_status public.account_status not null default 'ACTIVE',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format
    check (username ~ '^[a-zA-Z0-9_]+$')
);

create index if not exists idx_profiles_username
  on public.profiles(username);

create index if not exists idx_profiles_account_status
  on public.profiles(account_status);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Prevent a normal user from changing account_status.
-- Service-role/server-side operations can still manage it.
create or replace function public.protect_account_status()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and new.account_status is distinct from old.account_status then
    raise exception 'account_status can only be changed by an authorized server operation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_account_status on public.profiles;
create trigger trg_protect_account_status
before update on public.profiles
for each row execute function public.protect_account_status();

-- ============================================================
-- 4. EXERCISES
-- ============================================================

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),

  name varchar(100) not null unique,
  description text,
  muscle_group public.muscle_group not null,
  equipment public.equipment_type[] not null default '{}',
  instructions text,

  created_at timestamptz not null default now()
);

create index if not exists idx_exercises_muscle_group
  on public.exercises(muscle_group);

-- ============================================================
-- 5. WORKOUT PLANS
-- ============================================================

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null references public.profiles(id) on delete cascade,
  source_plan_id uuid references public.workout_plans(id) on delete set null,

  name varchar(100) not null,
  description text,

  goal public.fitness_goal not null default 'GENERAL_FITNESS',
  difficulty public.experience_level not null default 'BEGINNER',
  visibility public.plan_visibility not null default 'PRIVATE',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workout_plans_no_self_source
    check (source_plan_id is null or source_plan_id <> id)
);

create index if not exists idx_workout_plans_owner
  on public.workout_plans(owner_id);

create index if not exists idx_workout_plans_public
  on public.workout_plans(visibility)
  where visibility = 'PUBLIC';

create index if not exists idx_workout_plans_source
  on public.workout_plans(source_plan_id);

drop trigger if exists trg_workout_plans_updated_at on public.workout_plans;
create trigger trg_workout_plans_updated_at
before update on public.workout_plans
for each row execute function public.set_updated_at();

-- ============================================================
-- 6. WORKOUT PLAN DAYS
-- ============================================================

create table if not exists public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),

  workout_plan_id uuid not null
    references public.workout_plans(id) on delete cascade,

  name varchar(100) not null,
  day_number integer not null check (day_number >= 1),

  created_at timestamptz not null default now(),

  unique (workout_plan_id, day_number)
);

create index if not exists idx_workout_plan_days_plan
  on public.workout_plan_days(workout_plan_id);

-- ============================================================
-- 7. WORKOUT EXERCISES
-- ============================================================

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),

  workout_day_id uuid not null
    references public.workout_plan_days(id) on delete cascade,

  exercise_id uuid not null
    references public.exercises(id) on delete restrict,

  order_index integer not null check (order_index >= 0),
  target_sets integer not null check (target_sets > 0),
  target_reps integer not null check (target_reps > 0),
  rest_seconds integer not null default 0 check (rest_seconds >= 0),
  notes text,

  created_at timestamptz not null default now(),

  unique (workout_day_id, order_index)
);

create index if not exists idx_workout_exercises_day
  on public.workout_exercises(workout_day_id);

create index if not exists idx_workout_exercises_exercise
  on public.workout_exercises(exercise_id);

-- ============================================================
-- 8. WORKOUT SESSIONS
-- ============================================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  workout_plan_id uuid
    references public.workout_plans(id) on delete set null,

  workout_day_id uuid
    references public.workout_plan_days(id) on delete set null,

  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds >= 0),

  status public.session_status not null default 'IN_PROGRESS',

  created_at timestamptz not null default now(),

  constraint workout_sessions_completion_time
    check (completed_at is null or completed_at >= started_at)
);

create index if not exists idx_workout_sessions_user
  on public.workout_sessions(user_id);

create index if not exists idx_workout_sessions_plan
  on public.workout_sessions(workout_plan_id);

create index if not exists idx_workout_sessions_created_at
  on public.workout_sessions(created_at desc);

-- ============================================================
-- 9. WORKOUT SETS
-- ============================================================

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.workout_sessions(id) on delete cascade,

  exercise_id uuid not null
    references public.exercises(id) on delete restrict,

  set_number integer not null check (set_number > 0),
  weight numeric(6,2) not null default 0 check (weight >= 0),
  reps integer not null default 0 check (reps >= 0),
  completed boolean not null default false,

  created_at timestamptz not null default now(),

  unique (session_id, exercise_id, set_number)
);

create index if not exists idx_workout_sets_session
  on public.workout_sets(session_id);

create index if not exists idx_workout_sets_exercise
  on public.workout_sets(exercise_id);

-- ============================================================
-- 10. POSTS
-- ============================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),

  author_id uuid not null
    references public.profiles(id) on delete cascade,

  content text,
  media_url text,

  session_id uuid
    references public.workout_sessions(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint posts_has_content_or_media
    check (
      nullif(trim(content), '') is not null
      or nullif(trim(media_url), '') is not null
    )
);

create index if not exists idx_posts_author
  on public.posts(author_id);

create index if not exists idx_posts_created_at
  on public.posts(created_at desc);

-- ============================================================
-- 11. COMMENTS
-- ============================================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null
    references public.posts(id) on delete cascade,

  author_id uuid not null
    references public.profiles(id) on delete cascade,

  content text not null check (char_length(trim(content)) > 0),

  created_at timestamptz not null default now()
);

create index if not exists idx_comments_post
  on public.comments(post_id);

-- ============================================================
-- 12. LIKES
-- ============================================================

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null
    references public.posts(id) on delete cascade,

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  created_at timestamptz not null default now(),

  unique (post_id, user_id)
);

create index if not exists idx_likes_post
  on public.likes(post_id);

-- ============================================================
-- 13. FOLLOWS
-- ============================================================

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),

  follower_id uuid not null
    references public.profiles(id) on delete cascade,

  following_id uuid not null
    references public.profiles(id) on delete cascade,

  created_at timestamptz not null default now(),

  unique (follower_id, following_id),

  constraint follows_no_self_follow
    check (follower_id <> following_id)
);

create index if not exists idx_follows_follower
  on public.follows(follower_id);

create index if not exists idx_follows_following
  on public.follows(following_id);

-- ============================================================
-- 14. VERIFICATION REQUESTS
-- ============================================================

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  type public.verification_type not null,
  status public.verification_status not null default 'PENDING',

  reviewed_by uuid
    references public.profiles(id) on delete set null,

  reviewed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint verification_review_consistency
    check (
      (status = 'PENDING' and reviewed_by is null and reviewed_at is null)
      or
      (status in ('APPROVED', 'REJECTED')
       and reviewed_by is not null
       and reviewed_at is not null)
    )
);

create index if not exists idx_verification_requests_user
  on public.verification_requests(user_id);

create index if not exists idx_verification_requests_pending
  on public.verification_requests(status)
  where status = 'PENDING';

-- ============================================================
-- 15. RLS ENABLEMENT
-- ============================================================

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.verification_requests enable row level security;

-- ============================================================
-- 16. RLS POLICIES
-- ============================================================

-- ----- PROFILES -----

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
on public.profiles
for select
to authenticated
using (account_status = 'ACTIVE');

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and account_status = 'ACTIVE'
);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  and account_status = 'ACTIVE'
)
with check (
  id = auth.uid()
  and account_status = 'ACTIVE'
);

-- ----- EXERCISES -----

drop policy if exists exercises_select_authenticated on public.exercises;
create policy exercises_select_authenticated
on public.exercises
for select
to authenticated
using (true);

-- No INSERT/UPDATE/DELETE policy:
-- exercise writes are server/admin operations only.

-- ----- WORKOUT PLANS -----

drop policy if exists workout_plans_select_visible on public.workout_plans;
create policy workout_plans_select_visible
on public.workout_plans
for select
to authenticated
using (
  owner_id = auth.uid()
  or (
    visibility = 'PUBLIC'
    and exists (
      select 1
      from public.profiles p
      where p.id = workout_plans.owner_id
        and p.account_status = 'ACTIVE'
    )
  )
);

drop policy if exists workout_plans_insert_own on public.workout_plans;
create policy workout_plans_insert_own
on public.workout_plans
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists workout_plans_update_own on public.workout_plans;
create policy workout_plans_update_own
on public.workout_plans
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists workout_plans_delete_own on public.workout_plans;
create policy workout_plans_delete_own
on public.workout_plans
for delete
to authenticated
using (owner_id = auth.uid());

-- ----- WORKOUT PLAN DAYS -----

drop policy if exists workout_plan_days_select_visible on public.workout_plan_days;
create policy workout_plan_days_select_visible
on public.workout_plan_days
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_days.workout_plan_id
      and (
        wp.owner_id = auth.uid()
        or wp.visibility = 'PUBLIC'
      )
  )
);

drop policy if exists workout_plan_days_insert_owner on public.workout_plan_days;
create policy workout_plan_days_insert_owner
on public.workout_plan_days
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_days.workout_plan_id
      and wp.owner_id = auth.uid()
  )
);

drop policy if exists workout_plan_days_update_owner on public.workout_plan_days;
create policy workout_plan_days_update_owner
on public.workout_plan_days
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_days.workout_plan_id
      and wp.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_days.workout_plan_id
      and wp.owner_id = auth.uid()
  )
);

drop policy if exists workout_plan_days_delete_owner on public.workout_plan_days;
create policy workout_plan_days_delete_owner
on public.workout_plan_days
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_plans wp
    where wp.id = workout_plan_days.workout_plan_id
      and wp.owner_id = auth.uid()
  )
);

-- ----- WORKOUT EXERCISES -----

drop policy if exists workout_exercises_select_visible on public.workout_exercises;
create policy workout_exercises_select_visible
on public.workout_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp
      on wp.id = wpd.workout_plan_id
    where wpd.id = workout_exercises.workout_day_id
      and (
        wp.owner_id = auth.uid()
        or wp.visibility = 'PUBLIC'
      )
  )
);

drop policy if exists workout_exercises_insert_owner on public.workout_exercises;
create policy workout_exercises_insert_owner
on public.workout_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp
      on wp.id = wpd.workout_plan_id
    where wpd.id = workout_exercises.workout_day_id
      and wp.owner_id = auth.uid()
  )
);

drop policy if exists workout_exercises_update_owner on public.workout_exercises;
create policy workout_exercises_update_owner
on public.workout_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp
      on wp.id = wpd.workout_plan_id
    where wpd.id = workout_exercises.workout_day_id
      and wp.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp
      on wp.id = wpd.workout_plan_id
    where wpd.id = workout_exercises.workout_day_id
      and wp.owner_id = auth.uid()
  )
);

drop policy if exists workout_exercises_delete_owner on public.workout_exercises;
create policy workout_exercises_delete_owner
on public.workout_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_plan_days wpd
    join public.workout_plans wp
      on wp.id = wpd.workout_plan_id
    where wpd.id = workout_exercises.workout_day_id
      and wp.owner_id = auth.uid()
  )
);

-- ----- WORKOUT SESSIONS -----

drop policy if exists workout_sessions_select_own on public.workout_sessions;
create policy workout_sessions_select_own
on public.workout_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists workout_sessions_insert_own on public.workout_sessions;
create policy workout_sessions_insert_own
on public.workout_sessions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists workout_sessions_update_own on public.workout_sessions;
create policy workout_sessions_update_own
on public.workout_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists workout_sessions_delete_own on public.workout_sessions;
create policy workout_sessions_delete_own
on public.workout_sessions
for delete
to authenticated
using (user_id = auth.uid());

-- ----- WORKOUT SETS -----

drop policy if exists workout_sets_select_own on public.workout_sets;
create policy workout_sets_select_own
on public.workout_sets
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_sets.session_id
      and ws.user_id = auth.uid()
  )
);

drop policy if exists workout_sets_insert_own on public.workout_sets;
create policy workout_sets_insert_own
on public.workout_sets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_sets.session_id
      and ws.user_id = auth.uid()
  )
);

drop policy if exists workout_sets_update_own on public.workout_sets;
create policy workout_sets_update_own
on public.workout_sets
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_sets.session_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_sets.session_id
      and ws.user_id = auth.uid()
  )
);

drop policy if exists workout_sets_delete_own on public.workout_sets;
create policy workout_sets_delete_own
on public.workout_sets
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_sets.session_id
      and ws.user_id = auth.uid()
  )
);

-- ----- POSTS -----

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
on public.posts
for select
to authenticated
using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
on public.posts
for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
on public.posts
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own
on public.posts
for delete
to authenticated
using (author_id = auth.uid());

-- ----- COMMENTS -----

drop policy if exists comments_select_public on public.comments;
create policy comments_select_public
on public.comments
for select
to authenticated
using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
on public.comments
for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own
on public.comments
for delete
to authenticated
using (author_id = auth.uid());

-- ----- LIKES -----

drop policy if exists likes_select_public on public.likes;
create policy likes_select_public
on public.likes
for select
to authenticated
using (true);

drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own
on public.likes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own
on public.likes
for delete
to authenticated
using (user_id = auth.uid());

-- ----- FOLLOWS -----

drop policy if exists follows_select_public on public.follows;
create policy follows_select_public
on public.follows
for select
to authenticated
using (true);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own
on public.follows
for insert
to authenticated
with check (follower_id = auth.uid());

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own
on public.follows
for delete
to authenticated
using (follower_id = auth.uid());

-- ----- VERIFICATION REQUESTS -----

drop policy if exists verification_requests_select_own on public.verification_requests;
create policy verification_requests_select_own
on public.verification_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists verification_requests_insert_own on public.verification_requests;
create policy verification_requests_insert_own
on public.verification_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'PENDING'
  and reviewed_by is null
  and reviewed_at is null
);

-- No authenticated-user UPDATE policy.
-- Approval/rejection must be performed by a trusted server/admin operation.

-- ============================================================
-- 17. HELPER VIEWS FOR VERIFIED BADGES
-- ============================================================

create or replace view public.verified_profiles
with (security_invoker = true)
as
select
  p.id,
  p.username,
  p.display_name,
  exists (
    select 1 from public.verification_requests vr
    where vr.user_id = p.id
      and vr.type = 'CREATOR'
      and vr.status = 'APPROVED'
  ) as is_verified_creator,
  exists (
    select 1 from public.verification_requests vr
    where vr.user_id = p.id
      and vr.type = 'TRAINER'
      and vr.status = 'APPROVED'
  ) as is_verified_trainer,
  exists (
    select 1 from public.verification_requests vr
    where vr.user_id = p.id
      and vr.type = 'ATHLETE'
      and vr.status = 'APPROVED'
  ) as is_verified_athlete
from public.profiles p;

-- ============================================================
-- 18. BASIC SEED DATA
-- ============================================================

insert into public.exercises
  (name, description, muscle_group, equipment, instructions)
values
  ('Bench Press', 'Barbell horizontal press.', 'CHEST',
    array['BARBELL'::public.equipment_type, 'BENCH'::public.equipment_type],
    'Lie on the bench, lower the bar under control, then press upward.'),

  ('Incline Dumbbell Press', 'Incline dumbbell chest press.', 'CHEST',
    array['DUMBBELL'::public.equipment_type, 'BENCH'::public.equipment_type],
    'Press dumbbells upward while maintaining control.'),

  ('Cable Fly', 'Cable-based chest fly.', 'CHEST',
    array['CABLE'::public.equipment_type],
    'Bring the handles together with controlled movement.'),

  ('Lat Pulldown', 'Vertical pulling movement for the back.', 'BACK',
    array['MACHINE'::public.equipment_type, 'CABLE'::public.equipment_type],
    'Pull the bar toward the upper chest while keeping control.'),

  ('Barbell Row', 'Barbell horizontal pulling movement.', 'BACK',
    array['BARBELL'::public.equipment_type],
    'Pull the bar toward the torso while maintaining a stable position.'),

  ('Overhead Press', 'Overhead pressing movement.', 'SHOULDERS',
    array['BARBELL'::public.equipment_type],
    'Press the bar overhead while maintaining a stable posture.'),

  ('Dumbbell Lateral Raise', 'Isolation exercise for the lateral deltoids.', 'SHOULDERS',
    array['DUMBBELL'::public.equipment_type],
    'Raise dumbbells laterally with controlled movement.'),

  ('Barbell Squat', 'Compound lower-body movement.', 'LEGS',
    array['BARBELL'::public.equipment_type],
    'Squat under control while maintaining stable posture.'),

  ('Leg Press', 'Machine-based lower-body press.', 'LEGS',
    array['MACHINE'::public.equipment_type],
    'Press the platform while maintaining controlled range of motion.'),

  ('Romanian Deadlift', 'Hip-hinge movement targeting the posterior chain.', 'LEGS',
    array['BARBELL'::public.equipment_type],
    'Hinge at the hips while keeping the weight controlled.'),

  ('Biceps Curl', 'Arm isolation exercise.', 'ARMS',
    array['DUMBBELL'::public.equipment_type],
    'Curl the weight upward without excessive body movement.'),

  ('Triceps Pushdown', 'Cable triceps isolation exercise.', 'ARMS',
    array['CABLE'::public.equipment_type],
    'Push the handle downward while keeping the elbows controlled.'),

  ('Plank', 'Isometric core exercise.', 'CORE',
    array['BODYWEIGHT'::public.equipment_type],
    'Maintain a stable plank position while bracing the core.')
on conflict (name) do nothing;

-- ============================================================
-- END
-- ============================================================
