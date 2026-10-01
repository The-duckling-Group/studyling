# studyling

Learn with the duck 🐤 — flashcards, quizzes, and a study timer.

## Stack

- **client/** — React 19 + Vite 7 SPA. Dev server listens on 5173, mapped to host port 3000. Dev proxies `/api/*` to the api service (see `client/vite.config.js`) — single origin, no CORS config.
- **server/** — Express 4 + node-postgres (ESM). Listens on `PORT` (default 4000), internal to the compose network only.
- Postgres 16 runs as a compose service. The schema is created idempotently and demo data seeded on server boot (`server/src/db.js`) — no separate migration/seed step.

## Run

```
docker compose -f docker-compose.base44.yml up -d
```

Then open http://localhost:3000. Both app services `npm install` at container start; `node_modules` lives in the bind-mounted repo (gitignored).

## Notes

- Spaced-repetition logic is `nextReview()` in `server/src/index.js` (again/hard/good/easy adjust ease + interval).
- No external credentials needed; the DB credentials are local infra values in the compose file.
- Verify: `curl localhost:3000/api/health` (through the Vite proxy) and the compose healthchecks.
