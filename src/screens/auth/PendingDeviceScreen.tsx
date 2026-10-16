import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldAlert, ShieldX, Smartphone, RefreshCw, LogOut } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { AppButton } from '../../components/common/AppButton';
import { theme } from '../../theme';

type PendingDeviceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PendingDevice'>;

interface PendingDeviceScreenProps {
  navigation: PendingDeviceNavigationProp;
}

export const PendingDeviceScreen: React.FC<PendingDeviceScreenProps> = ({ navigation }) => {
  const {
    isDeviceBlocked,
    device,
    isLoading,
    recheckDeviceApproval,
    logout,
  } = useAuthStore();

  const handleRecheck = async () => {
    const isApproved = await recheckDeviceApproval();
    if (isApproved) {
      navigation.replace('DiagnosticHome');
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container} testID="pending-device-screen-container">
      <ScrollView contentContainerStyle={styles.content}>
        {/* Ícone de Status */}
        <View style={styles.iconContainer}>
          {isDeviceBlocked ? (
            <ShieldX size={80} color={theme.colors.danger} testID="icon-device-blocked" />
          ) : (
            <ShieldAlert size={80} color={theme.colors.warning} testID="icon-device-pending" />
          )}
        </View>

        {/* Título Principal */}
        <Text style={styles.title} accessibilityRole="header">
          {isDeviceBlocked ? 'Aparelho Bloqueado' : 'Aguardando Aprovação'}
        </Text>

        {/* Explicação Operacional */}
        <Text style={styles.description}>
          {isDeviceBlocked
            ? 'Este dispositivo móvel foi bloqueado ou teve a autorização revogada pelo administrador. Entre em contato com a equipe de TI ou segurança patrimonial.'
            : 'Este dispositivo móvel ainda não foi autorizado para acessar o almoxarifado. A solicitação de vínculo foi registrada e aguarda aprovação pelo administrador.'}
        </Text>

        {/* Card com Metadados do Aparelho */}
        <View style={styles.deviceCard} testID="device-metadata-card">
          <View style={styles.cardHeader}>
            <Smartphone size={18} color={theme.colors.primary} />
            <Text style={styles.cardHeaderText}>Identificação do Dispositivo</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device ID:</Text>
            <Text style={styles.infoValue} selectable>
              {device.deviceId}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fabricante:</Text>
            <Text style={styles.infoValue}>{device.manufacturer}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Modelo:</Text>
            <Text style={styles.infoValue}>{device.model}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plataforma:</Text>
            <Text style={styles.infoValue}>
              {device.platform} ({device.androidVersion})
            </Text>
          </View>
        </View>

        {/* Ações Operacionais */}
        <View style={styles.actionsContainer}>
          {!isDeviceBlocked ? (
            <AppButton
              title="VERIFICAR APROVAÇÃO"
              variant="primary"
              loading={isLoading}
              icon={<RefreshCw size={18} color={theme.colors.textWhite} />}
              onPress={handleRecheck}
              testID="btn-recheck-approval"
            />
          ) : null}

          <AppButton
            title="VOLTAR AO LOGIN"
            variant={isDeviceBlocked ? 'primary' : 'secondary'}
            icon={<LogOut size={18} color={theme.colors.textPrimary} />}
            onPress={handleBackToLogin}
            testID="btn-back-login"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 340,
  },
  deviceCard: {
    width: '100%',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: 16,
    marginBottom: 36,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardHeaderText: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
});
