import { type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function CreateTicketForm() {
    const navigate = useNavigate()

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const title = String(form.get('title') ?? '')
        const description = String(form.get('description') ?? '')
        const status = String(form.get('status') ?? 'Backlog')

        await fetch('http://127.0.0.1:8000/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                status,
            }),
        })

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
                <button type="submit">Create</button>
            </form>
        </main>
    )
}
