import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export function query(text, params) {
  return pool.query(text, params)
}

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS decks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_reviewed TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      focus_minutes INTEGER NOT NULL,
      break_minutes INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

// Seeds a small demo deck and quiz so a fresh install isn't empty.
export async function seed() {
  const { rows } = await query('SELECT COUNT(*)::INT AS c FROM decks')
  if (rows[0].c > 0) return

  const deck = await query(
    "INSERT INTO decks (name, description) VALUES ($1, $2) RETURNING id",
    ['Duck Facts 🦆', 'Get to know your study buddy']
  )
  const deckId = deck.rows[0].id
  const cards = [
    ['What sound does a duck make?', 'Quack quack!'],
    ['What do ducks eat?', 'Seeds, insects, grass and small water creatures'],
    ['Can ducks sleep with one eye open?', 'Yes! Half their brain sleeps while the other half stays alert'],
    ['A baby duck is called…', 'A duckling 🐤'],
    ['How fast can ducks fly?', 'Up to 80 km/h'],
  ]
  for (const [front, back] of cards) {
    await query('INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)', [deckId, front, back])
  }

  const quiz = await query('INSERT INTO quizzes (title) VALUES ($1) RETURNING id', ['Studying Basics 📚'])
  const quizId = quiz.rows[0].id
  const questions = [
    ['What is spaced repetition?', ['Cramming the night before', 'Reviewing at increasing intervals', 'Reading once very carefully', 'Studying with music on'], 1],
    ['What is the classic pomodoro focus length?', ['10 minutes', '25 minutes', '45 minutes', '90 minutes'], 1],
    ['Which is a good study habit?', ['Multitasking while learning', 'Highlighting everything', 'Testing yourself regularly', 'Studying only right before exams'], 2],
  ]
  for (const [prompt, options, correctIndex] of questions) {
    await query(
      'INSERT INTO questions (quiz_id, prompt, options, correct_index) VALUES ($1, $2, $3, $4)',
      [quizId, prompt, JSON.stringify(options), correctIndex]
    )
  }
}
