import { useEffect, useState } from "react";
import Ticket from "./ticket";
import "../styles/ticket.css";

type TicketData = {
    id: number;
    title: string;
    description: string;
    status: string;
};

export default function TicketList({ title }: { title: string }) {
    const [tickets, setTickets] = useState<TicketData[]>([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/")
            .then((res) => res.json())
            .then((data: TicketData[]) => setTickets(data));
    }, []);

    const visibleTickets = tickets.filter((ticket) => ticket.status === title);
    const statusClass = title.toLowerCase().replaceAll(" ", "-");

    return (
        <section className={`ticket-list ticket-list--${statusClass}`}>
            <header className="ticket-list-header">
                <div>
                    <span className="status-dot" aria-hidden="true" />
                    <h2>{title}</h2>
                </div>
                <span className="ticket-count">{visibleTickets.length}</span>
            </header>
            <div className="ticket-list-content">
                {visibleTickets.map((ticket) => (
                    <Ticket
                        key={ticket.id}
                        id={ticket.id}
                        title={ticket.title}
                        description={ticket.description}
                        onDeleted={(deletedId) =>
                            setTickets((currentTickets) =>
                                currentTickets.filter(
                                    (currentTicket) =>
                                        currentTicket.id !== deletedId,
                                ),
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}