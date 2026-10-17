import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Header } from '../../components/common/Header';
import { playIndustrialBeep, extrairMatriculaCracha } from '../../components/common/QrCodeScannerModal';
import { Camera, AlertCircle } from 'lucide-react';

interface ScannerScreenProps {
  onBack: () => void;
  onCodeScanned?: (code: string) => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onBack, onCodeScanned }) => {
  const [codigoManual, setCodigoManual] = useState<string>('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'main-scanner-container';

  useEffect(() => {
    let isMounted = true;
    setIsLoadingCamera(true);
    setCameraError(null);

    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (w, h) => {
              const min = Math.min(w, h);
              return { width: Math.floor(min * 0.75), height: Math.floor(min * 0.75) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            playIndustrialBeep();
            const processado = extrairMatriculaCracha(decodedText);
            setMensagemSucesso(`Código detectado: ${processado}`);
            if (onCodeScanned) {
              onCodeScanned(processado);
            }
          },
          () => {}
        );

        if (isMounted) {
          setIsLoadingCamera(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsLoadingCamera(false);
          setCameraError('Câmera indisponível ou permissão não concedida. Utilize a digitação manual ou leitor USB.');
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
  }, [onCodeScanned]);

  const handleSubmeterCodigo = (code: string) => {
    if (!code.trim()) return;
    playIndustrialBeep();
    const processado = extrairMatriculaCracha(code);
    setMensagemSucesso(`Código detectado: ${processado}`);
    if (onCodeScanned) {
      onCodeScanned(processado);
    }
  };

  return (
    <div className="zoestock-page-container scanner-page">
      <Header title="Scanner de Código e QR Code" showBack={true} onBack={onBack} />

      <main className="scanner-view-container" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Mirador da Câmera */}
        <div className="scanner-camera-box" style={{ width: '100%', minHeight: '320px', borderRadius: '20px', overflow: 'hidden', position: 'relative', backgroundColor: '#0F172A', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div id={scannerId} className="html5-qr-reader" style={{ width: '100%' }} />

          {isLoadingCamera && !cameraError && (
            <div className="scanner-camera-loading">
              <div className="spinner"></div>
              <span>Iniciando câmera traseira...</span>
            </div>
          )}

          {cameraError && (
            <div className="scanner-camera-fallback" style={{ padding: '24px', textAlign: 'center', color: '#CBD5E1' }}>
              <AlertCircle size={40} color="#E53935" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>{cameraError}</p>
            </div>
          )}
        </div>

        {mensagemSucesso && (
          <div className="alert-box success" style={{ animation: 'scaleUp 0.2s forwards' }}>
            <Camera size={18} />
            <strong>{mensagemSucesso}</strong>
          </div>
        )}

        {/* Entrada Manual de Contingência */}
        <div className="scanner-manual-box" style={{ background: '#1E293B', padding: '16px', borderRadius: '16px' }}>
          <label className="field-label" style={{ color: '#FFFFFF', marginBottom: '8px', display: 'block' }}>
            Digitação Manual / Leitor Barcode USB:
          </label>
          <div className="search-row">
            <input
              type="text"
              className="text-input"
              placeholder="Digite o código ou bip..."
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmeterCodigo(codigoManual)}
              autoFocus={Boolean(cameraError)}
            />
            <button
              type="button"
              className="btn-search-action red"
              onClick={() => handleSubmeterCodigo(codigoManual)}
            >
              Confirmar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
