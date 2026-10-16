import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AlertCircle, HelpCircle } from 'lucide-react-native';
import { theme } from '../../theme';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const isDanger = variant === 'danger';
  const actionColor = isDanger ? theme.colors.danger : theme.colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard} testID="confirmation-modal-card">
          <View style={styles.iconRow}>
            {isDanger ? (
              <AlertCircle size={36} color={theme.colors.danger} />
            ) : (
              <HelpCircle size={36} color={theme.colors.primary} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
              testID="btn-modal-cancel"
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.confirmButton, { backgroundColor: actionColor }]}
              onPress={onConfirm}
              disabled={loading}
              testID="btn-modal-confirm"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: 20,
    alignItems: 'center',
  },
  iconRow: {
    marginBottom: 12,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
