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
