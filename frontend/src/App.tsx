import { Route, Routes, useNavigate } from 'react-router-dom'
import TicketList from './components/ticketList.tsx'
import CreateTicketForm from './components/createTicketForm.tsx'
import EditTicketForm from './components/editTicketForm.tsx'
import './App.css'

function Board() {
  const navigate = useNavigate()

  return (
    <main className="board">
      <header className="board-header">
        <div>
          <p className="board-eyebrow">Engineering workspace</p>
          <h1>Ticket Board</h1>
          <p className="board-subtitle">
            Plan, track, and ship your team's work.
          </p>
        </div>
        <button type="button" onClick={() => navigate('/create')}>
          <span aria-hidden="true">+</span>
          New ticket
        </button>
      </header>
      <div className="board-columns">
        <TicketList title="Backlog" />
        <TicketList title="In Progress" />
        <TicketList title="Under Review" />
        <TicketList title="Completed" />
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Board />} />
      <Route path="/create" element={<CreateTicketForm />} />
      <Route path="/tickets/:ticketId/edit" element={<EditTicketForm />} />
    </Routes>
  )
}

export default App
