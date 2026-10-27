import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary'
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container confirm-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <div className={`confirm-icon-box ${confirmVariant}`}>
            <AlertTriangle size={22} />
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirm-modal-body">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`primary-button ${confirmVariant === 'danger' ? 'danger-button' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
