import { useEffect, useState } from 'react'
import { api } from '../api.js'

const PRESETS = [15, 25, 50]
const BREAK = 5

export default function Timer() {
  const [minutes, setMinutes] = useState(25)
  const [mode, setMode] = useState('focus')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(null)
  const [justFinished, setJustFinished] = useState(false)

  const load = () => api.get('/api/sessions').then(setSessions).catch(() => {})
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(t)
  }, [running])

  async function finish() {
    setRunning(false)
    if (mode === 'focus') {
      await api.post('/api/sessions', { focusMinutes: minutes, breakMinutes: BREAK })
      load()
      setMode('break')
      setRemaining(BREAK * 60)
      setJustFinished(true)
    } else {
      setMode('focus')
      setRemaining(minutes * 60)
      setJustFinished(false)
    }
  }

  useEffect(() => {
    if (running && remaining === 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running])

  function reset() {
    setRunning(false)
    setMode('focus')
    setRemaining(minutes * 60)
    setJustFinished(false)
  }

  function pickPreset(p) {
    setMinutes(p)
    if (mode === 'focus' && !running) setRemaining(p * 60)
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const duckFace = mode === 'break' ? '🛁' : running ? '🐤' : '🦆'
  const duckMsg =
    mode === 'break'
      ? justFinished
        ? 'Quack-tastic session! Paddle around for a bit 🌿'
        : 'Enjoy the break — stretch, sip some water.'
      : running
        ? 'The duck is studying right beside you. Stay with it!'
        : 'Quack! Press start when you are ready.'

  const today = new Date().toDateString()
  const todayFocus = (sessions ?? [])
    .filter((s) => new Date(s.created_at).toDateString() === today)
    .reduce((a, s) => a + s.focus_minutes, 0)

  return (
    <div className="page">
      <h1>Study timer</h1>

      <div className="card timer-card">
        <div className="timer-duck">{duckFace}</div>
        <p className="timer-mode">{mode === 'focus' ? 'Focus' : 'Break'}</p>
        <div className="timer-clock">{fmt(remaining)}</div>
        <p className="muted">{duckMsg}</p>

        {mode === 'focus' && !running && (
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button key={p} className={`preset ${minutes === p ? 'active' : ''}`} onClick={() => pickPreset(p)}>
                {p} min
              </button>
            ))}
          </div>
        )}

        <div className="timer-controls">
          <button className="btn primary" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Start'}
          </button>
          <button className="btn" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat card">
          <span className="stat-num">{todayFocus}</span>
          <span className="stat-label">Focus minutes today</span>
        </div>
        <div className="stat card">
          <span className="stat-num">{sessions?.length ?? '–'}</span>
          <span className="stat-label">Recent sessions</span>
        </div>
      </div>

      <div className="card-list">
        {(sessions ?? []).slice(0, 8).map((s) => (
          <div key={s.id} className="card card-row">
            <div>
              <strong>{s.focus_minutes} min focus</strong> <span className="muted">+ {s.break_minutes} min break</span>
            </div>
            <span className="muted">{new Date(s.created_at).toLocaleString()}</span>
          </div>
        ))}
        {sessions && sessions.length === 0 && <p className="muted">No sessions logged yet — the duck is waiting.</p>}
      </div>
    </div>
  )
}
