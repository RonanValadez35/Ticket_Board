import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AuthPage, { type AuthUser } from './components/AuthPage.tsx'
import TicketList from './components/ticketList.tsx'
import CreateTicketForm from './components/createTicketForm.tsx'
import EditTicketForm from './components/editTicketForm.tsx'
import type { TicketData, TicketStatus } from './types/ticket.ts'
import './App.css'

const ticketStatuses: TicketStatus[] = [
  'Backlog',
  'In Progress',
  'Under Review',
  'Completed',
]

interface BoardProps {
  user: AuthUser
  onSignOut: () => void
}

function Board({ user, onSignOut }: BoardProps) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<TicketData[]>([])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load tickets')
        }

        return response.json() as Promise<TicketData[]>
      })
      .then(setTickets)
      .catch((error: Error) => console.error(error.message))
  }, [])

  async function moveTicket(ticketId: number, newStatus: TicketStatus) {
    const originalTicket = tickets.find((ticket) => ticket.id === ticketId)

    if (!originalTicket || originalTicket.status === newStatus) {
      return
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket,
      ),
    )

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/tickets/${ticketId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      )

      if (!response.ok) {
        throw new Error('Could not move ticket')
      }
    } catch (error) {
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: originalTicket.status }
            : ticket,
        ),
      )
      console.error(error)
    }
  }

  return (
    <main className="board">
      <header className="board-header">
        <div>
          <h1>Ticket Board</h1>
          <p className="board-subtitle">
            Plan, track, and ship your team's work.
          </p>
        </div>
        <button type="button" onClick={() => navigate('/create')}>
          <span aria-hidden="true">+</span>
          New ticket
        </button>
        <div className="account-menu">
          <span>Signed in as <strong>{user.username}</strong></span>
          <button type="button" className="sign-out-button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <div className="board-columns">
        {ticketStatuses.map((status) => (
          <TicketList
            key={status}
            title={status}
            tickets={tickets.filter((ticket) => ticket.status === status)}
            onDropTicket={moveTicket}
            onTicketDeleted={(deletedId) =>
              setTickets((currentTickets) =>
                currentTickets.filter((ticket) => ticket.id !== deletedId),
              )
            }
          />
        ))}
      </div>
    </main>
  )
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('ticket-board-user')
    if (!savedUser) return null

    try {
      return JSON.parse(savedUser) as AuthUser
    } catch {
      localStorage.removeItem('ticket-board-user')
      return null
    }
  })

  function handleAuthenticated(authenticatedUser: AuthUser) {
    localStorage.setItem('ticket-board-user', JSON.stringify(authenticatedUser))
    setUser(authenticatedUser)
  }

  function handleSignOut() {
    localStorage.removeItem('ticket-board-user')
    setUser(null)
  }

  return (
    <Routes>
      <Route
        path="/signin"
        element={user ? <Navigate to="/" replace /> : <AuthPage mode="signin" onAuthenticated={handleAuthenticated} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" onAuthenticated={handleAuthenticated} />}
      />
      <Route path="/" element={user ? <Board user={user} onSignOut={handleSignOut} /> : <Navigate to="/signin" replace />} />
      <Route path="/create" element={user ? <CreateTicketForm /> : <Navigate to="/signin" replace />} />
      <Route path="/tickets/:ticketId/edit" element={user ? <EditTicketForm /> : <Navigate to="/signin" replace />} />
      <Route path="*" element={<Navigate to={user ? '/' : '/signin'} replace />} />
    </Routes>
  )
}

export default App
