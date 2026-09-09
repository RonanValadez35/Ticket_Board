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
};
