import React from 'react';
import { LogOut, User, Building, HardDrive, Package } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface DiagnosticScreenProps {
  onNavigate: (route: string) => void;
}

export const EnvironmentDiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ onNavigate }) => {
  const { funcionario, session, device, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  return (
    <div className="diagnostic-screen" data-testid="staging-environment-banner">
      <div className="staging-header-banner">
        <span className="staging-tag">FASE 4 HOMOLOGADA • PWA CHROME</span>
        <h2>ZOESTOCK OPERACIONAL</h2>
        <p>Ambiente PWA de Homologação de Sessão, EPIs e Dispositivo</p>
      </div>

      <div className="diagnostic-content">
        <div className="session-card">
          <div className="card-header">
            <User size={20} className="text-primary" />
            <h3>Colaborador Autenticado</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>Nome:</span>
              <strong>{funcionario?.nome || session?.nome || 'Operador Industrial'}</strong>
            </div>
            <div className="info-row">
              <span>Matrícula / Crachá:</span>
              <strong>{funcionario?.cracha || session?.cracha || 'CR-001'}</strong>
            </div>
            <div className="info-row">
              <span>Status:</span>
              <span className="status-badge-active">Ativo & Autorizado</span>
            </div>
          </div>
        </div>

        <div className="session-card">
          <div className="card-header">
            <Building size={20} className="text-primary" />
            <h3>Empresa & Unidade</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>Empresa:</span>
              <strong>{session?.empresaNome || 'Unidade Fabril Principal'}</strong>
            </div>
            <div className="info-row">
              <span>ID Tenant:</span>
              <code>{session?.empresaId || 'MATRIZ-01'}</code>
            </div>
          </div>
        </div>

        <div className="session-card">
          <div className="card-header">
            <HardDrive size={20} className="text-primary" />
            <h3>Identificação PWA</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>ID Aparelho:</span>
              <code>{device.deviceId}</code>
            </div>
            <div className="info-row">
              <span>Navegador:</span>
              <span>{device.manufacturer}</span>
            </div>
          </div>
        </div>

        <div className="staging-notice-card">
          <Package size={24} className="text-warning" />
          <div>
            <strong>Módulos Operacionais da Fase 5:</strong>
            <p>
              Entrada, Saída de EPI com Trava de CA, Devolução, Nada Consta e Inventário
              serão integrados na sequência.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-logout"
          data-testid="btn-staging-logout"
        >
          <LogOut size={18} />
          <span>Encerrar Sessão (Logout Seguro)</span>
        </button>
      </div>
    </div>
  );
};
