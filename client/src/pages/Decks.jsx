import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Decks() {
  const [decks, setDecks] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const load = () => api.get('/api/decks').then(setDecks).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  async function createDeck(e) {
    e.preventDefault()
    if (!name.trim()) return
    await api.post('/api/decks', { name: name.trim() })
    setName('')
    load()
  }

  return (
    <div className="page">
      <h1>Flashcard decks</h1>

      <form className="card inline-form" onSubmit={createDeck}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New deck name, e.g. Spanish vocab" />
        <button className="btn primary" type="submit">Create deck</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {(decks ?? []).map((d) => (
          <Link key={d.id} to={`/decks/${d.id}`} className="card deck-card">
            <h3>{d.name}</h3>
            <p className="deck-meta">{d.card_count} cards · <strong>{d.due_count} due</strong></p>
          </Link>
        ))}
        {decks && decks.length === 0 && <p className="muted">No decks yet — create your first one above!</p>}
      </div>
    </div>
  )
}
