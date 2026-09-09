import { type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function CreateTicketForm() {
    const navigate = useNavigate()

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        <div>
            <Link to="/">Back to board</Link>
            <form onSubmit={handleSubmit}>
                <input type="text" name="title" placeholder="Title" required />
                <input type="text" name="description" placeholder="Description" />
                <select name="status" defaultValue="Backlog">
                    <option value="Backlog">Backlog</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                </select>
                <button type="submit">Create</button>
            </form>
        </div>
    )
}
