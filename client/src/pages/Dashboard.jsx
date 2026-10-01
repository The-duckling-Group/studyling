import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/stats').then(setStats).catch((e) => setError(e.message))
  }, [])

  return (
    <div className="page">
      <section className="hero card">
        <div className="hero-duck">🐤</div>
        <div>
          <h1>Quack! Ready to study?</h1>
          <p>Your duck buddy helps you learn — flashcards, quizzes and focused study sessions.</p>
          <div className="hero-actions">
            <Link className="btn primary" to="/decks">Review flashcards</Link>
            <Link className="btn" to="/timer">Start a focus session</Link>
          </div>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      {stats && (
        <section className="stat-grid">
          <div className="stat card"><span className="stat-num">{stats.decks}</span><span className="stat-label">Decks</span></div>
          <div className="stat card"><span className="stat-num">{stats.due}</span><span className="stat-label">Cards due</span></div>
          <div className="stat card"><span className="stat-num">{stats.quizzes}</span><span className="stat-label">Quizzes</span></div>
          <div className="stat card"><span className="stat-num">{stats.focus_minutes}</span><span className="stat-label">Focus minutes</span></div>
        </section>
      )}

      <section className="feature-grid">
        <Link to="/decks" className="feature card">
          <span>🃏</span>
          <h3>Flashcards</h3>
          <p>Create decks and review with spaced repetition.</p>
        </Link>
        <Link to="/quizzes" className="feature card">
          <span>❓</span>
          <h3>Quizzes</h3>
          <p>Test yourself and track your score.</p>
        </Link>
        <Link to="/timer" className="feature card">
          <span>⏳</span>
          <h3>Study timer</h3>
          <p>Pomodoro sessions — the duck keeps you company.</p>
        </Link>
      </section>
    </div>
  )
}
