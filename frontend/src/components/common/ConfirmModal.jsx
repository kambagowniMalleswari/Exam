import React, { useEffect } from "react";
import { TrashIcon, AlertTriangleIcon } from "./Icons.jsx";
import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-backdrop"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-modal-icon-bubble ${type}`}>
          {type === "danger" ? <TrashIcon size={26} /> : <AlertTriangleIcon size={26} />}
        </div>

        <h3 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h3>

        <div className="confirm-modal-message">
          <p>{message}</p>
          {itemName && (
            <div className="confirm-modal-highlight-box">
              <span>{itemName}</span>
            </div>
          )}
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-confirm-action ${type}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
