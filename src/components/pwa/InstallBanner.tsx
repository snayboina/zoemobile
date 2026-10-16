import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const InstallBanner: React.FC = () => {
  const { canInstall, hasPromptNative, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    if (hasPromptNative) {
      await promptInstall();
    } else if (isIOS) {
      setShowIosModal(true);
    }
  };

  return (
    <>
      <div className="install-banner">
        <div className="install-banner-content">
          <div className="install-banner-icon">
            <Smartphone size={24} className="text-primary" />
          </div>
          <div className="install-banner-text">
            <strong>Instale o ZOESTOCK no Celular</strong>
            <p>Acesse rápido da tela inicial e trabalhe sem navegador.</p>
          </div>
        </div>

        <div className="install-banner-actions">
          <button
            onClick={handleInstallClick}
            className="btn-install-pwa"
            title="Instalar no celular"
          >
            <Download size={16} />
            <span>Instalar Aplicativo</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="btn-close-banner"
            aria-label="Fechar banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Modal de Instruções para iPhone / iOS */}
      {showIosModal && (
        <div className="modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Como instalar no iPhone</h3>
              <button onClick={() => setShowIosModal(false)} className="btn-close-modal">
                <X size={20} />
              </button>
            </div>
            <div className="ios-steps">
              <div className="ios-step">
                <span className="step-num">1</span>
                <p>No Safari, toque no botão <strong>Compartilhar</strong> <Share size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> na barra inferior.</p>
              </div>
              <div className="ios-step">
                <span className="step-num">2</span>
                <p>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</p>
              </div>
              <div className="ios-step">
                <span className="step-num">3</span>
                <p>Toque em <strong>Adicionar</strong> no canto superior direito.</p>
              </div>
            </div>
            <button onClick={() => setShowIosModal(false)} className="btn-modal-ok">
              <Check size={18} />
              <span>Entendi</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
