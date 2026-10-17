/**
 * ZOESTOCK MOBILE - MODELOS DE DADOS E CONTRATOS DO SISTEMA
 * Compatibilidade integral com os modelos Flutter/Dart e os contratos Supabase.
 */

// ==========================================
// 1. CONFORMIDADE & EPI
// ==========================================
export interface ConformidadeInfo {
  tipo_controle?: 'CA' | 'AFERICAO' | string;
  data_validade?: string; // ISO Date YYYY-MM-DD
  data_proxima_afericao?: string; // ISO Date YYYY-MM-DD
  status_manual?: 'ATIVO' | 'BLOQUEADO' | string;
  bloquear_vencido?: boolean;
  numero_ca?: string | number | null;
}

// ==========================================
// 2. PRODUTO (ProdutoModel)
// ==========================================
export interface ProdutoModel {
  id: string;
  codigo: string;              // banco: codigo_barras
  nome: string;
  categoria?: string | null;
  unidade?: string | null;     // banco: unidade_medida
  estoqueAtual: number;        // agregado das prateleiras
  estoqueMinimo: number;       // banco: estoque_minimo
  prateleiraId?: string | null;// banco: prateleira_id
  ativo: boolean;              // banco: !excluido
  consumo: boolean;            // banco: consumo
  conformidade?: ConformidadeInfo | null;
  caNumero?: string | null;    // banco: ca_numero
  ehEpi?: boolean | null;      // banco: eh_epi

  // Aliases para compatibilidade direta com consultas
  codigo_barras?: string;
  unidade_medida?: string | null;
  estoque_atual?: number;
  estoque_minimo?: number;
  prateleira_id?: string | null;
  excluido?: boolean;
  ca_numero?: string | null;
  eh_epi?: boolean | null;
  empresa_id?: string;
  is_epi?: boolean;
  numero_ca?: string | null;
  validade_ca?: string | null;
}

export function isConformidadeVencida(produto: ProdutoModel): boolean {
  if (!produto.conformidade) return false;
  const conf = produto.conformidade;
  const tipo = conf.tipo_controle || 'CA';
  const dataStr = tipo === 'CA' ? conf.data_validade : conf.data_proxima_afericao;

  if (conf.status_manual === 'BLOQUEADO') return true;

  if (dataStr) {
    try {
      const validade = new Date(dataStr);
      if (isNaN(validade.getTime())) return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      validade.setHours(0, 0, 0, 0);
      return validade.getTime() < hoje.getTime();
    } catch {
      return false;
    }
  }
  return false;
}

export function deveBloquearVencido(produto: ProdutoModel): boolean {
  if (!produto.conformidade) return false;
  return produto.conformidade.bloquear_vencido !== false;
}

export function getNumeroCaFinal(produto: ProdutoModel): string | null {
  if (produto.caNumero && produto.caNumero.trim() !== '' && produto.caNumero.toUpperCase() !== 'EMPTY') {
    return produto.caNumero.trim();
  }
  if (produto.conformidade && produto.conformidade.numero_ca != null) {
    const caConf = String(produto.conformidade.numero_ca).trim();
    if (caConf !== '' && caConf.toUpperCase() !== 'EMPTY') {
      return caConf;
    }
  }
  return null;
}

export function parseProdutoFromDb(json: Record<string, any>): ProdutoModel {
  const codigo = json.codigo_barras || json.codigo || '';
  const unidade = json.unidade_medida || json.unidade || null;
  const ativo = json.excluido !== undefined ? !json.excluido : (json.ativo ?? true);
  const caNumero = json.ca_numero || json.numero_ca || null;
  const ehEpi = json.eh_epi ?? json.is_epi ?? false;

  return {
    id: json.id || '',
    codigo,
    nome: json.nome || '',
    categoria: json.categoria || null,
    unidade,
    estoqueAtual: Number(json.estoque_atual ?? json.estoqueAtual ?? 0),
    estoqueMinimo: Number(json.estoque_minimo ?? json.estoqueMinimo ?? 0),
    prateleiraId: json.prateleira_id || json.prateleiraId || null,
    ativo,
    consumo: Boolean(json.consumo ?? false),
    conformidade: json.conformidade || null,
    caNumero,
    ehEpi,
    codigo_barras: codigo,
    unidade_medida: unidade,
    estoque_atual: Number(json.estoque_atual ?? 0),
    estoque_minimo: Number(json.estoque_minimo ?? 0),
    prateleira_id: json.prateleira_id || null,
    excluido: !ativo,
    ca_numero: caNumero,
    eh_epi: ehEpi,
    empresa_id: json.empresa_id,
    is_epi: ehEpi,
    numero_ca: caNumero,
    validade_ca: json.conformidade?.data_validade || json.validade_ca,
  };
}

// ==========================================
// 3. FUNCIONÁRIO (FuncionarioModel)
// ==========================================
export interface FuncionarioModel {
  id: string;
  cracha: string;
  nome: string;
  departamento?: string | null;
  ativo: boolean;             // banco: !excluido
  empresaId?: string | null;  // banco: empresa_id
  empresaNome?: string | null;// banco: empresa_nome
  senhaMovimentacao?: string | null; // banco: senha_movimentacao_hash

  // Aliases
  empresa_id: string;
  permite_login_app: boolean;
  tem_senha_movimentacao: boolean;
  cargo?: string;
  created_at?: string;
}

export function parseFuncionarioFromDb(json: Record<string, any>): FuncionarioModel {
  const ativo = json.excluido !== undefined ? !json.excluido : (json.ativo ?? true);
  const empresaId = json.empresa_id || json.empresaId || '';
  const senha = json.senha_movimentacao_hash || json.senha_movimentacao || json.senhaMovimentacao || null;

  return {
    id: json.id || '',
    cracha: json.cracha || '',
    nome: json.nome || '',
    departamento: json.departamento || null,
    ativo,
    empresaId,
    empresaNome: json.empresa_nome || json.empresaNome || null,
    senhaMovimentacao: senha,
    empresa_id: empresaId,
    permite_login_app: json.permite_login_app ?? true,
    tem_senha_movimentacao: Boolean(senha && senha.length > 0),
    cargo: json.cargo || json.departamento,
    created_at: json.created_at,
  };
}

// ==========================================
// 4. MOVIMENTAÇÃO (MovimentacaoModel)
// ==========================================
export type TipoMovimentacao = 'EN' | 'SA' | 'DV' | 'CONSUMO' | 'ENTRADA' | 'SAIDA' | 'DEVOLUCAO' | 'AJUSTE';
export type TipoEntrada = 'INVENTARIO' | 'NOTA_FISCAL' | 'FORNECEDOR' | 'AVULSO' | string;

export interface MovimentacaoModel {
  id?: string;
  produtoId: string;
  funcionarioId?: string | null;
  prateleiraId?: string | null;
  tipo: TipoMovimentacao;
  quantidade: number;
  observacao?: string | null;
  tipoEntrada?: TipoEntrada | null;
  createdAt?: string | Date | null;

  nomeProduto?: string | null;
  nomeFuncionario?: string | null;
  usuarioNome?: string | null;
  usuarioMatricula?: string | null;

  deviceId?: string | null;
  appVersion?: string | null;
  osPlatform?: string | null;
  ipAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sessionId?: string | null;
  empresaId?: string | null;
  synced?: boolean;

  // Aliases
  empresa_id?: string;
  funcionario_id?: string;
  produto_id?: string;
  prateleira_id?: string | null;
  tipo_entrada?: string | null;
  created_at?: string;
  saldo_anterior?: number;
  saldo_resultante?: number;
  motivo?: string;
  usuario_nome?: string | null;
  usuario_matricula?: string | null;
  device_id?: string | null;
  app_version?: string | null;
  os_platform?: string | null;
  ip_address?: string | null;
  session_id?: string | null;
}

export function parseMovimentacaoFromDb(json: Record<string, any>): MovimentacaoModel {
  return {
    id: json.id,
    produtoId: json.produto_id || json.produtoId || '',
    funcionarioId: json.funcionario_id || json.funcionarioId || null,
    prateleiraId: json.prateleira_id || json.prateleiraId || null,
    tipo: json.tipo || 'SA',
    quantidade: Number(json.quantidade || 0),
    observacao: json.observacao || null,
    tipoEntrada: json.tipo_entrada || json.tipoEntrada || null,
    createdAt: json.created_at ? new Date(json.created_at) : null,
    nomeProduto: json.produtos?.nome || json.nomeProduto || null,
    nomeFuncionario: json.funcionarios?.nome || json.nomeFuncionario || null,
    usuarioNome: json.usuario_nome || json.usuarioNome || null,
    usuarioMatricula: json.usuario_matricula || json.usuarioMatricula || null,
    deviceId: json.device_id || json.deviceId || null,
    appVersion: json.app_version || json.appVersion || null,
    osPlatform: json.os_platform || json.osPlatform || null,
    ipAddress: json.ip_address || json.ipAddress || null,
    latitude: json.latitude != null ? Number(json.latitude) : null,
    longitude: json.longitude != null ? Number(json.longitude) : null,
    sessionId: json.session_id || json.sessionId || null,
    empresaId: json.empresa_id || json.empresaId || null,
    synced: json.synced ?? true,
    empresa_id: json.empresa_id || json.empresaId,
    funcionario_id: json.funcionario_id || json.funcionarioId,
    produto_id: json.produto_id || json.produtoId,
    prateleira_id: json.prateleira_id || json.prateleiraId,
    tipo_entrada: json.tipo_entrada || json.tipoEntrada,
    created_at: json.created_at,
    motivo: json.observacao || json.motivo,
  };
}

// ==========================================
// 5. INVENTÁRIO (InventarioModel)
// ==========================================
export interface InventarioModel {
  id?: string;
  produtoId: string;
  usuarioId?: string;
  quantidadeSistema: number;
  quantidadeReal: number;
  diferenca: number;
  observacao?: string | null;
  createdAt?: string | Date | null;

  produto_id?: string;
  usuario_id?: string;
  quantidade_sistema?: number;
  quantidade_real?: number;
  created_at?: string;
}

export function parseInventarioFromDb(json: Record<string, any>): InventarioModel {
  return {
    id: json.id,
    produtoId: json.produto_id || json.produtoId || '',
    usuarioId: json.usuario_id || json.usuarioId || '',
    quantidadeSistema: Number(json.quantidade_sistema ?? json.quantidadeSistema ?? 0),
    quantidadeReal: Number(json.quantidade_real ?? json.quantidadeReal ?? 0),
    diferenca: Number(json.diferenca ?? 0),
    observacao: json.observacao || null,
    createdAt: json.created_at ? new Date(json.created_at) : null,
    produto_id: json.produto_id,
    usuario_id: json.usuario_id,
    quantidade_sistema: Number(json.quantidade_sistema ?? 0),
    quantidade_real: Number(json.quantidade_real ?? 0),
    created_at: json.created_at,
  };
}

// ==========================================
// 6. PRATELEIRA (PrateleiraModel)
// ==========================================
export interface PrateleiraModel {
  id?: string;
  codigoLocalizacao: string;
  zona: string;
  descricao?: string;
  empresaId?: string;
  ativo?: boolean;

  codigo_localizacao?: string;
  codigo?: string;
  empresa_id?: string;
}

export function parsePrateleiraFromDb(json: Record<string, any>): PrateleiraModel {
  const cod = json.codigo_localizacao || json.codigoLocalizacao || json.codigo || '';
  return {
    id: json.id,
    codigoLocalizacao: cod,
    zona: json.zona || '',
    descricao: json.descricao || '',
    empresaId: json.empresa_id || json.empresaId,
    ativo: json.ativo ?? true,
    codigo_localizacao: cod,
    codigo: cod,
    empresa_id: json.empresa_id || json.empresaId,
  };
}

// ==========================================
// 7. DISPOSITIVO & SESSÃO
// ==========================================
export interface DeviceModel {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  platform: string;
  androidVersion?: string;
  appVersion: string;
  isPWA?: boolean;
}

export interface SessionInfo {
  id: string;
  cracha: string;
  nome: string;
  empresaId: string;
  empresaNome: string;
  ativo: boolean;
  requerTrocaSenha?: boolean;
}

export interface AuthResultModel {
  sucesso: boolean;
  funcionario?: SessionInfo;
  erro?: string;
  mensagem?: string;
  tentativasRestantes?: number;
  bloqueadoAte?: string;
}

export interface OnboardingModel {
  id: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  imagemUrl: string;
  icone: string;
}
