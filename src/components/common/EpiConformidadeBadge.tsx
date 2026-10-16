import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, ShieldAlert, HelpCircle, ShieldBan } from 'lucide-react-native';
import { ProdutoModel, isConformidadeVencida, deveBloquearVencido, getNumeroCaFinal } from '../../types/models';
import { theme } from '../../theme';

export type EpiStatus = 'conforme' | 'vencido' | 'alerta' | 'bloqueado' | 'desconhecido';

export interface EpiConformidadeBadgeProps {
  /** Produto completo a ser avaliado */
  produto?: ProdutoModel;
  /** Ou status explícito pré-calculado */
  status?: EpiStatus;
  /** Número do Certificado de Aprovação (CA) */
  numeroCa?: string;
  /** Exibe o número do CA junto ao badge */
  showCaNumber?: boolean;
}

/**
 * Badge de Conformidade de EPI Industrial ZOESTOCK.
 * 
 * Regra Mandatória de Segurança:
 * - NUNCA transformar uma situação desconhecida em autorização automática de saída!
 * - Utiliza as funções canônicas do domínio (isConformidadeVencida, deveBloquearVencido).
 * - Indicadores visuais:
 *   - CONFORME: CA ativo e dentro do prazo regulatório.
 *   - VENCIDO: CA com data de validade ultrapassada.
 *   - BLOQUEADO: EPI bloqueado para entrega.
 *   - ALERTA: CA a menos de 30 dias do vencimento.
 *   - DESCONHECIDO: Situação não validada (Trava automática).
 */
export const EpiConformidadeBadge: React.FC<EpiConformidadeBadgeProps> = ({
  produto,
  status: explicitStatus,
  numeroCa: explicitCa,
  showCaNumber = true,
}) => {
  let status: EpiStatus = explicitStatus ?? 'desconhecido';
  let caFinal: string | null | undefined = explicitCa;

  if (produto) {
    caFinal = getNumeroCaFinal(produto);

    if (!produto.eh_epi) {
      return null;
    }

    if (deveBloquearVencido(produto)) {
      status = 'bloqueado';
    } else if (isConformidadeVencida(produto)) {
      status = 'vencido';
    } else if (produto.validade_ca) {
      // Verifica se está próximo do vencimento (30 dias)
      try {
        const dataValidade = new Date(produto.validade_ca);
        const agora = new Date();
        const diffDias = Math.floor(
          (dataValidade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDias >= 0 && diffDias <= 30) {
          status = 'alerta';
        } else if (diffDias > 30) {
          status = 'conforme';
        } else {
          status = 'vencido';
        }
      } catch {
        status = 'desconhecido';
      }
    } else if (produto.numero_ca && produto.numero_ca.trim().length > 0) {
      status = 'conforme';
    } else {
      status = 'desconhecido';
    }
  }

  const getConfig = () => {
    switch (status) {
      case 'conforme':
        return {
          label: 'EPI CONFORME',
          color: theme.colors.success,
          bg: theme.colors.successBackground,
          icon: <ShieldCheck size={14} color={theme.colors.success} />,
          accessibility: 'EPI em conformidade. Saída liberada.',
        };
      case 'vencido':
        return {
          label: 'CA VENCIDO',
          color: theme.colors.danger,
          bg: theme.colors.dangerBackground,
          icon: <ShieldAlert size={14} color={theme.colors.danger} />,
          accessibility: 'Atenção: CA Vencido. Saída bloqueada pela segurança do trabalho.',
        };
      case 'bloqueado':
        return {
          label: 'EPI BLOQUEADO',
          color: '#991B1B',
          bg: 'rgba(153, 27, 27, 0.25)',
          icon: <ShieldBan size={14} color="#EF4444" />,
          accessibility: 'EPI bloqueado administrativamente para saídas.',
        };
      case 'alerta':
        return {
          label: 'CA PRÓX. VENCIMENTO',
          color: theme.colors.warning,
          bg: theme.colors.warningBackground,
          icon: <ShieldAlert size={14} color={theme.colors.warning} />,
          accessibility: 'EPI próximo do vencimento de CA.',
        };
      case 'desconhecido':
      default:
        return {
          label: 'CA NÃO LOCALIZADO',
          color: theme.colors.textMuted,
          bg: 'rgba(107, 114, 128, 0.2)',
          icon: <HelpCircle size={14} color={theme.colors.textMuted} />,
          accessibility: 'Conformidade de EPI desconhecida. Saída bloqueada por segurança.',
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[styles.container, { backgroundColor: config.bg, borderColor: config.color }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${config.accessibility} ${caFinal ? `CA número ${caFinal}` : ''}`}
      testID={`epi-badge-${status}`}
    >
      <View style={styles.icon}>{config.icon}</View>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      {showCaNumber && caFinal ? (
        <Text style={[styles.caNumber, { color: config.color }]}>• CA {caFinal}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  caNumber: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
});
