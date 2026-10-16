import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react-native';
import { ProdutoModel } from '../../types/models';
import { theme } from '../../theme';

export interface EstoqueBaixoAlertProps {
  /** Produto individual sob alerta */
  produto?: ProdutoModel;
  /** Ou lista de produtos com estoque baixo (modo resumo de almoxarifado) */
  produtos?: ProdutoModel[];
  /** Nome direto do produto (opcional caso não passe o objeto produto) */
  nomeProduto?: string;
  /** Estoque atual (opcional) */
  estoqueAtual?: number;
  /** Estoque mínimo (opcional) */
  estoqueMinimo?: number;
  /** Ação ao tocar no alerta */
  onTap?: () => void;
}

/**
 * Componente de Sinalização de Estoque Baixo / Crítico ZOESTOCK.
 * 
 * Fidelidade ao Flutter original (alert_estoque_baixo.dart) expandido com:
 * - Indicador de criticidade industrial:
 *   - CRÍTICO (Vermelho): Estoque Zerado ou Negativo (estoqueAtual <= 0)
 *   - ATENÇÃO (Laranja/Amarelo): Estoque abaixo ou igual ao mínimo de segurança
 * - Exibição clara de saldo atual vs estoque mínimo exigido
 * - Modo sumário para avisos globais em telas operacionais
 */
export const EstoqueBaixoAlert: React.FC<EstoqueBaixoAlertProps> = ({
  produto,
  produtos,
  nomeProduto,
  estoqueAtual,
  estoqueMinimo,
  onTap,
}) => {
  // Modo Lista / Sumário (compatibilidade com alert_estoque_baixo.dart)
  if (produtos !== undefined) {
    if (produtos.length === 0) return null;

    const totalCriticos = produtos.filter((p) => (p.estoque_atual ?? 0) <= 0).length;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onTap}
        style={[
          styles.container,
          totalCriticos > 0 ? styles.containerCritico : styles.containerAtencao,
        ]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Atenção: ${produtos.length} produtos com estoque baixo`}
        testID="alerta-estoque-baixo-sumario"
      >
        <View style={styles.iconBox}>
          {totalCriticos > 0 ? (
            <AlertCircle size={28} color={theme.colors.danger} />
          ) : (
            <AlertTriangle size={28} color={theme.colors.warning} />
          )}
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: totalCriticos > 0 ? theme.colors.danger : theme.colors.warning },
            ]}
          >
            {totalCriticos > 0 ? 'Estoque Crítico Detectado!' : 'Atenção ao Estoque!'}
          </Text>
          <Text style={styles.description}>
            {`${produtos.length} produto(s) com estoque abaixo do mínimo`}
          </Text>
        </View>

        {onTap ? (
          <ChevronRight
            size={20}
            color={totalCriticos > 0 ? theme.colors.danger : theme.colors.warning}
          />
        ) : null}
      </TouchableOpacity>
    );
  }

  // Modo Produto Individual
  const nome = nomeProduto ?? produto?.nome ?? 'Produto sem identificação';
  const atual = estoqueAtual ?? produto?.estoque_atual ?? 0;
  const minimo = estoqueMinimo ?? produto?.estoque_minimo ?? 0;

  // Se o estoque atual for maior que o mínimo, não há alerta
  if (atual > minimo) {
    return null;
  }

  const isZerado = atual <= 0;
  const criticidadeColor = isZerado ? theme.colors.danger : theme.colors.warning;
  const criticidadeBg = isZerado ? theme.colors.dangerBackground : theme.colors.warningBackground;
  const badgeLabel = isZerado ? 'ESGOTADO' : 'ESTOQUE BAIXO';

  return (
    <TouchableOpacity
      activeOpacity={onTap ? 0.8 : 1}
      onPress={onTap}
      disabled={!onTap}
      style={[
        styles.container,
        {
          borderColor: criticidadeColor,
          backgroundColor: criticidadeBg,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${badgeLabel}: ${nome}. Saldo: ${atual}, Mínimo: ${minimo}`}
      testID="alerta-estoque-baixo-individual"
    >
      <View style={styles.iconBox}>
        {isZerado ? (
          <AlertCircle size={26} color={criticidadeColor} />
        ) : (
          <AlertTriangle size={26} color={criticidadeColor} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {nome}
          </Text>
          <View style={[styles.badge, { backgroundColor: criticidadeColor }]}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>

        <View style={styles.saldoRow}>
          <Text style={styles.saldoText}>
            Saldo atual: <Text style={[styles.saldoDestaque, { color: criticidadeColor }]}>{atual}</Text>
          </Text>
          <Text style={styles.minimoText}>
            Estoque Mínimo: <Text style={styles.minimoDestaque}>{minimo}</Text>
          </Text>
        </View>
      </View>

      {onTap ? <ChevronRight size={20} color={criticidadeColor} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
  },
  containerCritico: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerBackground,
  },
  containerAtencao: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warningBackground,
  },
  iconBox: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  saldoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  saldoText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  saldoDestaque: {
    fontWeight: 'bold',
  },
  minimoText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  minimoDestaque: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});
