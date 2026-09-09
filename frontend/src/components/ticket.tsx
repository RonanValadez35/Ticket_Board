import editIcon from "../assets/edit_icon.png";
import deleteIcon from "../assets/delete_icon.png";
import { type DragEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteTicketModal from "./deleteTicketModal";
import "../styles/ticket.css";

type TicketProps = {
    id: number;
    title: string;
    description: string;
    onDeleted: (id: number) => void;
};

export default function Ticket({ id, title, description, onDeleted }: TicketProps) {
    const navigate = useNavigate();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    function handleDragStart(event: DragEvent<HTMLDivElement>) {
        if ((event.target as HTMLElement).closest("button")) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.setData("text/plain", String(id));
        event.dataTransfer.effectAllowed = "move";
        event.currentTarget.classList.add("ticket--dragging");
    }

    function handleDragEnd(event: DragEvent<HTMLDivElement>) {
        event.currentTarget.classList.remove("ticket--dragging");
    }

    async function deleteTicket() {
        setIsDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/tickets/${id}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                throw new Error("Delete request failed");
            }

            onDeleted(id);
        } catch {
            setDeleteError("Could not delete ticket.");
            setIsDeleting(false);
        }
    }

    return (
        <>
            <div
                className="ticket"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <h3>{title}</h3>
                <p>{description}</p>
                <button
                    type="button"
                    className="ticket-edit-button"
                    aria-label={`Edit ${title}`}
                    onClick={() => navigate(`/tickets/${id}/edit`)}
                >
                    <img src={editIcon} alt="" />
                </button>
                <button
                    type="button"
                    className="ticket-delete-button"
                    aria-label={`Delete ${title}`}
                    onClick={() => setShowDeleteConfirmation(true)}
                >
                    <img src={deleteIcon} alt="" />
                </button>
            </div>

            {showDeleteConfirmation && (
                <DeleteTicketModal
                    title={title}
                    isDeleting={isDeleting}
                    error={deleteError}
                    onConfirm={deleteTicket}
                    onCancel={() => setShowDeleteConfirmation(false)}
                />
            )}
        </>
    );
}