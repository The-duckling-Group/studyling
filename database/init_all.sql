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
-- ============================================================================
-- Studyling Learning Platform - Neon Tech PostgreSQL Seed Data
-- File: 02_seed.sql
-- Description: Realistic production demo data matching the Google Stitch designs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Insert Primary Demo User (Matches Stitch Header: Alex, 12 Streak, 1420 XP)
-- ----------------------------------------------------------------------------
INSERT INTO users (
    id, username, email, display_name, avatar_url,
    streak_count, total_xp, level, study_time_today_minutes
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'alex_study',
    'alex@studyling.app',
    'Alex M.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    12,
    1420,
    4,
    45
) ON CONFLICT (id) DO UPDATE SET
    streak_count = EXCLUDED.streak_count,
    total_xp = EXCLUDED.total_xp;

-- ----------------------------------------------------------------------------
-- 2. Insert User Streaks History (Last 12 Days)
-- ----------------------------------------------------------------------------
INSERT INTO user_streaks (user_id, activity_date, sessions_completed, xp_gained, minutes_studied)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE, 2, 45, 50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '1 day', 3, 70, 75),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '2 days', 2, 40, 50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '3 days', 4, 90, 100),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '4 days', 1, 25, 25),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '5 days', 2, 50, 50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '6 days', 3, 65, 75),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '7 days', 2, 40, 50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '8 days', 3, 60, 75),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '9 days', 2, 45, 50),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '10 days', 1, 20, 25),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - INTERVAL '11 days', 2, 50, 50)
ON CONFLICT (user_id, activity_date) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Insert Courses (Matching Stitch Screen 2 & Screen 4)
-- ----------------------------------------------------------------------------
-- Course 1: Kognitionspsychologie (01 / PSY-402)
INSERT INTO courses (
    id, code, code_number, title, subtitle, category, semester,
    description, topics_summary, current_level_label, current_module_label,
    total_modules, color_accent, is_core_curriculum
) VALUES (
    'c1111111-1111-1111-1111-111111111111',
    'PSY-402',
    '01',
    'Kognitionspsychologie',
    'Gedächtnismodelle & Exekutivfunktionen',
    'Basis-Fächer',
    'Q2 • 2025',
    'Einführung in die menschliche Informationsverarbeitung, neuronale Grundlagen des Gedächtnisses und exekutive Kontrollprozesse.',
    'Sensorisches Gedächtnis, Arbeitsgedächtnis, LTP, Aufmerksamkeit',
    'Stufe 4',
    'Modul 3.2',
    10,
    '#fdc425',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Course 2: Statistik & Datenanalyse (02 / MTH-108)
INSERT INTO courses (
    id, code, code_number, title, subtitle, category, semester,
    description, topics_summary, current_level_label, current_module_label,
    total_modules, color_accent, is_core_curriculum
) VALUES (
    'c2222222-2222-2222-2222-222222222222',
    'MTH-108',
    '02',
    'Statistik & Datenanalyse',
    'Hypothesentests & ANOVA',
    'Basis-Fächer',
    'Q2 • 2025',
    'Deskriptive und induktive Statistik, Wahrscheinlichkeitsverteilungen, Signifikanztests und multivariate Varianzanalyse.',
    'Normalverteilung, p-Werte, t-Test, Varianzanalyse',
    'Stufe 2',
    'Modul 1.4',
    8,
    '#fdc425',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Course 3: Höhere Mathematik I (01 / MTH-101)
INSERT INTO courses (
    id, code, code_number, title, subtitle, category, semester,
    description, topics_summary, current_level_label, current_module_label,
    total_modules, color_accent, is_core_curriculum
) VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'MTH-101',
    '01',
    'Höhere Mathematik I',
    'Analysis, Lineare Algebra, Vektoren',
    'Basis-Fächer',
    'Sem. 1 / 2025',
    'Mathematisches Fundament für natur- und ingenieurwissenschaftliche Studiengänge. Folgen, Reihen, Differentialrechnung und Matrizen.',
    'Analysis, Lineare Algebra, Vektoren',
    'Stufe 3',
    'Modul 2.1',
    12,
    '#1c1b1d',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Course 4: Grundlagen der Informatik (02 / INF-101)
INSERT INTO courses (
    id, code, code_number, title, subtitle, category, semester,
    description, topics_summary, current_level_label, current_module_label,
    total_modules, color_accent, is_core_curriculum
) VALUES (
    'c4444444-4444-4444-4444-444444444444',
    'INF-101',
    '02',
    'Grundlagen der Informatik',
    'Algorithmen, Datenstrukturen, Python',
    'Basis-Fächer',
    'Sem. 1 / 2025',
    'Imperative Programmierung, asymptotische Komplexität (O-Notation), Such- und Sortierverfahren und Rekursion.',
    'Algorithmen, Datenstrukturen, Python',
    'Stufe 2',
    'Modul 1.3',
    10,
    '#1c1b1d',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Course 5: Klassische Physik & Mechanik (03 / PHY-101)
INSERT INTO courses (
    id, code, code_number, title, subtitle, category, semester,
    description, topics_summary, current_level_label, current_module_label,
    total_modules, color_accent, is_core_curriculum
) VALUES (
    'c5555555-5555-5555-5555-555555555555',
    'PHY-101',
    '03',
    'Klassische Physik & Mechanik',
    'Kinematik, Dynamik, Erhaltungssätze',
    'Basis-Fächer',
    'Sem. 1 / 2025',
    'Newtons Axiome, Erhaltungssätze für Energie und Impuls, Schwingungen und Starrkörperdynamik.',
    'Kinematik, Dynamik, Erhaltungssätze',
    'Stufe 1',
    'Modul 1.1',
    8,
    '#1c1b1d',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Course 6: Allgemeine Chemie (04 / CHE-101) [Catalog]
INSERT INTO courses (
    id, code, code_number, title, subtitle, category, semester,
    description, topics_summary, current_level_label, current_module_label,
    total_modules, color_accent, is_core_curriculum
) VALUES (
    'c6666666-6666-6666-6666-666666666666',
    'CHE-101',
    '04',
    'Allgemeine Chemie',
    'Stöchiometrie, Thermodynamik, Bindungsmodelle',
    'Katalog',
    'Sem. 1 / 2025',
    'Atomaufbau, chemische Bindungen, Reaktionskinetik und chemisches Gleichgewicht.',
    'Stöchiometrie, Thermodynamik, Bindungsmodelle',
    'Stufe 1',
    'Modul 0.1',
    6,
    '#78767b',
    FALSE
) ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Enrollments for Alex M.
-- ----------------------------------------------------------------------------
INSERT INTO user_course_enrollments (user_id, course_id, status, progress_pct, cards_due_count)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1111111-1111-1111-1111-111111111111', 'active', 68, 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2222222-2222-2222-2222-222222222222', 'active', 25, 8),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3333333-3333-3333-3333-333333333333', 'active', 65, 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c4444444-4444-4444-4444-444444444444', 'active', 40, 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5555555-5555-5555-5555-555555555555', 'active', 15, 0)
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress_pct = EXCLUDED.progress_pct,
    cards_due_count = EXCLUDED.cards_due_count;

-- ----------------------------------------------------------------------------
-- 5. Learning Path: Mathematik / Abschnitt 01 - Vektoren & Matrizen (Screen 3)
-- ----------------------------------------------------------------------------
INSERT INTO learning_path_sections (
    id, course_id, section_index, section_tag, title, description, progress_pct
) VALUES (
    's3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    1,
    'Abschnitt 01',
    'Vektoren & Matrizen',
    'Grundlagen der Linearen Algebra für ingenieur- und naturwissenschaftliche Studiengänge.',
    25
) ON CONFLICT DO NOTHING;

-- Learning Path Nodes (01..05)
INSERT INTO learning_path_nodes (
    id, section_id, order_index, node_number, title, description, node_type, xp_reward, default_status
) VALUES
    ('n1111111-1111-1111-1111-111111111111', 's3333333-3333-3333-3333-333333333333', 1, '01', 'Vektorrechnung', 'Vektorräume, Linearkombination & lineare Unabhängigkeit.', 'lesson', 20, 'completed'),
    ('n2222222-2222-2222-2222-222222222222', 's3333333-3333-3333-3333-333333333333', 2, '02', 'Skalarprodukt & Winkel', 'Euklidische Norm, Orthogonalität und Cauchy-Schwarz-Ungleichung.', 'lesson', 20, 'completed'),
    ('n3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333', 3, '03', 'Matrixmultiplikation', 'Zeile mal Spalte & Dimensionen von Matrizen im euklidischen Raum.', 'lesson', 25, 'current'),
    ('n4444444-4444-4444-4444-444444444444', 's3333333-3333-3333-3333-333333333333', 4, '04', 'Determinanten & Inverse', 'Laplacescher Entwicklungssatz und Gauß-Jordan-Algorithmus.', 'lesson', 30, 'locked'),
    ('n5555555-5555-5555-5555-555555555555', 's3333333-3333-3333-3333-333333333333', 5, '05', 'Meilenstein: Modul-Abschluss', 'Zertifizierungsprüfung Lineare Algebra I mit Repetitorium.', 'milestone', 50, 'locked')
ON CONFLICT DO NOTHING;

-- User Node Progress
INSERT INTO user_node_progress (user_id, node_id, status, score_pct, completed_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'n1111111-1111-1111-1111-111111111111', 'completed', 100, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'n2222222-2222-2222-2222-222222222222', 'completed', 100, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'n3333333-3333-3333-3333-333333333333', 'current', 0, NULL),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'n4444444-4444-4444-4444-444444444444', 'locked', 0, NULL),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'n5555555-5555-5555-5555-555555555555', 'locked', 0, NULL)
ON CONFLICT (user_id, node_id) DO UPDATE SET
    status = EXCLUDED.status,
    score_pct = EXCLUDED.score_pct;

-- ----------------------------------------------------------------------------
-- 6. Quiz Questions & Options (Matching Screen 1: Lerneinheit LTP)
-- ----------------------------------------------------------------------------
-- Question 1: LTP im Hippocampus (Exact match from Stitch Screen 1)
INSERT INTO quiz_questions (
    id, node_id, course_id, topic_tag, category,
    question_number, total_questions, question_text, highlight_phrase,
    instruction, xp_reward, explanation
) VALUES (
    'q1111111-1111-1111-1111-111111111111',
    'n3333333-3333-3333-3333-333333333333',
    'c1111111-1111-1111-1111-111111111111',
    'Neurobiologie',
    'Aktives Erinnern',
    6,
    10,
    'Welche Funktion erfüllt die Langzeitpotenzierung (LTP) im Hippocampus?',
    'Langzeitpotenzierung (LTP)',
    'Wähle die zutreffende Antwort',
    20,
    'Die Langzeitpotenzierung (LTP) bezeichnet eine anhaltende Verstärkung der Signalübertragung an Synapsen nach hochfrequenter Stimulation und gilt als zelluläres Hauptmodell für Lernen und Gedächtniskonsolidierung.'
) ON CONFLICT DO NOTHING;

INSERT INTO quiz_options (id, question_id, option_letter, option_text, is_correct, order_index)
VALUES
    ('o1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 'A', 'Verringerung der Übertragungsstärke bei Dauerreiz.', FALSE, 1),
    ('o2222222-2222-2222-2222-222222222222', 'q1111111-1111-1111-1111-111111111111', 'B', 'Dauerhafte Verstärkung der synaptischen Übertragung.', TRUE, 2),
    ('o3333333-3333-3333-3333-333333333333', 'q1111111-1111-1111-1111-111111111111', 'C', 'Inaktivierung von Neurotransmitter-Rezeptoren.', FALSE, 3)
ON CONFLICT DO NOTHING;

-- Question 2: Matrixmultiplikation Kompatibilität (Mathematik Lerneinheit)
INSERT INTO quiz_questions (
    id, node_id, course_id, topic_tag, category,
    question_number, total_questions, question_text, highlight_phrase,
    instruction, xp_reward, explanation
) VALUES (
    'q2222222-2222-2222-2222-222222222222',
    'n3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'Lineare Algebra',
    'Aktives Erinnern',
    7,
    10,
    'Unter welcher Bedingung ist das Matrixprodukt A · B für Matrix A (m × n) und Matrix B (p × q) definiert?',
    'Matrixprodukt A · B',
    'Wähle die zutreffende Antwort',
    20,
    'Zwei Matrizen können nur multipliziert werden, wenn die Spaltenanzahl n der ersten Matrix gleich der Zeilenanzahl p der zweiten Matrix ist (n = p).'
) ON CONFLICT DO NOTHING;

INSERT INTO quiz_options (id, question_id, option_letter, option_text, is_correct, order_index)
VALUES
    ('o4444444-4444-4444-4444-444444444444', 'q2222222-2222-2222-2222-222222222222', 'A', 'Die Zeilenanzahl m muss gleich der Spaltenanzahl q sein.', FALSE, 1),
    ('o5555555-5555-5555-5555-555555555555', 'q2222222-2222-2222-2222-222222222222', 'B', 'Die Spaltenanzahl n von A muss gleich der Zeilenanzahl p von B sein (n = p).', TRUE, 2),
    ('o6666666-6666-6666-6666-666666666666', 'q2222222-2222-2222-2222-222222222222', 'C', 'Beide Matrizen müssen zwingend quadratisch sein.', FALSE, 3)
ON CONFLICT DO NOTHING;

-- Question 3: Statistik Hypothesentests
INSERT INTO quiz_questions (
    id, node_id, course_id, topic_tag, category,
    question_number, total_questions, question_text, highlight_phrase,
    instruction, xp_reward, explanation
) VALUES (
    'q3333333-3333-3333-3333-333333333333',
    'n3333333-3333-3333-3333-333333333333',
    'c2222222-2222-2222-2222-222222222222',
    'Statistik',
    'Aktives Erinnern',
    8,
    10,
    'Was beschreibt der p-Wert bei der Überprüfung einer Nullhypothese?',
    'p-Wert',
    'Wähle die zutreffende Antwort',
    20,
    'Der p-Wert ist die Wahrscheinlichkeit, unter der Annahme, dass die Nullhypothese wahr ist, ein mindestens so extremes Ergebnis wie das beobachtete zu erhalten.'
) ON CONFLICT DO NOTHING;

INSERT INTO quiz_options (id, question_id, option_letter, option_text, is_correct, order_index)
VALUES
    ('o7777777-7777-7777-7777-777777777777', 'q3333333-3333-3333-3333-333333333333', 'A', 'Die Wahrscheinlichkeit, dass die Nullhypothese wahr ist.', FALSE, 1),
    ('o8888888-8888-8888-8888-888888888888', 'q3333333-3333-3333-3333-333333333333', 'B', 'Wahrscheinlichkeit eines mindestens so extremen Stichprobenergebnisses unter der Nullhypothese.', TRUE, 2),
    ('o9999999-9999-9999-9999-999999999999', 'q3333333-3333-3333-3333-333333333333', 'C', 'Die absolute Fehlerquote der Alternativhypothese.', FALSE, 3)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Flashcards for "8 Karten fällig" (MTH-108 Statistik)
-- ----------------------------------------------------------------------------
INSERT INTO flashcard_decks (id, course_id, title, description)
VALUES (
    'd2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    'Hypothesentests & ANOVA Kernbegriffe',
    'Repetitorium für die Prüfungsvorbereitung MTH-108'
) ON CONFLICT DO NOTHING;

INSERT INTO flashcards (deck_id, front_text, back_text, due_date)
VALUES
    ('d2222222-2222-2222-2222-222222222222', 'Was ist ein Alpha-Fehler (Fehler 1. Art)?', 'Die Nullhypothese wird verworfen, obwohl sie in Wirklichkeit wahr ist.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Was ist ein Beta-Fehler (Fehler 2. Art)?', 'Die Nullhypothese wird beibehalten, obwohl die Alternativhypothese zutrifft.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Wann wird ein t-Test für unabhängige Stichproben eingesetzt?', 'Zum Vergleich der Mittelwerte zweier unabhängiger Gruppen bei normalverteilten Daten.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Was prüft eine einfaktorielle Varianzanalyse (ANOVA)?', 'Ob sich die Mittelwerte von mehr als zwei unabhängigen Gruppen statistisch signifikant unterscheiden.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Was gibt das Bestimmtheitsmaß R² an?', 'Den Anteil der Varianz der abhängigen Variablen, der durch die unabhängigen Variablen erklärt wird.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Was bedeutet Varianzhomogenität (Homoskedastizität)?', 'Gleiche Varianzen der Fehlerterme bzw. Gruppen, überprüfbar mit dem Levene-Test.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Was ist die Teststärke (Power) eines statistischen Tests?', '1 - Beta: Die Wahrscheinlichkeit, einen tatsächlich existierenden Effekt auch nachzuweisen.', CURRENT_DATE),
    ('d2222222-2222-2222-2222-222222222222', 'Welcher Korrelationskoeffizient misst monotone, nicht zwingend lineare Zusammenhänge?', 'Rangkorrelationskoeffizient nach Spearman (Spearman rho).', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. Study Timer Session History
-- ----------------------------------------------------------------------------
INSERT INTO study_timer_sessions (
    user_id, course_id, mode, interval_current, interval_total,
    duration_seconds, elapsed_seconds, completed, dnd_active, xp_reward, started_at, completed_at
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c3333333-3333-3333-3333-333333333333',
    'pomodoro_25',
    1,
    4,
    1500,
    1500,
    TRUE,
    TRUE,
    25,
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '35 minutes'
);
-- ============================================================================
-- Studyling Learning Platform - Neon Tech Views, Stored Functions & Triggers
-- File: 03_views_and_functions.sql
-- Description: Analytical views, game loop stored procedures, and state logic
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. View: User Dashboard Summary
-- Returns consolidated stats: Streak, XP, Level, Active Courses, Due Cards
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_dashboard_summary AS
SELECT 
    u.id AS user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.streak_count,
    u.total_xp,
    u.level,
    u.study_time_today_minutes,
    u.last_active_at,
    COUNT(DISTINCT uce.course_id) FILTER (WHERE uce.status = 'active') AS active_courses_count,
    COALESCE(SUM(uce.cards_due_count) FILTER (WHERE uce.status = 'active'), 0) AS total_cards_due,
    ROUND(COALESCE(AVG(uce.progress_pct) FILTER (WHERE uce.status = 'active'), 0), 1) AS avg_course_progress
FROM users u
LEFT JOIN user_course_enrollments uce ON u.id = uce.user_id
GROUP BY u.id;

-- ----------------------------------------------------------------------------
-- 2. View: Course Catalog & User Enrollments
-- Matches Stitch Screen 2 & Screen 4
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_course_overview AS
SELECT 
    c.id AS course_id,
    c.code,
    c.code_number,
    c.title,
    c.subtitle,
    c.category,
    c.semester,
    c.topics_summary,
    c.current_level_label,
    c.current_module_label,
    c.color_accent,
    uce.user_id,
    COALESCE(uce.status, 'catalog') AS enrollment_status,
    COALESCE(uce.progress_pct, 0) AS progress_pct,
    COALESCE(uce.cards_due_count, 0) AS cards_due_count,
    uce.last_studied_at
FROM courses c
LEFT JOIN user_course_enrollments uce ON c.id = uce.course_id
ORDER BY c.code_number ASC;

-- ----------------------------------------------------------------------------
-- 3. Stored Procedure / Function: Complete Quiz Question
-- Handles answer validation, XP calculation, user streak updates, and feedback
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_complete_quiz_question(
    p_user_id UUID,
    p_question_id UUID,
    p_option_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_correct BOOLEAN := FALSE;
    v_xp_reward INT := 0;
    v_explanation TEXT := '';
    v_total_xp INT := 0;
    v_streak_count INT := 0;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Check if option is correct and get question XP
    SELECT qo.is_correct, qq.xp_reward, qq.explanation
    INTO v_is_correct, v_xp_reward, v_explanation
    FROM quiz_options qo
    JOIN quiz_questions qq ON qq.id = qo.question_id
    WHERE qo.id = p_option_id AND qq.id = p_question_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question or Option ID not found';
    END IF;

    -- Award XP only if correct
    IF NOT v_is_correct THEN
        v_xp_reward := 0;
    END IF;

    -- Insert attempt log
    INSERT INTO user_quiz_attempts (user_id, question_id, selected_option_id, is_correct, xp_earned)
    VALUES (p_user_id, p_question_id, p_option_id, v_is_correct, v_xp_reward);

    -- Update User XP and last active timestamp
    UPDATE users
    SET total_xp = total_xp + v_xp_reward,
        last_active_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING total_xp, streak_count INTO v_total_xp, v_streak_count;

    -- Update or Insert Daily Streak
    INSERT INTO user_streaks (user_id, activity_date, sessions_completed, xp_gained, minutes_studied)
    VALUES (p_user_id, v_today, 1, v_xp_reward, 5)
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET sessions_completed = user_streaks.sessions_completed + 1,
        xp_gained = user_streaks.xp_gained + EXCLUDED.xp_gained;

    RETURN jsonb_build_object(
        'is_correct', v_is_correct,
        'xp_earned', v_xp_reward,
        'total_xp', v_total_xp,
        'streak_count', v_streak_count,
        'explanation', v_explanation
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Stored Procedure / Function: Log Study Timer Session
-- Matches Stitch Screen 5 (Pomodoro, Deep Work, 5-min Pause)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_log_study_session(
    p_user_id UUID,
    p_course_id UUID,
    p_mode VARCHAR(30),
    p_duration_seconds INT,
    p_completed BOOLEAN,
    p_dnd_active BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_xp_earned INT := 0;
    v_minutes INT := 0;
    v_total_xp INT := 0;
    v_streak_count INT := 0;
    v_today DATE := CURRENT_DATE;
BEGIN
    v_minutes := ROUND(p_duration_seconds / 60.0);
    
    -- Award XP if session was completed successfully
    IF p_completed THEN
        IF p_mode = 'deep_50' THEN
            v_xp_earned := 50;
        ELSIF p_mode = 'pomodoro_25' THEN
            v_xp_earned := 25;
        ELSE
            v_xp_earned := 10;
        END IF;
    ELSE
        -- Partial effort XP
        v_xp_earned := GREATEST(5, ROUND(v_minutes * 0.5));
    END IF;

    -- Insert into study_timer_sessions
    INSERT INTO study_timer_sessions (
        user_id, course_id, mode, duration_seconds, elapsed_seconds,
        completed, dnd_active, xp_reward, completed_at
    ) VALUES (
        p_user_id, p_course_id, p_mode, p_duration_seconds, p_duration_seconds,
        p_completed, p_dnd_active, v_xp_earned, CURRENT_TIMESTAMP
    );

    -- Update User profile
    UPDATE users
    SET total_xp = total_xp + v_xp_earned,
        study_time_today_minutes = study_time_today_minutes + v_minutes,
        last_active_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING total_xp, streak_count INTO v_total_xp, v_streak_count;

    -- Update Daily Streak entry
    INSERT INTO user_streaks (user_id, activity_date, sessions_completed, xp_gained, minutes_studied)
    VALUES (p_user_id, v_today, 1, v_xp_earned, v_minutes)
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET sessions_completed = user_streaks.sessions_completed + 1,
        xp_gained = user_streaks.xp_gained + EXCLUDED.xp_gained,
        minutes_studied = user_streaks.minutes_studied + EXCLUDED.minutes_studied;

    RETURN jsonb_build_object(
        'success', TRUE,
        'mode', p_mode,
        'minutes_logged', v_minutes,
        'xp_earned', v_xp_earned,
        'total_xp', v_total_xp,
        'streak_count', v_streak_count
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Stored Procedure / Function: Advance Learning Path Node
-- Advances user to next node and updates course progress percentage
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_advance_learning_path_node(
    p_user_id UUID,
    p_node_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_section_id UUID;
    v_course_id UUID;
    v_current_order INT;
    v_next_node_id UUID;
    v_total_nodes INT;
    v_completed_nodes INT;
    v_new_progress INT;
BEGIN
    -- Get current node details
    SELECT lpn.section_id, lpn.order_index, lps.course_id
    INTO v_section_id, v_current_order, v_course_id
    FROM learning_path_nodes lpn
    JOIN learning_path_sections lps ON lps.id = lpn.section_id
    WHERE lpn.id = p_node_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Node not found';
    END IF;

    -- Mark current node as completed
    INSERT INTO user_node_progress (user_id, node_id, status, score_pct, completed_at)
    VALUES (p_user_id, p_node_id, 'completed', 100, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, node_id) DO UPDATE
    SET status = 'completed', score_pct = 100, completed_at = CURRENT_TIMESTAMP;

    -- Find next node in sequence
    SELECT id INTO v_next_node_id
    FROM learning_path_nodes
    WHERE section_id = v_section_id AND order_index = v_current_order + 1;

    -- If next node exists, unlock it
    IF v_next_node_id IS NOT NULL THEN
        INSERT INTO user_node_progress (user_id, node_id, status, score_pct)
        VALUES (p_user_id, v_next_node_id, 'current', 0)
        ON CONFLICT (user_id, node_id) DO UPDATE
        SET status = CASE WHEN user_node_progress.status = 'completed' THEN 'completed' ELSE 'current' END;
    END IF;

    -- Recalculate progress percentage for this course
    SELECT COUNT(*) INTO v_total_nodes
    FROM learning_path_nodes lpn
    JOIN learning_path_sections lps ON lps.id = lpn.section_id
    WHERE lps.course_id = v_course_id;

    SELECT COUNT(*) INTO v_completed_nodes
    FROM user_node_progress unp
    JOIN learning_path_nodes lpn ON lpn.id = unp.node_id
    JOIN learning_path_sections lps ON lps.id = lpn.section_id
    WHERE unp.user_id = p_user_id AND lps.course_id = v_course_id AND unp.status = 'completed';

    IF v_total_nodes > 0 THEN
        v_new_progress := ROUND((v_completed_nodes::numeric / v_total_nodes::numeric) * 100);
    ELSE
        v_new_progress := 0;
    END IF;

    -- Update course enrollment progress
    UPDATE user_course_enrollments
    SET progress_pct = v_new_progress,
        last_studied_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND course_id = v_course_id;

    RETURN jsonb_build_object(
        'completed_node_id', p_node_id,
        'unlocked_next_node_id', v_next_node_id,
        'new_progress_pct', v_new_progress
    );
END;
$$;
