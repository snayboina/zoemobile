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

  private getContingenciaProdutos(empresaId: string): ProdutoModel[] {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const vencidoData = `${anoAtual - 1}-03-20`;
    const validoData = `${anoAtual + 3}-11-15`;

    return [
      {
        id: 'prod-001',
        nome: 'Luva de Vaqueta Mista Petroleira Cano Curto',
        codigo: 'EPI-001',
        codigo_barras: '7891000000011',
        estoqueAtual: 45,
        estoqueMinimo: 10,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
        conformidade: {
          tipo_controle: 'CA',
          numero_ca: '15432',
          data_validade: validoData,
          bloquear_vencido: true,
          status_manual: 'REGULAR',
        },
      },
      {
        id: 'prod-002',
        nome: 'Capacete de Segurança Classe B c/ Jugular Aba Frontal',
        codigo: 'EPI-002',
        codigo_barras: '7891000000028',
        estoqueAtual: 28,
        estoqueMinimo: 5,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
        conformidade: {
          tipo_controle: 'CA',
          numero_ca: '29871',
          data_validade: validoData,
          bloquear_vencido: true,
          status_manual: 'REGULAR',
        },
      },
      {
        id: 'prod-003',
        nome: 'Bota de Segurança Nobuck c/ Bico Composite Nº 41',
        codigo: 'EPI-003',
        codigo_barras: '7891000000035',
        estoqueAtual: 16,
        estoqueMinimo: 4,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
        conformidade: {
          tipo_controle: 'CA',
          numero_ca: '38910',
          data_validade: validoData,
          bloquear_vencido: true,
          status_manual: 'REGULAR',
        },
      },
      {
        id: 'prod-004',
        nome: 'Óculos de Proteção Antirrisco e Antiembaçante',
        codigo: 'EPI-004',
        codigo_barras: '7891000000042',
        estoqueAtual: 50,
        estoqueMinimo: 10,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
        conformidade: {
          tipo_controle: 'CA',
          numero_ca: '10344',
          data_validade: validoData,
          bloquear_vencido: true,
          status_manual: 'REGULAR',
        },
      },
      {
        id: 'prod-005',
        nome: 'Cinto Paraquedista 3 Pontos com Talabarte Duplo Y',
        codigo: 'EPI-005',
        codigo_barras: '7891000000059',
        estoqueAtual: 12,
        estoqueMinimo: 3,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
        conformidade: {
          tipo_controle: 'CA',
          numero_ca: '16890',
          data_validade: validoData,
          bloquear_vencido: true,
          status_manual: 'REGULAR',
        },
      },
      {
        id: 'prod-006',
        nome: 'Protetor Auditivo Plug Silicone (CA VENCIDO - TRAVA RN-08)',
        codigo: 'EPI-006',
        codigo_barras: '7891000000066',
        estoqueAtual: 30,
        estoqueMinimo: 10,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
        conformidade: {
          tipo_controle: 'CA',
          numero_ca: '09876',
          data_validade: vencidoData,
          bloquear_vencido: true,
          status_manual: 'REGULAR',
        },
      },
      {
        id: 'prod-007',
        nome: 'Fita Isolante de Alta Tensão 3M 19mm x 20m',
        codigo: 'MAT-001',
        codigo_barras: '7891000000073',
        estoqueAtual: 75,
        estoqueMinimo: 15,
        consumo: true,
        empresa_id: empresaId, ativo: true,
        excluido: false,
      },
      {
        id: 'prod-008',
        nome: 'Multímetro Digital Cat III 600V Fluke True-RMS',
        codigo: 'FER-001',
        codigo_barras: '7891000000080',
        estoqueAtual: 7,
        estoqueMinimo: 2,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
      },
      {
        id: 'prod-009',
        nome: 'Alicate Universal Isolado 1000V Tramontina PRO 8 pol',
        codigo: 'FER-002',
        codigo_barras: '7891000000097',
        estoqueAtual: 14,
        estoqueMinimo: 3,
        consumo: false,
        empresa_id: empresaId, ativo: true,
        excluido: false,
      },
      {
        id: 'prod-010',
        nome: 'Conector de Emenda Rápida 3 Vias WAGO 221-413 (pct 50)',
        codigo: 'MAT-002',
        codigo_barras: '7891000000103',
        estoqueAtual: 120,
        estoqueMinimo: 20,
        consumo: true,
        empresa_id: empresaId, ativo: true,
        excluido: false,
      },
    ];
  }

  async getProdutoByCodigo(codigo: string, empresaId?: string): Promise<ProdutoModel | null> {
    const codLimpo = (codigo || '').trim();
    if (!codLimpo) return null;

    try {
      // 1. Tentar busca com joins para a empresa especificada
      if (empresaId && empresaId.trim() !== '') {
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

      // 2. Busca geral no catálogo do Supabase (sem restrição de empresa)
      const resFull = await this.client
        .from('produtos')
        .select('*, estoque_atual(*), produto_conformidade(*)')
        .or(`codigo_barras.eq.${codLimpo},id.eq.${codLimpo}`)
        .eq('excluido', false)
        .maybeSingle();

      if (resFull.data) {
        return this.mapProdutoJson(resFull.data);
      }

      // 3. Fallback para select simples
      const resSimple = await this.client
        .from('produtos')
        .select('*')
        .or(`codigo_barras.eq.${codLimpo},id.eq.${codLimpo}`)
        .eq('excluido', false)
        .maybeSingle();

      if (resSimple.data) {
        return this.mapProdutoJson(resSimple.data);
      }
    } catch (_) {}

    // 4. Fallback no cache ou produtos de contingência
    const cache = await this.sync.obterProdutosCache(empresaId || 'default');
    const lista = cache.length > 0 ? cache : this.getContingenciaProdutos(empresaId || 'default');
    const found = lista.find(
      (p) =>
        p.codigo === codLimpo ||
        p.codigo_barras === codLimpo ||
        p.id === codLimpo
    );
    return found || null;
  }

  async listarProdutos(empresaId?: string): Promise<ProdutoModel[]> {
    try {
      const empFiltro = (empresaId || '').trim();

      // 1. Se informada empresaId, tentar carregar produtos vinculados a esta empresa
      if (empFiltro) {
        const { data, error } = await this.client
          .from('produtos')
          .select('*, estoque_atual(*), produto_conformidade(*)')
          .eq('excluido', false)
          .eq('empresa_id', empFiltro)
          .order('nome', { ascending: true });

        if (!error && data && data.length > 0) {
          const list = (data as Array<Record<string, any>>).map((json) =>
            this.mapProdutoJson(json)
          );
          await this.sync.salvarProdutosCache(list, empFiltro);
          return list;
        }

        // Se query com join falhou, tentar select simples na empresa
        if (error) {
          const resSimples = await this.client
            .from('produtos')
            .select('*')
            .eq('excluido', false)
            .eq('empresa_id', empFiltro)
            .order('nome', { ascending: true });

          if (!resSimples.error && resSimples.data && resSimples.data.length > 0) {
            const list = (resSimples.data as Array<Record<string, any>>).map((json) =>
              this.mapProdutoJson(json)
            );
            await this.sync.salvarProdutosCache(list, empFiltro);
            return list;
          }
        }
      }

      // 2. Busca geral de todos os produtos ativos cadastrados no Supabase
      // (Utilizado quando a empresa do operador não possui itens próprios ou empresaId é genérico)
      const resGeral = await this.client
        .from('produtos')
        .select('*, estoque_atual(*), produto_conformidade(*)')
        .eq('excluido', false)
        .order('nome', { ascending: true });

      if (!resGeral.error && resGeral.data && resGeral.data.length > 0) {
        const list = (resGeral.data as Array<Record<string, any>>).map((json) =>
          this.mapProdutoJson(json)
        );
        await this.sync.salvarProdutosCache(list, empFiltro || 'default');
        return list;
      }

      // 3. Fallback select simples geral
      const resGeralSimples = await this.client
        .from('produtos')
        .select('*')
        .eq('excluido', false)
        .order('nome', { ascending: true });

      if (!resGeralSimples.error && resGeralSimples.data && resGeralSimples.data.length > 0) {
        const list = (resGeralSimples.data as Array<Record<string, any>>).map((json) =>
          this.mapProdutoJson(json)
        );
        await this.sync.salvarProdutosCache(list, empFiltro || 'default');
        return list;
      }
    } catch (err) {
      console.warn('Falha na consulta ao Supabase de produtos:', err);
    }

    // 4. Fallback: obter cache salvo ou catálogo de contingência
    const cache = await this.sync.obterProdutosCache(empresaId || 'default');
    if (cache.length > 0) {
      return cache;
    }

    const contingencia = this.getContingenciaProdutos(empresaId || 'default');
    await this.sync.salvarProdutosCache(contingencia, empresaId || 'default');
    return contingencia;
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
