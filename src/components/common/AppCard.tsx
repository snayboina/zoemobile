import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface AppCardProps extends ViewProps {
  elevated?: boolean;
  highlightBorder?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  elevated = false,
  highlightBorder = false,
  style,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.card,
        elevated ? styles.elevated : styles.surface,
        highlightBorder && styles.highlight,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  surface: {
    backgroundColor: theme.colors.surface,
  },
  elevated: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  highlight: {
    borderColor: theme.colors.primary,
  },
});
