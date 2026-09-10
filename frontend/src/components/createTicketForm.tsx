import { type SyntheticEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types/auth'

type CreateTicketFormProps = {
    user: AuthUser
}

export default function CreateTicketForm({ user }: CreateTicketFormProps) {
    const navigate = useNavigate()
    const [claimTicket, setClaimTicket] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const title = String(form.get('title') ?? '')
        const description = String(form.get('description') ?? '')
        const status = String(form.get('status') ?? 'Backlog')

        setError('')
        const response = await fetch('http://127.0.0.1:8000/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                status,
                ...(claimTicket ? { user_id: user.id } : {}),
            }),
        })

        if (!response.ok) {
            setError('Could not create ticket')
            return
        }

        navigate('/')
    }

    return (
        <main className="ticket-form-page">
            <Link className="back-link" to="/">← Back to board</Link>
            <div className="form-heading">
                <p className="board-eyebrow">New work item</p>
                <h1>Create a ticket</h1>
                <p>Add the details your team needs to get started.</p>
            </div>
            <form className="ticket-form" onSubmit={handleSubmit}>
                <section className="ticket-ownership" aria-labelledby="ownership-heading">
                    <div className="owner-avatar" aria-hidden="true">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 id="ownership-heading">Ticket owner</h2>
                        <label className="claim-ticket-option">
                            <input
                                type="checkbox"
                                checked={claimTicket}
                                onChange={(event) => setClaimTicket(event.target.checked)}
                            />
                            <span>
                                <strong>Assign this ticket to me</strong>
                                <small>Take ownership as {user.username}</small>
                            </span>
                        </label>
                    </div>
                </section>
                <label>
                    Title
                    <input
                        type="text"
                        name="title"
                        placeholder="What needs to be done?"
                        required
                    />
                </label>
                <label>
                    Description
                    <textarea
                        name="description"
                        placeholder="Add context, requirements, or notes..."
                        rows={5}
                    />
                </label>
                <label>
                    Status
                    <select name="status" defaultValue="Backlog">
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                    </select>
                </label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit">Create</button>
            </form>
        </main>
    )
}
