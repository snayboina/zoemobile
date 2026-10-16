/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProdutoService } from '../services/produtoService';
import { MovimentacaoService } from '../services/movimentacaoService';
import { SyncService } from '../services/offline/syncService';
import { FuncionarioService } from '../services/funcionarioService';
import { InventarioService } from '../services/inventarioService';
import { PrateleiraService } from '../services/prateleiraService';
import { StorageAdapter } from '../services/offline/storageAdapter';
import { OfflineQueueException, BusinessRuleException } from '../services/exceptions';
import { ProdutoModel, MovimentacaoModel } from '../types/models';
import { sha256 } from '../utils/crypto';

describe('Suíte de Testes Automatizados dos Serviços de Domínio e Fila Offline (Fase 2)', () => {
  beforeEach(async () => {
    await StorageAdapter.clearAll();
    await SyncService.getInstance().resetFilaParaTestes();
  });

  // -------------------------------------------------------------------------
  // 1. PRODUTO SERVICE
  // -------------------------------------------------------------------------
  describe('ProdutoService', () => {
    it('deve agregar saldo de estoque de múltiplas prateleiras e conformidade', () => {
      const mockClient: any = {};
      const service = new ProdutoService(mockClient);

      const rawDbRow = {
        id: 'prod-10',
        codigo_barras: '789111222',
        nome: 'Luva de Vaqueta',
        estoque_minimo: 15,
        excluido: false,
        estoque_atual: [
          { quantidade: 10, prateleira_id: 'prat-1' },
          { quantidade: 25, prateleira_id: 'prat-2' },
        ],
        produto_conformidade: [
          {
            tipo_controle: 'CA',
            numero_ca: '44556',
            data_validade: '2028-12-31',
            status_manual: 'ATIVO',
          },
        ],
      };

      const produto = service.mapProdutoJson(rawDbRow);
      expect(produto.id).toBe('prod-10');
      expect(produto.estoqueAtual).toBe(35);
      expect(produto.prateleiraId).toBe('prat-1');
      expect(produto.caNumero).toBe('44556');
      expect(service.isEpiVencido(produto)).toBe(false);
    });

    it('deve recuperar produto do cache offline quando a consulta ao Supabase falhar', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockRejectedValue(new Error('Falha de conexão com o banco')),
        }),
      };

      const sync = SyncService.getInstance();
      const cachedProd: ProdutoModel = {
        id: 'p-cached',
        codigo: '789999',
        nome: 'Capacete MSA',
        ativo: true,
        consumo: false,
        estoqueAtual: 12,
        estoqueMinimo: 5,
      };
      await sync.salvarProdutosCache([cachedProd], 'emp-01');

      const service = new ProdutoService(mockClient, sync);
      const resultado = await service.getProdutoByCodigo('789999', 'emp-01');

      expect(resultado).not.toBeNull();
      expect(resultado?.id).toBe('p-cached');
      expect(resultado?.nome).toBe('Capacete MSA');
    });

    it('deve filtrar produtos com estoque crítico (estoqueAtual <= estoqueMinimo)', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { id: 'p1', nome: 'Item Seguro', estoque_atual: [{ quantidade: 50 }], estoque_minimo: 10, excluido: false },
              { id: 'p2', nome: 'Item Crítico', estoque_atual: [{ quantidade: 3 }], estoque_minimo: 10, excluido: false },
              { id: 'p3', nome: 'Item Zerado', estoque_atual: [], estoque_minimo: 5, excluido: false },
            ],
            error: null,
          }),
        }),
      };

      const service = new ProdutoService(mockClient);
      const criticos = await service.getProdutosComEstoqueBaixo('emp-01');

      expect(criticos.length).toBe(2);
      expect(criticos.map((p) => p.id)).toEqual(['p2', 'p3']);
    });
  });

  // -------------------------------------------------------------------------
  // 2. MOVIMENTACAO SERVICE
  // -------------------------------------------------------------------------
  describe('MovimentacaoService', () => {
    it('deve BLOQUEAR saída de EPI com Certificado de Aprovação (CA) vencido', async () => {
      const mockClient: any = {};
      const service = new MovimentacaoService(mockClient);

      const produtoVencido: ProdutoModel = {
        id: 'p-venc',
        codigo: '123',
        nome: 'Máscara Vencida',
        ativo: true,
        consumo: false,
        estoqueAtual: 20,
        estoqueMinimo: 2,
        conformidade: {
          tipo_controle: 'CA',
          data_validade: '2020-01-01',
          status_manual: 'ATIVO',
          bloquear_vencido: true,
        },
      };

      const mov: MovimentacaoModel = {
        produtoId: 'p-venc',
        tipo: 'SA',
        quantidade: 1,
      };

      await expect(
        service.registrarMovimentacao(mov, { empresaId: 'emp-01' }, produtoVencido)
      ).rejects.toThrow(BusinessRuleException);
    });

    it('deve BLOQUEAR saída quando saldo em estoque for insuficiente', async () => {
      const mockClient: any = {};
      const service = new MovimentacaoService(mockClient);

      const produtoSemSaldo: ProdutoModel = {
        id: 'p-saldo',
        codigo: '456',
        nome: 'Broca 8mm',
        ativo: true,
        consumo: false,
        estoqueAtual: 5,
        estoqueMinimo: 2,
      };

      const mov: MovimentacaoModel = {
        produtoId: 'p-saldo',
        tipo: 'SA',
        quantidade: 10, // solicitando 10 tendo apenas 5
      };

      await expect(
        service.registrarMovimentacao(mov, { empresaId: 'emp-01' }, produtoSemSaldo)
      ).rejects.toThrow(/Saldo insuficiente/);
    });

    it('deve enfileirar movimentação offline e lançar OfflineQueueException em falha de rede', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockRejectedValue(new Error('Network request failed')),
        }),
      };

      const sync = SyncService.getInstance();
      sync.setEmpresaContext('emp-01');
      const service = new MovimentacaoService(mockClient, sync);

      const mov: MovimentacaoModel = {
        produtoId: 'prod-007',
        tipo: 'EN',
        quantidade: 50,
      };

      await expect(
        service.registrarMovimentacao(mov, {
          empresaId: 'emp-01',
          funcionarioId: 'func-01',
          funcionarioNome: 'Operador Teste',
        })
      ).rejects.toThrow(OfflineQueueException);

      expect(sync.pendenciasCount).toBe(1);
      expect(sync.filaOffline[0].produtoId).toBe('prod-007');
      expect(sync.filaOffline[0].synced).toBe(false);
    });

    it('deve calcular saldo pendente de colaborador abatendo devoluções (DV) de saídas (SA)', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [
              { produto_id: 'p-alicate', quantidade: 2, tipo: 'SA', produtos: { nome: 'Alicate Universal' } },
              { produto_id: 'p-alicate', quantidade: 1, tipo: 'DV', produtos: { nome: 'Alicate Universal' } },
              { produto_id: 'p-luva', quantidade: 5, tipo: 'SA', produtos: { nome: 'Luva de Proteção' } },
              { produto_id: 'p-luva', quantidade: 5, tipo: 'DV', produtos: { nome: 'Luva de Proteção' } }, // saldo zero
            ],
            error: null,
          }),
        }),
      };

      const service = new MovimentacaoService(mockClient);
      const pendencias = await service.getPendenciasFuncionario('func-01', 'emp-01');

      expect(pendencias.length).toBe(1);
      expect(pendencias[0].produto_id).toBe('p-alicate');
      expect(pendencias[0].saldo_pendente).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. SYNC SERVICE (FILA OFFLINE & ISOLAMENTO)
  // -------------------------------------------------------------------------
  describe('SyncService (Operação Offline & Multi-tenant)', () => {
    it('deve sincronizar fila de pendências e expurgar itens concluídos', async () => {
      const sync = SyncService.getInstance();
      sync.setEmpresaContext('emp-01');

      await sync.enfileirarMovimentacao(
        {
          produtoId: 'p-sync-1',
          tipo: 'EN',
          quantidade: 10,
        },
        false
      );

      expect(sync.pendenciasCount).toBe(1);

      const mockSupabase: any = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({ error: null }),
        }),
      };

      const erro = await sync.sincronizarPendentes(mockSupabase);
      expect(erro).toBeNull();
      expect(sync.pendenciasCount).toBe(0);
    });

    it('deve isolar e limpar dados de tenant na troca de empresa', async () => {
      await StorageAdapter.setItem('segredo', 'dados_empresa_A', 'emp-A');
      await StorageAdapter.setItem('segredo', 'dados_empresa_B', 'emp-B');

      expect(await StorageAdapter.getItem('segredo', 'emp-A')).toBe('dados_empresa_A');
      expect(await StorageAdapter.getItem('segredo', 'emp-B')).toBe('dados_empresa_B');

      await StorageAdapter.clearTenantData('emp-A');
      expect(await StorageAdapter.getItem('segredo', 'emp-A')).toBeNull();
      expect(await StorageAdapter.getItem('segredo', 'emp-B')).toBe('dados_empresa_B');
    });
  });

  // -------------------------------------------------------------------------
  // 4. FUNCIONARIO SERVICE
  // -------------------------------------------------------------------------
  describe('FuncionarioService & Criptografia SHA-256', () => {
    it('deve gerar hash SHA-256 idêntico e invocar RPC validar_senha_movimentacao', async () => {
      const mockClient: any = {
        rpc: jest.fn().mockResolvedValue({
          data: { success: true, message: 'Senha autenticada com sucesso.' },
          error: null,
        }),
      };

      const service = new FuncionarioService(mockClient);
      const res = await service.validarSenhaMovimentacao('func-99', '1234');

      expect(res.success).toBe(true);
      expect(mockClient.rpc).toHaveBeenCalledWith('validar_senha_movimentacao', {
        p_funcionario_id: 'func-99',
        p_senha_hash: sha256('1234'),
      });
    });

    it('deve retornar modo offline com aviso quando a validação de senha falhar por conexão', async () => {
      const mockClient: any = {
        rpc: jest.fn().mockRejectedValue(new Error('Conexão recusada')),
      };

      const service = new FuncionarioService(mockClient);
      const res = await service.validarSenhaMovimentacao('func-99', '1234');

      expect(res.success).toBe(true);
      expect(res.offline).toBe(true);
      expect(res.message).toContain('Modo offline');
    });
  });

  // -------------------------------------------------------------------------
  // 5. INVENTARIO & PRATELEIRAS
  // -------------------------------------------------------------------------
  describe('InventarioService & PrateleiraService', () => {
    it('deve criar cabeçalho e itens do inventário no Supabase', async () => {
      const mockClient: any = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'inventarios') {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: 'inv-header-77' }, error: null }),
            };
          }
          if (table === 'inventario_itens') {
            return {
              insert: jest.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      const service = new InventarioService(mockClient);
      const invId = await service.registrarInventario(
        {
          produtoId: 'prod-50',
          usuarioId: 'user-01',
          quantidadeSistema: 100,
          quantidadeReal: 95,
          diferenca: -5,
        },
        'emp-01'
      );

      expect(invId).toBe('inv-header-77');
    });

    it('deve listar prateleiras e persistir no cache', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { id: 'prat-1', codigo_localizacao: 'A-01-01', zona: 'ZONA-A', empresa_id: 'emp-01' },
            ],
            error: null,
          }),
        }),
      };

      const sync = SyncService.getInstance();
      const service = new PrateleiraService(mockClient, sync);
      const lista = await service.listarPrateleiras('emp-01');

      expect(lista.length).toBe(1);
      expect(lista[0].codigoLocalizacao).toBe('A-01-01');

      const cached = await sync.obterPrateleirasCache('emp-01');
      expect(cached.length).toBe(1);
      expect(cached[0].codigoLocalizacao).toBe('A-01-01');
    });
  });
});
