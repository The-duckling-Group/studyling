# 🐘 Neon Tech Database Setup Guide für Studyling Learning Platform

Dieses Dokument erklärt, wie die PostgreSQL-Datenbank auf **Neon Tech (Serverless PostgreSQL)** eingerichtet und mit der Studyling PWA verbunden wird.

---

## 1. Schnelleinrichtung in Neon Tech (in 2 Minuten)

1. Öffne die [Neon Tech Konsole](https://console.neon.tech/) und logge dich ein.
2. Erstelle ein neues Projekt:
   - **Project Name**: `studyling-platform`
   - **Region**: `Frankfurt (eu-central-1)` (oder deine bevorzugte Region)
   - **Postgres Version**: `16` (oder `17`)
3. Kopiere den **Connection String** aus dem Neon Dashboard:
   ```text
   postgresql://alex_study:AbCdEf123456@ep-cool-cloud-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2. SQL Scripts ausführen

Neon bietet einen integrierten browserbasierten **SQL Editor**:

1. Gehe im Neon Dashboard im linken Menü auf **"SQL Editor"**.
2. Öffne die Datei [init_all.sql](file:///home/eymen/.gemini/antigravity-cli/scratch/studyling-platform/database/init_all.sql) (oder die einzelnen Skripte in der Reihenfolge `01_schema.sql` -> `02_seed.sql` -> `03_views_and_functions.sql`).
3. Füge den gesamten Inhalt in den SQL Editor ein und klicke auf **Run**.

### Was wird erstellt?
- **Erweiterungen**: `uuid-ossp`, `pgcrypto`
- **Tabellen**:
  - `users` (Alex M., Streak: 12, XP: 1420, Stufe 4)
  - `user_streaks` (12-Tage-Historie mit täglichen Sessions und XP)
  - `courses` (PSY-402, MTH-108, MTH-101, INF-101, PHY-101, CHE-101)
  - `user_course_enrollments` (Fortschritte: 68%, 25%, 65%, 40%, 15%)
  - `learning_path_sections` (Vektoren & Matrizen)
  - `learning_path_nodes` (01 Vektorrechnung, 02 Skalarprodukt, 03 Matrixmultiplikation, 04 Determinanten, 05 Meilenstein)
  - `user_node_progress` (Gemeisterte und aktive Einheiten)
  - `quiz_questions` & `quiz_options` (LTP Hippocampus Active Recall Frage, etc.)
  - `study_timer_sessions` (Historie aller Pomodoro- und Deep-Work-Sessions)
  - `flashcard_decks` & `flashcards` (8 fällige Karteikarten für Statistik & Datenanalyse)
- **Views**:
  - `v_user_dashboard_summary`: Konsolidierte Dashboardsicht
  - `v_user_course_overview`: Kurse und Status
- **Stored Functions**:
  - `fn_complete_quiz_question()`: Validiert Antworten, vergibt XP, aktualisiert Streaks
  - `fn_log_study_session()`: Speichert Timer-Sessions, verbucht Lernzeit & XP
  - `fn_advance_learning_path_node()`: Schaltet nächste Lerneinheit frei und aktualisiert Kursfortschritt

---

## 3. Verbindung mit der Studyling PWA

Die Studyling PWA unterstützt zwei Modi:
1. **Live Neon Tech Sync**:
   - Klicke in der App oben rechts auf das **Profil-Icon (Alex M.)** -> **Neon Tech Datenbank**.
   - Trage deinen Connection-String oder die Neon Database URL ein.
   - Die App synchronisiert Quiz-Ergebnisse, Timer-Sessions und Kursfortschritte direkt in deine Neon Tech PostgreSQL Instanz!
2. **Offline-First / Demo Mode**:
   - Wenn kein Neon Connection String hinterlegt ist, läuft die PWA voll autonom mit LocalStorage/IndexedDB und dem identischen Stitch-Datensatz.

---

## 4. Alternative: Ausführung über Neon CLI oder psql

Falls du die Neon CLI oder `psql` nutzt:

```bash
# Mit psql:
psql "postgresql://alex_study:AbCdEf123456@ep-cool-cloud-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require" -f database/init_all.sql

# Oder mit Neon CLI:
neon sql --project-id <your-project-id> < database/init_all.sql
```
