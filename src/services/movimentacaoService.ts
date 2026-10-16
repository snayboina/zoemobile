import { MovimentacaoModel, parseMovimentacaoFromDb, isConformidadeVencida, deveBloquearVencido, ProdutoModel } from '../types/models';
import { supabase } from './supabase/client';
import { syncService, SyncService } from './offline/syncService';
import { OfflineQueueException, BusinessRuleException } from './exceptions';

export interface AuditContext {
  empresaId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  funcionarioCracha?: string;
  deviceId?: string;
  appVersion?: string;
  osPlatform?: string;
  sessionId?: string;
  latitude?: number;
  longitude?: number;
}

export interface PendenciaColaborador {
  produto_id: string;
  nome: string;
  saldo_pendente: number;
}

/**
 * MovimentacaoService - Registro, Auditoria e Consulta de Movimentações.
 * Paridade integral com movimentacao_service.dart.
 */
export class MovimentacaoService {
  constructor(
    private client = supabase,
    private sync: SyncService = syncService
  ) {}

  /**
   * Registra movimentação de estoque (EN, SA, DV, CONSUMO).
   * Executa travas de conformidade de EPI e estoque.
   * Se offline, enfileira e lança OfflineQueueException.
   */
  async registrarMovimentacao(
    movimentacao: MovimentacaoModel,
    audit: AuditContext,
    produtoValidacao?: ProdutoModel
  ): Promise<void> {
    // 1. REGRA CRÍTICA DE SEGURANÇA: Bloqueio de EPI com CA vencido na Saída
    if (movimentacao.tipo === 'SA' && produtoValidacao) {
      if (isConformidadeVencida(produtoValidacao) && deveBloquearVencido(produtoValidacao)) {
        throw new BusinessRuleException(
          `Operação BLOQUEADA: O produto "${produtoValidacao.nome}" é um EPI com Certificado de Aprovação (CA) vencido ou bloqueado.`,
          'EPI_VENCIDO'
        );
      }

      // Validação de saldo disponível
      if (produtoValidacao.estoqueAtual < movimentacao.quantidade) {
        throw new BusinessRuleException(
          `Saldo insuficiente: O produto possui ${produtoValidacao.estoqueAtual} em estoque, mas foi solicitada a saída de ${movimentacao.quantidade}.`,
          'SALDO_INSUFICIENTE'
        );
      }
    }

    // 2. Enriquecimento auditável com telemetria
    const auditMov: MovimentacaoModel = {
      ...movimentacao,
      id: movimentacao.id || `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      funcionarioId: movimentacao.funcionarioId || audit.funcionarioId,
      empresaId: audit.empresaId,
      usuarioNome: audit.funcionarioNome,
      usuarioMatricula: audit.funcionarioCracha,
      deviceId: audit.deviceId,
      appVersion: audit.appVersion,
      osPlatform: audit.osPlatform,
      sessionId: audit.sessionId,
      latitude: audit.latitude ?? movimentacao.latitude,
      longitude: audit.longitude ?? movimentacao.longitude,
      createdAt: movimentacao.createdAt || new Date(),
    };

    // 3. Tentativa de inserção direta no Supabase
    try {
      const payload: Record<string, unknown> = {
        produto_id: auditMov.produtoId || auditMov.produto_id,
        tipo: auditMov.tipo,
        quantidade: auditMov.quantidade,
        empresa_id: audit.empresaId,
      };
      if (auditMov.funcionarioId) payload.funcionario_id = auditMov.funcionarioId;
      if (auditMov.prateleiraId) payload.prateleira_id = auditMov.prateleiraId;
      if (auditMov.observacao) payload.observacao = auditMov.observacao;
      if (auditMov.tipoEntrada) payload.tipo_entrada = auditMov.tipoEntrada;
      if (auditMov.usuarioNome) payload.usuario_nome = auditMov.usuarioNome;
      if (auditMov.usuarioMatricula) payload.usuario_matricula = auditMov.usuarioMatricula;
      if (auditMov.deviceId) payload.device_id = auditMov.deviceId;
      if (auditMov.appVersion) payload.app_version = auditMov.appVersion;
      if (auditMov.osPlatform) payload.os_platform = auditMov.osPlatform;
      if (auditMov.latitude != null) payload.latitude = auditMov.latitude;
      if (auditMov.longitude != null) payload.longitude = auditMov.longitude;
      if (auditMov.sessionId) payload.session_id = auditMov.sessionId;

      const { error } = await this.client.from('movimentacoes').insert(payload);
      if (error) {
        throw new Error(error.message);
      }
    } catch {
      // 4. Contingência offline: salva na fila persistente e avisa a UI
      await this.sync.enfileirarMovimentacao(auditMov);
      throw new OfflineQueueException();
    }
  }

  /**
   * Consulta o histórico de movimentações com isolamento multiempresa.
   */
  async getMovimentacoesRecentes(
    empresaId: string,
    tipo?: string,
    limit = 50
  ): Promise<MovimentacaoModel[]> {
    try {
      let query = this.client
        .from('movimentacoes')
        .select('*, produtos(nome), funcionarios(nome)')
        .eq('empresa_id', empresaId);

      if (tipo && tipo.trim().length > 0) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return ((data as Record<string, unknown>[]) || []).map((json) =>
        parseMovimentacaoFromDb(json)
      );
    } catch (err: unknown) {
      throw new Error(`Erro ao buscar movimentações: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Calcula as pendências de devolução de materiais por colaborador.
   * Agrupa saídas (SA) e abates de devoluções (DV).
   */
  async getPendenciasFuncionario(
    funcionarioId: string,
    empresaId: string
  ): Promise<PendenciaColaborador[]> {
    try {
      const { data, error } = await this.client
        .from('movimentacoes')
        .select('produto_id, quantidade, tipo, produtos(nome)')
        .eq('funcionario_id', funcionarioId)
        .eq('empresa_id', empresaId)
        .in('tipo', ['SA', 'DV']);

      if (error) {
        throw new Error(error.message);
      }

      const pendenciasMap: Record<string, PendenciaColaborador> = {};

      for (const mov of (data as Record<string, unknown>[]) || []) {
        const prodId = String(mov.produto_id);
        const qtd = Number(mov.quantidade || 0);
        const tipo = String(mov.tipo);
        const produtosObj = mov.produtos as Record<string, unknown> | undefined;
        const nomeProd = produtosObj?.nome != null ? String(produtosObj.nome) : 'Desconhecido';

        if (!pendenciasMap[prodId]) {
          pendenciasMap[prodId] = {
            produto_id: prodId,
            nome: nomeProd,
            saldo_pendente: 0,
          };
        }

        if (tipo === 'SA') {
          pendenciasMap[prodId].saldo_pendente += qtd;
        } else if (tipo === 'DV') {
          pendenciasMap[prodId].saldo_pendente -= qtd;
        }
      }

      return Object.values(pendenciasMap).filter((item) => item.saldo_pendente > 0);
    } catch (err: unknown) {
      throw new Error(`Erro ao calcular pendências: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export const movimentacaoService = new MovimentacaoService();
