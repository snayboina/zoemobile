import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';

export interface QrCodeScannerModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onScan: (scannedValue: string) => void;
}

/**
 * Toca o bipe sonoro de confirmação industrial
 */
export const playIndustrialBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignora se não houver permissão de áudio
  }
};

/**
 * Extrai a matrícula numérica do crachá, reproduzindo a regra do Flutter original
 */
export const extrairMatriculaCracha = (code: string): string => {
  if (!code) return '';
  const trimmed = code.trim();
  const matches = trimmed.match(/\d+/g);
  if (matches && matches.length > 0) {
    let maisLonga = '';
    for (const seq of matches) {
      if (seq.length > maisLonga.length) {
        maisLonga = seq;
      }
    }
    if (maisLonga.length >= 3) {
      return maisLonga;
    }
  }
  return trimmed;
};

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  title = 'Escanear QR Code do Crachá',
  subtitle = 'Aponte a câmera para o QR Code ou Código de Barras do crachá do colaborador.',
  onClose,
  onScan,
}) => {
  const [manualCode, setManualCode] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    setIsStartingCamera(true);
    setCameraError(null);

    // Timeout para garantir que o DOM com o ID do container foi montado
    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: Math.floor(minDim * 0.75), height: Math.floor(minDim * 0.75) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            playIndustrialBeep();
            const matricula = extrairMatriculaCracha(decodedText);
            
            // Parar a câmera antes de invocar o callback
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                onScan(matricula);
                onClose();
              });
          },
          () => {
            // Callback contínuo de busca por frame - ignorar
          }
        );

        if (isMounted) {
          setIsStartingCamera(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsStartingCamera(false);
          const msg = err?.message || String(err);
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setCameraError('Permissão de câmera negada. Permita o acesso à câmera nas configurações do navegador ou digite a matrícula manualmente.');
          } else {
            setCameraError('Câmera indisponível no dispositivo. Utilize o leitor USB ou digite a matrícula abaixo.');
          }
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
        scannerRef.current = null;
      }
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  const handleSubmeterManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const limpo = manualCode.trim();
    if (!limpo) return;
    playIndustrialBeep();
    const matricula = extrairMatriculaCracha(limpo);
    onScan(matricula);
    onClose();
  };

  return (
    <div className="scanner-modal-overlay" onClick={onClose}>
      <div className="scanner-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="scanner-modal-header">
          <div className="scanner-modal-title-box">
            <Camera size={20} className="text-primary-red" />
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            className="btn-close-scanner-modal"
            onClick={onClose}
            aria-label="Fechar scanner"
          >
            <X size={20} />
          </button>
        </div>

        <p className="scanner-modal-subtitle">{subtitle}</p>

        {/* Viewfinder da Câmera */}
        <div className="scanner-viewport-box">
          <div id={scannerContainerId} className="html5-qr-reader" />

          {isStartingCamera && !cameraError && (
            <div className="scanner-camera-loading">
              <div className="spinner"></div>
              <span>Iniciando câmera traseira...</span>
            </div>
          )}

          {cameraError && (
            <div className="scanner-camera-fallback">
              <AlertCircle size={36} color="#E53935" />
              <p>{cameraError}</p>
            </div>
          )}
        </div>

        {/* Entrada Manual de Contingência / Leitor Barcode USB */}
        <form onSubmit={handleSubmeterManual} className="scanner-manual-input-box">
          <label className="scanner-manual-label">
            <Keyboard size={15} />
            <span>Digitar Crachá / Matrícula:</span>
          </label>
          <div className="scanner-input-row">
            <input
              type="text"
              className="scanner-manual-field"
              placeholder="Ex: 1001, 95626..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              autoFocus={Boolean(cameraError)}
            />
            <button
              type="submit"
              className="btn-scanner-manual-ok"
              disabled={!manualCode.trim()}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
