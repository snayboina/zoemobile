import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, Minus } from 'lucide-react-native';
import { theme } from '../../theme';

export interface QuantitySelectorProps {
  /** Quantidade selecionada atualmente */
  value: number;
  /** Callback disparado ao alterar a quantidade */
  onChanged: (newValue: number) => void;
  /** Rótulo exibido à esquerda */
  label?: string;
  /** Quantidade mínima permitida (padrão: 1) */
  min?: number;
  /** Quantidade máxima permitida (ex: estoque disponível) */
  max?: number;
  /** Unidade de medida (ex: 'UN', 'PAR', 'KG', 'CX', 'M') */
  unit?: string;
  /** Quantidade em estoque para exibição informativa complementar */
  estoqueDisponivel?: number;
  /** Desabilita o componente */
  disabled?: boolean;
}

/**
 * Seletor de Quantidade Industrial ZOESTOCK.
 * 
 * Recursos:
 * - Botões ergonômicos táteis com área mínima de 48px.
 * - Entrada manual via teclado com validação estrita de inteiros.
 * - Tratamento de valores inválidos (reversão ao min ou ao teto máximo).
 * - Exibição da unidade e do estoque disponível.
 * - Acessibilidade completa e feedback tátil.
 */
export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChanged,
  label = 'Quantidade *',
  min = 1,
  max,
  unit = 'UN',
  estoqueDisponivel,
  disabled = false,
}) => {
  const [textValue, setTextValue] = useState<string>(String(value));

  // Sincroniza o valor textual quando o valor da prop mudar externamente
  useEffect(() => {
    setTextValue(String(value));
  }, [value]);

  const triggerHaptic = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignora silenciosamente
    }
  }, []);

  const sanitizeAndApply = useCallback((rawNum: number) => {
    let sanitized = rawNum;
    if (isNaN(sanitized) || sanitized < min) {
      sanitized = min;
    }
    if (max !== undefined && sanitized > max) {
      sanitized = max;
    }
    setTextValue(String(sanitized));
    onChanged(sanitized);
  }, [min, max, onChanged]);

  const handleIncrement = () => {
    if (disabled) return;
    if (max !== undefined && value >= max) return;
    triggerHaptic();
    const next = value + 1;
    sanitizeAndApply(next);
  };

  const handleDecrement = () => {
    if (disabled) return;
    if (value <= min) return;
    triggerHaptic();
    const prev = value - 1;
    sanitizeAndApply(prev);
  };

  const handleTextChange = (text: string) => {
    // Permite apenas dígitos
    const digitsOnly = text.replace(/[^0-9]/g, '');
    setTextValue(digitsOnly);

    if (digitsOnly.length > 0) {
      const parsed = parseInt(digitsOnly, 10);
      if (!isNaN(parsed)) {
        if (max !== undefined && parsed > max) {
          sanitizeAndApply(max);
        } else if (parsed >= min) {
          onChanged(parsed);
        }
      }
    }
  };

  const handleBlur = () => {
    if (textValue.trim() === '') {
      sanitizeAndApply(min);
    } else {
      const parsed = parseInt(textValue, 10);
      sanitizeAndApply(parsed);
    }
  };

  const isMinReached = value <= min || disabled;
  const isMaxReached = (max !== undefined && value >= max) || disabled;

  return (
    <View style={styles.container} testID="quantity-selector-container">
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {estoqueDisponivel !== undefined ? (
          <Text style={styles.estoqueInfo}>
            Disponível: <Text style={styles.estoqueDestaque}>{estoqueDisponivel} {unit}</Text>
          </Text>
        ) : null}
      </View>

      <View style={[styles.controlBox, disabled && styles.controlBoxDisabled]}>
        {/* Botão Decrementar (-) */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.stepperButton, isMinReached && styles.stepperDisabled]}
          onPress={handleDecrement}
          disabled={isMinReached}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Diminuir quantidade"
          testID="btn-decrement"
        >
          <Minus size={20} color={isMinReached ? theme.colors.textMuted : theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Input Numérico Central */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={textValue}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="number-pad"
            editable={!disabled}
            textAlign="center"
            selectTextOnFocus
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel="Valor da quantidade"
            testID="quantity-input"
          />
        </View>

        {/* Botão Incrementar (+) */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.stepperButton, isMaxReached && styles.stepperDisabled]}
          onPress={handleIncrement}
          disabled={isMaxReached}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aumentar quantidade"
          testID="btn-increment"
        >
          <Plus size={20} color={isMaxReached ? theme.colors.textMuted : theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Tag da Unidade (Ex: UN, PAR, KG) */}
        <View style={styles.unitTag}>
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  estoqueInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  estoqueDestaque: {
    fontWeight: '700',
    color: theme.colors.warning,
  },
  controlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  controlBoxDisabled: {
    opacity: 0.5,
  },
  stepperButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    width: '100%',
    height: '100%',
    padding: 0,
  },
  unitTag: {
    width: 48,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.borderSubtle,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
});
