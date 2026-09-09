import { type DragEvent, useState } from "react";
import Ticket from "./ticket";
import type { TicketData, TicketStatus } from "../types/ticket";
import "../styles/ticket.css";

type TicketListProps = {
    title: TicketStatus;
    tickets: TicketData[];
    onDropTicket: (ticketId: number, status: TicketStatus) => void;
    onTicketDeleted: (ticketId: number) => void;
};

export default function TicketList({
    title,
    tickets,
    onDropTicket,
    onTicketDeleted,
}: TicketListProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    function handleDragOver(event: DragEvent<HTMLElement>) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
    }

    function handleDragLeave(event: DragEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragOver(false);
        }
    }

    function handleDrop(event: DragEvent<HTMLElement>) {
        event.preventDefault();
        setIsDragOver(false);

        const ticketId = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isInteger(ticketId) && ticketId > 0) {
            onDropTicket(ticketId, title);
        }
    }

    const statusClass = title.toLowerCase().replaceAll(" ", "-");

    return (
        <section
            className={[
                "ticket-list",
                `ticket-list--${statusClass}`,
                isDragOver ? "ticket-list--drag-over" : "",
            ].join(" ")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <header className="ticket-list-header">
                <div>
                    <span className="status-dot" aria-hidden="true" />
                    <h2>{title}</h2>
                </div>
                <span className="ticket-count">{tickets.length}</span>
            </header>
            <div className="ticket-list-content">
                {tickets.map((ticket) => (
                    <Ticket
                        key={ticket.id}
                        id={ticket.id}
                        title={ticket.title}
                        description={ticket.description}
                        onDeleted={onTicketDeleted}
                    />
                ))}
            </div>
        </section>
    );
}