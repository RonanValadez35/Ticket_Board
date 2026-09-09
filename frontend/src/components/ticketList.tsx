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

    return (
        <div className="ticket-list">
            <h2>{title}</h2>
            {tickets
                .filter((ticket) => ticket.status === title)
                .map((ticket) => (
                    <Ticket
                        key={ticket.id}
                        id={ticket.id}
                        title={ticket.title}
                        description={ticket.description}
                    />
                ))}
        </div>
    );
}