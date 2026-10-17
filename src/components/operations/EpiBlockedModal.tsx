import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface EpiBlockedModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const EpiBlockedModal: React.FC<EpiBlockedModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content epi-blocked-card animate-scale-up">
        <div className="epi-icon-wrapper">
          <ShieldAlert size={48} color="#D32F2F" />
        </div>
        <h3 className="epi-blocked-title">{title}</h3>
        <p className="epi-blocked-message">{message}</p>
        <button
          type="button"
          className="btn-danger-confirm"
          onClick={onClose}
        >
          ENTENDIDO
        </button>
      </div>
    </div>
  );
};
