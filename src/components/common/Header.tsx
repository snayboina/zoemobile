import React from 'react';
import { ArrowLeft, RotateCw, LogOut } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'ZOESTOCK',
  showBack = false,
  onBack,
  showRefresh = false,
  onRefresh,
  showLogout = false,
  onLogout,
  isRefreshing = false,
}) => {
  return (
    <header className="zoestock-header">
      <div className="zoestock-header-left">
        {showBack && (
          <button
            type="button"
            className="zoestock-header-btn"
            onClick={onBack}
            aria-label="Voltar"
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </button>
        )}
      </div>

      <div className="zoestock-header-center">
        <h1 className="zoestock-header-title">{title}</h1>
      </div>

      <div className="zoestock-header-right">
        {showRefresh && (
          <button
            type="button"
            className={`zoestock-header-btn ${isRefreshing ? 'rotating' : ''}`}
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar dados"
          >
            <RotateCw size={20} color="#FFFFFF" />
          </button>
        )}
        {showLogout && (
          <button
            type="button"
            className="zoestock-header-btn"
            onClick={onLogout}
            aria-label="Encerrar sessão"
          >
            <LogOut size={20} color="#FFFFFF" />
          </button>
        )}
      </div>
    </header>
  );
};
