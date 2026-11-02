import type { ProdutoModel } from '../types/models';
import { parseProdutoFromDb, isConformidadeVencida } from '../types/models';
import { supabase } from './supabase/client';
import { syncService } from './offline/syncService';
import type { SyncService } from './offline/syncService';
import { StorageAdapter } from './offline/storageAdapter';

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
    } else if (json.tipo_controle) {
      jsonEnriquecido.conformidade = {
        tipo_controle: json.tipo_controle,
        numero_ca: json.numero_ca,
        data_validade: json.validade_ca,
        bloquear_vencido: Boolean(json.bloquear_vencido),
        status_manual: json.status_conformidade || 'REGULAR',
      };
    }

    return parseProdutoFromDb(jsonEnriquecido);
  }

  private isValidUuid(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
  }

  async getProdutoByCodigo(codigo: string, empresaId?: string): Promise<ProdutoModel | null> {
    const codLimpo = (codigo || '').trim();
    if (!codLimpo) return null;

    try {
      // 1. Tentar localizar na lista carregada da empresa (inclui produtos via RPC)
      const lista = await this.listarProdutos(empresaId);
      const found = lista.find(
        (p) =>
          p.codigo === codLimpo ||
          p.codigo_barras === codLimpo ||
          p.id === codLimpo
      );
      if (found) return found;

      // 2. Se for UUID ou código no Supabase
      if (empresaId && this.isValidUuid(empresaId)) {
        const resEmp = await this.client
          .from('produtos')
          .select('*, estoque_atual(*), produto_conformidade(*)')
          .or(`codigo_barras.eq.${codLimpo},id.eq.${codLimpo}`)
          .eq('excluido', false)
          .eq('empresa_id', empresaId)
          .maybeSingle();

        if (resEmp.data) {
          return this.mapProdutoJson(resEmp.data);
        }
      }
    } catch (_) {}

    // 3. Fallback no cache
    const cache = await this.sync.obterProdutosCache(empresaId || 'default');
    const item = cache.find(
      (p) =>
        p.codigo === codLimpo ||
        p.codigo_barras === codLimpo ||
        p.id === codLimpo
    );
    return item || null;
  }

  async listarProdutos(empresaId?: string): Promise<ProdutoModel[]> {
    let empFiltro = (empresaId || '').trim();

    // Se empresaId não foi fornecido ou não é UUID válido, recuperar da sessão salva
    if (!this.isValidUuid(empFiltro)) {
      try {
        const savedEmpId = await StorageAdapter.getItem('auth_empresa_id');
        if (this.isValidUuid(savedEmpId)) {
          empFiltro = savedEmpId!.trim();
        } else {
          const rawSess = await StorageAdapter.getItem('auth_session');
          if (rawSess) {
            const s = JSON.parse(rawSess);
            const sEmp = s.empresaId || s.empresa_id;
            if (this.isValidUuid(sEmp)) empFiltro = sEmp.trim();
          }
        }
      } catch (_) {}
    }

    try {
      // 1. Chamar RPC oficial listar_estoque_detalhado (utilizada no ZoeStock Web para saldos reais)
      if (this.isValidUuid(empFiltro)) {
        const { data: estDetalhado, error: estErr } = await this.client.rpc('listar_estoque_detalhado', {
          p_empresa_id: empFiltro,
        });

        if (!estErr && Array.isArray(estDetalhado) && estDetalhado.length > 0) {
          const estoqueMap = new Map<string, ProdutoModel>();

          for (const item of estDetalhado) {
            const pid = String(item.produto_id);
            const qtd = Number(item.quantidade || 0);

            if (!estoqueMap.has(pid)) {
              estoqueMap.set(pid, {
                id: pid,
                nome: item.produto_nome || '',
                codigo: item.codigo_barras || '',
                codigo_barras: item.codigo_barras || '',
                categoria: item.categoria || null,
                unidade: item.unidade_medida || 'UN',
                unidade_medida: item.unidade_medida || 'UN',
                estoqueAtual: qtd,
                estoque_atual: qtd,
                estoqueMinimo: Number(item.estoque_minimo || 0),
                estoque_minimo: Number(item.estoque_minimo || 0),
                consumo: Boolean(item.consumo),
                ativo: true,
                excluido: false,
                empresa_id: item.empresa_id || empFiltro,
                ehEpi: Boolean(item.eh_epi),
                eh_epi: Boolean(item.eh_epi),
                caNumero: item.ca_numero || null,
                ca_numero: item.ca_numero || null,
                prateleiraId: item.prateleira || null,
                prateleira_id: item.prateleira || null,
                conformidade: item.ca_numero
                  ? {
                      tipo_controle: 'CA',
                      numero_ca: item.ca_numero,
                      data_validade: undefined,
                      bloquear_vencido: false,
                      status_manual: 'REGULAR',
                    }
                  : null,
              });
            } else {
              const existente = estoqueMap.get(pid)!;
              existente.estoqueAtual = (existente.estoqueAtual ?? 0) + qtd;
              existente.estoque_atual = (existente.estoque_atual ?? 0) + qtd;
            }
          }

          // Enriquecer com listar_produtos_empresa para garantir conformidades completas e produtos zerados
          try {
            const { data: rpcProds } = await this.client.rpc('listar_produtos_empresa', {
              p_empresa_id: empFiltro,
            });

            if (Array.isArray(rpcProds)) {
              for (const raw of rpcProds) {
                const pid = String(raw.id);
                if (!estoqueMap.has(pid)) {
                  estoqueMap.set(pid, this.mapProdutoJson(raw));
                } else {
                  const p = estoqueMap.get(pid)!;
                  if (!p.conformidade && raw.tipo_controle) {
                    p.conformidade = {
                      tipo_controle: raw.tipo_controle,
                      numero_ca: raw.numero_ca,
                      data_validade: raw.validade_ca,
                      bloquear_vencido: Boolean(raw.bloquear_vencido),
                      status_manual: raw.status_conformidade || 'REGULAR',
                    };
                  }
                }
              }
            }
          } catch (_) {}

          const list = Array.from(estoqueMap.values());
          await this.sync.salvarProdutosCache(list, empFiltro);
          return list;
        }

        // 2. Se listar_estoque_detalhado não retornar, tentar listar_produtos_empresa
        const { data: rpcProds, error: rpcErr } = await this.client.rpc('listar_produtos_empresa', {
          p_empresa_id: empFiltro,
        });

        if (!rpcErr && Array.isArray(rpcProds) && rpcProds.length > 0) {
          const list = (rpcProds as Array<Record<string, any>>).map((json) =>
            this.mapProdutoJson(json)
          );
          await this.sync.salvarProdutosCache(list, empFiltro);
          return list;
        }
      }

      // 3. Fallback query direta se RLS permitir
      if (this.isValidUuid(empFiltro)) {
        const { data, error } = await this.client
          .from('produtos')
          .select('*, estoque_atual(*), produto_conformidade(*)')
          .eq('excluido', false)
          .eq('empresa_id', empFiltro)
          .order('nome', { ascending: true });

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            const list = (data as Array<Record<string, any>>).map((json) =>
              this.mapProdutoJson(json)
            );
            await this.sync.salvarProdutosCache(list, empFiltro);
            return list;
          } else {
            await this.sync.salvarProdutosCache([], empFiltro);
            return [];
          }
        }
      }
    } catch (err) {
      console.warn('Falha na consulta ao Supabase de produtos:', err);
    }

    // 3. Fallback: retornar cache offline ou vazio se o banco estiver limpo
    if (this.isValidUuid(empFiltro)) {
      const cache = await this.sync.obterProdutosCache(empFiltro);
      return cache;
    }
    return [];
  }

  async getProdutosByPrateleira(prateleiraId: string, empresaId?: string): Promise<ProdutoModel[]> {
    const todos = await this.listarProdutos(empresaId);
    return todos.filter((p) => p.prateleiraId === prateleiraId || p.prateleira_id === prateleiraId);
  }

  async getProdutosComEstoqueBaixo(empresaId?: string): Promise<ProdutoModel[]> {
    const produtos = await this.listarProdutos(empresaId);
    return produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);
  }

  isEpiVencido(produto: ProdutoModel): boolean {
    return isConformidadeVencida(produto);
  }
}

export const produtoService = new ProdutoService();
