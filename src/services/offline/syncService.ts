import { MovimentacaoModel, ProdutoModel, PrateleiraModel, FuncionarioModel } from '../../types/models';
import { StorageAdapter } from './storageAdapter';
import { supabase } from '../supabase/client';

export type SyncListener = (pendingCount: number, isSyncing: boolean) => void;

/**
 * SyncService - Gerenciamento de Fila Offline e Cache de Contingência.
 * Paridade integral com sync_service.dart do Flutter.
 */
export class SyncService {
  private static instance: SyncService;
  private movimentacoesOffline: MovimentacaoModel[] = [];
  private isSyncing = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<SyncListener> = new Set();
  private currentEmpresaId: string = '';

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  setEmpresaContext(empresaId: string): void {
    this.currentEmpresaId = empresaId;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.movimentacoesOffline.length, this.isSyncing);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.movimentacoesOffline.length, this.isSyncing);
    }
  }

  async initialize(empresaId?: string): Promise<void> {
    if (empresaId) this.currentEmpresaId = empresaId;
    await this.carregarFilaOffline();
    
    // Iniciar loop periódico a cada 30 segundos se houver ambiente com timer
    if (!this.syncTimer && typeof setInterval !== 'undefined') {
      this.syncTimer = setInterval(() => {
        this.sincronizarPendentes();
      }, 30000);
    }

    if (this.movimentacoesOffline.length > 0) {
      this.sincronizarPendentes();
    }
  }

  async resetFilaParaTestes(): Promise<void> {
    this.movimentacoesOffline = [];
    this.notify();
    await StorageAdapter.removeItem('movimentacoes_offline', this.currentEmpresaId);
  }

  dispose(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.listeners.clear();
  }

  get filaOffline(): MovimentacaoModel[] {
    return [...this.movimentacoesOffline];
  }

  get pendenciasCount(): number {
    return this.movimentacoesOffline.length;
  }

  get syncing(): boolean {
    return this.isSyncing;
  }

  // --- FILA DE MOVIMENTAÇÕES OFFLINE ---

  private async carregarFilaOffline(): Promise<void> {
    try {
      const jsonStr = await StorageAdapter.getItem('movimentacoes_offline', this.currentEmpresaId);
      if (jsonStr) {
        const list: Record<string, unknown>[] = JSON.parse(jsonStr);
        this.movimentacoesOffline = list.map((item) => item as unknown as MovimentacaoModel);
        this.notify();
      }
    } catch {
      this.movimentacoesOffline = [];
    }
  }

  private async salvarFilaOffline(): Promise<void> {
    try {
      const serialized = JSON.stringify(this.movimentacoesOffline);
      await StorageAdapter.setItem('movimentacoes_offline', serialized, this.currentEmpresaId);
    } catch {
      // Falha silenciosa de persistência
    }
  }

  /**
   * Enfileira uma movimentação na fila de contingência offline.
   * Atribui UUID idempotente se inexistente.
   */
  async enfileirarMovimentacao(mov: MovimentacaoModel, autoSync = true, client = supabase): Promise<void> {
    const movComData: MovimentacaoModel = {
      ...mov,
      id: mov.id || `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: mov.createdAt || new Date(),
      nomeProduto: mov.nomeProduto || 'Produto',
      nomeFuncionario: mov.nomeFuncionario || 'Colaborador',
      synced: false,
    };

    this.movimentacoesOffline.push(movComData);
    this.notify();
    await this.salvarFilaOffline();
    
    // Tentativa imediata de sincronização se solicitado
    if (autoSync) {
      await this.sincronizarPendentes(client);
    }
  }

  /**
   * Processa a fila de movimentações offline enviando ao Supabase.
   * Não descarta o item se o servidor falhar.
   */
  async sincronizarPendentes(client = supabase): Promise<string | null> {
    if (this.isSyncing || this.movimentacoesOffline.length === 0) return null;
    this.isSyncing = true;
    this.notify();

    const filaRestante = [...this.movimentacoesOffline];
    let erroCapturado: string | null = null;
    let houveSucesso = false;

    for (const mov of this.movimentacoesOffline) {
      try {
        const payload: Record<string, unknown> = {
          produto_id: mov.produtoId || mov.produto_id,
          tipo: mov.tipo,
          quantidade: mov.quantidade,
          created_at: mov.createdAt instanceof Date ? mov.createdAt.toISOString() : (mov.createdAt || new Date().toISOString()),
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

        const { error } = await client.from('movimentacoes').insert(payload);
        if (error) {
          throw new Error(error.message);
        }

        const idx = filaRestante.indexOf(mov);
        if (idx !== -1) {
          filaRestante.splice(idx, 1);
        }
        houveSucesso = true;
      } catch (err: unknown) {
        erroCapturado = err instanceof Error ? err.message : String(err);
        // Interrompe a fila na primeira falha para preservar a ordem estrita fiscal/logística
        break;
      }
    }

    if (houveSucesso) {
      this.movimentacoesOffline = filaRestante;
      await this.salvarFilaOffline();
    }

    this.isSyncing = false;
    this.notify();
    return erroCapturado;
  }

  // --- CACHE DE PRODUTOS ---

  async salvarProdutosCache(produtos: ProdutoModel[], empresaId?: string): Promise<void> {
    try {
      const eid = empresaId || this.currentEmpresaId;
      await StorageAdapter.setItem('produtos_cache', JSON.stringify(produtos), eid);
    } catch {
      // Ignora erro de cache
    }
  }

  async obterProdutosCache(empresaId?: string): Promise<ProdutoModel[]> {
    try {
      const eid = empresaId || this.currentEmpresaId;
      const jsonStr = await StorageAdapter.getItem('produtos_cache', eid);
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    } catch {
      return [];
    }
    return [];
  }

  // --- CACHE DE PRATELEIRAS ---

  async salvarPrateleirasCache(prateleiras: PrateleiraModel[], empresaId?: string): Promise<void> {
    try {
      const eid = empresaId || this.currentEmpresaId;
      await StorageAdapter.setItem('prateleiras_cache', JSON.stringify(prateleiras), eid);
    } catch { /* silêncio de cache */ }
  }

  async obterPrateleirasCache(empresaId?: string): Promise<PrateleiraModel[]> {
    try {
      const eid = empresaId || this.currentEmpresaId;
      const jsonStr = await StorageAdapter.getItem('prateleiras_cache', eid);
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    } catch {
      return [];
    }
    return [];
  }

  // --- CACHE DE FUNCIONÁRIOS ---

  async salvarFuncionariosCache(funcionarios: FuncionarioModel[], empresaId?: string): Promise<void> {
    try {
      const eid = empresaId || this.currentEmpresaId;
      await StorageAdapter.setItem('funcionarios_cache', JSON.stringify(funcionarios), eid);
    } catch { /* silêncio de cache */ }
  }

  async obterFuncionariosCache(empresaId?: string): Promise<FuncionarioModel[]> {
    try {
      const eid = empresaId || this.currentEmpresaId;
      const jsonStr = await StorageAdapter.getItem('funcionarios_cache', eid);
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    } catch {
      return [];
    }
    return [];
  }
}

export const syncService = SyncService.getInstance();
