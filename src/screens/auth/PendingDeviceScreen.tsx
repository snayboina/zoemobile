import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, RotateCw, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface PendingDeviceScreenProps {
  onNavigate: (route: string) => void;
}

export const PendingDeviceScreen: React.FC<PendingDeviceScreenProps> = ({ onNavigate }) => {
  const { device, isDeviceBlocked, recheckDeviceApproval, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRecheck = async () => {
    setChecking(true);
    setFeedback(null);
    const approved = await recheckDeviceApproval();
    setChecking(false);
    if (approved) {
      onNavigate('home');
    } else {
      setFeedback('Aparelho ainda não aprovado. Contate o administrador do sistema.');
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  return (
    <div className="pending-screen" data-testid="pending-device-screen-container">
      <div className="pending-card">
        <div className="pending-icon-wrapper">
          {isDeviceBlocked ? (
            <ShieldAlert size={48} className="text-danger" />
          ) : (
            <AlertTriangle size={48} className="text-warning" />
          )}
        </div>

        <h2 className="pending-title">
          {isDeviceBlocked ? 'Aparelho Bloqueado' : 'Aguardando Aprovação'}
        </h2>

        <p className="pending-description">
          {isDeviceBlocked
            ? 'Este dispositivo teve seu acesso revogado ou bloqueado pelo administrador.'
            : 'Este aparelho foi registrado no sistema e aguarda autorização da equipe de segurança para acessar o estoque.'}
        </p>

        {/* Card de Metadados */}
        <div className="device-metadata-card" data-testid="device-metadata-card">
          <div className="metadata-row">
            <span className="metadata-label">ID do Aparelho:</span>
            <span className="metadata-value">{device.deviceId}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Dispositivo:</span>
            <span className="metadata-value">{device.deviceName}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Plataforma:</span>
            <span className="metadata-value">{device.platform}</span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Versão do App:</span>
            <span className="metadata-value">{device.appVersion}</span>
          </div>
        </div>

        {feedback && <div className="feedback-warning">{feedback}</div>}

        <div className="pending-actions">
          {!isDeviceBlocked && (
            <button
              type="button"
              onClick={handleRecheck}
              disabled={checking}
              className="btn-primary-action"
              data-testid="btn-recheck-device"
            >
              <RotateCw size={18} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Verificando...' : 'Verificar Aprovação'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary-action"
            data-testid="btn-back-login"
          >
            <LogOut size={18} />
            <span>Voltar ao Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
