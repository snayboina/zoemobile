import { ProdutoModel, parseProdutoFromDb, isConformidadeVencida } from '../types/models';
import { supabase } from './supabase/client';
import { syncService, SyncService } from './offline/syncService';

/**
 * ProdutoService - Gestão e Consulta de Produtos no ZOESTOCK.
 * Paridade com produto_service.dart do Flutter.
 */
export class ProdutoService {
  constructor(
    private client = supabase,
    private sync: SyncService = syncService
  ) {}

  /**
   * Agrega estoque de prateleiras e conformidade ao modelo do produto.
   */
  mapProdutoJson(json: Record<string, unknown>): ProdutoModel {
    const estoques = json.estoque_atual as Record<string, unknown>[] | undefined;
    let total = 0;
    let primeiraPrateleira: string | null = null;

    if (estoques && Array.isArray(estoques)) {
      for (const est of estoques) {
        total += Number(est.quantidade || 0);
        if (!primeiraPrateleira && est.prateleira_id) {
          primeiraPrateleira = String(est.prateleira_id);
        }
      }
    }

    const jsonEnriquecido: Record<string, unknown> = {
      ...json,
      estoque_atual: total,
      prateleira_id: primeiraPrateleira,
    };

    const confRaw = json.produto_conformidade;
    if (confRaw != null) {
      if (Array.isArray(confRaw) && confRaw.length > 0) {
        const first = confRaw[0] as Record<string, unknown>;
        jsonEnriquecido.conformidade = first;
        if (first.numero_ca != null && !jsonEnriquecido.ca_numero) {
          jsonEnriquecido.ca_numero = String(first.numero_ca);
        }
      } else if (typeof confRaw === 'object') {
        const obj = confRaw as Record<string, unknown>;
        jsonEnriquecido.conformidade = obj;
        if (obj.numero_ca != null && !jsonEnriquecido.ca_numero) {
          jsonEnriquecido.ca_numero = String(obj.numero_ca);
        }
      }
    }

    return parseProdutoFromDb(jsonEnriquecido);
  }

  /**
   * Busca produto por código de barras com isolamento por empresa.
   * Fallback para cache offline em caso de falha de conexão.
   */
  async getProdutoByCodigo(codigo: string, empresaId: string): Promise<ProdutoModel | null> {
    try {
      const { data, error } = await this.client
        .from('produtos')
        .select('*, estoque_atual(*), produto_conformidade(*)')
        .eq('codigo_barras', codigo)
        .eq('excluido', false)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        return this.mapProdutoJson(data as Record<string, unknown>);
      }
      return null;
    } catch {
      // Fallback para cache offline
      const cache = await this.sync.obterProdutosCache(empresaId);
      if (cache.length > 0) {
        const found = cache.find((p) => p.codigo === codigo || p.codigo_barras === codigo);
        return found || null;
      }
      return null;
    }
  }

  /**
   * Lista todos os produtos ativos da empresa ordenados alfabeticamente.
   */
  async listarProdutos(empresaId: string): Promise<ProdutoModel[]> {
    try {
      const { data, error } = await this.client
        .from('produtos')
        .select('*, estoque_atual(*), produto_conformidade(*)')
        .eq('excluido', false)
        .eq('empresa_id', empresaId)
        .order('nome', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const list = ((data as Record<string, unknown>[]) || []).map((json) =>
        this.mapProdutoJson(json)
      );

      // Atualiza cache em segundo plano
      await this.sync.salvarProdutosCache(list, empresaId);
      return list;
    } catch (err: unknown) {
      const cache = await this.sync.obterProdutosCache(empresaId);
      if (cache.length > 0) {
        return cache;
      }
      throw new Error(`Erro ao listar produtos (sem conexão): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Lista produtos vinculados a uma prateleira específica.
   */
  async getProdutosByPrateleira(prateleiraId: string, empresaId: string): Promise<ProdutoModel[]> {
    const todos = await this.listarProdutos(empresaId);
    return todos.filter((p) => p.prateleiraId === prateleiraId || p.prateleira_id === prateleiraId);
  }

  /**
   * Filtra produtos com estoque em nível crítico (estoqueAtual <= estoqueMinimo).
   */
  async getProdutosComEstoqueBaixo(empresaId: string): Promise<ProdutoModel[]> {
    const produtos = await this.listarProdutos(empresaId);
    return produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);
  }

  /**
   * Auxiliar de validação: verifica se o produto é EPI com CA vencido.
   */
  isEpiVencido(produto: ProdutoModel): boolean {
    return isConformidadeVencida(produto);
  }
}

export const produtoService = new ProdutoService();
