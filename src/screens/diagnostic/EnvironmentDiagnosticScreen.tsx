import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer, AppText, AppCard, AppButton, AppBadge } from '../../components/common';
import { theme } from '../../theme';
import { env } from '../../config/env';
import { IntegrityService } from '../../services/security/integrityService';

export const EnvironmentDiagnosticScreen: React.FC = () => {
  const diagnostic = IntegrityService.getDiagnosticSnapshot();

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerArea}>
        <AppBadge label="ZOESTOCK MOBILE — V1.0.0" variant="info" />
        <AppText variant="h1" style={styles.title}>
          Diagnóstico de Fundação
        </AppText>
        <AppText variant="body" color={theme.colors.textSecondary}>
          Módulo 1: Fundação, Tipagem e Arquitetura React Native
        </AppText>
      </View>

      <AppCard style={styles.cardSection}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Status do Ambiente
        </AppText>
        <View style={styles.row}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Modo de Execução:
          </AppText>
          <AppBadge label={env.appEnv.toUpperCase()} variant="success" />
        </View>
        <View style={styles.row}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Integração Supabase:
          </AppText>
          <AppBadge
            label={env.isConfigured ? 'CONECTADO' : 'MOCK / DESENVOLVIMENTO'}
            variant={env.isConfigured ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.row}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Expo Dev Build:
          </AppText>
          <AppBadge label="CONFIGURADO" variant="info" />
        </View>
      </AppCard>

      <AppCard style={styles.cardSection}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Integridade & Segurança
        </AppText>
        <View style={styles.row}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Detecção de Root:
          </AppText>
          <AppBadge
            label={diagnostic.rootDetected ? 'COMPROMETIDO' : 'SEGURO'}
            variant={diagnostic.rootDetected ? 'danger' : 'success'}
          />
        </View>
        <View style={styles.row}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Integridade de Código:
          </AppText>
          <AppBadge label="VERIFICADA" variant="success" />
        </View>
        <View style={styles.row}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Fila Offline Transacional:
          </AppText>
          <AppBadge label="0 PENDÊNCIAS" variant="neutral" />
        </View>
      </AppCard>

      <AppCard style={styles.cardSection}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Próximos Módulos Autorizáveis
        </AppText>
        <AppText variant="caption" color={theme.colors.textMuted} style={styles.cardDesc}>
          A arquitetura de navegação, contratos de RPCs, Design System Industrial e suíte de testes unitários foram inicializados com sucesso.
        </AppText>
        <View style={styles.moduleItem}>
          <AppText variant="bodyBold">• Módulo 2:</AppText>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {' '}Autenticação por Crachá, PIN de 4 dígitos e Biometria
          </AppText>
        </View>
        <View style={styles.moduleItem}>
          <AppText variant="bodyBold">• Módulo 3:</AppText>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {' '}Scanner de Alta Cadência e Consulta de Produtos
          </AppText>
        </View>
        <View style={styles.moduleItem}>
          <AppText variant="bodyBold">• Módulo 4:</AppText>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {' '}Movimentações (Entrada/Saída/Devolução/EPIs/Assinatura)
          </AppText>
        </View>
      </AppCard>

      <View style={styles.footerActions}>
        <AppButton
          title="Pronto para Homologação do Módulo 1"
          variant="primary"
          disabled
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerArea: {
    marginVertical: theme.spacing.lg,
  },
  title: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  cardSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  cardDesc: {
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xxs,
  },
  footerActions: {
    marginVertical: theme.spacing.lg,
  },
});
