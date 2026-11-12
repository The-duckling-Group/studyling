// ============================================================================
// Studyling Learning Platform - Main Application Logic (public/app.js)
// Full PWA with Authentication, Role-Based Admin Panel & Stitch UI Fidelity
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const client = window.studylingClient;

  // --------------------------------------------------------------------------
  // 1. Audio Feedback (Web Audio API Synthesizer - 100% offline)
  // --------------------------------------------------------------------------
  const playSound = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'timer_end') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 1.2);
      }
    } catch (e) {}
  };

  // --------------------------------------------------------------------------
  // 2. Navigation & Screen Management
  // --------------------------------------------------------------------------
  const screens = {
    pfad: document.getElementById('screen-pfad'),
    kurse: document.getElementById('screen-kurse'),
    fokus: document.getElementById('screen-fokus'),
    lernen: document.getElementById('screen-lernen')
  };

  const navTabs = document.querySelectorAll('.nav-tab');
  const topHeader = document.getElementById('main-header');

  const switchScreen = (screenName) => {
    if (!screens[screenName]) screenName = 'kurse';

    Object.keys(screens).forEach((name) => {
      const el = screens[name];
      if (name === screenName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    navTabs.forEach((tab) => {
      if (tab.dataset.screen === screenName) {
        tab.classList.add('active', 'text-on-surface');
        tab.classList.remove('text-on-surface-variant');
      } else {
        tab.classList.remove('active', 'text-on-surface');
        tab.classList.add('text-on-surface-variant');
      }
    });

    if (screenName === 'lernen') {
      topHeader.classList.add('opacity-90');
    } else {
      topHeader.classList.remove('opacity-90');
    }

    window.location.hash = screenName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchScreen(tab.dataset.screen);
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (hash && screens[hash]) {
    switchScreen(hash);
  } else {
    switchScreen('kurse');
  }

  // --------------------------------------------------------------------------
  // 3. User Header & Profile Updates
  // --------------------------------------------------------------------------
  const streakCounterEl = document.getElementById('user-streak-counter');
  const userXpCounterEl = document.getElementById('user-xp-counter');
  const btnOpenAdmin = document.getElementById('btn-open-admin');

  const updateHeaderUI = () => {
    const user = client.getUser();
    if (!user) return;

    if (streakCounterEl) streakCounterEl.textContent = user.streak_count || user.streakCount || 12;
    if (userXpCounterEl) userXpCounterEl.textContent = `${user.total_xp || user.totalXp || 1420} EP`;

    // Show or hide the admin panel button
    if (client.isAdmin()) {
      btnOpenAdmin?.classList.remove('hidden');
    } else {
      btnOpenAdmin?.classList.add('hidden');
    }

    // Update Profile View in Auth Modal
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRoleBadge = document.getElementById('profile-role-badge');
    const profileStreak = document.getElementById('profile-streak');
    const profileXp = document.getElementById('profile-xp');
    const profileAvatarChar = document.getElementById('profile-avatar-char');
    const btnProfileGoAdmin = document.getElementById('btn-profile-go-admin');

    if (profileName) profileName.textContent = user.display_name || user.displayName || 'Alex M.';
    if (profileEmail) profileEmail.textContent = user.email || 'alex@studyling.app';
    if (profileRoleBadge) {
      profileRoleBadge.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
      profileRoleBadge.className = user.role === 'admin' 
        ? 'mt-1 w-max px-2 py-0.5 rounded-full text-[10px] font-code font-bold uppercase tracking-wider bg-primary text-secondary-container'
        : 'mt-1 w-max px-2 py-0.5 rounded-full text-[10px] font-code font-bold uppercase tracking-wider bg-surface-container-high text-on-surface';
    }
    if (profileStreak) profileStreak.textContent = `${user.streak_count || user.streakCount || 12} Tage`;
    if (profileXp) profileXp.textContent = `${user.total_xp || user.totalXp || 1420} EP`;
    if (profileAvatarChar) profileAvatarChar.textContent = (user.display_name || 'A')[0].toUpperCase();

    if (user.role === 'admin') {
      btnProfileGoAdmin?.classList.remove('hidden');
    } else {
      btnProfileGoAdmin?.classList.add('hidden');
    }

    checkDbDiagnostics();
  };

  const checkDbDiagnostics = async () => {
    try {
      const res = await fetch('/api/diagnostics');
      if (res.ok) {
        const diag = await res.json();
        const dot = document.getElementById('db-status-dot');
        const label = document.getElementById('db-status-label');
        const sub = document.getElementById('db-status-sub');
        if (diag.database?.neonConnected) {
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
          if (label) label.textContent = 'Neon PostgreSQL';
          if (sub) sub.textContent = 'Live Cloud ✓';
        } else if (diag.database?.configured) {
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-rose-500';
          if (label) label.textContent = 'Neon DB';
          if (sub) sub.textContent = diag.database?.error ? 'Verbindungsfehler' : 'Nicht erreichbar';
        } else {
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-500';
          if (label) label.textContent = 'Lokaler Modus';
          if (sub) sub.textContent = 'In-Memory Fallback';
        }
      }
    } catch (e) {}
  };

  client.subscribe(updateHeaderUI);
  updateHeaderUI();

  // --------------------------------------------------------------------------
  // 4. SCREEN 2: Meine Kurse & Filter
  // --------------------------------------------------------------------------
  const coursesContainer = document.getElementById('active-courses-list');
  const courseFilterBtns = document.querySelectorAll('.course-filter-btn');
  let currentCourseFilter = 'all';

  const renderCourses = async () => {
    if (!coursesContainer) return;
    const courses = await client.getCourses(currentCourseFilter);
    coursesContainer.innerHTML = '';

    courses.forEach((c) => {
      const article = document.createElement('article');
      article.className = 'py-4 border-b border-surface-container-high last:border-b-0 transition-colors group cursor-pointer hover:bg-surface-container-low/50 px-2 rounded-lg';
      
      const progress = c.progress_pct !== undefined ? c.progress_pct : (c.progress || 0);
      const isCardsDue = c.cards_due_count > 0 || c.badge_type === 'cards';
      const streakText = isCardsDue ? `${c.cards_due_count || 8} Karten fällig` : (c.streak_text || `${c.semester || 'Q2 • 2025'}`);

      let badgeHtml = '';
      if (isCardsDue) {
        badgeHtml = `
          <div class="flex items-center gap-1 text-[11px] font-label-sm text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[14px]">style</span>
            <span>${streakText}</span>
          </div>`;
      } else if (progress > 50) {
        badgeHtml = `
          <div class="flex items-center gap-1 text-[11px] font-label-sm text-secondary font-medium">
            <span class="material-symbols-outlined text-[14px]">local_fire_department</span>
            <span>12 Tage Streak</span>
          </div>`;
      } else {
        badgeHtml = `
          <div class="flex items-center gap-1 text-[11px] font-label-sm text-on-surface-variant">
            <span>${c.semester || 'Sem. 1 / 2025'}</span>
          </div>`;
      }

      article.innerHTML = `
        <div class="flex items-start justify-between gap-space-sm mb-1.5">
          <div>
            <span class="font-code text-label-sm text-on-surface-variant block mb-0.5">${c.code}</span>
            <h2 class="font-headline-sm text-[17px] font-bold text-on-surface group-hover:text-primary transition-colors">
              ${c.title}
            </h2>
          </div>
          <div class="flex items-center gap-1 text-on-surface font-title-md pt-1">
            <span class="font-code text-body-sm font-semibold">${progress > 0 ? 'Fortsetzen' : 'Öffnen'}</span>
            <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
          </div>
        </div>
        <p class="font-body-sm text-[13px] text-on-surface-variant mb-3">${c.subtitle || ''}</p>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-[11px] text-on-surface-variant">${c.current_level_label || 'Stufe 2'} · ${c.current_module_label || 'Modul 1.1'}</span>
            <span class="text-outline-variant">•</span>
            ${badgeHtml}
          </div>
          <span class="font-code text-body-sm font-semibold text-on-surface">${progress}%</span>
        </div>
        <div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-2">
          <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: ${progress}%"></div>
        </div>
      `;

      article.addEventListener('click', () => {
        switchScreen('pfad');
      });

      coursesContainer.appendChild(article);
    });
  };

  courseFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      courseFilterBtns.forEach((b) => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('text-on-surface-variant', 'bg-surface-container-low');
        const dot = b.querySelector('.bg-secondary-container');
        if (dot) dot.remove();
      });
      btn.classList.remove('text-on-surface-variant', 'bg-surface-container-low');
      btn.classList.add('bg-primary', 'text-on-primary');

      const span = document.createElement('span');
      span.className = 'w-1.5 h-1.5 rounded-full bg-secondary-container';
      btn.insertBefore(span, btn.firstChild);

      currentCourseFilter = btn.dataset.filter || 'all';
      renderCourses();
    });
  });
  renderCourses();

  // --------------------------------------------------------------------------
  // 5. SCREEN 3: Lernpfad: Mathematik (Ultra-Minimal)
  // --------------------------------------------------------------------------
  const pathNodesContainer = document.getElementById('learning-path-nodes');
  const pathProgressBar = document.getElementById('path-progress-bar');
  const pathProgressPct = document.getElementById('path-progress-pct');
  const pathSectionTag = document.getElementById('path-section-tag');
  const pathSectionTitle = document.getElementById('path-section-title');
  const pathSectionDesc = document.getElementById('path-section-desc');

  const renderLearningPath = async () => {
    if (!pathNodesContainer) return;
    const pathData = await client.getLearningPath();
    if (!pathData) return;

    const section = pathData.section || pathData;
    const nodes = pathData.nodes || [];
    const progress = section.progress_pct !== undefined ? section.progress_pct : (section.progress || 25);

    if (pathProgressBar) pathProgressBar.style.width = `${progress}%`;
    if (pathProgressPct) pathProgressPct.textContent = `${progress}%`;
    if (pathSectionTag) pathSectionTag.textContent = section.section_tag || 'Mathematik / Abschnitt 01';
    if (pathSectionTitle) pathSectionTitle.textContent = section.title || 'Vektoren & Matrizen';
    if (pathSectionDesc) pathSectionDesc.textContent = section.description || '';

    pathNodesContainer.innerHTML = '';

    nodes.forEach((node) => {
      const card = document.createElement('article');
      card.className = 'p-4 rounded-xl border transition-all duration-200';
      const status = node.user_status || node.status || 'locked';

      if (status === 'completed') {
        card.classList.add('bg-surface-container-low/60', 'border-transparent');
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-[14px] material-symbols-fill">check</span>
              </span>
              <span class="font-code text-code text-[12px] text-on-surface-variant font-medium">${node.node_number || node.nodeNumber}</span>
              <span class="text-xs text-on-surface-variant font-label-sm">• 100% gemeistert</span>
            </div>
            <span class="font-code text-label-sm text-on-surface-variant">+${node.xp_reward || 20} EP</span>
          </div>
          <h3 class="font-title-md text-[16px] text-on-surface font-semibold ml-7">${node.title}</h3>
          <p class="font-body-sm text-[13px] text-on-surface-variant mt-1 ml-7">${node.description}</p>
        `;
      } else if (status === 'current') {
        card.classList.add('bg-surface-container-lowest', 'border-secondary-container/80', 'shadow-sm');
        card.innerHTML = `
          <div class="flex items-start justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed font-code text-[11px] font-bold">
                ${node.node_number || node.nodeNumber}
              </span>
              <span class="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold">
                Aktuelle Lerneinheit
              </span>
            </div>
            <span class="font-code text-label-sm text-secondary font-bold">+${node.xp_reward || 25} EP</span>
          </div>
          <h3 class="font-title-md text-[17px] text-on-surface font-bold mt-1">${node.title}</h3>
          <p class="font-body-sm text-[13px] text-on-surface-variant mt-1 mb-3">${node.description}</p>
          <div class="flex items-center justify-end">
            <button class="btn-start-unit px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-sm" type="button">
              <span>Starten</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        `;

        card.querySelector('.btn-start-unit')?.addEventListener('click', () => {
          switchScreen('lernen');
        });
      } else {
        card.classList.add('bg-surface-container-low/40', 'border-transparent', 'opacity-60');
        const icon = (node.node_type || node.type) === 'milestone' ? 'workspace_premium' : 'lock';
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-[16px] text-on-surface-variant">${icon}</span>
              <span class="font-code text-code text-[12px] text-on-surface-variant font-medium">${node.node_number || node.nodeNumber}</span>
              <span class="text-xs text-on-surface-variant font-label-sm">• Gesperrt</span>
            </div>
            <span class="font-code text-label-sm text-on-surface-variant">+${node.xp_reward || 20} EP</span>
          </div>
          <h3 class="font-title-md text-[15px] text-on-surface-variant font-medium ml-6">${node.title}</h3>
          <p class="font-body-sm text-[12px] text-on-surface-variant/80 mt-1 ml-6">${node.description}</p>
        `;
      }

      pathNodesContainer.appendChild(card);
    });
  };
  renderLearningPath();

  // --------------------------------------------------------------------------
  // 6. SCREEN 1: Lerneinheit (Ultra-Minimal Active Recall Quiz)
  // --------------------------------------------------------------------------
  let currentQuestionIndex = 0;
  let questionsList = [];

  const quizTopicTag = document.getElementById('quiz-topic-tag');
  const quizCounter = document.getElementById('quiz-counter');
  const quizProgress = document.getElementById('quiz-progress-bar');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsList = document.getElementById('quiz-options-list');
  const quizFeedbackSection = document.getElementById('quiz-feedback-section');
  const quizFeedbackTitle = document.getElementById('quiz-feedback-title');
  const quizFeedbackExplanation = document.getElementById('quiz-feedback-explanation');
  const quizFeedbackXp = document.getElementById('quiz-feedback-xp');
  const btnQuizNext = document.getElementById('btn-quiz-next');
  const btnQuizClose = document.getElementById('btn-quiz-close');

  const renderQuizQuestion = async () => {
    if (questionsList.length === 0) {
      questionsList = await client.getQuizQuestions();
    }
    if (questionsList.length === 0) return;

    const q = questionsList[currentQuestionIndex % questionsList.length];

    if (quizTopicTag) quizTopicTag.textContent = q.topic_tag || q.topicTag || 'Neurobiologie';
    const qNum = currentQuestionIndex + 1;
    const totalQ = questionsList.length;
    if (quizCounter) quizCounter.innerHTML = `${String(qNum).padStart(2, '0')}<span class="text-outline-variant">/</span>${totalQ}`;
    if (quizProgress) quizProgress.style.width = `${(qNum / totalQ) * 100}%`;
    if (quizQuestionText) quizQuestionText.innerHTML = q.question_html || q.questionHtml || q.question_text || '';

    if (quizFeedbackSection) quizFeedbackSection.classList.add('hidden');
    if (quizOptionsList) {
      quizOptionsList.innerHTML = '';
      const opts = q.options || [];
      opts.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.className = 'option-btn text-left w-full p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-150 flex items-start gap-space-md group';
        
        btn.innerHTML = `
          <span class="status-indicator w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5 transition-colors">
            <span class="font-code text-[11px] text-on-surface-variant group-hover:text-on-surface">${opt.letter}</span>
          </span>
          <span class="font-body-md text-body-md text-on-surface font-normal flex-1">
            ${opt.text}
          </span>
        `;

        btn.addEventListener('click', async () => {
          quizOptionsList.querySelectorAll('.option-btn').forEach((b) => {
            b.setAttribute('aria-checked', 'false');
            b.classList.remove('shadow-sm');
            const ind = b.querySelector('.status-indicator');
            if (ind) {
              const letter = b.querySelector('.font-code')?.textContent || '';
              ind.className = 'status-indicator w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5 transition-colors';
              ind.innerHTML = `<span class="font-code text-[11px] text-on-surface-variant">${letter}</span>`;
            }
          });

          btn.setAttribute('aria-checked', 'true');
          btn.classList.add('shadow-sm');
          const ind = btn.querySelector('.status-indicator');
          if (ind) {
            ind.className = 'status-indicator w-5 h-5 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center shrink-0 mt-0.5 transition-colors';
            ind.innerHTML = '<span class="material-symbols-outlined text-[14px] material-symbols-fill">check</span>';
          }

          const result = await client.submitQuizAnswer(q.id, opt.id);
          if (result) {
            if (result.is_correct || result.isCorrect) {
              playSound('success');
              if (quizFeedbackTitle) quizFeedbackTitle.textContent = 'Richtig verstanden';
              if (quizFeedbackXp) quizFeedbackXp.textContent = `+${result.xp_earned || result.xpEarned || 20} EP`;
            } else {
              if (quizFeedbackTitle) quizFeedbackTitle.textContent = 'Fast richtig';
              if (quizFeedbackXp) quizFeedbackXp.textContent = '+0 EP';
            }
            if (quizFeedbackExplanation) quizFeedbackExplanation.textContent = result.explanation || q.explanation || '';
            if (quizFeedbackSection) quizFeedbackSection.classList.remove('hidden');
          }
        });

        quizOptionsList.appendChild(btn);
      });
    }
  };

  btnQuizNext?.addEventListener('click', () => {
    currentQuestionIndex++;
    renderQuizQuestion();
  });

  btnQuizClose?.addEventListener('click', () => {
    switchScreen('kurse');
  });

  renderQuizQuestion();

  // --------------------------------------------------------------------------
  // 7. SCREEN 5: Study Timer
  // --------------------------------------------------------------------------
  let timerDurationSeconds = 25 * 60;
  let timerRemainingSeconds = timerDurationSeconds;
  let timerInterval = null;
  let isTimerRunning = false;
  let currentTimerMode = 'pomodoro_25';

  const circumference = 2 * Math.PI * 112;
  const timerDisplay = document.getElementById('timer-display');
  const timerProgress = document.getElementById('timer-progress');
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const btnReset = document.getElementById('btn-reset');
  const btnSkip = document.getElementById('btn-skip');
  const dndToggle = document.getElementById('dnd-toggle');
  const dndHandle = document.getElementById('dnd-handle');
  const modePills = document.querySelectorAll('.mode-pill');

  const updateTimerDisplay = () => {
    if (!timerDisplay || !timerProgress) return;
    const mins = Math.floor(timerRemainingSeconds / 60);
    const secs = timerRemainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const fraction = (timerDurationSeconds - timerRemainingSeconds) / timerDurationSeconds;
    const offset = circumference * (1 - fraction);
    timerProgress.style.strokeDashoffset = offset;
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      if (playIcon) playIcon.textContent = 'play_arrow';
      if (playText) playText.textContent = 'Fortsetzen';
    } else {
      isTimerRunning = true;
      if (playIcon) playIcon.textContent = 'pause';
      if (playText) playText.textContent = 'Pausieren';

      timerInterval = setInterval(async () => {
        if (timerRemainingSeconds > 0) {
          timerRemainingSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          isTimerRunning = false;
          playSound('timer_end');
          if (playIcon) playIcon.textContent = 'play_arrow';
          if (playText) playText.textContent = 'Neuer Zyklus';

          const dndActive = dndToggle?.getAttribute('aria-checked') === 'true';
          await client.logStudySession(currentTimerMode, timerDurationSeconds, true, dndActive);
          alert('🎉 Fokus-Session erfolgreich abgeschlossen! EP gutgeschrieben.');
        }
      }, 1000);
    }
  };

  const resetTimer = () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerRemainingSeconds = timerDurationSeconds;
    if (playIcon) playIcon.textContent = 'play_arrow';
    if (playText) playText.textContent = 'Fokus starten';
    updateTimerDisplay();
  };

  btnPlay?.addEventListener('click', toggleTimer);
  btnReset?.addEventListener('click', resetTimer);
  btnSkip?.addEventListener('click', resetTimer);

  const setTimerMode = (mins, modeKey, clickedBtn) => {
    modePills.forEach((p) => {
      p.classList.remove('bg-primary', 'text-on-primary');
      p.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      const dot = p.querySelector('.bg-secondary-container');
      if (dot) dot.remove();
    });

    if (clickedBtn) {
      clickedBtn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      clickedBtn.classList.add('bg-primary', 'text-on-primary');
      const span = document.createElement('span');
      span.className = 'w-1.5 h-1.5 rounded-full bg-secondary-container';
      clickedBtn.insertBefore(span, clickedBtn.firstChild);
    }

    currentTimerMode = modeKey;
    timerDurationSeconds = mins * 60;
    resetTimer();
  };

  document.getElementById('mode-25')?.addEventListener('click', function() {
    setTimerMode(25, 'pomodoro_25', this);
  });
  document.getElementById('mode-50')?.addEventListener('click', function() {
    setTimerMode(50, 'deep_50', this);
  });
  document.getElementById('mode-5')?.addEventListener('click', function() {
    setTimerMode(5, 'pause_5', this);
  });

  let dndActive = true;
  dndToggle?.addEventListener('click', () => {
    dndActive = !dndActive;
    dndToggle.setAttribute('aria-checked', String(dndActive));
    if (dndActive) {
      dndToggle.classList.remove('bg-surface-container-highest');
      dndToggle.classList.add('bg-primary');
      dndHandle.classList.remove('translate-x-0');
      dndHandle.classList.add('translate-x-5');
    } else {
      dndToggle.classList.remove('bg-primary');
      dndToggle.classList.add('bg-surface-container-highest');
      dndHandle.classList.remove('translate-x-5');
      dndHandle.classList.add('translate-x-0');
    }
  });

  updateTimerDisplay();

  // --------------------------------------------------------------------------
  // 8. Auth Modal (Login / Register / Profile)
  // --------------------------------------------------------------------------
  const modalAuth = document.getElementById('modal-auth');
  const btnProfileTrigger = document.getElementById('btn-profile-trigger');
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  const authModalTitle = document.getElementById('auth-modal-title');

  const authViewProfile = document.getElementById('auth-view-profile');
  const authViewLogin = document.getElementById('auth-view-login');
  const authViewRegister = document.getElementById('auth-view-register');

  const btnShowLoginView = document.getElementById('btn-show-login-view');
  const btnSwitchToRegister = document.getElementById('btn-switch-to-register');
  const btnSwitchToLogin = document.getElementById('btn-switch-to-login');
  const btnAuthLogout = document.getElementById('btn-auth-logout');

  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const btnDoLogin = document.getElementById('btn-do-login');

  const regNameInput = document.getElementById('reg-name');
  const regEmailInput = document.getElementById('reg-email');
  const regPasswordInput = document.getElementById('reg-password');
  const regError = document.getElementById('reg-error');
  const btnDoRegister = document.getElementById('btn-do-register');

  const showAuthView = (viewName) => {
    authViewProfile?.classList.add('hidden');
    authViewLogin?.classList.add('hidden');
    authViewRegister?.classList.add('hidden');

    if (viewName === 'profile') {
      authModalTitle.textContent = 'Mein Konto';
      authViewProfile?.classList.remove('hidden');
    } else if (viewName === 'login') {
      authModalTitle.textContent = 'Anmelden';
      authViewLogin?.classList.remove('hidden');
      if (loginError) loginError.textContent = '';
    } else if (viewName === 'register') {
      authModalTitle.textContent = 'Konto erstellen';
      authViewRegister?.classList.remove('hidden');
      if (regError) regError.textContent = '';
    }
  };

  btnProfileTrigger?.addEventListener('click', () => {
    modalAuth?.classList.remove('hidden');
    showAuthView('profile');
  });

  btnCloseAuthModal?.addEventListener('click', () => {
    modalAuth?.classList.add('hidden');
  });

  modalAuth?.addEventListener('click', (e) => {
    if (e.target === modalAuth) modalAuth.classList.add('hidden');
  });

  btnShowLoginView?.addEventListener('click', () => showAuthView('login'));
  btnSwitchToRegister?.addEventListener('click', () => showAuthView('register'));
  btnSwitchToLogin?.addEventListener('click', () => showAuthView('login'));

  // Quick 1-Click Login buttons for evaluation & testing
  document.getElementById('btn-quick-admin-login')?.addEventListener('click', () => {
    if (loginEmailInput) loginEmailInput.value = 'admin@studyling.app';
    if (loginPasswordInput) loginPasswordInput.value = 'AdminPassword123!';
  });

  document.getElementById('btn-quick-student-login')?.addEventListener('click', () => {
    if (loginEmailInput) loginEmailInput.value = 'alex@studyling.app';
    if (loginPasswordInput) loginPasswordInput.value = 'Studyling2025!';
  });

  btnDoLogin?.addEventListener('click', async () => {
    const email = loginEmailInput?.value || '';
    const password = loginPasswordInput?.value || '';
    if (!email || !password) {
      if (loginError) loginError.textContent = 'Bitte E-Mail und Passwort eingeben.';
      return;
    }

    try {
      if (loginError) loginError.textContent = 'Anmeldung läuft...';
      await client.login(email, password);
      showAuthView('profile');
      renderCourses();
      renderLearningPath();
      alert('✓ Erfolgreich angemeldet!');
    } catch (err) {
      if (loginError) loginError.textContent = err.message;
    }
  });

  btnDoRegister?.addEventListener('click', async () => {
    const name = regNameInput?.value || '';
    const email = regEmailInput?.value || '';
    const password = regPasswordInput?.value || '';
    if (!name || !email || !password) {
      if (regError) regError.textContent = 'Bitte alle Felder ausfüllen.';
      return;
    }

    try {
      if (regError) regError.textContent = 'Registrierung läuft...';
      await client.register(name, email, password);
      showAuthView('profile');
      renderCourses();
      renderLearningPath();
      alert('✓ Konto erfolgreich erstellt!');
    } catch (err) {
      if (regError) regError.textContent = err.message;
    }
  });

  btnAuthLogout?.addEventListener('click', () => {
    client.logout();
    showAuthView('login');
    renderCourses();
    renderLearningPath();
  });

  // --------------------------------------------------------------------------
  // 9. ADMIN PANEL CONTROLLER
  // --------------------------------------------------------------------------
  const modalAdmin = document.getElementById('modal-admin');
  const btnCloseAdminModal = document.getElementById('btn-close-admin-modal');
  const btnProfileGoAdmin = document.getElementById('btn-profile-go-admin');
  const adminTabs = document.querySelectorAll('.admin-tab');

  const openAdminPanel = () => {
    if (!client.isAdmin()) {
      alert('Zugriff nur für Administratoren.');
      return;
    }
    modalAuth?.classList.add('hidden');
    modalAdmin?.classList.remove('hidden');
    loadAdminOverview();
  };

  btnOpenAdmin?.addEventListener('click', openAdminPanel);
  btnProfileGoAdmin?.addEventListener('click', openAdminPanel);

  btnCloseAdminModal?.addEventListener('click', () => {
    modalAdmin?.classList.add('hidden');
  });

  modalAdmin?.addEventListener('click', (e) => {
    if (e.target === modalAdmin) modalAdmin.classList.add('hidden');
  });

  // Admin Tab Switching
  adminTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      adminTabs.forEach((t) => {
        t.classList.remove('active', 'border-b-2', 'border-primary', 'text-on-surface');
        t.classList.add('text-on-surface-variant');
      });
      tab.classList.add('active', 'border-b-2', 'border-primary', 'text-on-surface');
      tab.classList.remove('text-on-surface-variant');

      const target = tab.dataset.tab;
      document.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.add('hidden'));
      document.getElementById(`admin-tab-${target}`)?.classList.remove('hidden');

      if (target === 'overview') loadAdminOverview();
      if (target === 'courses') loadAdminCourses();
      if (target === 'paths') loadAdminPaths();
      if (target === 'questions') loadAdminQuestions();
      if (target === 'users') loadAdminUsers();
    });
  });

  // Load Overview Stats
  const loadAdminOverview = async () => {
    try {
      const stats = await client.getAdminOverview();
      document.getElementById('admin-stat-users').textContent = stats.total_users || 0;
      document.getElementById('admin-stat-courses').textContent = stats.total_courses || 0;
      document.getElementById('admin-stat-nodes').textContent = stats.total_nodes || 0;
      document.getElementById('admin-stat-questions').textContent = stats.total_questions || 0;
    } catch (err) {
      console.warn('[Admin] Overview error:', err.message);
    }
  };

  // Tab 2: Admin Courses
  const loadAdminCourses = async () => {
    const container = document.getElementById('admin-course-list');
    if (!container) return;
    const courses = await client.getCourses('all');
    container.innerHTML = '';

    courses.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-center justify-between';
      row.innerHTML = `
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-code font-bold text-primary">${c.code}</span>
            <span class="font-bold text-on-surface">${c.title}</span>
          </div>
          <span class="text-[11px] text-on-surface-variant">${c.subtitle || ''} · ${c.category} · ${c.semester}</span>
        </div>
        <button class="btn-delete-course p-1.5 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors" title="Fach löschen">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      `;

      row.querySelector('.btn-delete-course')?.addEventListener('click', async () => {
        if (confirm(`Fach "${c.title}" wirklich löschen?`)) {
          await client.deleteCourse(c.id);
          loadAdminCourses();
          renderCourses();
        }
      });

      container.appendChild(row);
    });
  };

  const formCreateCourse = document.getElementById('form-create-course');
  const btnShowCreateCourse = document.getElementById('btn-admin-show-create-course');
  const btnCancelCreateCourse = document.getElementById('btn-cancel-create-course');

  btnShowCreateCourse?.addEventListener('click', () => formCreateCourse?.classList.remove('hidden'));
  btnCancelCreateCourse?.addEventListener('click', () => formCreateCourse?.classList.add('hidden'));

  formCreateCourse?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('new-course-code')?.value;
    const title = document.getElementById('new-course-title')?.value;
    const subtitle = document.getElementById('new-course-sub')?.value;
    const category = document.getElementById('new-course-cat')?.value;
    const semester = document.getElementById('new-course-sem')?.value;

    try {
      await client.createCourse({ code, title, subtitle, category, semester });
      formCreateCourse.reset();
      formCreateCourse.classList.add('hidden');
      loadAdminCourses();
      renderCourses();
      alert('✓ Neues Fach erfolgreich angelegt!');
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  });

  // Tab 3: Admin Learning Path Nodes
  const loadAdminPaths = async () => {
    const container = document.getElementById('admin-nodes-list');
    if (!container) return;
    const pathData = await client.getLearningPath();
    const nodes = pathData?.nodes || [];
    container.innerHTML = '';

    nodes.forEach((n) => {
      const row = document.createElement('div');
      row.className = 'p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-center justify-between';
      row.innerHTML = `
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center font-code font-bold text-[11px] text-primary">
              ${n.node_number || n.nodeNumber}
            </span>
            <span class="font-bold text-on-surface">${n.title}</span>
            <span class="text-[10px] uppercase font-code px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant">${n.node_type || n.type}</span>
          </div>
          <span class="text-[11px] text-on-surface-variant mt-0.5">${n.description || ''} (+${n.xp_reward || 20} EP)</span>
        </div>
        <button class="btn-delete-node p-1.5 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors" title="Lektion löschen">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      `;

      row.querySelector('.btn-delete-node')?.addEventListener('click', async () => {
        if (confirm(`Lektion "${n.title}" wirklich löschen?`)) {
          await client.deleteLearningNode(n.id);
          loadAdminPaths();
          renderLearningPath();
        }
      });

      container.appendChild(row);
    });
  };

  const formCreateNode = document.getElementById('form-create-node');
  const btnShowCreateNode = document.getElementById('btn-admin-show-create-node');
  const btnCancelCreateNode = document.getElementById('btn-cancel-create-node');

  btnShowCreateNode?.addEventListener('click', () => formCreateNode?.classList.remove('hidden'));
  btnCancelCreateNode?.addEventListener('click', () => formCreateNode?.classList.add('hidden'));

  formCreateNode?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nodeNumber = document.getElementById('new-node-num')?.value;
    const title = document.getElementById('new-node-title')?.value;
    const description = document.getElementById('new-node-desc')?.value;
    const xpReward = parseInt(document.getElementById('new-node-xp')?.value || '25');
    const nodeType = document.getElementById('new-node-type')?.value;

    try {
      await client.createLearningNode({ nodeNumber, title, description, xpReward, nodeType });
      formCreateNode.reset();
      formCreateNode.classList.add('hidden');
      loadAdminPaths();
      renderLearningPath();
      alert('✓ Neue Lektion erfolgreich zum Lernpfad hinzugefügt!');
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  });

  // Tab 4: Admin Quiz Questions
  const loadAdminQuestions = async () => {
    const container = document.getElementById('admin-questions-list');
    if (!container) return;
    questionsList = await client.getQuizQuestions();
    container.innerHTML = '';

    questionsList.forEach((q) => {
      const row = document.createElement('div');
      row.className = 'p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-start justify-between gap-2';
      row.innerHTML = `
        <div class="flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-low text-secondary font-code">
              ${q.topic_tag || q.topicTag}
            </span>
            <span class="text-[10px] text-on-surface-variant">+${q.xp_reward || 20} EP</span>
          </div>
          <span class="font-bold text-on-surface leading-snug">${q.question_text || q.questionHtml}</span>
          <span class="text-[11px] text-on-surface-variant mt-1">${(q.options || []).length} Antwortoptionen hinterlegt</span>
        </div>
        <button class="btn-delete-q p-1.5 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors" title="Aufgabe löschen">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      `;

      row.querySelector('.btn-delete-q')?.addEventListener('click', async () => {
        if (confirm('Diese Aufgabe wirklich löschen?')) {
          await client.deleteQuizQuestion(q.id);
          loadAdminQuestions();
          renderQuizQuestion();
        }
      });

      container.appendChild(row);
    });
  };

  const formCreateQ = document.getElementById('form-create-question');
  const btnShowCreateQ = document.getElementById('btn-admin-show-create-q');
  const btnCancelCreateQ = document.getElementById('btn-cancel-create-q');

  btnShowCreateQ?.addEventListener('click', () => formCreateQ?.classList.remove('hidden'));
  btnCancelCreateQ?.addEventListener('click', () => formCreateQ?.classList.add('hidden'));

  formCreateQ?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const topicTag = document.getElementById('new-q-topic')?.value;
    const questionText = document.getElementById('new-q-text')?.value;
    const highlightPhrase = document.getElementById('new-q-highlight')?.value;
    const xpReward = parseInt(document.getElementById('new-q-xp')?.value || '20');
    const explanation = document.getElementById('new-q-explanation')?.value;

    const optA = document.getElementById('new-opt-a')?.value;
    const optB = document.getElementById('new-opt-b')?.value;
    const optC = document.getElementById('new-opt-c')?.value;

    const correctRadio = document.querySelector('input[name="correct_opt"]:checked')?.value || 'A';

    const options = [
      { letter: 'A', text: optA, is_correct: correctRadio === 'A' },
      { letter: 'B', text: optB, is_correct: correctRadio === 'B' },
      { letter: 'C', text: optC, is_correct: correctRadio === 'C' }
    ];

    try {
      await client.createQuizQuestion({ topicTag, questionText, highlightPhrase, xpReward, explanation, options });
      formCreateQ.reset();
      formCreateQ.classList.add('hidden');
      loadAdminQuestions();
      renderQuizQuestion();
      alert('✓ Neue Quiz-Aufgabe erfolgreich angelegt!');
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  });

  // Tab 5: Admin Users List
  const loadAdminUsers = async () => {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    const users = await client.getAdminUsers();
    container.innerHTML = '';

    users.forEach((u) => {
      const row = document.createElement('div');
      row.className = 'p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-center justify-between';
      const isAdmin = u.role === 'admin';
      row.innerHTML = `
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-primary text-secondary-container' : 'bg-surface-container-high text-on-surface'} flex items-center justify-center font-bold text-xs font-code">
            ${(u.display_name || u.username || 'U')[0].toUpperCase()}
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-on-surface">${u.display_name || u.username}</span>
              <span class="text-[9px] font-code font-bold uppercase px-1.5 py-0.5 rounded ${isAdmin ? 'bg-primary text-secondary-container' : 'bg-surface-container-low text-on-surface-variant'}">
                ${u.role}
              </span>
            </div>
            <span class="text-[11px] text-on-surface-variant">${u.email} · ${u.streak_count || 12} Tage · ${u.total_xp || 1420} EP</span>
          </div>
        </div>
        <button class="btn-toggle-role px-2.5 py-1 rounded text-[11px] font-semibold border ${isAdmin ? 'border-error text-error hover:bg-error-container' : 'border-primary text-primary hover:bg-surface-container-high'} transition-colors">
          ${isAdmin ? 'Admin entziehen' : 'Zum Admin machen'}
        </button>
      `;

      row.querySelector('.btn-toggle-role')?.addEventListener('click', async () => {
        const nextRole = isAdmin ? 'student' : 'admin';
        if (confirm(`Rolle für ${u.display_name} auf '${nextRole}' ändern?`)) {
          await client.setAdminUserRole(u.id, nextRole);
          loadAdminUsers();
        }
      });

      container.appendChild(row);
    });
  };

  // --------------------------------------------------------------------------
  // 10. PWA Service Worker & Install Prompt
  // --------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[PWA] Service Worker aktiv:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker Fehler:', err));
    });
  }

  let deferredPrompt;
  const pwaInstallBanner = document.getElementById('pwa-install-banner');
  const btnInstallPwa = document.getElementById('btn-install-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    pwaInstallBanner?.classList.remove('hidden');
  });

  btnInstallPwa?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt = null;
      pwaInstallBanner?.classList.add('hidden');
    }
  });
});
