/**
 * ZOESTOCK MOBILE - MODELOS DE DADOS E CONTRATOS DO SISTEMA
 * Convertidos com paridade integral a partir dos modelos Flutter/Dart.
 * 
 * Regras Obrigatórias Preservadas:
 * - TypeScript Estrito SEM nenhum 'any' explícito
 * - Mapeamento exato de colunas do banco (codigo_barras, unidade_medida, excluido, etc.)
 * - Regras de negócio de EPI e validade de CA (isConformidadeVencida, deveBloquearVencido, getNumeroCaFinal)
 * - Compatibilidade com isolamento multiempresa (empresa_id)
 * - Serialização e desserialização tipada (parse / toDbJson)
 */

// ==========================================
// 1. EMPRESA
// ==========================================
export interface EmpresaModel {
  id: string;
  nome: string;
  cnpj?: string;
  ativo: boolean;
}
export type Empresa = EmpresaModel;

// ==========================================
// 2. CONFORMIDADE & EPI
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
// 3. PRODUTO (ProdutoModel / Produto)
// ==========================================
export interface ProdutoModel {
  id: string;
  codigo: string;              // banco: codigo_barras
  nome: string;
  categoria?: string | null;
  unidade?: string | null;     // banco: unidade_medida
  estoqueAtual: number;        // calculado ou carregado via view/join
  estoqueMinimo: number;       // banco: estoque_minimo
  prateleiraId?: string | null;// banco: prateleira_id
  ativo: boolean;              // banco: !excluido
  consumo: boolean;            // banco: consumo
  conformidade?: ConformidadeInfo | null;
  caNumero?: string | null;    // banco: ca_numero
  ehEpi?: boolean | null;      // banco: eh_epi

  // Aliases para conveniência e compatibilidade direta com consultas
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
export type Produto = ProdutoModel;

/**
 * Validação de conformidade do produto:
 * Verifica se o CA ou aferição está vencido com base na data atual zerada.
 */
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

/**
 * Verifica se a saída do produto vencido deve ser bloqueada.
 * Padrão é true quando não especificado.
 */
export function deveBloquearVencido(produto: ProdutoModel): boolean {
  if (!produto.conformidade) return false;
  return produto.conformidade.bloquear_vencido !== false;
}

/**
 * Obtém o número de CA final higienizado (prioriza caNumero, fallback conformidade).
 */
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

/**
 * Desserialização tipada de Produto a partir do registro do Supabase
 */
export function parseProdutoFromDb(json: Record<string, unknown>): ProdutoModel {
  const codigo = String(json.codigo_barras || json.codigo || '');
  const unidade = json.unidade_medida != null ? String(json.unidade_medida) : (json.unidade != null ? String(json.unidade) : null);
  const ativo = json.excluido !== undefined ? !json.excluido : (json.ativo !== undefined ? Boolean(json.ativo) : true);
  const caNumero = json.ca_numero != null ? String(json.ca_numero) : (json.numero_ca != null ? String(json.numero_ca) : null);
  const ehEpi = json.eh_epi != null ? Boolean(json.eh_epi) : (json.is_epi != null ? Boolean(json.is_epi) : false);

  const conformidadeObj = json.conformidade && typeof json.conformidade === 'object'
    ? (json.conformidade as ConformidadeInfo)
    : null;

  return {
    id: String(json.id || ''),
    codigo,
    nome: String(json.nome || ''),
    categoria: json.categoria != null ? String(json.categoria) : null,
    unidade,
    estoqueAtual: Number(json.estoque_atual ?? json.estoqueAtual ?? 0),
    estoqueMinimo: Number(json.estoque_minimo ?? json.estoqueMinimo ?? 0),
    prateleiraId: json.prateleira_id != null ? String(json.prateleira_id) : (json.prateleiraId != null ? String(json.prateleiraId) : null),
    ativo,
    consumo: Boolean(json.consumo ?? false),
    conformidade: conformidadeObj,
    caNumero,
    ehEpi,

    // Aliases
    codigo_barras: codigo,
    unidade_medida: unidade,
    estoque_atual: Number(json.estoque_atual ?? 0),
    estoque_minimo: Number(json.estoque_minimo ?? 0),
    prateleira_id: json.prateleira_id != null ? String(json.prateleira_id) : null,
    excluido: !ativo,
    ca_numero: caNumero,
    eh_epi: ehEpi,
    empresa_id: json.empresa_id != null ? String(json.empresa_id) : undefined,
    is_epi: ehEpi,
    numero_ca: caNumero,
    validade_ca: conformidadeObj?.data_validade || (json.validade_ca != null ? String(json.validade_ca) : null),
  };
}

/**
 * Serialização para persistência na tabela produtos
 */
export function produtoToDbJson(produto: ProdutoModel): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: produto.id,
    codigo_barras: produto.codigo,
    nome: produto.nome,
    categoria: produto.categoria,
    unidade_medida: produto.unidade,
    estoque_minimo: produto.estoqueMinimo,
    excluido: !produto.ativo,
    consumo: produto.consumo,
    conformidade: produto.conformidade,
    ca_numero: produto.caNumero,
    eh_epi: produto.ehEpi,
  };
  if (produto.empresa_id) {
    payload.empresa_id = produto.empresa_id;
  }
  return payload;
}

// ==========================================
// 4. FUNCIONÁRIO (FuncionarioModel / Funcionario)
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
export type Funcionario = FuncionarioModel;

export function parseFuncionarioFromDb(json: Record<string, unknown>): FuncionarioModel {
  const ativo = json.excluido !== undefined ? !json.excluido : (json.ativo !== undefined ? Boolean(json.ativo) : true);
  const empresaId = json.empresa_id != null ? String(json.empresa_id) : (json.empresaId != null ? String(json.empresaId) : '');
  const senha = json.senha_movimentacao_hash != null 
    ? String(json.senha_movimentacao_hash) 
    : (json.senha_movimentacao != null 
      ? String(json.senha_movimentacao) 
      : (json.senhaMovimentacao != null ? String(json.senhaMovimentacao) : null));

  return {
    id: String(json.id || ''),
    cracha: String(json.cracha || ''),
    nome: String(json.nome || ''),
    departamento: json.departamento != null ? String(json.departamento) : null,
    ativo,
    empresaId,
    empresaNome: json.empresa_nome != null ? String(json.empresa_nome) : (json.empresaNome != null ? String(json.empresaNome) : null),
    senhaMovimentacao: senha,

    // Aliases
    empresa_id: empresaId,
    permite_login_app: json.permite_login_app !== undefined ? Boolean(json.permite_login_app) : true,
    tem_senha_movimentacao: Boolean(senha && senha.length > 0),
    cargo: json.cargo != null ? String(json.cargo) : (json.departamento != null ? String(json.departamento) : undefined),
    created_at: json.created_at != null ? String(json.created_at) : undefined,
  };
}

export function funcionarioToDbJson(func: FuncionarioModel): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: func.id,
    cracha: func.cracha,
    nome: func.nome,
    departamento: func.departamento,
    excluido: !func.ativo,
  };
  if (func.empresaId) payload.empresa_id = func.empresaId;
  if (func.empresaNome) payload.empresa_nome = func.empresaNome;
  if (func.senhaMovimentacao) payload.senha_movimentacao_hash = func.senhaMovimentacao;
  return payload;
}

// ==========================================
// 5. MOVIMENTAÇÃO (MovimentacaoModel / Movimentacao)
// ==========================================
export type TipoMovimentacao = 'EN' | 'SA' | 'DV' | 'CONSUMO' | 'ENTRADA' | 'SAIDA' | 'DEVOLUCAO' | 'AJUSTE';
export type TipoEntrada = 'INVENTARIO' | 'NOTA_FISCAL' | 'FORNECEDOR' | 'AVULSO' | string;

export interface MovimentacaoModel {
  id?: string;
  produtoId: string;           // banco: produto_id
  funcionarioId?: string | null;// banco: funcionario_id
  prateleiraId?: string | null;// banco: prateleira_id
  tipo: TipoMovimentacao;      // 'EN', 'SA', 'DV', 'CONSUMO'
  quantidade: number;
  observacao?: string | null;
  tipoEntrada?: TipoEntrada | null; // banco: tipo_entrada
  createdAt?: string | Date | null;// banco: created_at

  // Relações opcionais para UI (joins)
  nomeProduto?: string | null;
  nomeFuncionario?: string | null;

  // Almoxarife responsável
  usuarioNome?: string | null; // banco: usuario_nome
  usuarioMatricula?: string | null; // banco: usuario_matricula

  // Auditoria, Telemetria e Segurança
  deviceId?: string | null;    // banco: device_id
  appVersion?: string | null;  // banco: app_version
  osPlatform?: string | null;  // banco: os_platform
  ipAddress?: string | null;   // banco: ip_address
  latitude?: number | null;
  longitude?: number | null;
  sessionId?: string | null;   // banco: session_id
  empresaId?: string | null;   // banco: empresa_id
  synced?: boolean;            // controle local da fila offline

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
  assinatura_base64?: string | null;
  usuario_nome?: string | null;
  usuario_matricula?: string | null;
  device_id?: string | null;
  app_version?: string | null;
  os_platform?: string | null;
  ip_address?: string | null;
  session_id?: string | null;
}
export type Movimentacao = MovimentacaoModel;

export function parseMovimentacaoFromDb(json: Record<string, unknown>): MovimentacaoModel {
  const produtosObj = json.produtos as Record<string, unknown> | undefined;
  const funcionariosObj = json.funcionarios as Record<string, unknown> | undefined;

  return {
    id: json.id != null ? String(json.id) : undefined,
    produtoId: String(json.produto_id || json.produtoId || ''),
    funcionarioId: json.funcionario_id != null ? String(json.funcionario_id) : (json.funcionarioId != null ? String(json.funcionarioId) : null),
    prateleiraId: json.prateleira_id != null ? String(json.prateleira_id) : (json.prateleiraId != null ? String(json.prateleiraId) : null),
    tipo: (json.tipo as TipoMovimentacao) || 'SA',
    quantidade: Number(json.quantidade || 0),
    observacao: json.observacao != null ? String(json.observacao) : null,
    tipoEntrada: json.tipo_entrada != null ? String(json.tipo_entrada) : (json.tipoEntrada != null ? String(json.tipoEntrada) : null),
    createdAt: json.created_at ? new Date(String(json.created_at)) : null,
    nomeProduto: produtosObj?.nome != null ? String(produtosObj.nome) : (json.nomeProduto != null ? String(json.nomeProduto) : null),
    nomeFuncionario: funcionariosObj?.nome != null ? String(funcionariosObj.nome) : (json.nomeFuncionario != null ? String(json.nomeFuncionario) : null),
    usuarioNome: json.usuario_nome != null ? String(json.usuario_nome) : (json.usuarioNome != null ? String(json.usuarioNome) : null),
    usuarioMatricula: json.usuario_matricula != null ? String(json.usuario_matricula) : (json.usuarioMatricula != null ? String(json.usuarioMatricula) : null),
    deviceId: json.device_id != null ? String(json.device_id) : (json.deviceId != null ? String(json.deviceId) : null),
    appVersion: json.app_version != null ? String(json.app_version) : (json.appVersion != null ? String(json.appVersion) : null),
    osPlatform: json.os_platform != null ? String(json.os_platform) : (json.osPlatform != null ? String(json.osPlatform) : null),
    ipAddress: json.ip_address != null ? String(json.ip_address) : (json.ipAddress != null ? String(json.ipAddress) : null),
    latitude: json.latitude != null ? Number(json.latitude) : null,
    longitude: json.longitude != null ? Number(json.longitude) : null,
    sessionId: json.session_id != null ? String(json.session_id) : (json.sessionId != null ? String(json.sessionId) : null),
    empresaId: json.empresa_id != null ? String(json.empresa_id) : (json.empresaId != null ? String(json.empresaId) : null),
    synced: json.synced !== undefined ? Boolean(json.synced) : true,

    // Aliases
    empresa_id: json.empresa_id != null ? String(json.empresa_id) : undefined,
    funcionario_id: json.funcionario_id != null ? String(json.funcionario_id) : undefined,
    produto_id: json.produto_id != null ? String(json.produto_id) : undefined,
    prateleira_id: json.prateleira_id != null ? String(json.prateleira_id) : undefined,
    tipo_entrada: json.tipo_entrada != null ? String(json.tipo_entrada) : undefined,
    created_at: json.created_at != null ? String(json.created_at) : undefined,
    saldo_anterior: json.saldo_anterior != null ? Number(json.saldo_anterior) : undefined,
    saldo_resultante: json.saldo_resultante != null ? Number(json.saldo_resultante) : undefined,
    motivo: json.observacao != null ? String(json.observacao) : (json.motivo != null ? String(json.motivo) : undefined),
  };
}

export function movimentacaoToDbJson(mov: MovimentacaoModel): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    produto_id: mov.produtoId || mov.produto_id,
    tipo: mov.tipo,
    quantidade: mov.quantidade,
  };
  if (mov.funcionarioId || mov.funcionario_id) payload.funcionario_id = mov.funcionarioId || mov.funcionario_id;
  if (mov.prateleiraId || mov.prateleira_id) payload.prateleira_id = mov.prateleiraId || mov.prateleira_id;
  if (mov.observacao || mov.motivo) payload.observacao = mov.observacao || mov.motivo;
  if (mov.tipoEntrada || mov.tipo_entrada) payload.tipo_entrada = mov.tipoEntrada || mov.tipo_entrada;
  if (mov.usuarioNome || mov.usuario_nome) payload.usuario_nome = mov.usuarioNome || mov.usuario_nome;
  if (mov.usuarioMatricula || mov.usuario_matricula) payload.usuario_matricula = mov.usuarioMatricula || mov.usuario_matricula;
  if (mov.deviceId || mov.device_id) payload.device_id = mov.deviceId || mov.device_id;
  if (mov.appVersion || mov.app_version) payload.app_version = mov.appVersion || mov.app_version;
  if (mov.osPlatform || mov.os_platform) payload.os_platform = mov.osPlatform || mov.os_platform;
  if (mov.ipAddress || mov.ip_address) payload.ip_address = mov.ipAddress || mov.ip_address;
  if (mov.latitude != null) payload.latitude = mov.latitude;
  if (mov.longitude != null) payload.longitude = mov.longitude;
  if (mov.sessionId || mov.session_id) payload.session_id = mov.sessionId || mov.session_id;
  if (mov.empresaId || mov.empresa_id) payload.empresa_id = mov.empresaId || mov.empresa_id;
  return payload;
}

// ==========================================
// 6. INVENTÁRIO (InventarioModel / Inventario)
// ==========================================
export interface InventarioModel {
  id?: string;
  produtoId: string;           // banco: produto_id
  usuarioId: string;           // banco: usuario_id
  quantidadeSistema: number;   // banco: quantidade_sistema
  quantidadeReal: number;      // banco: quantidade_real
  diferenca: number;           // banco: diferenca
  observacao?: string | null;  // banco: observacao
  createdAt?: string | Date | null;// banco: created_at

  // Aliases
  produto_id?: string;
  usuario_id?: string;
  quantidade_sistema?: number;
  quantidade_real?: number;
  created_at?: string;
}
export type Inventario = InventarioModel;

export function parseInventarioFromDb(json: Record<string, unknown>): InventarioModel {
  return {
    id: json.id != null ? String(json.id) : undefined,
    produtoId: String(json.produto_id || json.produtoId || ''),
    usuarioId: String(json.usuario_id || json.usuarioId || ''),
    quantidadeSistema: Number(json.quantidade_sistema ?? json.quantidadeSistema ?? 0),
    quantidadeReal: Number(json.quantidade_real ?? json.quantidadeReal ?? 0),
    diferenca: Number(json.diferenca ?? 0),
    observacao: json.observacao != null ? String(json.observacao) : null,
    createdAt: json.created_at ? new Date(String(json.created_at)) : null,
    produto_id: json.produto_id != null ? String(json.produto_id) : undefined,
    usuario_id: json.usuario_id != null ? String(json.usuario_id) : undefined,
    quantidade_sistema: Number(json.quantidade_sistema ?? 0),
    quantidade_real: Number(json.quantidade_real ?? 0),
    created_at: json.created_at != null ? String(json.created_at) : undefined,
  };
}

export function inventarioToDbJson(inv: InventarioModel): Record<string, unknown> {
  return {
    produto_id: inv.produtoId || inv.produto_id,
    usuario_id: inv.usuarioId || inv.usuario_id,
    quantidade_sistema: inv.quantidadeSistema,
    quantidade_real: inv.quantidadeReal,
    diferenca: inv.diferenca,
    observacao: inv.observacao,
  };
}

// ==========================================
// 7. PRATELEIRA (PrateleiraModel / Prateleira)
// ==========================================
export interface PrateleiraModel {
  id?: string;
  codigoLocalizacao: string;   // banco: codigo_localizacao
  zona: string;                // banco: zona
  descricao?: string;
  empresaId?: string;
  ativo?: boolean;

  // Aliases
  codigo_localizacao?: string;
  codigo?: string;
  empresa_id?: string;
}
export type Prateleira = PrateleiraModel;

export function parsePrateleiraFromDb(json: Record<string, unknown>): PrateleiraModel {
  const cod = String(json.codigo_localizacao || json.codigoLocalizacao || json.codigo || '');
  return {
    id: json.id != null ? String(json.id) : undefined,
    codigoLocalizacao: cod,
    zona: json.zona != null ? String(json.zona) : '',
    descricao: json.descricao != null ? String(json.descricao) : '',
    empresaId: json.empresa_id != null ? String(json.empresa_id) : (json.empresaId != null ? String(json.empresaId) : undefined),
    ativo: json.ativo !== undefined ? Boolean(json.ativo) : true,
    codigo_localizacao: cod,
    codigo: cod,
    empresa_id: json.empresa_id != null ? String(json.empresa_id) : undefined,
  };
}

export function prateleiraToDbJson(prat: PrateleiraModel): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    codigo_localizacao: prat.codigoLocalizacao || prat.codigo,
    zona: prat.zona,
  };
  if (prat.id) payload.id = prat.id;
  if (prat.descricao) payload.descricao = prat.descricao;
  if (prat.empresaId || prat.empresa_id) payload.empresa_id = prat.empresaId || prat.empresa_id;
  return payload;
}

// ==========================================
// 8. USUÁRIO ADMINISTRATIVO (UsuarioModel / Usuario)
// ==========================================
export interface UsuarioModel {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}
export type Usuario = UsuarioModel;

export function parseUsuarioFromDb(json: Record<string, unknown>): UsuarioModel {
  return {
    id: String(json.id || ''),
    nome: String(json.nome || ''),
    email: String(json.email || ''),
    role: String(json.role || 'user'),
    ativo: json.ativo !== undefined ? Boolean(json.ativo) : true,
  };
}

export function usuarioToDbJson(user: UsuarioModel): Record<string, unknown> {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    ativo: user.ativo,
  };
}

// ==========================================
// 9. DISPOSITIVO E TELEMETRIA (DeviceModel / DeviceMetadata)
// ==========================================
export interface DeviceModel {
  deviceId: string;          // banco: device_id
  deviceName: string;        // banco: device_name
  manufacturer: string;      // banco: manufacturer
  model: string;             // banco: model
  platform: string;          // banco: platform
  androidVersion: string;    // banco: android_version
  appVersion: string;        // banco: app_version

  // Aliases
  brand?: string;
  modelName?: string;
  osVersion?: string;
  isRooted?: boolean;
  uniqueDeviceId?: string;
}
export type DeviceMetadata = DeviceModel;

export function parseDeviceFromDb(json: Record<string, unknown>): DeviceModel {
  return {
    deviceId: String(json.device_id || json.deviceId || ''),
    deviceName: String(json.device_name || json.deviceName || ''),
    manufacturer: String(json.manufacturer || ''),
    model: String(json.model || ''),
    platform: String(json.platform || ''),
    androidVersion: String(json.android_version || json.androidVersion || ''),
    appVersion: String(json.app_version || json.appVersion || ''),
    brand: json.manufacturer != null ? String(json.manufacturer) : undefined,
    modelName: json.model != null ? String(json.model) : undefined,
    osVersion: json.android_version != null ? String(json.android_version) : undefined,
    uniqueDeviceId: json.device_id != null ? String(json.device_id) : undefined,
  };
}

export function deviceToDbJson(dev: DeviceModel): Record<string, unknown> {
  return {
    device_id: dev.deviceId || dev.uniqueDeviceId,
    device_name: dev.deviceName,
    manufacturer: dev.manufacturer || dev.brand,
    model: dev.model || dev.modelName,
    platform: dev.platform,
    android_version: dev.androidVersion || dev.osVersion,
    app_version: dev.appVersion,
  };
}

// ==========================================
// 10. SESSÃO & RESULTADO DE AUTENTICAÇÃO
// ==========================================
export interface SessionInfo {
  id: string;
  cracha: string;
  nome: string;
  ativo: boolean;
  forceChangePin: boolean;   // banco: force_change_pin
  empresaId?: string | null; // banco: empresa_id
  empresaNome?: string | null;// banco: empresa_nome
}

export function parseSessionInfoFromDb(json: Record<string, unknown>): SessionInfo {
  return {
    id: String(json.id || ''),
    cracha: String(json.cracha || ''),
    nome: String(json.nome || ''),
    ativo: json.ativo !== undefined ? Boolean(json.ativo) : true,
    forceChangePin: Boolean(json.force_change_pin ?? json.forceChangePin ?? false),
    empresaId: json.empresa_id != null ? String(json.empresa_id) : (json.empresaId != null ? String(json.empresaId) : null),
    empresaNome: json.empresa_nome != null ? String(json.empresa_nome) : (json.empresaNome != null ? String(json.empresaNome) : null),
  };
}

export function sessionInfoToDbJson(session: SessionInfo): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: session.id,
    cracha: session.cracha,
    nome: session.nome,
    ativo: session.ativo,
    force_change_pin: session.forceChangePin,
  };
  if (session.empresaId) payload.empresa_id = session.empresaId;
  if (session.empresaNome) payload.empresa_nome = session.empresaNome;
  return payload;
}

export interface AuthResultModel {
  sucesso: boolean;
  erro?: string | null;
  mensagem?: string | null;
  bloqueadoAte?: string | null;      // banco: bloqueado_ate
  tentativasRestantes?: number | null;// banco: tentativas_restantes
  funcionario?: SessionInfo | null;
  token_sessao?: string;
  erro_codigo?: string;
}
export type ValidarLoginResult = AuthResultModel;

// ==========================================
// 11. ONBOARDING
// ==========================================
export interface OnboardingModel {
  title: string;
  subtitle: string;
  imagePath: string | number;
  bulletPoints: string[];
  isFinalPage?: boolean;
}
