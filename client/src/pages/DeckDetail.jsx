import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'

export default function DeckDetail() {
  const { id } = useParams()
  const [deck, setDeck] = useState(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [error, setError] = useState(null)
  const [review, setReview] = useState(null)

  const load = () => api.get(`/api/decks/${id}`).then(setDeck).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [id])

  async function addCard(e) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    await api.post(`/api/decks/${id}/cards`, { front: front.trim(), back: back.trim() })
    setFront('')
    setBack('')
    load()
  }

  async function removeCard(cardId) {
    await api.del(`/api/cards/${cardId}`)
    load()
  }

  function startReview() {
    const cards = (deck.cards ?? []).slice().sort((a, b) => new Date(a.due) - new Date(b.due))
    if (!cards.length) return
    setReview({ cards, index: 0, flipped: false, reviewed: 0, again: 0, done: false })
  }

  async function rate(rating) {
    const card = review.cards[review.index]
    await api.post(`/api/cards/${card.id}/review`, { rating })
    const r = { ...review, reviewed: review.reviewed + 1 }
    if (rating === 'again') r.again += 1
    if (r.index + 1 < r.cards.length) {
      setReview({ ...r, index: r.index + 1, flipped: false })
    } else {
      setReview({ ...r, done: true })
      load()
    }
  }

  if (!deck) return <div className="page"><p className="muted">{error ?? 'Loading…'}</p></div>

  const dueCount = deck.cards.filter((c) => new Date(c.due) <= new Date()).length

  return (
    <div className="page">
      <Link to="/decks" className="muted">← All decks</Link>
      <div className="page-head">
        <h1>{deck.name}</h1>
        <button className="btn primary" onClick={startReview} disabled={!deck.cards?.length}>
          {deck.cards?.length ? `Review (${dueCount} due)` : 'No cards to review'}
        </button>
      </div>

      {review && (
        <div className="card review-card">
          {!review.done ? (
            <>
              <p className="muted">Card {review.index + 1} of {review.cards.length}</p>
              {!review.flipped ? (
                <div className="review-front" onClick={() => setReview({ ...review, flipped: true })}>
                  <p className="review-text">{review.cards[review.index].front}</p>
                  <p className="muted">Tap to reveal</p>
                </div>
              ) : (
                <>
                  <p className="review-text muted">{review.cards[review.index].front}</p>
                  <div className="review-back">
                    <p className="review-text">{review.cards[review.index].back}</p>
                  </div>
                  <div className="rating-row">
                    <button className="btn rate-again" onClick={() => rate('again')}>Again</button>
                    <button className="btn rate-hard" onClick={() => rate('hard')}>Hard</button>
                    <button className="btn rate-good" onClick={() => rate('good')}>Good</button>
                    <button className="btn rate-easy" onClick={() => rate('easy')}>Easy</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="review-done">
              <span className="hero-duck">🐤</span>
              <h2>Quack-tastic!</h2>
              <p className="muted">Reviewed {review.reviewed} cards — {review.again} will come back soon.</p>
              <div className="hero-actions">
                <button className="btn primary" onClick={() => setReview(null)}>Back to deck</button>
              </div>
            </div>
          )}
        </div>
      )}

      <form className="card inline-form" onSubmit={addCard}>
        <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Card front (question)" />
        <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="Card back (answer)" />
        <button className="btn primary" type="submit">Add card</button>
      </form>

      <div className="card-list">
        {deck.cards?.map((c) => (
          <div key={c.id} className="card card-row">
            <div>
              <strong>{c.front}</strong>
              <p className="muted">{c.back}</p>
            </div>
            <button className="btn ghost" onClick={() => removeCard(c.id)}>✕</button>
          </div>
        ))}
        {deck.cards?.length === 0 && <p className="muted">No cards yet — add some above.</p>}
      </div>
    </div>
  )
}
