-- ============================================================================
-- Studyling Learning Platform - Neon Tech PostgreSQL Database Schema
-- File: 01_schema.sql
-- Description: Core tables, constraints, indexes, and triggers for Neon Tech
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-initializing (in reverse dependency order)
DROP TABLE IF EXISTS user_quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS flashcard_reviews CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS flashcard_decks CASCADE;
DROP TABLE IF EXISTS study_timer_sessions CASCADE;
DROP TABLE IF EXISTS user_node_progress CASCADE;
DROP TABLE IF EXISTS learning_path_nodes CASCADE;
DROP TABLE IF EXISTS learning_path_sections CASCADE;
DROP TABLE IF EXISTS user_course_enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    streak_count INT NOT NULL DEFAULT 12 CHECK (streak_count >= 0),
    total_xp INT NOT NULL DEFAULT 1420 CHECK (total_xp >= 0),
    level INT NOT NULL DEFAULT 4 CHECK (level >= 1),
    study_time_today_minutes INT NOT NULL DEFAULT 45,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Daily User Streaks & Activity Table
-- ----------------------------------------------------------------------------
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sessions_completed INT NOT NULL DEFAULT 1 CHECK (sessions_completed >= 0),
    xp_gained INT NOT NULL DEFAULT 20 CHECK (xp_gained >= 0),
    minutes_studied INT NOT NULL DEFAULT 25 CHECK (minutes_studied >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_daily_streak UNIQUE (user_id, activity_date)
);

-- ----------------------------------------------------------------------------
-- 3. Courses Table (Matches Stitch designs: PSY-402, MTH-108, MTH-101, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,                -- e.g. '01 / PSY-402', 'MTH-101'
    code_number VARCHAR(10) NOT NULL DEFAULT '01',   -- e.g. '01', '02', '03'
    title VARCHAR(150) NOT NULL,                     -- e.g. 'Kognitionspsychologie'
    subtitle TEXT,                                   -- e.g. 'Gedächtnismodelle & Exekutivfunktionen'
    category VARCHAR(50) NOT NULL DEFAULT 'Basis-Fächer', -- 'Basis-Fächer', 'Vertiefung', 'Katalog'
    semester VARCHAR(50) NOT NULL DEFAULT 'Sem. 1 / 2025', -- 'Q2 • 2025' or 'Sem. 1 / 2025'
    description TEXT,
    topics_summary TEXT,                             -- e.g. 'Analysis, Lineare Algebra, Vektoren'
    current_level_label VARCHAR(30) DEFAULT 'Stufe 4',
    current_module_label VARCHAR(30) DEFAULT 'Modul 3.2',
    total_modules INT NOT NULL DEFAULT 8,
    color_accent VARCHAR(20) DEFAULT '#fdc425',
    is_core_curriculum BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. User Course Enrollments & Progress
-- ----------------------------------------------------------------------------
CREATE TABLE user_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    progress_pct INT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    cards_due_count INT NOT NULL DEFAULT 0 CHECK (cards_due_count >= 0),
    last_studied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_course_enrollment UNIQUE (user_id, course_id)
);

-- ----------------------------------------------------------------------------
-- 5. Learning Path Sections (e.g. "Mathematik / Abschnitt 01 - Vektoren & Matrizen")
-- ----------------------------------------------------------------------------
CREATE TABLE learning_path_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_index INT NOT NULL DEFAULT 1,
    section_tag VARCHAR(50) NOT NULL DEFAULT 'Abschnitt 01',
    title VARCHAR(150) NOT NULL,                     -- e.g. 'Vektoren & Matrizen'
    description TEXT,                                -- e.g. 'Grundlagen der Linearen Algebra für ingenieur- und naturwissenschaftliche Studiengänge.'
    progress_pct INT NOT NULL DEFAULT 25 CHECK (progress_pct BETWEEN 0 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. Learning Path Nodes / Units (01 Vektorrechnung, 02 Skalarprodukt, 03 Matrixmultiplikation, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE learning_path_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES learning_path_sections(id) ON DELETE CASCADE,
    order_index INT NOT NULL,                        -- 1, 2, 3, 4, 5
    node_number VARCHAR(10) NOT NULL,               -- '01', '02', '03', '04', '05'
    title VARCHAR(150) NOT NULL,                     -- e.g. 'Matrixmultiplikation'
    description TEXT,                                -- e.g. 'Zeile mal Spalte & Dimensionen von Matrizen im euklidischen Raum.'
    node_type VARCHAR(30) NOT NULL DEFAULT 'lesson' CHECK (node_type IN ('lesson', 'milestone', 'quiz', 'recap')),
    xp_reward INT NOT NULL DEFAULT 20 CHECK (xp_reward >= 0),
    default_status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (default_status IN ('completed', 'current', 'locked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. User Node Progress
-- ----------------------------------------------------------------------------
CREATE TABLE user_node_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('completed', 'current', 'locked')),
    score_pct INT NOT NULL DEFAULT 0 CHECK (score_pct BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_node UNIQUE (user_id, node_id)
);

-- ----------------------------------------------------------------------------
-- 8. Quiz Questions (Matches Stitch screen 1: Active Recall & LTP Question)
-- ----------------------------------------------------------------------------
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES learning_path_nodes(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    topic_tag VARCHAR(100) NOT NULL DEFAULT 'Neurobiologie',
    category VARCHAR(50) NOT NULL DEFAULT 'Aktives Erinnern',
    question_number INT NOT NULL DEFAULT 6,
    total_questions INT NOT NULL DEFAULT 10,
    question_text TEXT NOT NULL,                     -- e.g. 'Welche Funktion erfüllt die Langzeitpotenzierung (LTP) im Hippocampus?'
    highlight_phrase TEXT,                          -- e.g. 'Langzeitpotenzierung (LTP)'
    instruction TEXT DEFAULT 'Wähle die zutreffende Antwort',
    xp_reward INT NOT NULL DEFAULT 20,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. Quiz Options (A, B, C...)
-- ----------------------------------------------------------------------------
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_letter CHAR(1) NOT NULL,                 -- 'A', 'B', 'C', 'D'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- 10. User Quiz Attempts
-- ----------------------------------------------------------------------------
CREATE TABLE user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES quiz_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL,
    xp_earned INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. Study Timer Sessions (Matches Stitch screen 5: Pomodoro & Deep Work)
-- ----------------------------------------------------------------------------
CREATE TABLE study_timer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    mode VARCHAR(30) NOT NULL CHECK (mode IN ('pomodoro_25', 'deep_50', 'pause_5', 'custom')),
    interval_current INT NOT NULL DEFAULT 1,
    interval_total INT NOT NULL DEFAULT 4,
    duration_seconds INT NOT NULL DEFAULT 1500,     -- 25 min = 1500 sec
    elapsed_seconds INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    dnd_active BOOLEAN NOT NULL DEFAULT TRUE,       -- Ablenkungsfreier Modus
    xp_reward INT NOT NULL DEFAULT 25,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 12. Flashcard Decks & Cards (For "8 Karten fällig" feature)
-- ----------------------------------------------------------------------------
CREATE TABLE flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    repetition_interval_days INT NOT NULL DEFAULT 1,
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Indexes for High-Performance Queries in Neon Tech Serverless Postgres
-- ----------------------------------------------------------------------------
CREATE INDEX idx_user_streaks_user_date ON user_streaks(user_id, activity_date DESC);
CREATE INDEX idx_enrollments_user_status ON user_course_enrollments(user_id, status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_learning_nodes_section ON learning_path_nodes(section_id, order_index ASC);
CREATE INDEX idx_user_node_progress_user ON user_node_progress(user_id, node_id);
CREATE INDEX idx_quiz_questions_node ON quiz_questions(node_id);
CREATE INDEX idx_quiz_options_question ON quiz_options(question_id);
CREATE INDEX idx_timer_sessions_user ON study_timer_sessions(user_id, started_at DESC);
CREATE INDEX idx_flashcards_deck_due ON flashcards(deck_id, due_date);

-- ----------------------------------------------------------------------------
-- Trigger Function: Auto-update `updated_at` column
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_courses
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_node_progress
BEFORE UPDATE ON user_node_progress
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
