import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, AlertCircle, Clock } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { AppInput } from '../../components/common/AppInput';
import { PinKeyboard } from '../../components/common/PinKeyboard';
import { theme } from '../../theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [cracha, setCracha] = useState<string>('');
  const [crachaError, setCrachaError] = useState<string | null>(null);
    const [showKeyboard, setShowKeyboard] = useState<boolean>(true);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const {
    login,
    isLoading,
    errorMessage,
    blockedUntil,
    isDevicePending,
    isDeviceBlocked,
    clearError,
  } = useAuthStore();

  // Redireciona se o aparelho estiver pendente ou bloqueado
  useEffect(() => {
    if (isDevicePending || isDeviceBlocked) {
      navigation.replace('PendingDevice');
    }
  }, [isDevicePending, isDeviceBlocked, navigation]);

  // Gerenciador do temporizador de bloqueio por força bruta
  useEffect(() => {
    if (!blockedUntil) {
      setCountdownSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((blockedUntil.getTime() - now) / 1000));
      setCountdownSeconds(diff);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  const isBlocked = countdownSeconds > 0;

  const handlePinComplete = useCallback(async (pinValue: string) => {
    if (!cracha.trim()) {
      setCrachaError('Informe a matrícula ou número do crachá.');
      return;
    }
    setCrachaError(null);
    clearError();

    const success = await login(cracha.trim(), pinValue);
    if (success) {
      navigation.replace('DiagnosticHome');
    } else {
      setResetTrigger((prev) => prev + 1);
      const state = useAuthStore.getState();
      if (state.isDevicePending || state.isDeviceBlocked) {
        navigation.replace('PendingDevice');
      }
    }
  }, [cracha, clearError, login, navigation]);

  const formatTimer = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} testID="login-screen-container">
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho Institucional ZOESTOCK */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title} accessibilityRole="header">
              ZOESTOCK
            </Text>
            <Text style={styles.subtitle}>
              Controle de Estoque e Operação Industrial
            </Text>
          </View>

          {/* Campo 1: Matrícula / Crachá */}
          <View style={styles.inputSection}>
            <AppInput
              label="Crachá / Matrícula"
              placeholder="Digite o número da sua matrícula"
              value={cracha}
              onChangeText={(text) => {
                setCracha(text);
                if (crachaError) setCrachaError(null);
              }}
              error={crachaError || undefined}
              editable={!isLoading && !isBlocked}
              autoCapitalize="characters"
              testID="input-cracha"
            />
          </View>

          {/* Indicador de Bloqueio por Força Bruta */}
          {isBlocked ? (
            <View style={styles.bruteForceBanner} testID="login-blocked-banner">
              <Clock size={20} color={theme.colors.danger} />
              <View style={styles.bruteForceTextContainer}>
                <Text style={styles.bruteForceTitle}>Acesso Temporariamente Bloqueado</Text>
                <Text style={styles.bruteForceTimer}>
                  Tente novamente em <Text style={styles.boldTimer}>{formatTimer(countdownSeconds)}</Text>
                </Text>
              </View>
            </View>
          ) : null}

          {/* Mensagem de Erro de Autenticação */}
          {errorMessage && !isBlocked ? (
            <View style={styles.errorBanner} testID="login-error-banner">
              <AlertCircle size={18} color={theme.colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Seção do Teclado PIN Industrial */}
          <View style={styles.pinSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowKeyboard((prev) => !prev)}
              style={styles.pinToggleBar}
            >
              <View style={styles.pinLabelRow}>
                <Lock size={16} color={theme.colors.primary} />
                <Text style={styles.pinLabel}>PIN de Segurança (4 Dígitos)</Text>
              </View>
            </TouchableOpacity>

            {showKeyboard && !isBlocked ? (
              <PinKeyboard
                pinLength={4}
                onComplete={handlePinComplete}
                resetTrigger={resetTrigger}
                loading={isLoading}
                title=""
                errorMessage={undefined}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: 12,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  inputSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  bruteForceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  bruteForceTextContainer: {
    flex: 1,
  },
  bruteForceTitle: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
  bruteForceTimer: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    marginTop: 2,
  },
  boldTimer: {
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  pinSection: {
    marginTop: 4,
    alignItems: 'center',
  },
  pinToggleBar: {
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    marginBottom: 8,
  },
  pinLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
