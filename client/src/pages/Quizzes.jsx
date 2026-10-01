import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)

  const load = () => api.get('/api/quizzes').then(setQuizzes).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  async function createQuiz(e) {
    e.preventDefault()
    if (!title.trim()) return
    await api.post('/api/quizzes', { title: title.trim() })
    setTitle('')
    load()
  }

  return (
    <div className="page">
      <h1>Quizzes</h1>

      <form className="card inline-form" onSubmit={createQuiz}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New quiz title" />
        <button className="btn primary" type="submit">Create quiz</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {(quizzes ?? []).map((q) => (
          <Link key={q.id} to={`/quizzes/${q.id}`} className="card deck-card">
            <h3>{q.title}</h3>
            <p className="deck-meta">{q.question_count} questions</p>
            {q.last_score != null && <p className="muted">Last score: {q.last_score} / {q.question_count}</p>}
          </Link>
        ))}
        {quizzes && quizzes.length === 0 && <p className="muted">No quizzes yet — create one above!</p>}
      </div>
    </div>
  )
}
