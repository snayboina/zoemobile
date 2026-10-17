import type { ProdutoModel } from '../types/models';
import { parseProdutoFromDb, isConformidadeVencida } from '../types/models';
import { supabase } from './supabase/client';
import { syncService } from './offline/syncService';
import type { SyncService } from './offline/syncService';

export class ProdutoService {
  private client: any;
  private sync: SyncService;

  constructor(client = supabase, sync: SyncService = syncService) {
    this.client = client;
    this.sync = sync;
  }

  mapProdutoJson(json: Record<string, any>): ProdutoModel {
    const estoques = json.estoque_atual as Array<Record<string, any>> | undefined;
    let total = 0;
    let primeiraPrateleira: string | null = null;

    if (estoques && Array.isArray(estoques)) {
      for (const est of estoques) {
        total += Number(est.quantidade || 0);
        if (!primeiraPrateleira && est.prateleira_id) {
          primeiraPrateleira = String(est.prateleira_id);
        }
      }
    } else if (typeof json.estoque_atual === 'number') {
      total = json.estoque_atual;
    }

    const jsonEnriquecido: Record<string, any> = {
      ...json,
      estoque_atual: total,
      prateleira_id: primeiraPrateleira || json.prateleira_id || null,
    };

    const confRaw = json.produto_conformidade;
    if (confRaw != null) {
      if (Array.isArray(confRaw) && confRaw.length > 0) {
        jsonEnriquecido.conformidade = confRaw[0];
      } else if (typeof confRaw === 'object') {
        jsonEnriquecido.conformidade = confRaw;
      }
    }

    return parseProdutoFromDb(jsonEnriquecido);
  }

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
        return this.mapProdutoJson(data);
      }
      return null;
    } catch {
      const cache = await this.sync.obterProdutosCache(empresaId);
      if (cache.length > 0) {
        const found = cache.find((p) => p.codigo === codigo || p.codigo_barras === codigo);
        return found || null;
      }
      return null;
    }
  }

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

      const list = ((data as Array<Record<string, any>>) || []).map((json) =>
        this.mapProdutoJson(json)
      );

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

  async getProdutosByPrateleira(prateleiraId: string, empresaId: string): Promise<ProdutoModel[]> {
    const todos = await this.listarProdutos(empresaId);
    return todos.filter((p) => p.prateleiraId === prateleiraId || p.prateleira_id === prateleiraId);
  }

  async getProdutosComEstoqueBaixo(empresaId: string): Promise<ProdutoModel[]> {
    const produtos = await this.listarProdutos(empresaId);
    return produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);
  }

  isEpiVencido(produto: ProdutoModel): boolean {
    return isConformidadeVencida(produto);
  }
}

export const produtoService = new ProdutoService();
