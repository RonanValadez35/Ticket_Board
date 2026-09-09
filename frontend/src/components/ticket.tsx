import editIcon from "../assets/edit_icon.png";
import { useNavigate } from "react-router-dom";
import "../styles/ticket.css";

type TicketProps = {
    id: number;
    title: string;
    description: string;
};

export default function Ticket({ id, title, description }: TicketProps) {
    const navigate = useNavigate();

    return (
        <div className="ticket">
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
        </div>
    );
}