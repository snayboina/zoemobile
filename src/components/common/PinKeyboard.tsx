import React, { useState, useRef, useEffect } from 'react';
import { Delete, RotateCcw } from 'lucide-react';

export interface PinKeyboardProps {
  pinLength?: number;
  onComplete: (pin: string) => void;
  onChange?: (currentPin: string) => void;
  loading?: boolean;
  title?: string;
  errorMessage?: string;
  resetTrigger?: number;
}

export const PinKeyboard: React.FC<PinKeyboardProps> = ({
  pinLength = 4,
  onComplete,
  onChange,
  loading = false,
  title = 'Digite seu PIN de 4 dígitos',
  errorMessage,
  resetTrigger,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const pinRef = useRef<string>('');
  pinRef.current = pin;

  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      pinRef.current = '';
      setPin('');
      setIsSubmitting(false);
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (!loading) {
      setIsSubmitting(false);
    }
  }, [loading]);

  useEffect(() => {
    if (errorMessage) {
      pinRef.current = '';
      setPin('');
      setIsSubmitting(false);
    }
  }, [errorMessage]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // Ignora
      }
    }
  };

  const handleKeyPress = (digit: string) => {
    if (loading || isSubmitting) return;
    if (pinRef.current.length >= pinLength) return;

    const nextPin = pinRef.current + digit;
    pinRef.current = nextPin;
    setPin(nextPin);
    onChange?.(nextPin);
    triggerHaptic();

    if (nextPin.length === pinLength) {
      setIsSubmitting(true);
      onComplete(nextPin);
    }
  };

  const handleBackspace = () => {
    if (loading || isSubmitting) return;
    if (pinRef.current.length === 0) return;

    const nextPin = pinRef.current.slice(0, -1);
    pinRef.current = nextPin;
    setPin(nextPin);
    onChange?.(nextPin);
    triggerHaptic();
  };

  const handleClear = () => {
    if (loading || isSubmitting) return;
    pinRef.current = '';
    setPin('');
    onChange?.('');
    triggerHaptic();
  };

  const isBlocked = loading || isSubmitting;

  return (
    <div className="pin-keyboard-container" data-testid="pin-keyboard-container">
      {title ? <h4 className="pin-title">{title}</h4> : null}

      {/* Indicadores de PIN (Dots) */}
      <div
        className="pin-dots-container"
        aria-label={`${pin.length} de ${pinLength} dígitos preenchidos`}
      >
        {Array.from({ length: pinLength }).map((_, index) => {
          const isFilled = index < pin.length;
          const hasError = Boolean(errorMessage);

          return (
            <div
              key={index}
              data-testid={`pin-dot-${index}`}
              className={`pin-dot ${isFilled ? 'filled' : ''} ${hasError ? 'error' : ''}`}
            />
          );
        })}
      </div>

      {loading ? (
        <div className="pin-loading-indicator">
          <div className="spinner"></div>
          <span>Validando PIN...</span>
        </div>
      ) : (
        <div className="pin-loading-placeholder" />
      )}

      {/* Grid Numérico Industrial */}
      <div className="pin-grid">
        <div className="pin-row">
          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isBlocked}
              onClick={() => handleKeyPress(digit)}
              className="btn-pin-key"
              data-testid={`pin-key-${digit}`}
            >
              {digit}
            </button>
          ))}
        </div>

        <div className="pin-row">
          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isBlocked}
              onClick={() => handleKeyPress(digit)}
              className="btn-pin-key"
              data-testid={`pin-key-${digit}`}
            >
              {digit}
            </button>
          ))}
        </div>

        <div className="pin-row">
          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isBlocked}
              onClick={() => handleKeyPress(digit)}
              className="btn-pin-key"
              data-testid={`pin-key-${digit}`}
            >
              {digit}
            </button>
          ))}
        </div>

        <div className="pin-row">
          <button
            type="button"
            disabled={isBlocked || pin.length === 0}
            onClick={handleClear}
            className="btn-pin-special"
            title="Limpar todos os dígitos"
            data-testid="pin-key-clear"
          >
            <RotateCcw size={20} />
          </button>

          <button
            type="button"
            disabled={isBlocked}
            onClick={() => handleKeyPress('0')}
            className="btn-pin-key"
            data-testid="pin-key-0"
          >
            0
          </button>

          <button
            type="button"
            disabled={isBlocked || pin.length === 0}
            onClick={handleBackspace}
            className="btn-pin-special"
            title="Apagar último dígito"
            data-testid="pin-key-backspace"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
