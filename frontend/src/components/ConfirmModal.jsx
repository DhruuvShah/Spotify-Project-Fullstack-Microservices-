import { Modal } from "./Modal.jsx";

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
}) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={400}>
      <p className="confirm-msg">{message}</p>
      <div className="confirm-actions">
        <button className="confirm-cancel" onClick={onClose}>
          Cancel
        </button>
        <button className="confirm-ok" onClick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
