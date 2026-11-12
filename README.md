# 🎓 Studyling Learning Platform (PWA & Neon Tech PostgreSQL)

Vollständige Realisierung des **Google Stitch Projekts „Studyling Learning Platform“** als moderne **Progressive Web App (PWA)** mit nativer **Neon Tech (Serverless PostgreSQL)** Datenbank-Architektur.

---

## 🌟 Projekt-Highlights

- **📱 Progressive Web App (PWA)**:
  - Installierbar auf Android, iOS (Safari "Zum Home-Bildschirm") und Desktop (Chrome/Edge).
  - Volle Offline-Unterstützung mit eigenem Service Worker (`sw.js`) und Web App Manifest (`manifest.json`).
  - Haptisches und akustisches Feedback über die Web Audio API (Synthesizer ohne externe Audio-Dateien).
  - Responsive Mobile-First Design mit Safe-Area-Insets (`pt-safe`, `pb-safe`) und nativer App-Shell.

- **🐘 Neon Tech PostgreSQL Backend**:
  - Vollständige SQL DDL Scripts (`01_schema.sql`, `02_seed.sql`, `03_views_and_functions.sql`, `init_all.sql`).
  - Relationale Tabellen für Benutzer, Kurse, Lernpfad-Abschnitte, interaktive Quiz-Fragen, Pomodoro-Fokus-Sessions und Streaks.
  - Stored Procedures für automatische Punktevergabe (XP), Streak-Zähler und Lernpfad-Freischaltungen.
  - Unterstützt direkte Neon HTTP Serverless Queries sowie Offline-First Local-Storage-Fallback.

- **🎨 100% Google Stitch Design-Treue**:
  - **Screen 1: Lerneinheit (Ultra-Minimal)** – Aktives Erinnern mit LTP Neurobiologie Frage, Multiple-Choice Auswahl, Bestätigungs-Feedback und XP-Belohnung.
  - **Screen 2: Meine Kurse (Ultra-Minimal)** – Kursliste mit Filter-Pills ("Alle", "Aktiv", "Archiv", "Katalog"), Fortschrittsbalken und fälligen Karten ("8 Karten fällig").
  - **Screen 3: Lernpfad: Mathematik (Ultra-Minimal)** – Stufenweise Abschnitte (Vektorrechnung 100%, Skalarprodukt 100%, Matrixmultiplikation aktiv, Determinanten gesperrt).
  - **Screen 4: Kurse: Grundlagenfächer (Ultra-Minimal)** – Akademisches Portal mit Modulen für Höhere Mathematik I, Grundlagen der Informatik und Physik.
  - **Screen 5: Study Timer (Ultra-Minimal)** – Pomodoro 25 min, Deep Work 50 min, Pause 5 min mit animiertem SVG-Zifferblatt, Intervall-Zähler und Nicht-Stören-Modus.

---

## 📁 Projektstruktur

```text
studyling-platform/
├── database/
│   ├── 01_schema.sql             # Tabellen, Constraints, Indizes, Triggers
│   ├── 02_seed.sql               # Stitch-Demo-Datensatz (Alex M., Kurse, LTP-Quiz)
│   ├── 03_views_and_functions.sql# Views & Stored Procedures (Quiz, Timer, Pfad)
│   ├── init_all.sql              # Master-Skript für den Neon SQL Editor (900 Zeilen)
│   └── README_NEON.md            # Detaillierte Neon Tech Einrichtungsanleitung
├── public/
│   ├── index.html                # PWA App Shell mit allen 5 Stitch-Screens
│   ├── app.js                    # SPA Controller, Timer, Quiz & Audio-Engine
│   ├── neon-client.js            # Neon PostgreSQL Bridge & State Store
│   ├── styles.css                # Stitch Tailwind Styles & Material Symbols
│   ├── manifest.json             # PWA Web App Manifest
│   ├── sw.js                     # PWA Service Worker (Offline Cache & Sync)
│   └── icons/                    # App-Icons (SVG, 192px, 512px)
├── server.js                     # Zero-Dependency Node.js Server & Neon Proxy
├── package.json
└── README.md
```

---

## 🚀 Schnellstart

### 1. Server starten

```bash
cd /home/eymen/.gemini/antigravity-cli/scratch/studyling-platform
npm start
# oder
node server.js
```

Öffne anschließend [http://localhost:3000](http://localhost:3000) im Browser.

### 2. Neon Tech PostgreSQL verbinden

1. Erstelle ein kostenloses Projekt auf [console.neon.tech](https://console.neon.tech).
2. Öffne den **SQL Editor** in Neon und führe [init_all.sql](file:///home/eymen/.gemini/antigravity-cli/scratch/studyling-platform/database/init_all.sql) aus.
3. Klicke in der Web-App oben rechts auf das Profil-Icon (`person`) und trage deinen Neon Connection String ein:
   ```text
   postgresql://alex_study:secret@ep-cool-cloud-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Klicke auf **"Testen"** und **"Speichern"**. Alle Aktionen (Quiz-Antworten, Timer-Sessions) werden ab sofort live in deiner Neon Tech Cloud-Datenbank gespeichert!

---

## 📲 PWA Installation

- **Google Chrome / Chromium / Edge**: In der URL-Leiste auf das Installations-Symbol oder in der App auf das Banner *"Studyling als App installieren"* klicken.
- **Android**: Chrome-Menü -> *"App installieren"* bzw. *"Zum Startbildschirm hinzufügen"*.
- **iOS Safari**: Teilen-Button (Viereck mit Pfeil nach oben) -> *"Zum Home-Bildschirm"*.
