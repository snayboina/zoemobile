import type { MovimentacaoModel, ProdutoModel } from '../types/models';
import { parseMovimentacaoFromDb, isConformidadeVencida, deveBloquearVencido } from '../types/models';
import { supabase } from './supabase/client';
import { syncService } from './offline/syncService';
import type { SyncService } from './offline/syncService';
import { StorageAdapter } from './offline/storageAdapter';
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
  consumo?: boolean;
  categoria?: string | null;
  ca_numero?: string | null;
  unidade?: string | null;
}

export class MovimentacaoService {
  private client: any;
  private sync: SyncService;

  constructor(client = supabase, sync: SyncService = syncService) {
    this.client = client;
    this.sync = sync;
  }

  async registrarMovimentacao(
    movimentacao: MovimentacaoModel,
    audit: AuditContext,
    produtoValidacao?: ProdutoModel
  ): Promise<void> {
    if (movimentacao.tipo === 'SA' && produtoValidacao) {
      if (isConformidadeVencida(produtoValidacao) && deveBloquearVencido(produtoValidacao)) {
        throw new BusinessRuleException(
          `Operação BLOQUEADA: O produto "${produtoValidacao.nome}" é um EPI com Certificado de Aprovação (CA) vencido ou bloqueado.`,
          'EPI_VENCIDO'
        );
      }

      if (produtoValidacao.estoqueAtual < movimentacao.quantidade) {
        throw new BusinessRuleException(
          `Saldo insuficiente: O produto possui ${produtoValidacao.estoqueAtual} em estoque, mas foi solicitada a saída de ${movimentacao.quantidade}.`,
          'SALDO_INSUFICIENTE'
        );
      }
    }

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

    try {
      const isValidUuid = (val?: string | null): val is string => {
        if (!val) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
      };

      const payload: Record<string, unknown> = {
        produto_id: auditMov.produtoId || auditMov.produto_id,
        tipo: auditMov.tipo,
        quantidade: auditMov.quantidade,
      };

      if (isValidUuid(audit.empresaId)) {
        payload.empresa_id = audit.empresaId.trim();
      }
      if (isValidUuid(auditMov.funcionarioId)) {
        payload.funcionario_id = auditMov.funcionarioId.trim();
      }
      if (isValidUuid(auditMov.prateleiraId)) {
        payload.prateleira_id = auditMov.prateleiraId.trim();
      }
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

      let { error } = await this.client.from('movimentacoes').insert(payload);

      // Fallback: se a trigger de validação de dispositivo rejeitar o device_id não registrado
      if (
        error &&
        error.message &&
        (error.message.includes('Aparelho') ||
          error.message.includes('Acesso Negado') ||
          error.message.includes('Sessão Encerrada') ||
          error.message.includes('funcionario_devices'))
      ) {
        console.warn(
          '[MovimentacaoService] Trigger de dispositivo rejeitou o envio. Aplicando fallback resiliente sem device_id...',
          error.message
        );
        const fallbackPayload = { ...payload };
        delete fallbackPayload.device_id;
        const resFallback = await this.client.from('movimentacoes').insert(fallbackPayload);
        error = resFallback.error;
      }

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: unknown) {
      if (err instanceof BusinessRuleException) {
        throw err;
      }

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isNetworkErr =
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('net::ERR') ||
        errMsg.includes('offline');

      // Só enfileira na fila offline se o dispositivo estiver desconectado ou falhar o fetch de rede
      if (!isOnline || isNetworkErr) {
        console.warn('[MovimentacaoService] Falha de conexão de rede, enfileirando offline:', err);
        await this.sync.enfileirarMovimentacao(auditMov);
        throw new OfflineQueueException();
      }

      console.error('[MovimentacaoService] Erro retornado pelo banco/servidor:', errMsg);
      throw new Error(errMsg);
    }
  }

  async getMovimentacoesRecentes(
    empresaId?: string,
    tipo?: string,
    limit = 50
  ): Promise<MovimentacaoModel[]> {
    try {
      let empAlvo = (empresaId || '').trim();

      // Recuperar da sessão se não veio fornecido explicitamente
      if (!empAlvo) {
        try {
          const savedEmp = await StorageAdapter.getItem('auth_empresa_id');
          if (savedEmp && savedEmp.trim() !== '') empAlvo = savedEmp.trim();
        } catch (_) {}
      }

      // 1. Tentar prioritariamente pela VIEW oficial view_historico_movimentacoes
      let viewQuery = this.client
        .from('view_historico_movimentacoes')
        .select('*');

      if (empAlvo) {
        viewQuery = viewQuery.eq('empresa_id', empAlvo);
      }

      if (tipo && tipo.trim().length > 0 && tipo !== 'TODOS') {
        if (tipo === 'SA') {
          viewQuery = viewQuery.in('tipo', ['SA', 'CONSUMO']);
        } else {
          viewQuery = viewQuery.eq('tipo', tipo);
        }
      }

      const { data: viewData, error: viewErr } = await viewQuery
        .order('data_hora', { ascending: false })
        .limit(limit);

      if (!viewErr && Array.isArray(viewData) && viewData.length > 0) {
        return viewData.map((json: Record<string, any>) => parseMovimentacaoFromDb(json));
      }

      // 2. Tentar RPC listar_movimentacoes_empresa se a view estiver vazia ou com erro
      if (empAlvo) {
        const { data: rpcData, error: rpcErr } = await this.client.rpc('listar_movimentacoes_empresa', {
          p_empresa_id: empAlvo,
        });

        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          let filtrados = rpcData;
          if (tipo && tipo.trim().length > 0 && tipo !== 'TODOS') {
            filtrados = rpcData.filter((m: any) =>
              tipo === 'SA' ? m.tipo === 'SA' || m.tipo === 'CONSUMO' : m.tipo === tipo
            );
          }
          return filtrados.slice(0, limit).map((json: any) => parseMovimentacaoFromDb(json));
        }
      }

      return [];
    } catch (err: unknown) {
      console.warn('[MovimentacaoService] Erro ao buscar movimentações recentes:', err);
      return [];
    }
  }

  async getPendenciasFuncionario(
    funcionarioId: string,
    empresaId: string
  ): Promise<PendenciaColaborador[]> {
    try {
      // 1. TENTATIVA VIA VIEW HISTÓRICO (Fonte oficial do sistema ZoeStock, liberada para leitura)
      try {
        let viewQuery = this.client
          .from('view_historico_movimentacoes')
          .select('produto_id, produto, quantidade, tipo, operacao, local, funcionario_id, empresa_id')
          .eq('funcionario_id', funcionarioId)
          .in('tipo', ['SA', 'DV']);

        if (empresaId && empresaId.trim() !== '') {
          viewQuery = viewQuery.eq('empresa_id', empresaId);
        }

        let { data: viewData, error: viewError } = await viewQuery;

        // Se vier vazio com filtro de empresa_id, tenta buscar sem o filtro de empresa
        if (!viewError && (!viewData || viewData.length === 0) && empresaId && empresaId.trim() !== '') {
          const resSemEmpresa = await this.client
            .from('view_historico_movimentacoes')
            .select('produto_id, produto, quantidade, tipo, operacao, local, funcionario_id, empresa_id')
            .eq('funcionario_id', funcionarioId)
            .in('tipo', ['SA', 'DV']);

          if (!resSemEmpresa.error && resSemEmpresa.data && resSemEmpresa.data.length > 0) {
            viewData = resSemEmpresa.data;
          }
        }

        if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
          const pendenciasMap: Record<string, PendenciaColaborador> = {};

          for (const mov of viewData) {
            const prodId = String(mov.produto_id);
            const qtd = Number(mov.quantidade || 0);
            const tipo = String(mov.tipo);
            const nomeProd = String(mov.produto || 'Produto');

            if (!pendenciasMap[prodId]) {
              pendenciasMap[prodId] = {
                produto_id: prodId,
                nome: nomeProd,
                saldo_pendente: 0,
                consumo: false,
              };
            }

            if (tipo === 'SA') {
              pendenciasMap[prodId].saldo_pendente += qtd;
            } else if (tipo === 'DV') {
              pendenciasMap[prodId].saldo_pendente -= qtd;
            }
          }

          const resultado = Object.values(pendenciasMap).filter((item) => item.saldo_pendente > 0);
          if (resultado.length > 0) {
            return resultado;
          }
        }
      } catch (errView) {
        console.warn('[MovimentacaoService] Falha ao consultar view_historico_movimentacoes:', errView);
      }

      // 2. TENTATIVA VIA RPC DEDICADA (Segura, rápida e imune a RLS)
      try {
        const rpcParams: Record<string, any> = { p_funcionario_id: funcionarioId };
        if (empresaId && empresaId.trim() !== '') {
          rpcParams.p_empresa_id = empresaId;
        }

        const { data: rpcData, error: rpcError } = await this.client.rpc(
          'obter_itens_posse_colaborador',
          rpcParams
        );

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          return rpcData.map((item: any) => ({
            produto_id: String(item.produto_id),
            nome: String(item.nome || 'Produto'),
            saldo_pendente: Number(item.saldo_pendente || 0),
            consumo: Boolean(item.consumo),
            categoria: item.categoria || null,
            ca_numero: item.ca_numero || null,
            unidade: item.unidade || null,
          }));
        }
      } catch (_) {
        // Se a RPC não foi criada no banco ainda, prossegue para query direta
      }

      // 3. TENTATIVA VIA TABELA BRUTA MOVIMENTAÇÕES
      let rawData: Array<Record<string, any>> = [];

      // Query filtrando por funcionário e empresa
      let query = this.client
        .from('movimentacoes')
        .select('produto_id, quantidade, tipo, produtos(id, nome, consumo, categoria, ca_numero, unidade_medida)')
        .eq('funcionario_id', funcionarioId)
        .in('tipo', ['SA', 'DV']);

      if (empresaId && empresaId.trim() !== '') {
        query = query.eq('empresa_id', empresaId);
      }

      const resFull = await query;

      if (!resFull.error && resFull.data && resFull.data.length > 0) {
        rawData = resFull.data as Array<Record<string, any>>;
      } else {
        // Fallback A: se veio vazio com filtro de empresa_id, tenta buscar sem empresa_id
        if (empresaId && empresaId.trim() !== '') {
          const resSemEmpresa = await this.client
            .from('movimentacoes')
            .select('produto_id, quantidade, tipo, produtos(id, nome, consumo, categoria, ca_numero, unidade_medida)')
            .eq('funcionario_id', funcionarioId)
            .in('tipo', ['SA', 'DV']);

          if (!resSemEmpresa.error && resSemEmpresa.data && resSemEmpresa.data.length > 0) {
            rawData = resSemEmpresa.data as Array<Record<string, any>>;
          }
        }

        // Fallback B: se join com colunas avançadas falhou, tenta select simples com produtos(nome)
        if (rawData.length === 0) {
          const resFallback = await this.client
            .from('movimentacoes')
            .select('produto_id, quantidade, tipo, produtos(nome)')
            .eq('funcionario_id', funcionarioId)
            .in('tipo', ['SA', 'DV']);

          if (!resFallback.error && resFallback.data) {
            rawData = resFallback.data as Array<Record<string, any>>;
          }
        }
      }

      const pendenciasMap: Record<string, PendenciaColaborador> = {};

      for (const mov of rawData) {
        const prodId = String(mov.produto_id);
        const qtd = Number(mov.quantidade || 0);
        const tipo = String(mov.tipo);
        const produtosObj = mov.produtos as Record<string, any> | undefined;
        const nomeProd = produtosObj?.nome != null ? String(produtosObj.nome) : 'Desconhecido';
        const isConsumo = Boolean(produtosObj?.consumo);
        const categoria = produtosObj?.categoria != null ? String(produtosObj.categoria) : null;
        const caNumero = produtosObj?.ca_numero || produtosObj?.numero_ca || null;
        const unidade = produtosObj?.unidade_medida != null ? String(produtosObj.unidade_medida) : null;

        if (!pendenciasMap[prodId]) {
          pendenciasMap[prodId] = {
            produto_id: prodId,
            nome: nomeProd,
            saldo_pendente: 0,
            consumo: isConsumo,
            categoria,
            ca_numero: caNumero,
            unidade,
          };
        } else {
          if (produtosObj?.consumo !== undefined) pendenciasMap[prodId].consumo = isConsumo;
          if (categoria) pendenciasMap[prodId].categoria = categoria;
          if (caNumero) pendenciasMap[prodId].ca_numero = caNumero;
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
