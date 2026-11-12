// ============================================================================
// Studyling Unified Serverless API Router (api/index.js) - Production Ready
// Fully Compatible with Vercel Serverless Functions, Edge Rewrites & Node.js
// ============================================================================

const url = require('url');
const { queryNeon, isNeonConfigured, inMemoryStore } = require('./_db');
const {
  signToken,
  getAuthenticatedUser,
  hashPassword,
  comparePassword,
  JWT_SECRET_CONFIGURED
} = require('./_auth');

// Helper to send standardized JSON responses with full CORS headers
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.end(JSON.stringify(data));
}

// Universal body parser (handles both Vercel pre-parsed bodies & Node streams)
async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (e) {
        return {};
      }
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    if (req.readableEnded) {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    }
  });
}

// Robust path resolver for Vercel rewrites & direct routes
function resolvePath(req) {
  // 1. Vercel Catch-All Query: [...route]
  if (req.query && req.query.route) {
    const r = Array.isArray(req.query.route) ? req.query.route.join('/') : req.query.route;
    return '/' + r.replace(/^\//, '');
  }

  // 2. Vercel Header matches
  const matched = req.headers && (req.headers['x-matched-path'] || req.headers['x-invoke-path']);
  if (matched && matched.startsWith('/api') && !matched.includes('index.js')) {
    return matched.replace(/^\/api/, '');
  }

  // 3. Standard Request URL
  const reqUrl = req.url || '';
  const parsed = url.parse(reqUrl, true);
  let p = parsed.pathname || '';
  p = p.replace(/^\/api/, '');
  p = p.replace(/^\/index\.js/, '');
  if (!p || p === '/') return '/';
  return p.replace(/\/$/, ''); // strip trailing slash
}

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.end();
    return;
  }

  const pathname = resolvePath(req);
  const method = (req.method || 'GET').toUpperCase();
  const parsedUrl = url.parse(req.url || '', true);

  try {
    // ------------------------------------------------------------------------
    // HEALTH CHECK: GET /api/health
    // ------------------------------------------------------------------------
    if (pathname === '/health' || pathname === '') {
      return sendJson(res, 200, {
        status: 'ok',
        database: isNeonConfigured() ? 'neon_postgresql' : 'in_memory_fallback',
        time: new Date().toISOString()
      });
    }

    // ------------------------------------------------------------------------
    // DIAGNOSTICS: GET /api/diagnostics
    // Gives instant clarity if DATABASE_URL or tables have issues
    // ------------------------------------------------------------------------
    if (pathname === '/diagnostics' && method === 'GET') {
      let dbStatus = {
        configured: isNeonConfigured(),
        neonConnected: false,
        details: null,
        error: null
      };

      if (isNeonConfigured()) {
        try {
          const test = await queryNeon('SELECT NOW() as db_time, version() as pg_version;');
          const userCount = await queryNeon('SELECT COUNT(*) as count FROM users;');
          dbStatus.neonConnected = true;
          dbStatus.details = {
            dbTime: test[0]?.db_time,
            pgVersion: test[0]?.pg_version?.slice(0, 50),
            usersCount: userCount[0]?.count
          };
        } catch (err) {
          dbStatus.error = err.message;
        }
      }

      return sendJson(res, 200, {
        environment: {
          DATABASE_URL_SET: !!(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL),
          JWT_SECRET_SET: JWT_SECRET_CONFIGURED,
          NODE_ENV: process.env.NODE_ENV || 'production'
        },
        database: dbStatus,
        inMemoryUsersCount: inMemoryStore.users.length,
        time: new Date().toISOString()
      });
    }

    // ------------------------------------------------------------------------
    // AUTHENTICATION: POST /api/auth/register
    // ------------------------------------------------------------------------
    if (pathname === '/auth/register' && method === 'POST') {
      const { email, password, displayName, username } = await parseBody(req);
      if (!email || !password || !displayName) {
        return sendJson(res, 400, { error: 'E-Mail, Passwort und Name sind erforderlich.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = (username || cleanEmail.split('@')[0]).trim().toLowerCase();

      if (isNeonConfigured()) {
        try {
          const existing = await queryNeon(
            'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1;',
            [cleanEmail, cleanUsername]
          );
          if (existing && existing.length > 0) {
            return sendJson(res, 400, { error: 'Ein Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits.' });
          }

          const passwordHash = await hashPassword(password);
          const role = 'student';

          const inserted = await queryNeon(
            `INSERT INTO users (username, email, password_hash, role, display_name, streak_count, total_xp, level)
             VALUES ($1, $2, $3, $4, $5, 1, 0, 1)
             RETURNING id, username, email, role, display_name, streak_count, total_xp, level;`,
            [cleanUsername, cleanEmail, passwordHash, role, displayName.trim()]
          );
          const user = inserted[0];
          const token = signToken(user);
          return sendJson(res, 201, { success: true, token, user });
        } catch (dbErr) {
          console.error('[Register DB Error]', dbErr);
          return sendJson(res, 500, { error: `Datenbank-Fehler: ${dbErr.message}` });
        }
      } else {
        const exists = inMemoryStore.users.find(u => u.email === cleanEmail || u.username === cleanUsername);
        if (exists) {
          return sendJson(res, 400, { error: 'Ein Benutzer mit dieser E-Mail existiert bereits.' });
        }
        const passwordHash = await hashPassword(password);
        const newUser = {
          id: 'user_' + Date.now(),
          username: cleanUsername,
          email: cleanEmail,
          password_hash: passwordHash,
          role: 'student',
          display_name: displayName.trim(),
          streak_count: 1,
          total_xp: 0,
          level: 1,
          study_time_today_minutes: 0,
          created_at: new Date().toISOString()
        };
        inMemoryStore.users.push(newUser);
        const token = signToken(newUser);
        const { password_hash, ...safeUser } = newUser;
        return sendJson(res, 201, { success: true, token, user: safeUser });
      }
    }

    // ------------------------------------------------------------------------
    // AUTHENTICATION: POST /api/auth/login
    // ------------------------------------------------------------------------
    if (pathname === '/auth/login' && method === 'POST') {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        return sendJson(res, 400, { error: 'E-Mail und Passwort sind erforderlich.' });
      }

      const cleanEmail = email.trim().toLowerCase();

      let user = null;
      if (isNeonConfigured()) {
        try {
          const rows = await queryNeon(
            'SELECT id, username, email, password_hash, role, display_name, streak_count, total_xp, level, study_time_today_minutes FROM users WHERE email = $1 OR username = $1 LIMIT 1;',
            [cleanEmail]
          );
          if (rows && rows.length > 0) user = rows[0];
        } catch (dbErr) {
          console.error('[Login DB Error]', dbErr);
          return sendJson(res, 500, { error: `Datenbank-Fehler: ${dbErr.message}` });
        }
      } else {
        user = inMemoryStore.users.find(u => u.email === cleanEmail || u.username === cleanEmail);
      }

      if (!user) {
        return sendJson(res, 401, { error: 'Ungültige Anmeldedaten.' });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return sendJson(res, 401, { error: 'Ungültige Anmeldedaten.' });
      }

      const token = signToken(user);
      const { password_hash, ...safeUser } = user;
      return sendJson(res, 200, { success: true, token, user: safeUser });
    }

    // ------------------------------------------------------------------------
    // AUTHENTICATION: GET /api/auth/me
    // ------------------------------------------------------------------------
    if (pathname === '/auth/me' && method === 'GET') {
      const auth = getAuthenticatedUser(req);
      if (!auth) {
        return sendJson(res, 401, { error: 'Nicht authentifiziert' });
      }

      let user = null;
      if (isNeonConfigured()) {
        const rows = await queryNeon(
          'SELECT id, username, email, role, display_name, avatar_url, streak_count, total_xp, level, study_time_today_minutes FROM users WHERE id = $1;',
          [auth.id]
        );
        if (rows && rows.length > 0) user = rows[0];
      } else {
        user = inMemoryStore.users.find(u => u.id === auth.id);
      }

      if (!user) {
        return sendJson(res, 404, { error: 'Benutzer nicht gefunden' });
      }

      const { password_hash, ...safeUser } = user;
      return sendJson(res, 200, { user: safeUser });
    }

    // ------------------------------------------------------------------------
    // COURSES: GET /api/courses
    // ------------------------------------------------------------------------
    if (pathname === '/courses' && method === 'GET') {
      const category = parsedUrl.query.category || 'all';

      if (isNeonConfigured()) {
        try {
          const auth = getAuthenticatedUser(req);
          const userId = auth ? auth.id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
          let sql = `
            SELECT c.*, 
                   COALESCE(uce.status, 'catalog') AS enrollment_status,
                   COALESCE(uce.progress_pct, 0) AS progress_pct,
                   COALESCE(uce.cards_due_count, 0) AS cards_due_count
            FROM courses c
            LEFT JOIN user_course_enrollments uce ON c.id = uce.course_id AND uce.user_id = $1
            ORDER BY c.code_number ASC;
          `;
          const courses = await queryNeon(sql, [userId]);
          return sendJson(res, 200, { courses });
        } catch (dbErr) {
          console.error('[Courses DB Error]', dbErr);
          return sendJson(res, 200, { courses: inMemoryStore.courses });
        }
      } else {
        let courses = inMemoryStore.courses;
        if (category === 'active') {
          courses = courses.filter(c => c.status === 'active');
        } else if (category === 'catalog') {
          courses = courses.filter(c => c.category === 'Katalog' || c.status === 'catalog');
        } else if (category === 'archived') {
          courses = courses.filter(c => c.status === 'archived');
        }
        return sendJson(res, 200, { courses });
      }
    }

    // ------------------------------------------------------------------------
    // LEARNING PATH: GET /api/learning-path
    // ------------------------------------------------------------------------
    if (pathname === '/learning-path' && method === 'GET') {
      if (isNeonConfigured()) {
        try {
          const auth = getAuthenticatedUser(req);
          const userId = auth ? auth.id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

          const sections = await queryNeon(
            'SELECT * FROM learning_path_sections WHERE is_active = TRUE ORDER BY section_index ASC LIMIT 1;'
          );
          const section = sections[0] || {
            section_tag: 'Mathematik / Abschnitt 01',
            title: 'Vektoren & Matrizen',
            description: 'Grundlagen der Linearen Algebra',
            progress_pct: 25
          };

          const nodes = await queryNeon(
            `SELECT lpn.*, COALESCE(unp.status, lpn.default_status) AS user_status,
                    COALESCE(unp.score_pct, 0) AS score_pct
             FROM learning_path_nodes lpn
             LEFT JOIN user_node_progress unp ON lpn.id = unp.node_id AND unp.user_id = $1
             ORDER BY lpn.order_index ASC;`,
            [userId]
          );

          return sendJson(res, 200, { section, nodes });
        } catch (dbErr) {
          console.error('[Path DB Error]', dbErr);
          return sendJson(res, 200, inMemoryStore.learningPath);
        }
      } else {
        return sendJson(res, 200, inMemoryStore.learningPath);
      }
    }

    // ------------------------------------------------------------------------
    // QUIZ: GET /api/quiz
    // ------------------------------------------------------------------------
    if (pathname === '/quiz' && method === 'GET') {
      if (isNeonConfigured()) {
        try {
          const questions = await queryNeon(`
            SELECT qq.*,
                   json_agg(json_build_object(
                     'id', qo.id,
                     'letter', qo.option_letter,
                     'text', qo.option_text,
                     'is_correct', qo.is_correct
                   ) ORDER BY qo.order_index ASC) AS options
            FROM quiz_questions qq
            JOIN quiz_options qo ON qq.id = qo.question_id
            GROUP BY qq.id
            ORDER BY qq.question_number ASC;
          `);
          return sendJson(res, 200, { questions });
        } catch (dbErr) {
          console.error('[Quiz DB Error]', dbErr);
          return sendJson(res, 200, { questions: inMemoryStore.quizQuestions });
        }
      } else {
        return sendJson(res, 200, { questions: inMemoryStore.quizQuestions });
      }
    }

    // ------------------------------------------------------------------------
    // QUIZ: POST /api/quiz/submit
    // ------------------------------------------------------------------------
    if (pathname === '/quiz/submit' && method === 'POST') {
      const { questionId, optionId } = await parseBody(req);
      const auth = getAuthenticatedUser(req);
      const userId = auth ? auth.id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      if (isNeonConfigured()) {
        try {
          const result = await queryNeon(
            'SELECT fn_complete_quiz_question($1, $2, $3) AS result;',
            [userId, questionId, optionId]
          );
          if (result && result[0]?.result) {
            return sendJson(res, 200, result[0].result);
          }
        } catch (dbErr) {
          console.warn('[Quiz Submit Neon Error, fallback to local]', dbErr.message);
        }
      }

      // Memory Fallback grading
      const q = inMemoryStore.quizQuestions.find((item) => item.id === questionId) || inMemoryStore.quizQuestions[0];
      const opt = q?.options?.find((o) => o.id === optionId) || { is_correct: false };
      const isCorrect = !!opt.is_correct;
      const xpEarned = isCorrect ? (q?.xp_reward || 20) : 0;

      const user = inMemoryStore.users.find((u) => u.id === userId) || inMemoryStore.users[1];
      if (isCorrect) {
        user.total_xp += xpEarned;
      }

      return sendJson(res, 200, {
        is_correct: isCorrect,
        xp_earned: xpEarned,
        total_xp: user.total_xp,
        streak_count: user.streak_count,
        explanation: q?.explanation || ''
      });
    }

    // ------------------------------------------------------------------------
    // TIMER: POST /api/timer/session
    // ------------------------------------------------------------------------
    if (pathname === '/timer/session' && method === 'POST') {
      const { mode, durationSeconds, completed, dndActive } = await parseBody(req);
      const auth = getAuthenticatedUser(req);
      const userId = auth ? auth.id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      if (isNeonConfigured()) {
        try {
          const result = await queryNeon(
            'SELECT fn_log_study_session($1, $2, $3, $4, $5, $6) AS result;',
            [
              userId,
              'c3333333-3333-3333-3333-333333333333',
              mode || 'pomodoro_25',
              durationSeconds || 1500,
              !!completed,
              dndActive !== false
            ]
          );
          if (result && result[0]?.result) {
            return sendJson(res, 200, result[0].result);
          }
        } catch (dbErr) {
          console.warn('[Timer Session Neon Error, fallback]', dbErr.message);
        }
      }

      const minutes = Math.round((durationSeconds || 1500) / 60);
      const xp = completed ? (mode === 'deep_50' ? 50 : 25) : Math.max(5, Math.round(minutes * 0.5));
      const user = inMemoryStore.users.find((u) => u.id === userId) || inMemoryStore.users[1];
      user.study_time_today_minutes += minutes;
      user.total_xp += xp;

      return sendJson(res, 200, {
        success: true,
        mode,
        minutes_logged: minutes,
        xp_earned: xp,
        total_xp: user.total_xp,
        streak_count: user.streak_count
      });
    }

    // ========================================================================
    // ADMIN PANEL ROUTES (Require Role = 'admin')
    // ========================================================================
    if (pathname.startsWith('/admin')) {
      const auth = getAuthenticatedUser(req);
      if (!auth || auth.role !== 'admin') {
        return sendJson(res, 403, { error: 'Zugriff verweigert. Administrator-Rechte erforderlich.' });
      }

      // --- Admin Overview Stats ---
      if (pathname === '/admin/overview' && method === 'GET') {
        if (isNeonConfigured()) {
          try {
            const userCount = await queryNeon('SELECT COUNT(*) AS count FROM users;');
            const courseCount = await queryNeon('SELECT COUNT(*) AS count FROM courses;');
            const questionCount = await queryNeon('SELECT COUNT(*) AS count FROM quiz_questions;');
            const nodeCount = await queryNeon('SELECT COUNT(*) AS count FROM learning_path_nodes;');
            return sendJson(res, 200, {
              total_users: parseInt(userCount[0].count),
              total_courses: parseInt(courseCount[0].count),
              total_questions: parseInt(questionCount[0].count),
              total_nodes: parseInt(nodeCount[0].count)
            });
          } catch (e) {
            console.warn('[Admin Overview DB Error]', e.message);
          }
        }

        return sendJson(res, 200, {
          total_users: inMemoryStore.users.length,
          total_courses: inMemoryStore.courses.length,
          total_questions: inMemoryStore.quizQuestions.length,
          total_nodes: inMemoryStore.learningPath.nodes.length
        });
      }

      // --- Admin Users List ---
      if (pathname === '/admin/users' && method === 'GET') {
        if (isNeonConfigured()) {
          try {
            const users = await queryNeon(
              'SELECT id, username, email, role, display_name, streak_count, total_xp, level, created_at FROM users ORDER BY created_at DESC;'
            );
            return sendJson(res, 200, { users });
          } catch (e) {
            console.warn('[Admin Users DB Error]', e.message);
          }
        }
        const users = inMemoryStore.users.map(({ password_hash, ...u }) => u);
        return sendJson(res, 200, { users });
      }

      // --- Admin Update User Role ---
      if (pathname === '/admin/users/role' && method === 'POST') {
        const { targetUserId, newRole } = await parseBody(req);
        if (!targetUserId || !['student', 'admin'].includes(newRole)) {
          return sendJson(res, 400, { error: 'Ungültige User-ID oder Rolle.' });
        }

        if (isNeonConfigured()) {
          try {
            await queryNeon('UPDATE users SET role = $1 WHERE id = $2;', [newRole, targetUserId]);
          } catch (e) {
            console.warn('[Admin Role Update DB Error]', e.message);
          }
        }
        const u = inMemoryStore.users.find((user) => user.id === targetUserId);
        if (u) u.role = newRole;

        return sendJson(res, 200, { success: true, message: `Rolle erfolgreich auf '${newRole}' aktualisiert.` });
      }

      // --- Admin Courses: CREATE ---
      if (pathname === '/admin/courses' && method === 'POST') {
        const { code, title, subtitle, category, semester, current_level_label, current_module_label } = await parseBody(req);
        if (!code || !title) {
          return sendJson(res, 400, { error: 'Kurs-Code und Titel sind erforderlich.' });
        }

        if (isNeonConfigured()) {
          try {
            const inserted = await queryNeon(
              `INSERT INTO courses (code, code_number, title, subtitle, category, semester, current_level_label, current_module_label)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING *;`,
              [
                code,
                code.split('/')[0].trim() || '01',
                title,
                subtitle || '',
                category || 'Basis-Fächer',
                semester || 'Sem. 1 / 2025',
                current_level_label || 'Stufe 1',
                current_module_label || 'Modul 1.1'
              ]
            );
            return sendJson(res, 201, { success: true, course: inserted[0] });
          } catch (e) {
            console.warn('[Admin Course Create DB Error]', e.message);
          }
        }

        const newCourse = {
          id: 'c_' + Date.now(),
          code,
          code_number: code.split('/')[0].trim() || '01',
          title,
          subtitle: subtitle || '',
          category: category || 'Basis-Fächer',
          semester: semester || 'Sem. 1 / 2025',
          current_level_label: current_level_label || 'Stufe 1',
          current_module_label: current_module_label || 'Modul 1.1',
          progress_pct: 0,
          status: 'active',
          is_core_curriculum: true
        };
        inMemoryStore.courses.push(newCourse);
        return sendJson(res, 201, { success: true, course: newCourse });
      }

      // --- Admin Courses: DELETE ---
      if (pathname === '/admin/courses' && method === 'DELETE') {
        const { courseId } = await parseBody(req);
        if (isNeonConfigured()) {
          try {
            await queryNeon('DELETE FROM courses WHERE id = $1;', [courseId]);
          } catch (e) {
            console.warn('[Admin Course Delete DB Error]', e.message);
          }
        }
        inMemoryStore.courses = inMemoryStore.courses.filter((c) => c.id !== courseId);
        return sendJson(res, 200, { success: true });
      }

      // --- Admin Learning Path Nodes: CREATE ---
      if (pathname === '/admin/nodes' && method === 'POST') {
        const { nodeNumber, title, description, xpReward, nodeType } = await parseBody(req);
        if (!title || !nodeNumber) {
          return sendJson(res, 400, { error: 'Nummer und Titel sind erforderlich.' });
        }

        if (isNeonConfigured()) {
          try {
            const sections = await queryNeon('SELECT id FROM learning_path_sections LIMIT 1;');
            const sectionId = sections[0]?.id;
            const inserted = await queryNeon(
              `INSERT INTO learning_path_nodes (section_id, order_index, node_number, title, description, xp_reward, node_type, default_status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'locked')
               RETURNING *;`,
              [
                sectionId,
                parseInt(nodeNumber) || 99,
                nodeNumber,
                title,
                description || '',
                xpReward || 20,
                nodeType || 'lesson'
              ]
            );
            return sendJson(res, 201, { success: true, node: inserted[0] });
          } catch (e) {
            console.warn('[Admin Node Create DB Error]', e.message);
          }
        }

        const newNode = {
          id: 'n_' + Date.now(),
          node_number: nodeNumber,
          title,
          description: description || '',
          xp_reward: xpReward || 20,
          node_type: nodeType || 'lesson',
          status: 'locked',
          status_badge: 'Gesperrt'
        };
        inMemoryStore.learningPath.nodes.push(newNode);
        return sendJson(res, 201, { success: true, node: newNode });
      }

      // --- Admin Learning Path Nodes: DELETE ---
      if (pathname === '/admin/nodes' && method === 'DELETE') {
        const { nodeId } = await parseBody(req);
        if (isNeonConfigured()) {
          try {
            await queryNeon('DELETE FROM learning_path_nodes WHERE id = $1;', [nodeId]);
          } catch (e) {
            console.warn('[Admin Node Delete DB Error]', e.message);
          }
        }
        inMemoryStore.learningPath.nodes = inMemoryStore.learningPath.nodes.filter((n) => n.id !== nodeId);
        return sendJson(res, 200, { success: true });
      }

      // --- Admin Quiz Questions: CREATE ---
      if (pathname === '/admin/questions' && method === 'POST') {
        const { topicTag, questionText, highlightPhrase, xpReward, explanation, options } = await parseBody(req);
        if (!questionText || !options || options.length < 2) {
          return sendJson(res, 400, { error: 'Fragetext und mindestens 2 Antwortoptionen sind erforderlich.' });
        }

        if (isNeonConfigured()) {
          try {
            const qInserted = await queryNeon(
              `INSERT INTO quiz_questions (topic_tag, category, question_text, highlight_phrase, xp_reward, explanation)
               VALUES ($1, 'Aktives Erinnern', $2, $3, $4, $5)
               RETURNING id;`,
              [
                topicTag || 'Allgemein',
                questionText,
                highlightPhrase || '',
                xpReward || 20,
                explanation || ''
              ]
            );
            const qId = qInserted[0]?.id;
            if (qId) {
              for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                await queryNeon(
                  `INSERT INTO quiz_options (question_id, option_letter, option_text, is_correct, order_index)
                   VALUES ($1, $2, $3, $4, $5);`,
                  [qId, opt.letter, opt.text, !!opt.is_correct, i + 1]
                );
              }
              return sendJson(res, 201, { success: true, id: qId });
            }
          } catch (e) {
            console.warn('[Admin Question Create DB Error]', e.message);
          }
        }

        const newQ = {
          id: 'q_' + Date.now(),
          topic_tag: topicTag || 'Allgemein',
          category: 'Aktives Erinnern',
          question_number: inMemoryStore.quizQuestions.length + 1,
          total_questions: inMemoryStore.quizQuestions.length + 1,
          question_html: questionText,
          instruction: 'Wähle die zutreffende Antwort',
          xp_reward: xpReward || 20,
          explanation: explanation || '',
          options: options.map((opt, idx) => ({
            id: 'opt_' + Date.now() + '_' + idx,
            letter: opt.letter,
            text: opt.text,
            is_correct: !!opt.is_correct
          }))
        };
        inMemoryStore.quizQuestions.push(newQ);
        return sendJson(res, 201, { success: true, question: newQ });
      }

      // --- Admin Quiz Questions: DELETE ---
      if (pathname === '/admin/questions' && method === 'DELETE') {
        const { questionId } = await parseBody(req);
        if (isNeonConfigured()) {
          try {
            await queryNeon('DELETE FROM quiz_questions WHERE id = $1;', [questionId]);
          } catch (e) {
            console.warn('[Admin Question Delete DB Error]', e.message);
          }
        }
        inMemoryStore.quizQuestions = inMemoryStore.quizQuestions.filter((q) => q.id !== questionId);
        return sendJson(res, 200, { success: true });
      }
    }

    return sendJson(res, 404, { error: `Endpunkt '${pathname}' nicht gefunden.` });
  } catch (err) {
    console.error('[API Unhandled Error]', err);
    return sendJson(res, 500, { error: `Interner Server-Fehler: ${err.message}` });
  }
};
