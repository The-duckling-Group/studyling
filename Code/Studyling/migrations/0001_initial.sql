create extension if not exists pgcrypto;

create type app_role as enum ('student', 'teacher', 'editor', 'admin');
create type content_status as enum ('draft', 'review', 'published', 'archived');
create type exercise_type as enum ('explanation', 'multiple_choice', 'multiple_select', 'text', 'fill_gap', 'matching', 'ordering', 'true_false', 'flashcard', 'example');
create type review_state as enum ('new', 'learning', 'review', 'mastered');

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text unique,
  display_name text not null,
  username text unique,
  grade text check (grade in ('5','6','7','8','9','10','Oberstufe')),
  role app_role not null default 'student',
  daily_goal_minutes smallint not null default 10 check (daily_goal_minutes in (5,10,20,30)),
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subjects (
  id text primary key,
  name text not null,
  color text not null,
  sort_order smallint not null default 0
);

create table learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  subject_id text not null references subjects(id),
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('Leicht','Mittel','Anspruchsvoll')),
  grade_min smallint not null check (grade_min between 5 and 13),
  grade_max smallint not null check (grade_max between grade_min and 13),
  estimated_minutes integer not null check (estimated_minutes > 0),
  xp_reward integer not null default 0,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table levels (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references learning_paths(id) on delete cascade,
  title text not null,
  description text not null,
  position smallint not null,
  unique (learning_path_id, position)
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references levels(id) on delete cascade,
  title text not null,
  lesson_type text not null check (lesson_type in ('Lernen','Üben','Quiz')),
  estimated_minutes smallint not null check (estimated_minutes > 0),
  position smallint not null,
  status content_status not null default 'draft',
  unique (level_id, position)
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  type exercise_type not null,
  prompt text not null,
  options jsonb,
  answer jsonb not null,
  explanation text not null,
  xp_reward smallint not null default 5 check (xp_reward between 0 and 100),
  position smallint not null,
  unique (lesson_id, position)
);

create table path_progress (
  profile_id uuid not null references profiles(id) on delete cascade,
  learning_path_id uuid not null references learning_paths(id) on delete cascade,
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (profile_id, learning_path_id)
);

create table lesson_progress (
  profile_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  score_percent smallint check (score_percent between 0 and 100),
  attempts integer not null default 0,
  completed_at timestamptz,
  primary key (profile_id, lesson_id)
);

create table exercise_reviews (
  profile_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  state review_state not null default 'new',
  interval_days integer not null default 0,
  correct_streak smallint not null default 0,
  next_review_at timestamptz not null default now(),
  last_answered_at timestamptz,
  primary key (profile_id, exercise_id)
);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  answered_count integer not null default 0,
  correct_count integer not null default 0,
  xp_earned integer not null default 0
);

create index learning_paths_discovery_idx on learning_paths (status, subject_id, grade_min, grade_max);
create index lessons_level_idx on lessons (level_id, position);
create index reviews_due_idx on exercise_reviews (profile_id, next_review_at) where state <> 'mastered';
create index sessions_profile_date_idx on study_sessions (profile_id, started_at desc);
