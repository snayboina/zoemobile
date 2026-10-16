import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme';
import { AppText } from './AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  style,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="captionBold" color={theme.colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      )}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          Boolean(error) && styles.inputError,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={theme.colors.danger} style={styles.footerText}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" color={theme.colors.textMuted} style={styles.footerText}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  footerText: {
    marginTop: theme.spacing.xxs,
  },
});
