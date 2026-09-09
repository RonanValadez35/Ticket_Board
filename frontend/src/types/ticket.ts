export type TicketStatus =
    | "Backlog"
    | "In Progress"
    | "Under Review"
    | "Completed";

export type TicketData = {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    user_id: number | null;
    owner_username: string | null;
};
