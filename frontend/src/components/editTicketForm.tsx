import { type SyntheticEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

type TicketData = {
    id: number
    title: string
    description: string
    status: string
}

export default function EditTicketForm() {
    const { ticketId } = useParams()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState<TicketData | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!ticketId) {
            setError('Missing ticket ID')
            return
        }

        fetch(`http://127.0.0.1:8000/tickets/${ticketId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Ticket not found')
                }
                return response.json() as Promise<TicketData>
            })
            .then(setTicket)
            .catch((requestError: Error) => setError(requestError.message))
    }, [ticketId])

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
                }),
            },
        )

        if (!response.ok) {
            setError('Could not update ticket')
            return
        }

        navigate('/')
    }

    if (error) {
        return (
            <main className="ticket-form-page">
                <p>{error}</p>
                <Link className="back-link" to="/">← Back to board</Link>
            </main>
        )
    }

    if (!ticket) {
        return <p>Loading ticket...</p>
    }

    return (
        <main className="ticket-form-page">
            <Link className="back-link" to="/">← Back to board</Link>
            <div className="form-heading">
                <p className="board-eyebrow">Ticket #{ticket.id}</p>
                <h1>Edit ticket</h1>
                <p>Update the details or move this ticket to a new status.</p>
            </div>
            <form className="ticket-form" onSubmit={handleSubmit}>
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
