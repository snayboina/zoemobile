import React, { useState, useEffect } from 'react';
import { KeyRound, X } from 'lucide-react';

export interface PinModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  colaboradorNome?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onConfirm: (pin: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  title = 'Assinatura de Movimentação',
  subtitle,
  colaboradorNome,
  isLoading = false,
  errorMessage = null,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fechar = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
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
    if (pin.length === 6) {
      onConfirm(pin);
    }
  };

  const textoSubtitulo = subtitle
    ? subtitle
    : colaboradorNome
    ? `O colaborador ${colaboradorNome} deve digitar sua senha de movimentação (6 dígitos) para confirmar:`
    : 'Digite a senha de movimentação de 6 dígitos para autorizar a operação:';

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
            onClick={fechar}
            aria-label="Fechar"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="pin-modal-title">{title}</h3>
        <p className="pin-modal-subtitle">{textoSubtitulo}</p>

        {/* Display dos 6 dígitos */}
        <div className="pin-dots-row">
          {[0, 1, 2, 3, 4, 5].map(idx => (
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

        {/* Teclado numérico industrial de 6 dígitos */}
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
            onClick={fechar}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-modal-submit"
            onClick={() => handleSubmit()}
            disabled={isLoading || pin.length !== 6}
          >
            {isLoading ? 'Validando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
