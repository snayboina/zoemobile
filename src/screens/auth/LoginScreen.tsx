import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { PinKeyboard } from '../../components/common/PinKeyboard';

interface LoginScreenProps {
  onNavigate: (route: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [cracha, setCracha] = useState<string>('');
  const [crachaError, setCrachaError] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const {
    login,
    isLoading,
    errorMessage,
    blockedUntil,
    isDevicePending,
    isDeviceBlocked,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    if (isDevicePending || isDeviceBlocked) {
      onNavigate('pending_device');
    }
  }, [isDevicePending, isDeviceBlocked, onNavigate]);

  useEffect(() => {
    if (!blockedUntil) {
      setCountdownSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000));
      setCountdownSeconds(diff);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const isBlocked = countdownSeconds > 0;

  const handlePinComplete = async (pinValue: string) => {
    if (!cracha.trim()) {
      setCrachaError('Informe a matrícula ou número do crachá.');
      return;
    }
    setCrachaError(null);
    clearError();

    const success = await login(cracha.trim(), pinValue);
    if (success) {
      onNavigate('home');
    } else {
      setResetTrigger((prev) => prev + 1);
      const state = useAuthStore.getState();
      if (state.isDevicePending || state.isDeviceBlocked) {
        onNavigate('pending_device');
      }
    }
  };

  const formatTimer = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="login-screen" data-testid="login-screen-container">
      <div className="login-card">
        {/* Cabeçalho */}
        <div className="login-header">
          <img src="/assets/icon.png" alt="ZOESTOCK" className="login-logo" />
          <h2 className="login-title">ZOESTOCK</h2>
          <p className="login-subtitle">Controle de Estoque e Operação Industrial</p>
        </div>

        {/* Campo Matrícula */}
        <div className="form-group">
          <label htmlFor="input-cracha" className="form-label">
            Crachá / Matrícula
          </label>
          <input
            id="input-cracha"
            data-testid="input-cracha"
            type="text"
            className={`form-input ${crachaError ? 'input-error' : ''}`}
            placeholder="Digite o número da sua matrícula"
            value={cracha}
            onChange={(e) => {
              setCracha(e.target.value.toUpperCase());
              if (crachaError) setCrachaError(null);
            }}
            disabled={isLoading || isBlocked}
            autoComplete="off"
            autoCapitalize="characters"
          />
          {crachaError && <span className="field-error-text">{crachaError}</span>}
        </div>

        {/* Banner de Bloqueio por Força Bruta */}
        {isBlocked && (
          <div className="blocked-banner" data-testid="login-blocked-banner">
            <Clock size={20} className="text-danger" />
            <div>
              <strong>Acesso Temporariamente Bloqueado</strong>
              <p>Tente novamente em <b>{formatTimer(countdownSeconds)}</b></p>
            </div>
          </div>
        )}

        {/* Banner de Erro */}
        {errorMessage && !isBlocked && (
          <div className="error-banner" data-testid="login-error-banner">
            <AlertCircle size={18} className="text-danger" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Seção PIN */}
        <div className="pin-section">
          <div className="pin-section-header">
            <Lock size={16} className="text-primary" />
            <span>PIN de Segurança (6 Dígitos)</span>
          </div>

          {!isBlocked && (
            <PinKeyboard
              pinLength={6}
              onComplete={handlePinComplete}
              resetTrigger={resetTrigger}
              loading={isLoading}
              title=""
            />
          )}
        </div>

        <div className="login-footer-security">
          <ShieldCheck size={14} />
          <span>Autenticação Criptografada • ZOESTOCK PWA</span>
        </div>
      </div>
    </div>
  );
};
