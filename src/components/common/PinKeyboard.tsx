import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Delete, RotateCcw } from 'lucide-react-native';
import { theme } from '../../theme';

export interface PinKeyboardProps {
  /** Quantidade esperada de dígitos do PIN (padrão: 4) */
  pinLength?: number;
  /** Callback disparado quando o PIN atinge a quantidade completa de dígitos */
  onComplete: (pin: string) => void;
  /** Callback opcional a cada dígito inserido ou removido */
  onChange?: (currentPin: string) => void;
  /** Bloqueia visualmente o teclado durante autenticação ou processamento */
  loading?: boolean;
  /** Mensagem ou dica exibida acima dos indicadores de PIN */
  title?: string;
  /** Mensagem de erro para destacar visualmente os dots em vermelho */
  errorMessage?: string;
  /** Limpa o PIN automaticamente de forma controlada */
  resetTrigger?: number;
}

/**
 * Teclado Numérico Virtual Industrial ZOESTOCK.
 * 
 * Regras estritas de segurança e design:
 * - NUNCA armazena nem registra o PIN em console, logs ou telemetria.
 * - Mascaramento rigoroso: apenas indicadores circulares (dots) são exibidos.
 * - Teclas táteis com dimensões industriais de 72x72px adequadas para uso operacional.
 * - Disparo único e síncrono de onComplete sem race conditions.
 * - Totalmente acessível com accessibilityLabel e roles.
 */
export const PinKeyboard: React.FC<PinKeyboardProps> = ({
  pinLength = 4,
  onComplete,
  onChange,
  loading = false,
  title = 'Digite seu PIN de 4 dígitos',
  errorMessage,
  resetTrigger,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const pinRef = useRef<string>('');
  pinRef.current = pin;

  // Efeito para resetar o PIN externamente quando solicitado
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      pinRef.current = '';
      setPin('');
      setIsSubmitting(false);
    }
  }, [resetTrigger]);

  // Se o loading externo for desligado, libera a submissão
  useEffect(() => {
    if (!loading) {
      setIsSubmitting(false);
    }
  }, [loading]);

  // Se houver mensagem de erro externa, limpa o pin e destrava o teclado
  useEffect(() => {
    if (errorMessage) {
      pinRef.current = '';
      setPin('');
      setIsSubmitting(false);
    }
  }, [errorMessage]);

  const triggerHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignora silenciosamente em ambientes que não suportam haptics
    }
  };

  const handleKeyPress = (digit: string) => {
    if (loading || isSubmitting) return;
    if (pinRef.current.length >= pinLength) return;

    const nextPin = pinRef.current + digit;
    pinRef.current = nextPin;
    setPin(nextPin);
    if (onChange) {
      onChange(nextPin);
    }
    triggerHaptic();

    if (nextPin.length === pinLength) {
      setIsSubmitting(true);
      onComplete(nextPin);
    }
  };

  const handleBackspace = () => {
    if (loading || isSubmitting) return;
    if (pinRef.current.length === 0) return;

    const nextPin = pinRef.current.slice(0, -1);
    pinRef.current = nextPin;
    setPin(nextPin);
    if (onChange) {
      onChange(nextPin);
    }
    triggerHaptic();
  };

  const handleClear = () => {
    if (loading || isSubmitting) return;

    pinRef.current = '';
    setPin('');
    if (onChange) {
      onChange('');
    }
    triggerHaptic();
  };

  const isBlocked = loading || isSubmitting;

  return (
    <View style={styles.container} testID="pin-keyboard-container">
      {/* Título e Orientação */}
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}

      {/* Indicadores Visuais de Dígitos (PIN Dots) */}
      <View
        style={styles.dotsContainer}
        accessible={true}
        accessibilityLabel={`${pin.length} de ${pinLength} dígitos preenchidos`}
      >
        {Array.from({ length: pinLength }).map((_, index) => {
          const isFilled = index < pin.length;
          const hasError = Boolean(errorMessage);

          return (
            <View
              key={index}
              testID={`pin-dot-${index}`}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                hasError && styles.dotError,
              ]}
            />
          );
        })}
      </View>

      {/* Mensagem de Erro ou Feedback */}
      {errorMessage ? (
        <Text style={styles.errorMessage} accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}

      {/* Indicador de Carregamento Centralizado */}
      {isBlocked ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Validando PIN...</Text>
        </View>
      ) : (
        <View style={styles.loadingPlaceholder} />
      )}

      {/* Matriz Numérica Industrial (3x4) */}
      <View style={styles.keysGrid}>
        {/* Linha 1 */}
        <View style={styles.row}>
          {['1', '2', '3'].map((digit) => (
            <KeyButton
              key={digit}
              label={digit}
              disabled={isBlocked}
              onPress={() => handleKeyPress(digit)}
              accessibilityLabel={`Dígito ${digit}`}
            />
          ))}
        </View>

        {/* Linha 2 */}
        <View style={styles.row}>
          {['4', '5', '6'].map((digit) => (
            <KeyButton
              key={digit}
              label={digit}
              disabled={isBlocked}
              onPress={() => handleKeyPress(digit)}
              accessibilityLabel={`Dígito ${digit}`}
            />
          ))}
        </View>

        {/* Linha 3 */}
        <View style={styles.row}>
          {['7', '8', '9'].map((digit) => (
            <KeyButton
              key={digit}
              label={digit}
              disabled={isBlocked}
              onPress={() => handleKeyPress(digit)}
              accessibilityLabel={`Dígito ${digit}`}
            />
          ))}
        </View>

        {/* Linha 4: Limpar Tudo, 0, Backspace */}
        <View style={styles.row}>
          <SpecialKeyButton
            icon={<RotateCcw size={22} color={theme.colors.textSecondary} />}
            disabled={isBlocked || pin.length === 0}
            onPress={handleClear}
            accessibilityLabel="Limpar todos os dígitos"
            testID="pin-key-clear"
          />

          <KeyButton
            label="0"
            disabled={isBlocked}
            onPress={() => handleKeyPress('0')}
            accessibilityLabel="Dígito 0"
          />

          <SpecialKeyButton
            icon={<Delete size={22} color={theme.colors.primaryLight} />}
            disabled={isBlocked || pin.length === 0}
            onPress={handleBackspace}
            accessibilityLabel="Apagar último dígito"
            testID="pin-key-backspace"
          />
        </View>
      </View>
    </View>
  );
};

interface KeyButtonProps {
  label: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

const KeyButton: React.FC<KeyButtonProps> = ({
  label,
  disabled,
  onPress,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      style={[styles.keyButton, disabled && styles.keyDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={`pin-key-${label}`}
    >
      <Text style={styles.keyText}>{label}</Text>
    </TouchableOpacity>
  );
};

interface SpecialKeyButtonProps {
  icon: React.ReactNode;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
}

const SpecialKeyButton: React.FC<SpecialKeyButtonProps> = ({
  icon,
  disabled,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      style={[styles.specialKeyButton, disabled && styles.specialKeyDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    marginHorizontal: 12,
  },
  dotFilled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dotError: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorMessage: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    marginBottom: 12,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
  },
  loadingPlaceholder: {
    height: 28,
    marginBottom: 12,
  },
  keysGrid: {
    width: '100%',
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  specialKeyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  keyDisabled: {
    opacity: 0.35,
    backgroundColor: theme.colors.surfaceElevated,
  },
  specialKeyDisabled: {
    opacity: 0.25,
  },
});
