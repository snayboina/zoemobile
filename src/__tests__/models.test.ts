import {
  parseProdutoFromDb,
  produtoToDbJson,
  isConformidadeVencida,
  deveBloquearVencido,
  getNumeroCaFinal,
  parseFuncionarioFromDb,
  funcionarioToDbJson,
  parseMovimentacaoFromDb,
  movimentacaoToDbJson,
  parseInventarioFromDb,
  inventarioToDbJson,
  parsePrateleiraFromDb,
  prateleiraToDbJson,
  parseDeviceFromDb,
  deviceToDbJson,
  parseSessionInfoFromDb,
  sessionInfoToDbJson,
  ProdutoModel,
} from '../types/models';

describe('Suíte de Testes Unitários dos Modelos e Contratos ZOESTOCK (Fase 1)', () => {
  // -------------------------------------------------------------------------
  // 1. PRODUTO & CONFORMIDADE
  // -------------------------------------------------------------------------
  describe('Modelo Produto e Regras de Negócio de Conformidade/EPI', () => {
    it('deve desserializar registro do banco para ProdutoModel com aliases corretos', () => {
      const dbRow = {
        id: 'prod-001',
        codigo_barras: '7891234567890',
        nome: 'Luva de Proteção Nitrílica',
        categoria: 'EPI',
        unidade_medida: 'PAR',
        estoque_atual: 45,
        estoque_minimo: 10,
        prateleira_id: 'prat-a1',
        excluido: false,
        consumo: false,
        ca_numero: '12345',
        eh_epi: true,
        empresa_id: 'empresa-xyz',
      };

      const produto = parseProdutoFromDb(dbRow);
      expect(produto.id).toBe('prod-001');
      expect(produto.codigo).toBe('7891234567890');
      expect(produto.unidade).toBe('PAR');
      expect(produto.ativo).toBe(true);
      expect(produto.estoqueAtual).toBe(45);
      expect(produto.caNumero).toBe('12345');
      expect(produto.ehEpi).toBe(true);
      expect(produto.empresa_id).toBe('empresa-xyz');
    });

    it('deve serializar ProdutoModel para formato do banco (excluido invertido)', () => {
      const prod: ProdutoModel = {
        id: 'prod-002',
        codigo: '7890001',
        nome: 'Capacete de Segurança',
        ativo: true,
        consumo: false,
        estoqueAtual: 20,
        estoqueMinimo: 5,
        caNumero: '54321',
      };

      const json = produtoToDbJson(prod);
      expect(json.codigo_barras).toBe('7890001');
      expect(json.excluido).toBe(false);
      expect(json.ca_numero).toBe('54321');
    });

    it('deve detectar EPI com validade de CA vencida', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);

      const produtoVencido: ProdutoModel = {
        id: 'prod-vencido',
        codigo: '111',
        nome: 'Óculos de Proteção',
        ativo: true,
        consumo: false,
        estoqueAtual: 10,
        estoqueMinimo: 2,
        conformidade: {
          tipo_controle: 'CA',
          data_validade: ontem.toISOString().split('T')[0],
          status_manual: 'ATIVO',
          bloquear_vencido: true,
        },
      };

      expect(isConformidadeVencida(produtoVencido)).toBe(true);
      expect(deveBloquearVencido(produtoVencido)).toBe(true);
    });

    it('deve aprovar EPI com validade de CA futura', () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);

      const produtoValido: ProdutoModel = {
        id: 'prod-valido',
        codigo: '222',
        nome: 'Protetor Auricular',
        ativo: true,
        consumo: false,
        estoqueAtual: 50,
        estoqueMinimo: 10,
        conformidade: {
          tipo_controle: 'CA',
          data_validade: futuro.toISOString().split('T')[0],
          status_manual: 'ATIVO',
        },
      };

      expect(isConformidadeVencida(produtoValido)).toBe(false);
    });

    it('deve detectar bloqueio manual de conformidade mesmo com data futura', () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 60);

      const produtoBloqueadoManual: ProdutoModel = {
        id: 'prod-bloq-manual',
        codigo: '333',
        nome: 'Máscara PFF2',
        ativo: true,
        consumo: false,
        estoqueAtual: 30,
        estoqueMinimo: 5,
        conformidade: {
          tipo_controle: 'CA',
          data_validade: futuro.toISOString().split('T')[0],
          status_manual: 'BLOQUEADO',
        },
      };

      expect(isConformidadeVencida(produtoBloqueadoManual)).toBe(true);
    });

    it('deve resolver número de CA final com higienização', () => {
      const prodComCa: ProdutoModel = {
        id: 'p1',
        codigo: '1',
        nome: 'Item 1',
        ativo: true,
        consumo: false,
        estoqueAtual: 1,
        estoqueMinimo: 1,
        caNumero: '  CA-9988  ',
      };
      expect(getNumeroCaFinal(prodComCa)).toBe('CA-9988');

      const prodFallbackConf: ProdutoModel = {
        id: 'p2',
        codigo: '2',
        nome: 'Item 2',
        ativo: true,
        consumo: false,
        estoqueAtual: 1,
        estoqueMinimo: 1,
        conformidade: { numero_ca: '7766' },
      };
      expect(getNumeroCaFinal(prodFallbackConf)).toBe('7766');

      const prodVazio: ProdutoModel = {
        id: 'p3',
        codigo: '3',
        nome: 'Item 3',
        ativo: true,
        consumo: false,
        estoqueAtual: 1,
        estoqueMinimo: 1,
        caNumero: 'EMPTY',
      };
      expect(getNumeroCaFinal(prodVazio)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 2. FUNCIONÁRIO
  // -------------------------------------------------------------------------
  describe('Modelo Funcionário e Isolamento Multiempresa', () => {
    it('deve converter campos do banco e mapear status de exclusão lógica', () => {
      const dbRow = {
        id: 'func-01',
        cracha: 'CR-5544',
        nome: 'Carlos Almoxarife',
        departamento: 'Logística',
        excluido: false,
        empresa_id: 'empresa-alpha',
        empresa_nome: 'Alpha Distribuidora',
        senha_movimentacao_hash: 'hash_sha256_mock',
      };

      const func = parseFuncionarioFromDb(dbRow);
      expect(func.id).toBe('func-01');
      expect(func.cracha).toBe('CR-5544');
      expect(func.ativo).toBe(true);
      expect(func.empresaId).toBe('empresa-alpha');
      expect(func.empresaNome).toBe('Alpha Distribuidora');
      expect(func.tem_senha_movimentacao).toBe(true);

      const json = funcionarioToDbJson(func);
      expect(json.cracha).toBe('CR-5544');
      expect(json.excluido).toBe(false);
      expect(json.empresa_id).toBe('empresa-alpha');
    });
  });

  // -------------------------------------------------------------------------
  // 3. MOVIMENTAÇÃO
  // -------------------------------------------------------------------------
  describe('Modelo Movimentação e Auditoria', () => {
    it('deve processar movimentações com telemetria e relações de join', () => {
      const dbRow = {
        id: 'mov-100',
        produto_id: 'prod-001',
        funcionario_id: 'func-01',
        prateleira_id: 'prat-a1',
        tipo: 'SA',
        quantidade: 2,
        observacao: 'Saída para manutenção',
        tipo_entrada: null,
        created_at: '2026-10-16T10:00:00.000Z',
        produtos: { nome: 'Luva Nitrílica' },
        funcionarios: { nome: 'Carlos Almoxarife' },
        device_id: 'dev-android-01',
        latitude: -23.5505,
        longitude: -46.6333,
        empresa_id: 'empresa-alpha',
      };

      const mov = parseMovimentacaoFromDb(dbRow);
      expect(mov.id).toBe('mov-100');
      expect(mov.tipo).toBe('SA');
      expect(mov.quantidade).toBe(2);
      expect(mov.nomeProduto).toBe('Luva Nitrílica');
      expect(mov.nomeFuncionario).toBe('Carlos Almoxarife');
      expect(mov.latitude).toBe(-23.5505);
      expect(mov.empresaId).toBe('empresa-alpha');

      const json = movimentacaoToDbJson(mov);
      expect(json.produto_id).toBe('prod-001');
      expect(json.tipo).toBe('SA');
      expect(json.quantidade).toBe(2);
      expect(json.device_id).toBe('dev-android-01');
      expect(json.empresa_id).toBe('empresa-alpha');
    });
  });

  // -------------------------------------------------------------------------
  // 4. INVENTÁRIO
  // -------------------------------------------------------------------------
  describe('Modelo Inventário e Auditoria de Estoque', () => {
    it('deve calcular e persistir contagem física e divergências', () => {
      const dbRow = {
        id: 'inv-01',
        produto_id: 'prod-01',
        usuario_id: 'user-01',
        quantidade_sistema: 50,
        quantidade_real: 48,
        diferenca: -2,
        observacao: '2 unidades avariadas',
      };

      const inv = parseInventarioFromDb(dbRow);
      expect(inv.quantidadeSistema).toBe(50);
      expect(inv.quantidadeReal).toBe(48);
      expect(inv.diferenca).toBe(-2);

      const json = inventarioToDbJson(inv);
      expect(json.diferenca).toBe(-2);
      expect(json.observacao).toBe('2 unidades avariadas');
    });
  });

  // -------------------------------------------------------------------------
  // 5. PRATELEIRA & DISPOSITIVO
  // -------------------------------------------------------------------------
  describe('Prateleiras e Dispositivos de Acesso', () => {
    it('deve mapear endereço e zona de prateleira', () => {
      const prat = parsePrateleiraFromDb({
        id: 'prat-99',
        codigo_localizacao: 'A-01-02',
        zona: 'SETOR-NORTE',
      });
      expect(prat.codigoLocalizacao).toBe('A-01-02');
      expect(prat.zona).toBe('SETOR-NORTE');

      const json = prateleiraToDbJson(prat);
      expect(json.codigo_localizacao).toBe('A-01-02');
    });

    it('deve converter metadados do aparelho para validação de aprovação', () => {
      const dev = parseDeviceFromDb({
        device_id: 'uuid-aparelho-123',
        device_name: 'Zebra TC26',
        manufacturer: 'Zebra Technologies',
        model: 'TC26',
        platform: 'android',
        android_version: '11.0',
        app_version: '1.0.0',
      });
      expect(dev.deviceId).toBe('uuid-aparelho-123');
      expect(dev.manufacturer).toBe('Zebra Technologies');

      const json = deviceToDbJson(dev);
      expect(json.device_id).toBe('uuid-aparelho-123');
      expect(json.device_name).toBe('Zebra TC26');
    });

    it('deve desserializar SessionInfo com controle de troca de PIN', () => {
      const session = parseSessionInfoFromDb({
        id: 'func-77',
        cracha: 'CR-777',
        nome: 'João Santos',
        ativo: true,
        force_change_pin: true,
        empresa_id: 'emp-01',
      });
      expect(session.cracha).toBe('CR-777');
      expect(session.forceChangePin).toBe(true);

      const json = sessionInfoToDbJson(session);
      expect(json.force_change_pin).toBe(true);
    });
  });
});
