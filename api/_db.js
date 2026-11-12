// ============================================================================
// Studyling Neon Database Bridge (api/_db.js) - Production Ready
// Auto-detects DATABASE_URL from Vercel / Environment variables
// Self-healing: Auto-initializes schema & seed if tables don't exist yet!
// ============================================================================

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Sanitize connection string (remove quotes, whitespace, etc.)
function sanitizeConnectionString(val) {
  if (!val) return '';
  let clean = String(val).trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

const DATABASE_URL = sanitizeConnectionString(
  process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL ||
  ''
);

let sqlClient = null;
let isInitialized = false;

if (DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'))) {
  try {
    sqlClient = neon(DATABASE_URL);
    console.log('[Neon DB] Initialized Neon HTTP Client with DATABASE_URL');
  } catch (err) {
    console.error('[Neon DB] Initialization error:', err.message);
  }
}

// In-Memory Fallback Store (for local development or if DB is offline)
const inMemoryStore = {
  users: [
    {
      id: 'a1111111-aaaa-bbbb-cccc-111111111111',
      username: 'admin',
      email: 'admin@studyling.app',
      password_hash: '$2b$10$PBOjLNBrYik45ahHFmfkOO8vXeu7T8RMhhbi05B5ULGsB1PWoE0dC', // AdminPassword123!
      role: 'admin',
      display_name: 'Studyling Admin',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=80',
      streak_count: 42,
      total_xp: 5800,
      level: 10,
      study_time_today_minutes: 90,
      created_at: new Date().toISOString()
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      username: 'alex_study',
      email: 'alex@studyling.app',
      password_hash: '$2b$10$At7wq9N6bjBvfrZLlSDS3OiqZXPnn5xdfXiblJtvPpALl9Tq6eMam', // Studyling2025!
      role: 'student',
      display_name: 'Alex M.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
      streak_count: 12,
      total_xp: 1420,
      level: 4,
      study_time_today_minutes: 45,
      created_at: new Date().toISOString()
    }
  ],
  courses: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      code: '01 / PSY-402',
      code_number: '01',
      title: 'Kognitionspsychologie',
      subtitle: 'Gedächtnismodelle & Exekutivfunktionen',
      category: 'Basis-Fächer',
      semester: 'Q2 • 2025',
      current_level_label: 'Stufe 4',
      current_module_label: 'Modul 3.2',
      progress_pct: 68,
      streak_text: '12 Tage Streak',
      badge_type: 'streak',
      status: 'active',
      is_core_curriculum: true
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      code: '02 / MTH-108',
      code_number: '02',
      title: 'Statistik & Datenanalyse',
      subtitle: 'Hypothesentests & ANOVA',
      category: 'Basis-Fächer',
      semester: 'Q2 • 2025',
      current_level_label: 'Stufe 2',
      current_module_label: 'Modul 1.4',
      progress_pct: 25,
      streak_text: '8 Karten fällig',
      badge_type: 'cards',
      status: 'active',
      is_core_curriculum: true
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      code: '01 / MTH-101',
      code_number: '01',
      title: 'Höhere Mathematik I',
      subtitle: 'Analysis, Lineare Algebra, Vektoren',
      category: 'Basis-Fächer',
      semester: 'Sem. 1 / 2025',
      current_level_label: 'Stufe 3',
      current_module_label: 'Modul 2.1',
      progress_pct: 65,
      streak_text: 'Laufend',
      badge_type: 'normal',
      status: 'active',
      is_core_curriculum: true
    },
    {
      id: 'c4444444-4444-4444-4444-444444444444',
      code: '02 / INF-101',
      code_number: '02',
      title: 'Grundlagen der Informatik',
      subtitle: 'Algorithmen, Datenstrukturen, Python',
      category: 'Basis-Fächer',
      semester: 'Sem. 1 / 2025',
      current_level_label: 'Stufe 2',
      current_module_label: 'Modul 1.3',
      progress_pct: 40,
      streak_text: 'Laufend',
      badge_type: 'normal',
      status: 'active',
      is_core_curriculum: true
    },
    {
      id: 'c5555555-5555-5555-5555-555555555555',
      code: '03 / PHY-101',
      code_number: '03',
      title: 'Klassische Physik & Mechanik',
      subtitle: 'Kinematik, Dynamik, Erhaltungssätze',
      category: 'Basis-Fächer',
      semester: 'Sem. 1 / 2025',
      current_level_label: 'Stufe 1',
      current_module_label: 'Modul 1.1',
      progress_pct: 15,
      streak_text: 'Laufend',
      badge_type: 'normal',
      status: 'active',
      is_core_curriculum: true
    },
    {
      id: 'c6666666-6666-6666-6666-666666666666',
      code: '04 / CHE-101',
      code_number: '04',
      title: 'Allgemeine Chemie',
      subtitle: 'Stöchiometrie, Thermodynamik, Bindungsmodelle',
      category: 'Katalog',
      semester: 'Sem. 1 / 2025',
      current_level_label: 'Stufe 1',
      current_module_label: 'Modul 0.1',
      progress_pct: 0,
      streak_text: 'Wählbar',
      badge_type: 'catalog',
      status: 'catalog',
      is_core_curriculum: false
    }
  ],
  learningPath: {
    section_tag: 'Mathematik / Abschnitt 01',
    title: 'Vektoren & Matrizen',
    description: 'Grundlagen der Linearen Algebra für ingenieur- und naturwissenschaftliche Studiengänge.',
    progress_pct: 25,
    nodes: [
      {
        id: 'n1111111-1111-1111-1111-111111111111',
        node_number: '01',
        title: 'Vektorrechnung',
        description: 'Vektorräume, Linearkombination & Basisvektoren',
        status: 'completed',
        status_badge: '100% gemeistert',
        node_type: 'lesson',
        xp_reward: 20
      },
      {
        id: 'n2222222-2222-2222-2222-222222222222',
        node_number: '02',
        title: 'Skalarprodukt & Winkel',
        description: 'Orthogonalität, Projektionen & euklidische Norm',
        status: 'completed',
        status_badge: '100% gemeistert',
        node_type: 'lesson',
        xp_reward: 20
      },
      {
        id: 'n3333333-3333-3333-3333-333333333333',
        node_number: '03',
        title: 'Matrixmultiplikation',
        description: 'Zeile mal Spalte & Dimensionen von Matrizen im euklidischen Raum.',
        status: 'current',
        status_badge: 'Aktuelle Lerneinheit',
        node_type: 'lesson',
        xp_reward: 25
      },
      {
        id: 'n4444444-4444-4444-4444-444444444444',
        node_number: '04',
        title: 'Determinanten & Inverse',
        description: 'Laplacescher Entwicklungssatz & Reguläre Matrizen',
        status: 'locked',
        status_badge: 'Gesperrt',
        node_type: 'lesson',
        xp_reward: 30
      },
      {
        id: 'n5555555-5555-5555-5555-555555555555',
        node_number: '05',
        title: 'Meilenstein: Modul-Abschlussprüfung',
        description: 'Abschlussklausur Lineare Algebra I',
        status: 'locked',
        status_badge: 'Meilenstein',
        node_type: 'milestone',
        xp_reward: 50
      }
    ]
  },
  quizQuestions: [
    {
      id: 'q1111111-1111-1111-1111-111111111111',
      topic_tag: 'Neurobiologie',
      category: 'Aktives Erinnern',
      question_number: 6,
      total_questions: 10,
      question_html: 'Welche Funktion erfüllt die <span class="bg-secondary-container/30 px-1 py-0.5 text-on-surface">Langzeitpotenzierung (LTP)</span> im Hippocampus?',
      instruction: 'Wähle die zutreffende Antwort',
      xp_reward: 20,
      explanation: 'Die Langzeitpotenzierung (LTP) verstärkt dauerhaft die synaptische Transmission und ist das zelluläre Modell für Gedächtnisbildung.',
      options: [
        { id: 'o1', letter: 'A', text: 'Verringerung der Übertragungsstärke bei Dauerreiz.', is_correct: false },
        { id: 'o2', letter: 'B', text: 'Dauerhafte Verstärkung der synaptischen Übertragung.', is_correct: true },
        { id: 'o3', letter: 'C', text: 'Inaktivierung von Neurotransmitter-Rezeptoren.', is_correct: false }
      ]
    },
    {
      id: 'q2222222-2222-2222-2222-222222222222',
      topic_tag: 'Lineare Algebra',
      category: 'Aktives Erinnern',
      question_number: 7,
      total_questions: 10,
      question_html: 'Wann ist das Produkt zweier Matrizen <span class="bg-secondary-container/30 px-1 py-0.5 text-on-surface">A (m×n) und B (p×q)</span> mathematisch definiert?',
      instruction: 'Wähle die zutreffende Antwort',
      xp_reward: 20,
      explanation: 'Zeile mal Spalte: Die innere Dimension muss übereinstimmen (n = p).',
      options: [
        { id: 'o4', letter: 'A', text: 'Die Zeilenanzahl m muss gleich der Spaltenanzahl q sein.', is_correct: false },
        { id: 'o5', letter: 'B', text: 'Die Spaltenanzahl n von A muss gleich der Zeilenanzahl p von B sein (n = p).', is_correct: true },
        { id: 'o6', letter: 'C', text: 'Beide Matrizen müssen strikt quadratisch sein.', is_correct: false }
      ]
    },
    {
      id: 'q3333333-3333-3333-3333-333333333333',
      topic_tag: 'Statistik & Datenanalyse',
      category: 'Aktives Erinnern',
      question_number: 8,
      total_questions: 10,
      question_html: 'Was drückt der <span class="bg-secondary-container/30 px-1 py-0.5 text-on-surface">p-Wert</span> bei einem statistischen Signifikanztest aus?',
      instruction: 'Wähle die zutreffende Antwort',
      xp_reward: 20,
      explanation: 'Der p-Wert misst die Plausibilität der Daten unter Gültigkeit der Nullhypothese.',
      options: [
        { id: 'o7', letter: 'A', text: 'Die Wahrscheinlichkeit, dass die Nullhypothese zutrifft.', is_correct: false },
        { id: 'o8', letter: 'B', text: 'Die Wahrscheinlichkeit, die Daten oder extremere unter der Nullhypothese zu beobachten.', is_correct: true },
        { id: 'o9', letter: 'C', text: 'Die exakte Effektstärke der Alternativhypothese.', is_correct: false }
      ]
    }
  ]
};

// Core SQL execution function
// Uses sqlClient.query(text, params) to avoid tagged template restrictions!
async function queryNeon(text, params = []) {
  if (!sqlClient) return null;

  // Auto-initialize schema on first query if not already done
  if (!isInitialized) {
    isInitialized = true;
    await ensureDatabaseSchema();
  }

  try {
    const res = await sqlClient.query(text, params);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.rows)) return res.rows;
    return res;
  } catch (err) {
    // If table doesn't exist, try auto-migration and retry once
    if (err.message && err.message.includes('does not exist')) {
      console.log('[Neon DB] Table missing detected, running auto-schema initialization...');
      await autoInitializeSchema();
      const retryRes = await sqlClient.query(text, params);
      if (Array.isArray(retryRes)) return retryRes;
      if (retryRes && Array.isArray(retryRes.rows)) return retryRes.rows;
      return retryRes;
    }
    console.error('[Neon Query Error]', err.message);
    throw err;
  }
}

// Auto-check if tables exist in Neon
async function ensureDatabaseSchema() {
  if (!sqlClient) return;
  try {
    const res = await sqlClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) AS exists;
    `, []);
    const exists = res && res[0] && (res[0].exists === true || res[0].exists === 't');
    if (!exists) {
      console.log('[Neon DB] Users table not found. Auto-creating all tables and seed data...');
      await autoInitializeSchema();
    }
  } catch (err) {
    console.warn('[Neon DB] Auto-schema check error:', err.message);
  }
}

// Full Self-Healing DDL & Seed Execution for Neon Tech
async function autoInitializeSchema() {
  if (!sqlClient) return;

  const ddlStatements = [
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
      display_name VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      streak_count INT NOT NULL DEFAULT 12,
      total_xp INT NOT NULL DEFAULT 1420,
      level INT NOT NULL DEFAULT 4,
      study_time_today_minutes INT NOT NULL DEFAULT 45,
      last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(20) NOT NULL UNIQUE,
      code_number VARCHAR(10) NOT NULL DEFAULT '01',
      title VARCHAR(150) NOT NULL,
      subtitle TEXT,
      category VARCHAR(50) NOT NULL DEFAULT 'Basis-Fächer',
      semester VARCHAR(50) NOT NULL DEFAULT 'Sem. 1 / 2025',
      description TEXT,
      topics_summary TEXT,
      current_level_label VARCHAR(30) DEFAULT 'Stufe 4',
      current_module_label VARCHAR(30) DEFAULT 'Modul 3.2',
      total_modules INT NOT NULL DEFAULT 8,
      color_accent VARCHAR(20) DEFAULT '#fdc425',
      is_core_curriculum BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS user_course_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      progress_pct INT NOT NULL DEFAULT 0,
      cards_due_count INT NOT NULL DEFAULT 0,
      last_studied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_course_enrollment UNIQUE (user_id, course_id)
    );`,

    `CREATE TABLE IF NOT EXISTS learning_path_sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      section_index INT NOT NULL DEFAULT 1,
      section_tag VARCHAR(50) NOT NULL DEFAULT 'Abschnitt 01',
      title VARCHAR(150) NOT NULL,
      description TEXT,
      progress_pct INT NOT NULL DEFAULT 25,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS learning_path_nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID NOT NULL REFERENCES learning_path_sections(id) ON DELETE CASCADE,
      order_index INT NOT NULL,
      node_number VARCHAR(10) NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      node_type VARCHAR(30) NOT NULL DEFAULT 'lesson',
      xp_reward INT NOT NULL DEFAULT 20,
      default_status VARCHAR(20) NOT NULL DEFAULT 'locked',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS user_node_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      node_id UUID NOT NULL REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'locked',
      score_pct INT NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_node UNIQUE (user_id, node_id)
    );`,

    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id UUID REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      topic_tag VARCHAR(100) NOT NULL DEFAULT 'Neurobiologie',
      category VARCHAR(50) NOT NULL DEFAULT 'Aktives Erinnern',
      question_number INT NOT NULL DEFAULT 6,
      total_questions INT NOT NULL DEFAULT 10,
      question_text TEXT NOT NULL,
      highlight_phrase TEXT,
      instruction TEXT DEFAULT 'Wähle die zutreffende Antwort',
      xp_reward INT NOT NULL DEFAULT 20,
      explanation TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS quiz_options (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      option_letter CHAR(1) NOT NULL,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE,
      order_index INT NOT NULL DEFAULT 1
    );`,

    `CREATE TABLE IF NOT EXISTS user_quiz_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      selected_option_id UUID REFERENCES quiz_options(id) ON DELETE SET NULL,
      is_correct BOOLEAN NOT NULL,
      xp_earned INT NOT NULL DEFAULT 0,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS study_timer_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      mode VARCHAR(30) NOT NULL,
      interval_current INT NOT NULL DEFAULT 1,
      interval_total INT NOT NULL DEFAULT 4,
      duration_seconds INT NOT NULL DEFAULT 1500,
      elapsed_seconds INT NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      dnd_active BOOLEAN NOT NULL DEFAULT TRUE,
      xp_reward INT NOT NULL DEFAULT 25,
      started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMPTZ
    );`,

    `CREATE TABLE IF NOT EXISTS user_streaks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
      sessions_completed INT NOT NULL DEFAULT 1,
      xp_gained INT NOT NULL DEFAULT 20,
      minutes_studied INT NOT NULL DEFAULT 25,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_daily_streak UNIQUE (user_id, activity_date)
    );`,

    // Pre-insert Admin & Demo User
    `INSERT INTO users (id, username, email, password_hash, role, display_name, streak_count, total_xp, level)
     VALUES ('a1111111-aaaa-bbbb-cccc-111111111111', 'admin', 'admin@studyling.app', '$2b$10$PBOjLNBrYik45ahHFmfkOO8vXeu7T8RMhhbi05B5ULGsB1PWoE0dC', 'admin', 'Studyling Admin', 42, 5800, 10)
     ON CONFLICT (email) DO NOTHING;`,

    `INSERT INTO users (id, username, email, password_hash, role, display_name, streak_count, total_xp, level)
     VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'alex_study', 'alex@studyling.app', '$2b$10$At7wq9N6bjBvfrZLlSDS3OiqZXPnn5xdfXiblJtvPpALl9Tq6eMam', 'student', 'Alex M.', 12, 1420, 4)
     ON CONFLICT (email) DO NOTHING;`,

    // Seed Courses
    `INSERT INTO courses (id, code, code_number, title, subtitle, category, semester, current_level_label, current_module_label, progress_pct)
     VALUES 
      ('c1111111-1111-1111-1111-111111111111', '01 / PSY-402', '01', 'Kognitionspsychologie', 'Gedächtnismodelle & Exekutivfunktionen', 'Basis-Fächer', 'Q2 • 2025', 'Stufe 4', 'Modul 3.2', 68),
      ('c2222222-2222-2222-2222-222222222222', '02 / MTH-108', '02', 'Statistik & Datenanalyse', 'Hypothesentests & ANOVA', 'Basis-Fächer', 'Q2 • 2025', 'Stufe 2', 'Modul 1.4', 25),
      ('c3333333-3333-3333-3333-333333333333', '01 / MTH-101', '01', 'Höhere Mathematik I', 'Analysis, Lineare Algebra, Vektoren', 'Basis-Fächer', 'Sem. 1 / 2025', 'Stufe 3', 'Modul 2.1', 65),
      ('c4444444-4444-4444-4444-444444444444', '02 / INF-101', '02', 'Grundlagen der Informatik', 'Algorithmen, Datenstrukturen, Python', 'Basis-Fächer', 'Sem. 1 / 2025', 'Stufe 2', 'Modul 1.3', 40),
      ('c5555555-5555-5555-5555-555555555555', '03 / PHY-101', '03', 'Klassische Physik & Mechanik', 'Kinematik, Dynamik, Erhaltungssätze', 'Basis-Fächer', 'Sem. 1 / 2025', 'Stufe 1', 'Modul 1.1', 15),
      ('c6666666-6666-6666-6666-666666666666', '04 / CHE-101', '04', 'Allgemeine Chemie', 'Stöchiometrie, Thermodynamik, Bindungsmodelle', 'Katalog', 'Sem. 1 / 2025', 'Stufe 1', 'Modul 0.1', 0)
     ON CONFLICT (code) DO NOTHING;`,

    // Seed Section
    `INSERT INTO learning_path_sections (id, course_id, section_index, section_tag, title, description, progress_pct)
     VALUES ('s3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 1, 'Abschnitt 01', 'Vektoren & Matrizen', 'Grundlagen der Linearen Algebra für ingenieur- und naturwissenschaftliche Studiengänge.', 25)
     ON CONFLICT DO NOTHING;`,

    // Seed Nodes
    `INSERT INTO learning_path_nodes (id, section_id, order_index, node_number, title, description, xp_reward, default_status)
     VALUES 
      ('n1111111-1111-1111-1111-111111111111', 's3333333-3333-3333-3333-333333333333', 1, '01', 'Vektorrechnung', 'Vektorräume, Linearkombination & lineare Unabhängigkeit.', 20, 'completed'),
      ('n2222222-2222-2222-2222-222222222222', 's3333333-3333-3333-3333-333333333333', 2, '02', 'Skalarprodukt & Winkel', 'Euklidische Norm, Orthogonalität und Cauchy-Schwarz-Ungleichung.', 20, 'completed'),
      ('n3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333', 3, '03', 'Matrixmultiplikation', 'Zeile mal Spalte & Dimensionen von Matrizen im euklidischen Raum.', 25, 'current'),
      ('n4444444-4444-4444-4444-444444444444', 's3333333-3333-3333-3333-333333333333', 4, '04', 'Determinanten & Inverse', 'Laplacescher Entwicklungssatz und Gauß-Jordan-Algorithmus.', 30, 'locked'),
      ('n5555555-5555-5555-5555-555555555555', 's3333333-3333-3333-3333-333333333333', 5, '05', 'Meilenstein: Modul-Abschluss', 'Zertifizierungsprüfung Lineare Algebra I mit Repetitorium.', 50, 'locked')
     ON CONFLICT DO NOTHING;`,

    // Seed Quiz Question & Options
    `INSERT INTO quiz_questions (id, topic_tag, category, question_number, total_questions, question_text, highlight_phrase, instruction, xp_reward, explanation)
     VALUES ('q1111111-1111-1111-1111-111111111111', 'Neurobiologie', 'Aktives Erinnern', 6, 10, 'Welche Funktion erfüllt die Langzeitpotenzierung (LTP) im Hippocampus?', 'Langzeitpotenzierung (LTP)', 'Wähle die zutreffende Antwort', 20, 'Die Langzeitpotenzierung (LTP) bezeichnet eine anhaltende Verstärkung der Signalübertragung an Synapsen nach hochfrequenter Stimulation und gilt als zelluläres Hauptmodell für Lernen und Gedächtniskonsolidierung.')
     ON CONFLICT DO NOTHING;`,

    `INSERT INTO quiz_options (id, question_id, option_letter, option_text, is_correct, order_index)
     VALUES 
      ('o1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 'A', 'Verringerung der Übertragungsstärke bei Dauerreiz.', FALSE, 1),
      ('o2222222-2222-2222-2222-222222222222', 'q1111111-1111-1111-1111-111111111111', 'B', 'Dauerhafte Verstärkung der synaptischen Übertragung.', TRUE, 2),
      ('o3333333-3333-3333-3333-333333333333', 'q1111111-1111-1111-1111-111111111111', 'C', 'Inaktivierung von Neurotransmitter-Rezeptoren.', FALSE, 3)
     ON CONFLICT DO NOTHING;`
  ];

  for (const stmt of ddlStatements) {
    try {
      await sqlClient.query(stmt, []);
    } catch (e) {
      console.warn('[Neon DB] Auto-DDL Warning on statement:', e.message);
    }
  }
  console.log('[Neon DB] Self-healing schema auto-initialization complete.');
}

module.exports = {
  sqlClient,
  queryNeon,
  isNeonConfigured: () => !!sqlClient,
  inMemoryStore,
  ensureDatabaseSchema,
  autoInitializeSchema
};
