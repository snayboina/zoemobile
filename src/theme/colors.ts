/**
 * Paleta de Cores Institucional ZOESTOCK Mobile.
 * Preservação integral da identidade visual corporativa:
 * - Preto industrial profundo (#0B0F19, #111827)
 * - Vermelho institucional (#D32F2F primário, #9A0007 dark, #EF4444 light)
 * - Branco e cinzas de alto contraste (#FFFFFF, #F9FAFB, #E5E7EB)
 * - Cores operacionais: Verde Sucesso (#10B981), Amarelo Alerta (#F59E0B), Vermelho Erro (#DC2626)
 */

export const colors = {
  // Fundos e Superfícies Industriais
  background: '#0B0F19',        // Preto industrial profundo
  backgroundLight: '#111827',   // Fundo secundário / seções
  surface: '#111827',           // Cartões e cards operacionais
  surfaceElevated: '#1F2937',   // Modais, painéis suspensos e seletores
  surfaceHighlighted: '#374151', // Hover e estados pressionados

  // Bordas e Divisores
  border: '#1F2937',            // Linha divisória sutil
  borderSubtle: '#374151',      // Borda de campos e botões neutros
  borderFocus: '#D32F2F',       // Borda em foco (Vermelho Institucional)

  // Cores Institucionais ZOESTOCK (Vermelho Institucional)
  primary: '#D32F2F',           // Vermelho institucional principal ZOESTOCK
  primaryDark: '#9A0007',       // Vermelho escuro / pressionado
  primaryLight: '#EF4444',      // Vermelho claro / acentos
  primaryGlow: 'rgba(211, 47, 47, 0.25)', // Brilho de foco

  // Acentos Secundários
  secondary: '#4B5563',         // Cinza industrial secundário
  secondaryDark: '#374151',
  secondaryLight: '#9CA3AF',

  // Status Operacionais e Alertas
  success: '#10B981',           // Verde estoque OK / Bip confirmado / EPI conforme
  successBackground: 'rgba(16, 185, 129, 0.15)',
  successDark: '#065F46',

  warning: '#F59E0B',           // Amarelo atenção / Estoque mínimo / Próximo vencimento
  warningBackground: 'rgba(245, 158, 11, 0.15)',
  warningDark: '#78350F',

  danger: '#DC2626',            // Vermelho crítico / CA Vencido / Saldo insuficiente
  dangerBackground: 'rgba(220, 38, 38, 0.15)',
  dangerDark: '#7F1D1D',

  info: '#0EA5E9',              // Azul informativo / Dicas operacionais
  infoBackground: 'rgba(14, 165, 233, 0.15)',

  // Tipografia e Contrastes
  textPrimary: '#F9FAFB',       // Branco de alto contraste
  textSecondary: '#9CA3AF',     // Cinza de apoio / legendas
  textMuted: '#6B7280',         // Placeholders / desabilitados
  textInverse: '#111827',       // Texto sobre superfícies brancas/claras
  textWhite: '#FFFFFF',

  // Badges e Destaques Setoriais
  badgeEpi: '#8B5CF6',          // Roxo identificador de EPI
  badgePrateleira: '#EC4899',   // Rosa identificador de prateleira
  scannedOverlay: 'rgba(211, 47, 47, 0.25)', // Overlay de bipagem ZOESTOCK
} as const;

export type ColorTokens = typeof colors;
