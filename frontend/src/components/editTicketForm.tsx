import { type SyntheticEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { AuthUser } from '../types/auth'
import type { TicketData } from '../types/ticket'

type EditTicketFormProps = {
    user: AuthUser
}

export default function EditTicketForm({ user }: EditTicketFormProps) {
    const { ticketId } = useParams()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState<TicketData | null>(null)
    const [error, setError] = useState('')
    const [ownsTicket, setOwnsTicket] = useState(false)

    useEffect(() => {
        if (!ticketId) return

        fetch(`http://127.0.0.1:8000/tickets/${ticketId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Ticket not found')
                }
                return response.json() as Promise<TicketData>
            })
            .then((loadedTicket) => {
                setTicket(loadedTicket)
                setOwnsTicket(loadedTicket.user_id === user.id)
            })
            .catch((requestError: Error) => setError(requestError.message))
    }, [ticketId, user.id])

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!ticketId) return

        const form = new FormData(event.currentTarget)
        const response = await fetch(
            `http://127.0.0.1:8000/tickets/${ticketId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: String(form.get('title') ?? ''),
                    description: String(form.get('description') ?? ''),
                    status: String(form.get('status') ?? 'Backlog'),
                    ...(ticket?.user_id === null || ticket?.user_id === user.id
                        ? { user_id: ownsTicket ? user.id : null }
                        : {}),
                }),
            },
        )

        if (!response.ok) {
            setError('Could not update ticket')
            return
        }

        navigate('/board')
    }

    const displayedError = ticketId ? error : 'Missing ticket ID'

    if (displayedError) {
        return (
            <main className="ticket-form-page">
                <p>{displayedError}</p>
                <Link className="back-link" to="/board">
                    ← Back to board
                </Link>
            </main>
        )
    }

    if (!ticket) {
        return <p>Loading ticket...</p>
    }

    return (
        <main className="ticket-form-page">
            <Link className="back-link" to="/board">
                ← Back to board
            </Link>
            <div className="form-heading">
                <p className="board-eyebrow">Ticket #{ticket.id}</p>
                <h1>Edit ticket</h1>
                <p>Update the details or move this ticket to a new status.</p>
            </div>
            <form className="ticket-form" onSubmit={handleSubmit}>
                <section className="ticket-ownership" aria-labelledby="ownership-heading">
                    <div className="owner-avatar" aria-hidden="true">
                        {(ticket.owner_username ?? user.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 id="ownership-heading">Ticket owner</h2>
                        {ticket.user_id !== null && ticket.user_id !== user.id ? (
                            <p>
                                Assigned to <strong>{ticket.owner_username}</strong>
                            </p>
                        ) : (
                            <label className="claim-ticket-option">
                                <input
                                    type="checkbox"
                                    checked={ownsTicket}
                                    onChange={(event) => setOwnsTicket(event.target.checked)}
                                />
                                <span>
                                    <strong>{ownsTicket ? 'Assigned to me' : 'Assign this ticket to me'}</strong>
                                    <small>
                                        {ownsTicket
                                            ? 'Turn off to release ownership of this ticket'
                                            : `Take ownership as ${user.username}`}
                                    </small>
                                </span>
                            </label>
                        )}
                    </div>
                </section>
                <label>
                    Title
                    <input
                        type="text"
                        name="title"
                        defaultValue={ticket.title}
                        required
                    />
                </label>
                <label>
                    Description
                    <textarea
                        name="description"
                        defaultValue={ticket.description}
                        rows={5}
                    />
                </label>
                <label>
                    Status
                    <select name="status" defaultValue={ticket.status}>
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                    </select>
                </label>
                <button type="submit">Save changes</button>
            </form>
        </main>
    )
}
