import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X, Zap, ZapOff, Keyboard, Camera as CameraIcon } from 'lucide-react-native';
import { theme } from '../../theme';

export interface BarcodeScannerModalProps {
  /** Controla a visibilidade do modal */
  visible: boolean;
  /** Callback executado ao ler um código com sucesso */
  onScan: (barcode: string) => void;
  /** Callback para fechar o modal */
  onClose: () => void;
  /** Título do leitor */
  title?: string;
  /** Instrução personalizada */
  instructionText?: string;
}

/**
 * Modal de Leitura de Código de Barras / QR Code Industrial ZOESTOCK.
 * 
 * Destaques de engenharia e confiabilidade operacional:
 * - Compatível com Expo SDK 52 via CameraView oficial.
 * - Gerenciamento robusto de permissões da câmera com feedback amigável.
 * - Prevenção estrita de leituras duplicadas (debounce atômico com ref).
 * - Mira industrial com cantoneiras destacadas no vermelho ZOESTOCK (#D32F2F).
 * - Alternância de lanterna (Torch) para almoxarifados escuros.
 * - Fallback para digitação manual do código quando a etiqueta estiver danificada.
 * - Feedback tátil de sucesso na leitura.
 */
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onScan,
  onClose,
  title = 'Ler Código de Barras',
  instructionText = 'Posicione o código na área marcada',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const isScannedRef = useRef<boolean>(false);

  // Reseta a trava ao abrir o modal
  React.useEffect(() => {
    if (visible) {
      isScannedRef.current = false;
      setTorchEnabled(false);
      setManualMode(false);
      setManualCode('');
    }
  }, [visible]);

  const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (isScannedRef.current) return;
    if (!result.data) return;

    isScannedRef.current = true;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignora silenciosamente
    }

    onScan(result.data.trim());
    onClose();
  }, [onScan, onClose]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    isScannedRef.current = true;
    onScan(manualCode.trim());
    onClose();
  };

  const toggleTorch = () => {
    setTorchEnabled((prev) => !prev);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Barra Superior de Controles */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>

          <View style={styles.headerActions}>
            {!manualMode && permission?.granted ? (
              <TouchableOpacity
                onPress={toggleTorch}
                style={[styles.iconButton, torchEnabled && styles.iconButtonActive]}
                accessibilityLabel={torchEnabled ? 'Desligar lanterna' : 'Ligar lanterna'}
                accessibilityRole="button"
                testID="btn-toggle-torch"
              >
                {torchEnabled ? (
                  <Zap size={22} color={theme.colors.warning} />
                ) : (
                  <ZapOff size={22} color={theme.colors.textPrimary} />
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => setManualMode((prev) => !prev)}
              style={styles.iconButton}
              accessibilityLabel={manualMode ? 'Voltar para Câmera' : 'Entrada Manual'}
              accessibilityRole="button"
              testID="btn-toggle-manual"
            >
              {manualMode ? (
                <CameraIcon size={22} color={theme.colors.textPrimary} />
              ) : (
                <Keyboard size={22} color={theme.colors.textPrimary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.iconButton, styles.closeButton]}
              accessibilityLabel="Fechar leitor"
              accessibilityRole="button"
              testID="btn-close-scanner"
            >
              <X size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modo Entrada Manual */}
        {manualMode ? (
          <View style={styles.manualContainer} testID="scanner-manual-view">
            <Text style={styles.manualTitle}>Digitação Manual de Código</Text>
            <Text style={styles.manualSubtitle}>
              Utilize esta opção caso a etiqueta esteja ilegível ou danificada.
            </Text>

            <TextInput
              style={styles.manualInput}
              placeholder="Digite o código (ex: 789123456789)"
              placeholderTextColor={theme.colors.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="default"
              autoCapitalize="characters"
              autoFocus
              onSubmitEditing={handleManualSubmit}
              testID="input-manual-barcode"
            />

            <TouchableOpacity
              style={[
                styles.manualConfirmButton,
                !manualCode.trim() && styles.manualConfirmButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!manualCode.trim()}
              testID="btn-confirm-manual-code"
            >
              <Text style={styles.manualConfirmText}>CONFIRMAR CÓDIGO</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Modo Scanner Câmera */
          <View style={styles.scannerWrapper} testID="scanner-camera-wrapper">
            {!permission ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Carregando leitor de código...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.permissionContainer} testID="scanner-permission-denied">
                <Text style={styles.permissionTitle}>Permissão de Câmera Necessária</Text>
                <Text style={styles.permissionText}>
                  O ZOESTOCK Mobile necessita de acesso à câmera para bipar produtos e crachás industriais.
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                  accessibilityRole="button"
                  testID="btn-request-permission"
                >
                  <Text style={styles.permissionButtonText}>AUTORIZAR CÂMERA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fallbackManualLink}
                  onPress={() => setManualMode(true)}
                >
                  <Text style={styles.fallbackManualText}>Ou digitar código manualmente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  enableTorch={torchEnabled}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      'qr',
                      'ean13',
                      'ean8',
                      'code128',
                      'code39',
                      'upc_a',
                      'upc_e',
                      'itf14',
                    ],
                  }}
                  onBarcodeScanned={handleBarcodeScanned}
                />

                {/* Overlay com Mira Industrial ZOESTOCK */}
                <View style={styles.overlay}>
                  <View style={styles.overlayTop} />
                  <View style={styles.overlayCenterRow}>
                    <View style={styles.overlaySide} />
                    <View style={styles.targetBox} testID="scanner-target-box">
                      {/* Cantoneiras Vermelhas de Mira */}
                      <View style={[styles.corner, styles.cornerTL]} />
                      <View style={[styles.corner, styles.cornerTR]} />
                      <View style={[styles.corner, styles.cornerBL]} />
                      <View style={[styles.corner, styles.cornerBR]} />
                      {/* Linha laser central indicativa */}
                      <View style={styles.laserLine} />
                    </View>
                    <View style={styles.overlaySide} />
                  </View>
                  <View style={styles.overlayBottom}>
                    <View style={styles.instructionPill}>
                      <Text style={styles.instructionText}>{instructionText}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const TARGET_SIZE = 250;
const CORNER_SIZE = 24;
const CORNER_BORDER = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  closeButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
  },
  scannerWrapper: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayCenterRow: {
    height: TARGET_SIZE,
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  targetBox: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: theme.colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderBottomRightRadius: 6,
  },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(211, 47, 47, 0.7)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  instructionPill: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  instructionText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  manualContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  manualTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  manualSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  manualInput: {
    height: 56,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  manualConfirmButton: {
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualConfirmButtonDisabled: {
    opacity: 0.5,
  },
  manualConfirmText: {
    color: theme.colors.textWhite,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  permissionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: theme.colors.textWhite,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fallbackManualLink: {
    marginTop: 20,
    padding: 10,
  },
  fallbackManualText: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
