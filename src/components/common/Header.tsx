import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { AppText } from './AppText';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleArea}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <AppText variant="bodyBold" color={theme.colors.primaryLight}>
              ←
            </AppText>
          </TouchableOpacity>
        )}
        <View>
          <AppText variant="h2">{title}</AppText>
          {subtitle && (
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
