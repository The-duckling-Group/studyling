import express from 'express'
import { query, migrate, seed } from './db.js'

const app = express()
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/stats', async (req, res) => {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::INT FROM decks) AS decks,
      (SELECT COUNT(*)::INT FROM cards) AS cards,
      (SELECT COUNT(*)::INT FROM cards WHERE due <= now()) AS due,
      (SELECT COUNT(*)::INT FROM quizzes) AS quizzes,
      (SELECT COUNT(*)::INT FROM attempts) AS attempts,
      (SELECT COALESCE(SUM(focus_minutes), 0)::INT FROM sessions) AS focus_minutes
  `)
  res.json(rows[0])
})

// ---------- Decks & flashcards ----------

app.get('/api/decks', async (req, res) => {
  const { rows } = await query(`
    SELECT d.id, d.name, d.description, d.created_at,
           COUNT(c.id)::INT AS card_count,
           COUNT(c.id) FILTER (WHERE c.due <= now())::INT AS due_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `)
  res.json(rows)
})

app.post('/api/decks', async (req, res) => {
  const { name, description = '' } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Deck name is required' })
  const { rows } = await query(
    'INSERT INTO decks (name, description) VALUES ($1, $2) RETURNING *',
    [name.trim(), description]
  )
  res.status(201).json(rows[0])
})

app.get('/api/decks/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM decks WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Deck not found' })
  const { rows: cards } = await query(
    'SELECT * FROM cards WHERE deck_id = $1 ORDER BY due ASC, id ASC',
    [req.params.id]
  )
  res.json({ ...rows[0], cards })
})

app.post('/api/decks/:id/cards', async (req, res) => {
  const { front, back } = req.body
  if (!front?.trim() || !back?.trim()) {
    return res.status(400).json({ error: 'Card front and back are required' })
  }
  const { rows } = await query(
    'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, front.trim(), back.trim()]
  )
  res.status(201).json(rows[0])
})

app.delete('/api/cards/:id', async (req, res) => {
  await query('DELETE FROM cards WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

function nextReview(card, rating) {
  let { ease, interval_days, repetitions } = card
  if (rating === 'again') {
    ease = Math.max(1.3, ease - 0.2)
    repetitions = 0
    interval_days = 1 / 144 // ~10 minutes
  } else {
    if (rating === 'hard') ease = Math.max(1.3, ease - 0.15)
    if (rating === 'easy') ease = Math.min(3.0, ease + 0.15)
    repetitions += 1
    if (repetitions === 1) interval_days = rating === 'hard' ? 1 : rating === 'good' ? 1 : 3
    else if (repetitions === 2) interval_days = rating === 'hard' ? 3 : rating === 'good' ? 6 : 9
    else interval_days = Math.round(interval_days * ease * (rating === 'hard' ? 0.8 : rating === 'easy' ? 1.3 : 1))
  }
  const due = new Date(Date.now() + interval_days * 86400000)
  return { ease, repetitions, interval_days, due }
}

app.post('/api/cards/:id/review', async (req, res) => {
  const { rating } = req.body
  if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
    return res.status(400).json({ error: 'Invalid rating' })
  }
  const { rows } = await query('SELECT * FROM cards WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Card not found' })
  const n = nextReview(rows[0], rating)
  await query(
    `UPDATE cards SET ease = $2, repetitions = $3, interval_days = $4, due = $5, last_reviewed = now()
     WHERE id = $1`,
    [req.params.id, n.ease, n.repetitions, n.interval_days, n.due]
  )
  res.json({ ok: true, ...n })
})

// ---------- Quizzes ----------

app.get('/api/quizzes', async (req, res) => {
  const { rows } = await query(`
    SELECT q.id, q.title, q.created_at,
           COUNT(DISTINCT qs.id)::INT AS question_count,
           (SELECT a.score FROM attempts a WHERE a.quiz_id = q.id ORDER BY a.created_at DESC LIMIT 1) AS last_score
    FROM quizzes q
    LEFT JOIN questions qs ON qs.quiz_id = q.id
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `)
  res.json(rows)
})

app.post('/api/quizzes', async (req, res) => {
  const { title } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Quiz title is required' })
  const { rows } = await query('INSERT INTO quizzes (title) VALUES ($1) RETURNING *', [title.trim()])
  res.status(201).json(rows[0])
})

app.get('/api/quizzes/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM quizzes WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Quiz not found' })
  const { rows: questions } = await query('SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id', [req.params.id])
  const { rows: attempts } = await query(
    'SELECT * FROM attempts WHERE quiz_id = $1 ORDER BY created_at DESC LIMIT 5',
    [req.params.id]
  )
  res.json({ ...rows[0], questions, attempts })
})

app.post('/api/quizzes/:id/questions', async (req, res) => {
  const { prompt, options, correctIndex } = req.body
  if (!prompt?.trim() || !Array.isArray(options) || options.length < 2 || options.some(o => !o?.trim())) {
    return res.status(400).json({ error: 'Prompt and at least two non-empty options are required' })
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return res.status(400).json({ error: 'correctIndex must point at one of the options' })
  }
  const { rows } = await query(
    'INSERT INTO questions (quiz_id, prompt, options, correct_index) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.params.id, prompt.trim(), JSON.stringify(options.map(o => o.trim())), correctIndex]
  )
  res.status(201).json(rows[0])
})

app.post('/api/quizzes/:id/attempts', async (req, res) => {
  const { answers } = req.body
  const { rows: questions } = await query(
    'SELECT id, correct_index FROM questions WHERE quiz_id = $1 ORDER BY id',
    [req.params.id]
  )
  if (!questions.length) return res.status(400).json({ error: 'Quiz has no questions' })
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return res.status(400).json({ error: 'answers must match the number of questions' })
  }
  const results = questions.map((q, i) => ({
    questionId: q.id,
    correct: answers[i] === q.correct_index,
    correctIndex: q.correct_index,
  }))
  const score = results.filter(r => r.correct).length
  await query('INSERT INTO attempts (quiz_id, score, total) VALUES ($1, $2, $3)', [
    req.params.id, score, questions.length,
  ])
  res.status(201).json({ score, total: questions.length, results })
})

// ---------- Study sessions ----------

app.get('/api/sessions', async (req, res) => {
  const { rows } = await query('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 20')
  res.json(rows)
})

app.post('/api/sessions', async (req, res) => {
  const { focusMinutes, breakMinutes = 5 } = req.body
  if (!Number.isFinite(focusMinutes) || focusMinutes <= 0 || focusMinutes > 600) {
    return res.status(400).json({ error: 'focusMinutes must be between 1 and 600' })
  }
  const { rows } = await query(
    'INSERT INTO sessions (focus_minutes, break_minutes) VALUES ($1, $2) RETURNING *',
    [Math.round(focusMinutes), Math.round(breakMinutes)]
  )
  res.status(201).json(rows[0])
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

const port = process.env.PORT || 4000
await migrate()
await seed()
app.listen(port, () => console.log(`studyling API listening on port ${port}`))
