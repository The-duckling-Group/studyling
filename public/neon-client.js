// ============================================================================
// Studyling Neon Client (neon-client.js)
// Supports: Direct Neon Tech Serverless SQL API, Server Proxy & Offline Demo Fallback
// ============================================================================

const STORAGE_KEYS = {
  NEON_CONFIG: 'studyling_neon_config',
  LOCAL_STATE: 'studyling_local_state'
};

// Initial state strictly matching Stitch screens and seed.sql
const DEFAULT_SEED_STATE = {
  user: {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    username: 'alex_study',
    displayName: 'Alex M.',
    streakCount: 12,
    totalXp: 1420,
    level: 4,
    studyTimeTodayMinutes: 45
  },
  courses: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      code: '01 / PSY-402',
      rawCode: 'PSY-402',
      title: 'Kognitionspsychologie',
      subtitle: 'Gedächtnismodelle & Exekutivfunktionen',
      category: 'Basis-Fächer',
      semester: 'Q2 • 2025',
      currentLevel: 'Stufe 4',
      currentModule: 'Modul 3.2',
      progress: 68,
      streakText: '12 Tage Streak',
      badgeType: 'streak',
      status: 'active',
      isCore: true
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      code: '02 / MTH-108',
      rawCode: 'MTH-108',
      title: 'Statistik & Datenanalyse',
      subtitle: 'Hypothesentests & ANOVA',
      category: 'Basis-Fächer',
      semester: 'Q2 • 2025',
      currentLevel: 'Stufe 2',
      currentModule: 'Modul 1.4',
      progress: 25,
      streakText: '8 Karten fällig',
      badgeType: 'cards',
      status: 'active',
      isCore: true
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      code: '01 / MTH-101',
      rawCode: 'MTH-101',
      title: 'Höhere Mathematik I',
      subtitle: 'Analysis, Lineare Algebra, Vektoren',
      category: 'Basis-Fächer',
      semester: 'Sem. 1 / 2025',
      currentLevel: 'Stufe 3',
      currentModule: 'Modul 2.1',
      progress: 65,
      streakText: 'Laufend',
      badgeType: 'normal',
      status: 'active',
      isCore: true
    },
    {
      id: 'c4444444-4444-4444-4444-444444444444',
      code: '02 / INF-101',
      rawCode: 'INF-101',
      title: 'Grundlagen der Informatik',
      subtitle: 'Algorithmen, Datenstrukturen, Python',
      category: 'Basis-Fächer',
      semester: 'Sem. 1 / 2025',
      currentLevel: 'Stufe 2',
      currentModule: 'Modul 1.3',
      progress: 40,
      streakText: 'Laufend',
      badgeType: 'normal',
      status: 'active',
      isCore: true
    },
    {
      id: 'c5555555-5555-5555-5555-555555555555',
      code: '03 / PHY-101',
      rawCode: 'PHY-101',
      title: 'Klassische Physik & Mechanik',
      subtitle: 'Kinematik, Dynamik, Erhaltungssätze',
      category: 'Basis-Fächer',
      semester: 'Sem. 1 / 2025',
      currentLevel: 'Stufe 1',
      currentModule: 'Modul 1.1',
      progress: 15,
      streakText: 'Laufend',
      badgeType: 'normal',
      status: 'active',
      isCore: true
    },
    {
      id: 'c6666666-6666-6666-6666-666666666666',
      code: '04 / CHE-101',
      rawCode: 'CHE-101',
      title: 'Allgemeine Chemie',
      subtitle: 'Stöchiometrie, Thermodynamik, Bindungsmodelle',
      category: 'Katalog',
      semester: 'Sem. 1 / 2025',
      currentLevel: 'Stufe 1',
      currentModule: 'Modul 0.1',
      progress: 0,
      streakText: 'Wählbar',
      badgeType: 'catalog',
      status: 'catalog',
      isCore: false
    }
  ],
  learningPath: {
    sectionTag: 'Mathematik / Abschnitt 01',
    progress: 25,
    title: 'Vektoren & Matrizen',
    description: 'Grundlagen der Linearen Algebra für ingenieur- und naturwissenschaftliche Studiengänge.',
    nodes: [
      {
        id: 'n1111111-1111-1111-1111-111111111111',
        nodeNumber: '01',
        title: 'Vektorrechnung',
        status: 'completed', // completed, current, locked
        statusBadge: '100% gemeistert',
        description: 'Vektorräume, Linearkombination & Basisvektoren',
        type: 'lesson',
        xpReward: 20
      },
      {
        id: 'n2222222-2222-2222-2222-222222222222',
        nodeNumber: '02',
        title: 'Skalarprodukt & Winkel',
        status: 'completed',
        statusBadge: '100% gemeistert',
        description: 'Orthogonalität, Projektionen & euklidische Norm',
        type: 'lesson',
        xpReward: 20
      },
      {
        id: 'n3333333-3333-3333-3333-333333333333',
        nodeNumber: '03',
        title: 'Matrixmultiplikation',
        status: 'current',
        statusBadge: 'Aktuelle Lerneinheit',
        description: 'Zeile mal Spalte & Dimensionen von Matrizen im euklidischen Raum.',
        type: 'lesson',
        xpReward: 25
      },
      {
        id: 'n4444444-4444-4444-4444-444444444444',
        nodeNumber: '04',
        title: 'Determinanten & Inverse',
        status: 'locked',
        statusBadge: 'Gesperrt',
        description: 'Laplacescher Entwicklungssatz & Reguläre Matrizen',
        type: 'lesson',
        xpReward: 30
      },
      {
        id: 'n5555555-5555-5555-5555-555555555555',
        nodeNumber: '05',
        title: 'Meilenstein: Modul-Abschlussprüfung',
        status: 'locked',
        statusBadge: 'Meilenstein',
        description: 'Abschlussklausur Lineare Algebra I',
        type: 'milestone',
        xpReward: 50
      }
    ]
  },
  quizQuestions: [
    {
      id: 'q1111111-1111-1111-1111-111111111111',
      topicTag: 'Neurobiologie',
      category: 'Aktives Erinnern',
      questionNumber: 6,
      totalQuestions: 10,
      questionHtml: 'Welche Funktion erfüllt die <span class="bg-secondary-container/30 px-1 py-0.5 text-on-surface">Langzeitpotenzierung (LTP)</span> im Hippocampus?',
      instruction: 'Wähle die zutreffende Antwort',
      xpReward: 20,
      options: [
        { id: 'o1', letter: 'A', text: 'Verringerung der Übertragungsstärke bei Dauerreiz.', isCorrect: false },
        { id: 'o2', letter: 'B', text: 'Dauerhafte Verstärkung der synaptischen Übertragung.', isCorrect: true },
        { id: 'o3', letter: 'C', text: 'Inaktivierung von Neurotransmitter-Rezeptoren.', isCorrect: false }
      ],
      explanation: 'Die Langzeitpotenzierung (LTP) verstärkt dauerhaft die synaptische Transmission und ist das zelluläre Modell für Gedächtnisbildung.'
    },
    {
      id: 'q2222222-2222-2222-2222-222222222222',
      topicTag: 'Lineare Algebra',
      category: 'Aktives Erinnern',
      questionNumber: 7,
      totalQuestions: 10,
      questionHtml: 'Wann ist das Produkt zweier Matrizen <span class="bg-secondary-container/30 px-1 py-0.5 text-on-surface">A (m×n) und B (p×q)</span> mathematisch definiert?',
      instruction: 'Wähle die zutreffende Antwort',
      xpReward: 20,
      options: [
        { id: 'o4', letter: 'A', text: 'Die Zeilenanzahl m muss gleich der Spaltenanzahl q sein.', isCorrect: false },
        { id: 'o5', letter: 'B', text: 'Die Spaltenanzahl n von A muss gleich der Zeilenanzahl p von B sein (n = p).', isCorrect: true },
        { id: 'o6', letter: 'C', text: 'Beide Matrizen müssen strikt quadratisch sein.', isCorrect: false }
      ],
      explanation: 'Zeile mal Spalte: Die innere Dimension muss übereinstimmen (n = p).'
    },
    {
      id: 'q3333333-3333-3333-3333-333333333333',
      topicTag: 'Statistik & Datenanalyse',
      category: 'Aktives Erinnern',
      questionNumber: 8,
      totalQuestions: 10,
      questionHtml: 'Was drückt der <span class="bg-secondary-container/30 px-1 py-0.5 text-on-surface">p-Wert</span> bei einem statistischen Signifikanztest aus?',
      instruction: 'Wähle die zutreffende Antwort',
      xpReward: 20,
      options: [
        { id: 'o7', letter: 'A', text: 'Die Wahrscheinlichkeit, dass die Nullhypothese zutrifft.', isCorrect: false },
        { id: 'o8', letter: 'B', text: 'Die Wahrscheinlichkeit, die Daten oder extremere unter der Nullhypothese zu beobachten.', isCorrect: true },
        { id: 'o9', letter: 'C', text: 'Die exakte Effektstärke der Alternativhypothese.', isCorrect: false }
      ],
      explanation: 'Der p-Wert misst die Plausibilität der Daten unter Gültigkeit der Nullhypothese.'
    }
  ]
};

class NeonTechClient {
  constructor() {
    this.connectionString = localStorage.getItem(STORAGE_KEYS.NEON_CONFIG) || '';
    this.listeners = new Set();
    this.initState();
  }

  initState() {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_STATE);
    if (!saved) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_SEED_STATE));
      this.saveLocal();
    } else {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(DEFAULT_SEED_STATE));
        this.saveLocal();
      }
    }
  }

  saveLocal() {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STATE, JSON.stringify(this.state));
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      cb(this.state);
    }
  }

  setNeonConnectionString(connStr) {
    this.connectionString = (connStr || '').trim();
    if (this.connectionString) {
      localStorage.setItem(STORAGE_KEYS.NEON_CONFIG, this.connectionString);
    } else {
      localStorage.removeItem(STORAGE_KEYS.NEON_CONFIG);
    }
  }

  getNeonConnectionString() {
    return this.connectionString;
  }

  isNeonConnected() {
    return !!(this.connectionString && this.connectionString.startsWith('postgresql://'));
  }

  // Parse Neon HTTP Endpoint from connection string:
  // e.g. postgresql://user:pass@ep-cool-cloud-123.eu-central-1.aws.neon.tech/neondb
  getNeonHttpEndpoint() {
    if (!this.connectionString) return null;
    try {
      const url = new URL(this.connectionString.replace('postgresql://', 'https://'));
      return `https://${url.host}/sql`;
    } catch (e) {
      return null;
    }
  }

  async executeNeonQuery(sqlQuery, params = []) {
    if (!this.connectionString) {
      throw new Error('Kein Neon Connection String konfiguriert.');
    }

    // Attempt 1: Local server proxy if available
    try {
      const resp = await fetch('/api/neon/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: this.connectionString,
          query: sqlQuery,
          params
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch (err) {
      console.warn('[Neon Client] Local server proxy not reachable, falling back to direct Neon HTTP SQL...');
    }

    // Attempt 2: Direct Neon Serverless HTTP API
    const httpEndpoint = this.getNeonHttpEndpoint();
    if (!httpEndpoint) {
      throw new Error('Ungültiger Neon Connection String.');
    }

    const resp = await fetch(httpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String-Source': 'header',
        'Authorization': `Bearer ${this.connectionString}`
      },
      body: JSON.stringify({ query: sqlQuery, params })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Neon HTTP Fehler (${resp.status}): ${errorText}`);
    }

    return await resp.json();
  }

  async testConnection(connStr) {
    const original = this.connectionString;
    try {
      this.connectionString = connStr;
      const res = await this.executeNeonQuery('SELECT NOW() as current_time, version() as pg_version;');
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      this.connectionString = original;
    }
  }

  // Get current user dashboard summary
  getUser() {
    return this.state.user;
  }

  getCourses(category = 'all') {
    if (category === 'all') {
      return this.state.courses;
    }
    if (category === 'active') {
      return this.state.courses.filter(c => c.status === 'active');
    }
    if (category === 'catalog') {
      return this.state.courses.filter(c => c.category === 'Katalog' || c.status === 'catalog');
    }
    if (category === 'archived') {
      return this.state.courses.filter(c => c.status === 'archived');
    }
    return this.state.courses;
  }

  getLearningPath() {
    return this.state.learningPath;
  }

  getQuizQuestions() {
    return this.state.quizQuestions;
  }

  // Submit Answer & Calculate Rewards
  async submitQuizAnswer(questionId, optionId) {
    const question = this.state.quizQuestions.find(q => q.id === questionId);
    if (!question) return null;

    const option = question.options.find(o => o.id === optionId);
    const isCorrect = option ? option.isCorrect : false;
    const xpEarned = isCorrect ? question.xpReward : 0;

    // Update state
    if (isCorrect) {
      this.state.user.totalXp += xpEarned;
      // Mark current node as progress
      const currentNode = this.state.learningPath.nodes.find(n => n.id === 'n3333333-3333-3333-3333-333333333333');
      if (currentNode && currentNode.status === 'current') {
        currentNode.status = 'completed';
        currentNode.statusBadge = '100% gemeistert';
        // Unlock next node
        const nextNode = this.state.learningPath.nodes.find(n => n.nodeNumber === '04');
        if (nextNode) {
          nextNode.status = 'current';
          nextNode.statusBadge = 'Aktuelle Lerneinheit';
        }
        this.state.learningPath.progress = Math.min(100, this.state.learningPath.progress + 25);
      }
    }

    this.saveLocal();

    // Sync to live Neon if configured
    if (this.isNeonConnected()) {
      try {
        await this.executeNeonQuery(
          'SELECT fn_complete_quiz_question($1, $2, $3);',
          [this.state.user.id, questionId, optionId]
        );
      } catch (e) {
        console.warn('[Neon Sync] Background Neon update error:', e.message);
      }
    }

    return {
      isCorrect,
      xpEarned,
      totalXp: this.state.user.totalXp,
      streakCount: this.state.user.streakCount,
      explanation: question.explanation
    };
  }

  // Complete Study Timer
  async logStudySession(mode, durationSeconds, completed, dndActive) {
    const minutes = Math.round(durationSeconds / 60);
    const xpReward = completed ? (mode === 'deep_50' ? 50 : 25) : Math.max(5, Math.round(minutes * 0.5));

    this.state.user.studyTimeTodayMinutes += minutes;
    this.state.user.totalXp += xpReward;
    this.saveLocal();

    if (this.isNeonConnected()) {
      try {
        await this.executeNeonQuery(
          'SELECT fn_log_study_session($1, $2, $3, $4, $5, $6);',
          [
            this.state.user.id,
            'c3333333-3333-3333-3333-333333333333',
            mode,
            durationSeconds,
            completed,
            dndActive
          ]
        );
      } catch (e) {
        console.warn('[Neon Sync] Background Neon timer log error:', e.message);
      }
    }

    return {
      minutes,
      xpReward,
      totalXp: this.state.user.totalXp,
      studyTimeTodayMinutes: this.state.user.studyTimeTodayMinutes
    };
  }

  // Reset to initial demo state
  resetDemoData() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_SEED_STATE));
    this.saveLocal();
  }
}

// Global singleton instance
window.neonClient = new NeonTechClient();
