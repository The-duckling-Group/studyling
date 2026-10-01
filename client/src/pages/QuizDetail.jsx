import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'

const EMPTY_Q = { prompt: '', options: ['', '', '', ''], correctIndex: 0 }

export default function QuizDetail() {
  const { id } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [q, setQ] = useState(EMPTY_Q)
  const [error, setError] = useState(null)
  const [run, setRun] = useState(null)

  const load = () => api.get(`/api/quizzes/${id}`).then(setQuiz).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [id])

  async function addQuestion(e) {
    e.preventDefault()
    if (!q.prompt.trim() || q.options.some((o) => !o.trim())) return
    await api.post(`/api/quizzes/${id}/questions`, {
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: q.correctIndex,
    })
    setQ(EMPTY_Q)
    load()
  }

  function startQuiz() {
    if (!quiz.questions?.length) return
    setRun({ i: 0, answers: quiz.questions.map(() => null), done: false, result: null })
  }

  async function submit(answers) {
    const result = await api.post(`/api/quizzes/${id}/attempts`, { answers })
    setRun({ i: 0, answers, done: true, result })
    load()
  }

  function next() {
    const ni = run.i + 1
    if (ni < quiz.questions.length) setRun((r) => ({ ...r, i: ni }))
    else submit(run.answers)
  }

  if (!quiz) return <div className="page"><p className="muted">{error ?? 'Loading…'}</p></div>

  const question = run && !run.done ? quiz.questions[run.i] : null
  const pct = run?.result ? Math.round((run.result.score / run.result.total) * 100) : 0
  const duckMsg =
    pct >= 80 ? 'Quack-tastic! The duck is doing a happy wiggle 🐤'
    : pct >= 50 ? 'Good paddling! A little more practice and you have it 🦆'
    : 'Keep going — the duck believes in you 🐣'

  return (
    <div className="page">
      <Link to="/quizzes" className="muted">← All quizzes</Link>
      <div className="page-head">
        <h1>{quiz.title}</h1>
        <button className="btn primary" onClick={startQuiz} disabled={!quiz.questions?.length || (!!run && !run.done)}>
          {quiz.questions?.length ? 'Start quiz' : 'Add questions to start'}
        </button>
      </div>

      {run && !run.done && question && (
        <div className="card">
          <p className="muted">Question {run.i + 1} of {quiz.questions.length}</p>
          <h3 className="quiz-prompt">{question.prompt}</h3>
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              className={`quiz-option ${run.answers[run.i] === idx ? 'selected' : ''}`}
              onClick={() => setRun((r) => ({ ...r, answers: r.answers.map((a, i) => (i === r.i ? idx : a)) }))}
            >
              {opt}
            </button>
          ))}
          <button className="btn primary" onClick={next} disabled={run.answers[run.i] === null}>
            {run.i + 1 < quiz.questions.length ? 'Next' : 'Finish'}
          </button>
        </div>
      )}

      {run?.done && run.result && (
        <div className="card review-done">
          <span className="hero-duck">{pct >= 50 ? '🐤' : '🐣'}</span>
          <h2>{run.result.score} / {run.result.total} correct</h2>
          <p className="muted">{duckMsg}</p>
          <div className="quiz-review">
            {quiz.questions.map((qq, i) => {
              const r = run.result.results[i]
              return (
                <div key={qq.id} className="card card-row" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>{r.correct ? '✅' : '❌'} {qq.prompt}</strong>
                    {!r.correct && <p className="muted">Correct answer: {qq.options[r.correctIndex]}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hero-actions center">
            <button className="btn primary" onClick={startQuiz}>Try again</button>
            <button className="btn" onClick={() => setRun(null)}>Back to quiz</button>
          </div>
        </div>
      )}

      <form className="card q-form" onSubmit={addQuestion}>
        <h3>Add a question</h3>
        <input value={q.prompt} onChange={(e) => setQ({ ...q, prompt: e.target.value })} placeholder="Question prompt" />
        {q.options.map((opt, idx) => (
          <div key={idx} className="opt-row">
            <input
              type="radio"
              name="correct"
              checked={q.correctIndex === idx}
              onChange={() => setQ({ ...q, correctIndex: idx })}
            />
            <input
              value={opt}
              onChange={(e) => setQ({ ...q, options: q.options.map((o, i) => (i === idx ? e.target.value : o)) })}
              placeholder={`Option ${idx + 1}`}
            />
          </div>
        ))}
        <p className="muted">Select the radio next to the correct option.</p>
        <button className="btn primary" type="submit">Add question</button>
      </form>

      {quiz.attempts?.length > 0 && (
        <div className="card-list">
          <h3>Recent attempts</h3>
          {quiz.attempts.map((a) => (
            <div key={a.id} className="card card-row">
              <strong>{a.score} / {a.total}</strong>
              <span className="muted">{new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
