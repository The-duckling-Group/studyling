# 🎓 Studyling Learning Platform (PWA, Neon Tech & Vercel)

Vollständige Realisierung des **Google Stitch Projekts „Studyling Learning Platform“** als moderne **Progressive Web App (PWA)** mit nativer **Neon Tech (Serverless PostgreSQL)** Datenbank-Architektur, **Authentifizierung (Login & Sign Up)**, **Admin-Panel** und **Vercel-Deployment**.

---

## 🌟 Neu: Vercel Environment Variables & Admin Panel

- **🔒 Sicherer Serverless-Betrieb über Environment Variables**:
  - Endnutzer tragen **keine** Datenbank-URLs mehr im Browser ein!
  - Die Neon Tech Verbindung wird serverseitig über die Environment Variable `DATABASE_URL` (in Vercel oder lokaler `.env`) gesteuert.
- **🛡️ Rollenbasierte Zugriffskontrolle (RBAC)**:
  - Rollen: `student` und `admin`.
  - Passwörter werden mit `bcrypt` gehasht, Sitzungen mit sicheren JWT-Tokens verwaltet.
- **⚙️ Vollständiges In-App Admin Panel**:
  - **Fächer & Kurse verwalten**: Neue Fächer mit Modulen, Stufen und Semestern anlegen oder löschen.
  - **Lernpfade bearbeiten**: Neue Abschnitte und Lektionen (Nummer, Titel, Beschreibung, XP, Lektion oder Meilenstein) konfigurieren.
  - **Aufgaben & Quizfragen erstellen**: Fragen mit Thema, Fragetext, Hervorhebung, Antwortoptionen A, B, C und Auflösungserklärung anlegen.
  - **Benutzerverwaltung**: Benutzer einsehen und mit 1 Klick zum Administrator ernennen oder zurückstufen.

---

## 🔑 Demo-Zugangsdaten (Sofort testbar)

| Rolle | E-Mail | Passwort | Berechtigungen |
|---|---|---|---|
| **Administrator** | `admin@studyling.app` | `AdminPassword123!` | Voller Zugriff auf das Admin-Panel, Fächer, Lernpfade, Aufgaben & Rollen |
| **Student** | `alex@studyling.app` | `Studyling2025!` | Standard-Lernzugriff, Kurse, Timer, Quiz & 12-Tage-Streak |

> 💡 *Tipp:* Im Anmelde-Fenster gibt es praktische 1-Klick-Buttons (**„🔑 Als Admin“** und **„🎒 Als Student“**), um sich sofort ohne Tippen einzuloggen.

---

## 🚀 Hosting auf Vercel (1-Click Deployment)

1. Repository auf GitHub mit Vercel verknüpfen: [https://github.com/The-duckling-Group/studyling](https://github.com/The-duckling-Group/studyling)
2. Im Vercel Dashboard unter **Settings -> Environment Variables** folgende Variablen hinzufügen:
   ```env
   DATABASE_URL="postgresql://alex_study:passwort@ep-cool-cloud-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="studyling_production_jwt_secret_beliebiger_key"
   ```
3. Vercel führt den Build automatisch aus. Die Serverless Functions unter `/api/` verbinden sich mit Neon Tech, und die PWA unter `/public` wird global gecacht!

---

## 📁 Projektstruktur

```text
studyling-platform/
├── api/                          # Vercel Serverless Functions
│   ├── _auth.js                  # JWT & Bcrypt Auth Helpers
│   ├── _db.js                    # Neon Tech Serverless DB Client (DATABASE_URL)
│   └── index.js                  # Unified API Handler (Auth, Courses, Path, Admin)
├── database/                     # Neon Tech PostgreSQL Skripte
│   ├── 01_schema.sql             # Tabellen mit Rollen (admin, student) & Constraints
│   ├── 02_seed.sql               # Seed-Daten inkl. Admin- und Student-Accounts
│   ├── 03_views_and_functions.sql# Stored Procedures für Quiz, Timer & Pfade
│   ├── init_all.sql              # Master-Skript für den Neon SQL Editor
│   └── README_NEON.md            # Neon Tech Einrichtungsanleitung
├── public/                       # PWA Frontend Shell (Google Stitch Design)
│   ├── index.html                # App Shell mit Admin-Panel & Auth-Modals
│   ├── app.js                    # SPA Controller, Audio-Synthesizer, Admin-Logik
│   ├── neon-client.js            # API-Client mit Auth-Header & Offline-Sync
│   ├── styles.css                # Stitch Tailwind Styles & Material Symbols
│   ├── manifest.json             # PWA Web App Manifest
│   ├── sw.js                     # Service Worker für Offline-Caching
│   └── icons/                    # App-Icons (SVG, 192px, 512px)
├── stitch-designs/               # Original Google Stitch HTML-Referenzen
├── server.js                     # Lokaler Entwicklungs-Server & API Proxy
├── vercel.json                   # Vercel Serverless Routing-Konfiguration
├── .env.example                  # Vorlage für Environment Variables
├── package.json
└── README.md
```

---

## 💻 Lokaler Start

```bash
cd /home/eymen/.gemini/antigravity-cli/scratch/studyling-platform
npm start
```
Die App ist anschließend unter `http://localhost:3000` erreichbar.
