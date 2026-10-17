import React, { useState } from 'react';
// scanner icons
import { Header } from '../../components/common/Header';

interface ScannerScreenProps {
  onBack: () => void;
  onCodeScanned?: (code: string) => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onBack, onCodeScanned }) => {
  const [codigoManual, setCodigoManual] = useState<string>('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const handleSubmeterCodigo = (code: string) => {
    if (!code.trim()) return;
    setMensagemSucesso(`Código detectado: ${code.trim()}`);
    if (onCodeScanned) {
      onCodeScanned(code.trim());
    }
  };

  return (
    <div className="zoestock-page-container scanner-page">
      <Header title="Scanner de Código de Barras" showBack={true} onBack={onBack} />

      <main className="scanner-view-container">
        {/* Mirador do Scanner Centralizado */}
        <div className="scanner-camera-box">
          <div className="scanner-reticle animate-pulse-border">
            <div className="scanner-laser-line animate-laser-scan" />
          </div>
          <div className="scanner-hint-text">
            Centralize o código de barras ou QR Code no quadrado
          </div>
        </div>

        {mensagemSucesso && (
          <div className="scanner-success-badge">
            {mensagemSucesso}
          </div>
        )}

        {/* Entrada Manual de Contingência */}
        <div className="scanner-manual-box">
          <label className="field-label" style={{ color: '#FFFFFF' }}>
            Digitação Manual / Leitor Barcode USB:
          </label>
          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o código..."
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmeterCodigo(codigoManual)}
              autoFocus
            />
            <button
              type="button"
              className="btn-search-action red"
              onClick={() => handleSubmeterCodigo(codigoManual)}
            >
              OK
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
