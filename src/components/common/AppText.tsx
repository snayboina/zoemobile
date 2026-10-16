import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface AppTextProps extends TextProps {
  variant?: keyof typeof theme.typography;
  color?: string;
  center?: boolean;
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'body',
  color = theme.colors.textPrimary,
  center = false,
  style,
  ...rest
}) => {
  return (
    <Text
      style={[
        theme.typography[variant],
        { color },
        center && styles.center,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
