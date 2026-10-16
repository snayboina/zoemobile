import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ViewProps,
  StatusBar,
} from 'react-native';
import { theme } from '../../theme';

interface ScreenContainerProps extends ViewProps {
  scrollable?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {scrollable ? (
        <ScrollView
          style={[styles.container, style]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    paddingVertical: theme.spacing.md,
  },
});
