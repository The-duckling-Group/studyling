// ============================================================================
// Studyling Client & API Bridge (public/neon-client.js)
// Communicates with /api/ (backed by Vercel Environment Variable DATABASE_URL)
// ============================================================================

const AUTH_TOKEN_KEY = 'studyling_jwt_token';
const AUTH_USER_KEY = 'studyling_current_user';

class StudylingApiClient {
  constructor() {
    this.token = localStorage.getItem(AUTH_TOKEN_KEY) || null;
    this.currentUser = null;
    try {
      this.currentUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (e) {
      this.currentUser = null;
    }
    this.listeners = new Set();
    // Default fallback demo user if no login has occurred yet
    if (!this.currentUser) {
      this.currentUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        username: 'alex_study',
        display_name: 'Alex M.',
        email: 'alex@studyling.app',
        role: 'student',
        streak_count: 12,
        total_xp: 1420,
        level: 4
      };
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      cb(this.currentUser);
    }
  }

  // --- Auth Methods ---
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login fehlgeschlagen');
    }
    this.token = data.token;
    this.currentUser = data.user;
    localStorage.setItem(AUTH_TOKEN_KEY, this.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    this.notify();
    return this.currentUser;
  }

  async register(displayName, email, password, username) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, email, password, username })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registrierung fehlgeschlagen');
    }
    this.token = data.token;
    this.currentUser = data.user;
    localStorage.setItem(AUTH_TOKEN_KEY, this.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    this.notify();
    return this.currentUser;
  }

  logout() {
    this.token = null;
    this.currentUser = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      username: 'alex_study',
      display_name: 'Alex M.',
      email: 'alex@studyling.app',
      role: 'student',
      streak_count: 12,
      total_xp: 1420,
      level: 4
    };
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.notify();
  }

  getUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.token;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // --- Courses API ---
  async getCourses(category = 'all') {
    try {
      const res = await fetch(`/api/courses?category=${encodeURIComponent(category)}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.courses || [];
      }
    } catch (err) {
      console.warn('[API Client] Falling back to offline cache:', err.message);
    }
    return [];
  }

  // --- Learning Path API ---
  async getLearningPath() {
    try {
      const res = await fetch('/api/learning-path', {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API Client] Falling back to offline path:', err.message);
    }
    return null;
  }

  // --- Quiz API ---
  async getQuizQuestions() {
    try {
      const res = await fetch('/api/quiz', {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.questions || [];
      }
    } catch (err) {
      console.warn('[API Client] Falling back to offline quiz:', err.message);
    }
    return [];
  }

  async submitQuizAnswer(questionId, optionId) {
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ questionId, optionId })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.total_xp) {
          this.currentUser.total_xp = result.total_xp;
          if (result.streak_count) this.currentUser.streak_count = result.streak_count;
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
          this.notify();
        }
        return result;
      }
    } catch (err) {
      console.error('[API Client] Quiz submit error:', err.message);
    }
    return null;
  }

  // --- Study Timer API ---
  async logStudySession(mode, durationSeconds, completed, dndActive) {
    try {
      const res = await fetch('/api/timer/session', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ mode, durationSeconds, completed, dndActive })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.total_xp) {
          this.currentUser.total_xp = result.total_xp;
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
          this.notify();
        }
        return result;
      }
    } catch (err) {
      console.error('[API Client] Timer session error:', err.message);
    }
    return null;
  }

  // ==========================================================================
  // ADMIN PANEL METHODS
  // ==========================================================================
  async getAdminOverview() {
    const res = await fetch('/api/admin/overview', { headers: this.getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'Admin Übersicht fehlgeschlagen');
    return await res.json();
  }

  async getAdminUsers() {
    const res = await fetch('/api/admin/users', { headers: this.getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'Benutzerliste fehlgeschlagen');
    const data = await res.json();
    return data.users || [];
  }

  async setAdminUserRole(targetUserId, newRole) {
    const res = await fetch('/api/admin/users/role', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetUserId, newRole })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Rollenänderung fehlgeschlagen');
    return await res.json();
  }

  async createCourse(courseData) {
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(courseData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Kurs-Erstellung fehlgeschlagen');
    return await res.json();
  }

  async deleteCourse(courseId) {
    const res = await fetch('/api/admin/courses', {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ courseId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Kurs-Löschung fehlgeschlagen');
    return await res.json();
  }

  async createLearningNode(nodeData) {
    const res = await fetch('/api/admin/nodes', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(nodeData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Lektion-Erstellung fehlgeschlagen');
    return await res.json();
  }

  async deleteLearningNode(nodeId) {
    const res = await fetch('/api/admin/nodes', {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ nodeId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Lektion-Löschung fehlgeschlagen');
    return await res.json();
  }

  async createQuizQuestion(questionData) {
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(questionData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Aufgaben-Erstellung fehlgeschlagen');
    return await res.json();
  }

  async deleteQuizQuestion(questionId) {
    const res = await fetch('/api/admin/questions', {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ questionId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Aufgaben-Löschung fehlgeschlagen');
    return await res.json();
  }
}

// Global client instance
window.studylingClient = new StudylingApiClient();
