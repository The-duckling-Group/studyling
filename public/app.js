// ============================================================================
// Studyling Learning Platform - Main Application Logic (app.js)
// Realizing the 5 Google Stitch Screens with Seamless Navigation & Neon Tech Sync
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Audio Feedback (Web Audio API Synthesizer - works 100% offline)
  // --------------------------------------------------------------------------
  const playSound = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        // Double pleasant chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'timer_end') {
        // Gentle bell
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 1.2);
      }
    } catch (e) {
      // AudioContext restricted before gesture
    }
  };

  // --------------------------------------------------------------------------
  // Navigation & Screen Management
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

    // Update active screen
    Object.keys(screens).forEach((name) => {
      const el = screens[name];
      if (name === screenName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update bottom nav highlighting
    navTabs.forEach((tab) => {
      if (tab.dataset.screen === screenName) {
        tab.classList.add('active', 'text-on-surface');
        tab.classList.remove('text-on-surface-variant');
      } else {
        tab.classList.remove('active', 'text-on-surface');
        tab.classList.add('text-on-surface-variant');
      }
    });

    // Toggle header in quiz mode for ultra-minimalist focus
    if (screenName === 'lernen') {
      topHeader.classList.add('opacity-90');
    } else {
      topHeader.classList.remove('opacity-90');
    }

    // Update URL hash without reload
    window.location.hash = screenName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchScreen(tab.dataset.screen);
    });
  });

  // Handle URL hash on load
  const hash = window.location.hash.replace('#', '');
  if (hash && screens[hash]) {
    switchScreen(hash);
  } else {
    switchScreen('kurse');
  }

  // --------------------------------------------------------------------------
  // Reactive UI Updates from Neon Client
  // --------------------------------------------------------------------------
  const streakCounterEl = document.getElementById('user-streak-counter');
  const userXpCounterEl = document.getElementById('user-xp-counter');
  const neonStatusBadge = document.getElementById('neon-status-badge');

  const updateHeaderStats = () => {
    const user = window.neonClient.getUser();
    if (streakCounterEl) streakCounterEl.textContent = user.streakCount;
    if (userXpCounterEl) userXpCounterEl.textContent = `${user.totalXp} EP`;

    if (neonStatusBadge) {
      if (window.neonClient.isNeonConnected()) {
        neonStatusBadge.className = 'w-2 h-2 rounded-full bg-emerald-500';
        neonStatusBadge.title = 'Neon Tech verbunden';
      } else {
        neonStatusBadge.className = 'w-2 h-2 rounded-full bg-secondary-container';
        neonStatusBadge.title = 'Offline Demo Modus';
      }
    }
  };

  // Subscribe to changes
  window.neonClient.subscribe(() => {
    updateHeaderStats();
    renderCourses();
    renderLearningPath();
  });
  updateHeaderStats();

  // --------------------------------------------------------------------------
  // SCREEN 2 & 4: Kurse & Grundlagenfächer
  // --------------------------------------------------------------------------
  const coursesContainer = document.getElementById('active-courses-list');
  const courseFilterBtns = document.querySelectorAll('.course-filter-btn');
  let currentCourseFilter = 'all';

  const renderCourses = () => {
    if (!coursesContainer) return;
    const courses = window.neonClient.getCourses(currentCourseFilter);
    coursesContainer.innerHTML = '';

    courses.forEach((c) => {
      const article = document.createElement('article');
      article.className = 'py-4 border-b border-surface-container-high last:border-b-0 transition-colors group cursor-pointer hover:bg-surface-container-low/50 px-2 rounded-lg';
      
      let badgeHtml = '';
      if (c.streakText && c.badgeType === 'streak') {
        badgeHtml = `
          <div class="flex items-center gap-1 text-[11px] font-label-sm text-secondary font-medium">
            <span class="material-symbols-outlined text-[14px]">local_fire_department</span>
            <span>${c.streakText}</span>
          </div>`;
      } else if (c.streakText && c.badgeType === 'cards') {
        badgeHtml = `
          <div class="flex items-center gap-1 text-[11px] font-label-sm text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[14px]">style</span>
            <span>${c.streakText}</span>
          </div>`;
      } else {
        badgeHtml = `
          <div class="flex items-center gap-1 text-[11px] font-label-sm text-on-surface-variant">
            <span>${c.semester}</span>
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
            <span class="font-code text-body-sm font-semibold">${c.progress > 0 ? 'Fortsetzen' : 'Öffnen'}</span>
            <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
          </div>
        </div>
        <p class="font-body-sm text-[13px] text-on-surface-variant mb-3">${c.subtitle}</p>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-[11px] text-on-surface-variant">${c.currentLevel} · ${c.currentModule}</span>
            <span class="text-outline-variant">•</span>
            ${badgeHtml}
          </div>
          <span class="font-code text-body-sm font-semibold text-on-surface">${c.progress}%</span>
        </div>
        <!-- Progress Bar -->
        <div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-2">
          <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: ${c.progress}%"></div>
        </div>
      `;

      article.addEventListener('click', () => {
        // Direct jump to learning path or active unit
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
  // SCREEN 3: Lernpfad: Mathematik (Ultra-Minimal)
  // --------------------------------------------------------------------------
  const pathNodesContainer = document.getElementById('learning-path-nodes');
  const pathProgressBar = document.getElementById('path-progress-bar');
  const pathProgressPct = document.getElementById('path-progress-pct');

  const renderLearningPath = () => {
    if (!pathNodesContainer) return;
    const path = window.neonClient.getLearningPath();

    if (pathProgressBar) pathProgressBar.style.width = `${path.progress}%`;
    if (pathProgressPct) pathProgressPct.textContent = `${path.progress}%`;

    pathNodesContainer.innerHTML = '';

    path.nodes.forEach((node) => {
      const card = document.createElement('article');
      card.className = 'p-4 rounded-xl border transition-all duration-200';

      if (node.status === 'completed') {
        card.classList.add('bg-surface-container-low/60', 'border-transparent');
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-[14px] material-symbols-fill">check</span>
              </span>
              <span class="font-code text-code text-[12px] text-on-surface-variant font-medium">${node.nodeNumber}</span>
              <span class="text-xs text-on-surface-variant font-label-sm">• ${node.statusBadge}</span>
            </div>
            <span class="font-code text-label-sm text-on-surface-variant">+${node.xpReward} EP</span>
          </div>
          <h3 class="font-title-md text-[16px] text-on-surface font-semibold ml-7">${node.title}</h3>
          <p class="font-body-sm text-[13px] text-on-surface-variant mt-1 ml-7">${node.description}</p>
        `;
      } else if (node.status === 'current') {
        card.classList.add('bg-surface-container-lowest', 'border-secondary-container/80', 'shadow-sm');
        card.innerHTML = `
          <div class="flex items-start justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed font-code text-[11px] font-bold">
                ${node.nodeNumber}
              </span>
              <span class="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold">
                ${node.statusBadge}
              </span>
            </div>
            <span class="font-code text-label-sm text-secondary font-bold">+${node.xpReward} EP</span>
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
        // Locked
        card.classList.add('bg-surface-container-low/40', 'border-transparent', 'opacity-60');
        const icon = node.type === 'milestone' ? 'workspace_premium' : 'lock';
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-[16px] text-on-surface-variant">${icon}</span>
              <span class="font-code text-code text-[12px] text-on-surface-variant font-medium">${node.nodeNumber}</span>
              <span class="text-xs text-on-surface-variant font-label-sm">• ${node.statusBadge}</span>
            </div>
            <span class="font-code text-label-sm text-on-surface-variant">+${node.xpReward} EP</span>
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
  // SCREEN 1: Lerneinheit (Ultra-Minimal Active Recall Quiz)
  // --------------------------------------------------------------------------
  let currentQuestionIndex = 0;
  let selectedOptionId = null;

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

  const renderQuizQuestion = () => {
    const questions = window.neonClient.getQuizQuestions();
    const q = questions[currentQuestionIndex % questions.length];
    selectedOptionId = null;

    if (quizTopicTag) quizTopicTag.textContent = q.topicTag;
    if (quizCounter) quizCounter.innerHTML = `${String(q.questionNumber).padStart(2, '0')}<span class="text-outline-variant">/</span>${q.totalQuestions}`;
    if (quizProgress) quizProgress.style.width = `${(q.questionNumber / q.totalQuestions) * 100}%`;
    if (quizQuestionText) quizQuestionText.innerHTML = q.questionHtml;

    if (quizFeedbackSection) quizFeedbackSection.classList.add('hidden');
    if (quizOptionsList) {
      quizOptionsList.innerHTML = '';
      q.options.forEach((opt) => {
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
          // Deselect others
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

          // Select this button
          btn.setAttribute('aria-checked', 'true');
          btn.classList.add('shadow-sm');
          const ind = btn.querySelector('.status-indicator');
          if (ind) {
            ind.className = 'status-indicator w-5 h-5 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center shrink-0 mt-0.5 transition-colors';
            ind.innerHTML = '<span class="material-symbols-outlined text-[14px] material-symbols-fill">check</span>';
          }

          selectedOptionId = opt.id;

          // Submit & validate
          const result = await window.neonClient.submitQuizAnswer(q.id, opt.id);
          if (result) {
            if (result.isCorrect) {
              playSound('success');
              if (quizFeedbackTitle) quizFeedbackTitle.textContent = 'Richtig verstanden';
              if (quizFeedbackXp) quizFeedbackXp.textContent = `+${result.xpEarned} EP`;
            } else {
              if (quizFeedbackTitle) quizFeedbackTitle.textContent = 'Fast richtig';
              if (quizFeedbackXp) quizFeedbackXp.textContent = '+0 EP';
            }
            if (quizFeedbackExplanation) quizFeedbackExplanation.textContent = result.explanation;
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
  // SCREEN 5: Study Timer (Pomodoro 25, Deep Work 50, Pause 5)
  // --------------------------------------------------------------------------
  let timerDurationSeconds = 25 * 60;
  let timerRemainingSeconds = timerDurationSeconds;
  let timerInterval = null;
  let isTimerRunning = false;
  let currentTimerMode = 'pomodoro_25';

  const circumference = 2 * Math.PI * 112; // 703.71px for r=112
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

          // Log completed session to database
          const dndActive = dndToggle?.getAttribute('aria-checked') === 'true';
          await window.neonClient.logStudySession(currentTimerMode, timerDurationSeconds, true, dndActive);
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

  // Do Not Disturb Switch
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
  // Settings & Neon Tech Database Modal
  // --------------------------------------------------------------------------
  const btnProfile = document.getElementById('btn-profile-settings');
  const modalNeon = document.getElementById('modal-neon-settings');
  const btnCloseModal = document.getElementById('btn-close-neon-modal');
  const inputNeonConn = document.getElementById('input-neon-connection');
  const btnSaveNeon = document.getElementById('btn-save-neon');
  const btnTestNeon = document.getElementById('btn-test-neon');
  const neonTestResult = document.getElementById('neon-test-result');
  const btnResetData = document.getElementById('btn-reset-demo-data');

  btnProfile?.addEventListener('click', () => {
    if (inputNeonConn) {
      inputNeonConn.value = window.neonClient.getNeonConnectionString();
    }
    if (neonTestResult) neonTestResult.textContent = '';
    modalNeon?.classList.remove('hidden');
  });

  btnCloseModal?.addEventListener('click', () => {
    modalNeon?.classList.add('hidden');
  });

  modalNeon?.addEventListener('click', (e) => {
    if (e.target === modalNeon) {
      modalNeon.classList.add('hidden');
    }
  });

  btnSaveNeon?.addEventListener('click', () => {
    const val = inputNeonConn?.value || '';
    window.neonClient.setNeonConnectionString(val);
    updateHeaderStats();
    if (neonTestResult) {
      neonTestResult.className = 'text-xs text-emerald-600 mt-2 font-code';
      neonTestResult.textContent = val ? '✓ Neon Konfiguration gespeichert.' : 'Offline Demo-Modus aktiviert.';
    }
    setTimeout(() => {
      modalNeon?.classList.add('hidden');
    }, 900);
  });

  btnTestNeon?.addEventListener('click', async () => {
    const val = inputNeonConn?.value || '';
    if (!val) {
      if (neonTestResult) {
        neonTestResult.className = 'text-xs text-amber-600 mt-2 font-code';
        neonTestResult.textContent = 'Bitte zuerst einen Neon Connection String eingeben.';
      }
      return;
    }
    if (neonTestResult) {
      neonTestResult.className = 'text-xs text-on-surface-variant mt-2 font-code';
      neonTestResult.textContent = 'Teste Verbindung zu Neon Tech...';
    }

    const res = await window.neonClient.testConnection(val);
    if (res.success) {
      if (neonTestResult) {
        neonTestResult.className = 'text-xs text-emerald-600 mt-2 font-code';
        neonTestResult.textContent = '✓ Verbindung erfolgreich hergestellt! Postgres bereit.';
      }
    } else {
      if (neonTestResult) {
        neonTestResult.className = 'text-xs text-rose-600 mt-2 font-code';
        neonTestResult.textContent = `✗ Fehler: ${res.error}`;
      }
    }
  });

  btnResetData?.addEventListener('click', () => {
    if (confirm('Möchtest du alle Demo-Daten auf den Ursprungszustand zurücksetzen?')) {
      window.neonClient.resetDemoData();
      modalNeon?.classList.add('hidden');
    }
  });

  // --------------------------------------------------------------------------
  // PWA Service Worker Registration & Installation Prompt
  // --------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker erfolgreich registriert:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker Registrierung fehlgeschlagen:', err);
        });
    });
  }

  let deferredPrompt;
  const pwaInstallBanner = document.getElementById('pwa-install-banner');
  const btnInstallPwa = document.getElementById('btn-install-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaInstallBanner) {
      pwaInstallBanner.classList.remove('hidden');
    }
  });

  btnInstallPwa?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install Outcome: ${outcome}`);
      deferredPrompt = null;
      pwaInstallBanner?.classList.add('hidden');
    }
  });
});
