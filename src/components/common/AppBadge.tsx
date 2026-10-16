import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { AppText } from './AppText';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'epi' | 'neutral';

interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const AppBadge: React.FC<AppBadgeProps> = ({ label, variant = 'neutral' }) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.successBackground, text: theme.colors.success };
      case 'warning':
        return { bg: theme.colors.warningBackground, text: theme.colors.warning };
      case 'danger':
        return { bg: theme.colors.dangerBackground, text: theme.colors.danger };
      case 'info':
        return { bg: '#082F49', text: theme.colors.info };
      case 'epi':
        return { bg: '#2E1065', text: theme.colors.badgeEpi };
      case 'neutral':
      default:
        return { bg: theme.colors.surfaceElevated, text: theme.colors.textSecondary };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText variant="badge" color={text}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
});
