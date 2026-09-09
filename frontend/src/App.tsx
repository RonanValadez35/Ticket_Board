import { useEffect, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
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

function Board() {
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
  return (
    <Routes>
      <Route path="/" element={<Board />} />
      <Route path="/create" element={<CreateTicketForm />} />
      <Route path="/tickets/:ticketId/edit" element={<EditTicketForm />} />
    </Routes>
  )
}

export default App
