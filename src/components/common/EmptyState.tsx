import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { theme } from '../../theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.container} testID="empty-state-view">
      <View style={styles.iconWrapper}>
        {icon ?? <Inbox size={48} color={theme.colors.textMuted} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionText && onAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.actionButton}
          onPress={onAction}
          testID="btn-empty-state-action"
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginVertical: 24,
  },
  iconWrapper: {
    marginBottom: 16,
    opacity: 0.8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  actionButton: {
    paddingHorizontal: 20,
    height: 42,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: theme.colors.textWhite,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
