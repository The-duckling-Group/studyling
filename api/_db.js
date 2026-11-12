// ============================================================================
// Studyling Neon Database Bridge (api/_db.js)
// Reads DATABASE_URL from Vercel / Environment variables
// ============================================================================

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

let sqlClient = null;
if (DATABASE_URL && DATABASE_URL.startsWith('postgres')) {
  try {
    sqlClient = neon(DATABASE_URL);
    console.log('[Neon DB] Connected via DATABASE_URL environment variable');
  } catch (err) {
    console.error('[Neon DB] Initialization error:', err.message);
  }
}

// In-Memory fallback store for offline/local development when no DATABASE_URL is set
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

async function queryNeon(text, params = []) {
  if (sqlClient) {
    try {
      return await sqlClient(text, params);
    } catch (err) {
      console.error('[Neon Query Error]', err);
      throw err;
    }
  }
  return null;
}

module.exports = {
  sqlClient,
  queryNeon,
  isNeonConfigured: () => !!sqlClient,
  inMemoryStore
};
