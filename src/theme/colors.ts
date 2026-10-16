export const colors = {
  // Fundos e Superfícies
  background: '#0B0F19', // Fundo ultra-escuro industrial
  surface: '#111827',    // Cartões e cards elevados
  surfaceElevated: '#1F2937', // Modais e dropdowns
  border: '#1E293B',     // Linhas divisórias sutis
  borderFocus: '#3B82F6', // Linha com foco ativo

  // Cores de Ação e Marca
  primary: '#2563EB',     // Azul primário ZOESTOCK
  primaryDark: '#1D4ED8', // Hover / Pressionado
  primaryLight: '#60A5FA',// Acentos
  secondary: '#475569',   // Botões secundários e controles neutros

  // Status e Indicadores Operacionais
  success: '#10B981',     // Verde estoque normal / bip OK
  successBackground: '#064E3B',
  warning: '#F59E0B',     // Amarelo atenção / quarentena / estoque mínimo
  warningBackground: '#78350F',
  danger: '#EF4444',      // Vermelho bloqueio / erro / EPI vencido
  dangerBackground: '#7F1D1D',
  info: '#0EA5E9',        // Azul informativo

  // Tipografia e Contrastes
  textPrimary: '#F9FAFB',   // Branco principal de alta legibilidade
  textSecondary: '#9CA3AF', // Cinza de apoio / rótulos secundários
  textMuted: '#6B7280',     // Desabilitados / placeholders
  textInverse: '#0B0F19',   // Texto sobre fundo claro

  // Badges e Destaques
  badgeEpi: '#8B5CF6',      // Roxo identificador de EPI
  badgePrateleira: '#EC4899',// Rosa identificador de prateleira
  scannedOverlay: 'rgba(37, 99, 235, 0.25)',
} as const;

export type ColorTokens = typeof colors;
