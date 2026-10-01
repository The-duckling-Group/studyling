import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Decks from './pages/Decks.jsx'
import DeckDetail from './pages/DeckDetail.jsx'
import Quizzes from './pages/Quizzes.jsx'
import QuizDetail from './pages/QuizDetail.jsx'
import Timer from './pages/Timer.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-duck">🐤</span> studyling
        </Link>
        <nav>
          <NavLink to="/decks" className={({ isActive }) => (isActive ? 'active' : '')}>Flashcards</NavLink>
          <NavLink to="/quizzes" className={({ isActive }) => (isActive ? 'active' : '')}>Quizzes</NavLink>
          <NavLink to="/timer" className={({ isActive }) => (isActive ? 'active' : '')}>Timer</NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/decks/:id" element={<DeckDetail />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quizzes/:id" element={<QuizDetail />} />
          <Route path="/timer" element={<Timer />} />
        </Routes>
      </main>
    </div>
  )
}
