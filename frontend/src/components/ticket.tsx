import "../styles/ticket.css";

export default function Ticket({ title, description }: { title: string; description: string }) {
    return <div className="ticket">
        <h3>{title}</h3>
        <p>{description}</p>
    </div>;
}