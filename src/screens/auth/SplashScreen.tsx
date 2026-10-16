import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface SplashScreenProps {
  onNavigate: (route: string) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigate }) => {
  const { checkInitialState } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const runInit = async () => {
      // Tempo mínimo para visualização da marca industrial
      await new Promise((r) => setTimeout(r, 1200));
      const nextRoute = await checkInitialState();
      if (isMounted) {
        onNavigate(nextRoute);
      }
    };
    runInit();
    return () => {
      isMounted = false;
    };
  }, [checkInitialState, onNavigate]);

  return (
    <div className="splash-screen" data-testid="splash-screen-container">
      <div className="splash-card">
        <div className="splash-logo-wrapper">
          <img src="/assets/icon.png" alt="ZOESTOCK" className="splash-logo" />
        </div>
        <h1 className="splash-title">ZOESTOCK</h1>
        <p className="splash-subtitle">Controle de Estoque e Operação Industrial</p>
        <div className="splash-spinner-container">
          <div className="spinner"></div>
          <span className="splash-loading-text">Verificando segurança e credenciais...</span>
        </div>
      </div>
    </div>
  );
};
