import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, User, Building, LogOut, Terminal } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { AppButton } from '../../components/common/AppButton';
import { theme } from '../../theme';

type DiagnosticNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DiagnosticHome'>;

interface EnvironmentDiagnosticScreenProps {
  navigation: DiagnosticNavigationProp;
}

/**
 * Tela de Diagnóstico e Staging Operacional.
 * Identificada explicitamente como ambiente de desenvolvimento e staging da Fase 4.
 */
export const EnvironmentDiagnosticScreen: React.FC<EnvironmentDiagnosticScreenProps> = ({
  navigation,
}) => {
  const { funcionario, session, empresaId, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner de Ambiente de Desenvolvimento */}
      <View style={styles.stagingBanner} testID="staging-environment-banner">
        <Terminal size={18} color={theme.colors.warning} />
        <View style={styles.stagingTextContainer}>
          <Text style={styles.stagingTitle}>AMBIENTE DE HOMOLOGAÇÃO — FASE 4</Text>
          <Text style={styles.stagingSubtitle}>
            Autenticação, Sessão e Dispositivo Aprovados com Sucesso.
          </Text>
        </View>
      </View>

      {/* Card da Sessão Ativa */}
      <View style={styles.card} testID="session-info-card">
        <View style={styles.cardHeader}>
          <ShieldCheck size={22} color={theme.colors.success} />
          <Text style={styles.cardTitle}>Sessão Operacional Conectada</Text>
        </View>

        <View style={styles.row}>
          <User size={16} color={theme.colors.textSecondary} />
          <Text style={styles.label}>Operador:</Text>
          <Text style={styles.value}>{funcionario?.nome || session?.nome || 'Almoxarife'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Matrícula/Crachá:</Text>
          <Text style={styles.value}>{funcionario?.cracha || session?.cracha || 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <Building size={16} color={theme.colors.textSecondary} />
          <Text style={styles.label}>Empresa/Tenant:</Text>
          <Text style={styles.value}>{empresaId || session?.empresaNome || 'Unidade Matriz'}</Text>
        </View>
      </View>

      {/* Botão de Logout Seguro */}
      <View style={styles.actionContainer}>
        <AppButton
          title="ENCERRAR SESSÃO (LOGOUT SEGURO)"
          variant="danger"
          icon={<LogOut size={18} color={theme.colors.textWhite} />}
          onPress={handleLogout}
          testID="btn-staging-logout"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 48,
  },
  stagingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 24,
  },
  stagingTextContainer: {
    flex: 1,
  },
  stagingTitle: {
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  stagingSubtitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: 20,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  actionContainer: {
    marginTop: 8,
  },
});
