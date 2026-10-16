import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const checkInitialState = useAuthStore((s) => s.checkInitialState);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // Pausa sutil de inicialização visual para fixação da marca
      await new Promise((res) => setTimeout(res, 1200));

      if (!isMounted) return;

      const target = await checkInitialState();

      if (!isMounted) return;

      switch (target) {
        case 'onboarding':
          navigation.replace('Onboarding');
          break;
        case 'pending_device':
          navigation.replace('PendingDevice');
          break;
        case 'home':
          navigation.replace('DiagnosticHome');
          break;
        case 'login':
        default:
          navigation.replace('Login');
          break;
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [checkInitialState, navigation]);

  return (
    <View style={styles.container} testID="splash-screen-container">
      <View style={styles.content}>
        {/* Logo ZOESTOCK */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
            testID="splash-logo-image"
          />
        </View>

        {/* Título e Subtítulo Institucional */}
        <Text style={styles.brandTitle} accessibilityRole="header">
          ZOESTOCK
        </Text>
        <Text style={styles.brandSubtitle}>
          Controle de Estoque e Operação Industrial
        </Text>

        {/* Spinner Indicador */}
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} testID="splash-loading-indicator" />
          <Text style={styles.loadingText}>Iniciando sistema...</Text>
        </View>
      </View>

      {/* Rodapé de Versão */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0 — Ambiente de Contingência</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 90,
    height: 90,
  },
  brandTitle: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 8,
  },
  brandSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 48,
  },
  spinnerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
});
