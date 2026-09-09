type DeleteTicketModalProps = {
    title: string;
    isDeleting: boolean;
    error: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function DeleteTicketModal({
    title,
    isDeleting,
    error,
    onConfirm,
    onCancel,
}: DeleteTicketModalProps) {
    return (
        <div className="delete-modal-backdrop">
            <div
                className="delete-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
            >
                <h3 id="delete-modal-title">
                    Are you sure you want to delete this ticket?
                </h3>
                <p>{title}</p>
                {error && <p className="delete-error">{error}</p>}
                <div className="delete-modal-actions">
                    <button
                        type="button"
                        className="confirm-delete-button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete ticket"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
}
