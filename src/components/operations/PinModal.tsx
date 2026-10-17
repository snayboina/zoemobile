import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  colaboradorNome: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  colaboradorNome,
  isLoading = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}) => {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length === 4) {
      onConfirm(pin);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content pin-modal-card animate-scale-up">
        <div className="pin-modal-header">
          <div className="pin-icon-circle">
            <KeyRound size={24} color="#D32F2F" />
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="pin-modal-title">Assinatura de Movimentação</h3>
        <p className="pin-modal-subtitle">
          O colaborador <strong>{colaboradorNome}</strong> deve digitar sua senha de movimentação (4 números) para confirmar:
        </p>

        {/* Display do PIN */}
        <div className="pin-dots-row">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`pin-dot ${idx < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="pin-modal-error">
            {errorMessage}
          </div>
        )}

        {/* Teclado numérico industrial para o colaborador */}
        <div className="pin-keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              type="button"
              className="keypad-btn"
              onClick={() => handleDigit(d)}
              disabled={isLoading}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className="keypad-btn keypad-fn"
            onClick={handleClear}
            disabled={isLoading || pin.length === 0}
          >
            C
          </button>
          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleDigit('0')}
            disabled={isLoading}
          >
            0
          </button>
          <button
            type="button"
            className="keypad-btn keypad-fn"
            onClick={handleDelete}
            disabled={isLoading || pin.length === 0}
          >
            ⌫
          </button>
        </div>

        <div className="modal-actions-row">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-modal-submit"
            onClick={() => handleSubmit()}
            disabled={isLoading || pin.length !== 4}
          >
            {isLoading ? 'Validando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
