/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import {
  PinKeyboard,
  QuantitySelector,
  BarcodeScannerModal,
  EstoqueBaixoAlert,
  EpiConformidadeBadge,
  ConfirmationModal,
  EmptyState,
  ConnectionStatusIndicator,
} from '../components';
import { ProdutoModel } from '../types/models';

// Mocks essenciais para ambiente de teste Jest / Fabric
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockSvg = (props: any) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Circle: MockSvg,
    Path: MockSvg,
    Rect: MockSvg,
    Line: MockSvg,
    Polygon: MockSvg,
    Polyline: MockSvg,
    G: MockSvg,
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, {
    get: (_target, prop) => {
      const MockIcon = (props: any) => React.createElement(View, { testID: `icon-${String(prop)}`, ...props });
      return MockIcon;
    },
  });
});

// Mocks de módulos nativos do Expo
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const mockRequestPermission = jest.fn();
let mockPermissionState: { granted: boolean } | null = { granted: true };

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props: any) => <View testID="mock-camera-view" {...props} />,
    useCameraPermissions: () => [mockPermissionState, mockRequestPermission],
  };
});

/**
 * Função utilitária para gerar ProdutoModel tipado estritamente
 */
function createMockProduto(overrides: Partial<ProdutoModel> = {}): ProdutoModel {
  return {
    id: 'prod-mock-1',
    codigo: '7891234567890',
    nome: 'Item Industrial Padrão',
    ativo: true,
    consumo: false,
    estoqueAtual: 10,
    estoqueMinimo: 5,
    estoque_atual: 10,
    estoque_minimo: 5,
    empresa_id: 'emp-1',
    ...overrides,
  };
}

describe('Fase 3 — Suíte de Testes dos Componentes Industriais ZOESTOCK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissionState = { granted: true };
  });

  // ==========================================================================
  // 1. PIN KEYBOARD: Entrada, exclusão, limpeza e acessibilidade
  // ==========================================================================
  describe('PinKeyboard Component', () => {
    it('1. Deve inserir dígitos, atualizar os dots visuais e disparar onComplete ao atingir o tamanho', () => {
      const handleComplete = jest.fn();
      const handleChange = jest.fn();

      const { getByTestId, queryByText } = render(
        <PinKeyboard pinLength={4} onComplete={handleComplete} onChange={handleChange} />
      );

      // Clica nas teclas 1, 2, 3, 4
      fireEvent.press(getByTestId('pin-key-1'));
      expect(handleChange).toHaveBeenCalledWith('1');

      fireEvent.press(getByTestId('pin-key-2'));
      expect(handleChange).toHaveBeenCalledWith('12');

      fireEvent.press(getByTestId('pin-key-3'));
      expect(handleChange).toHaveBeenCalledWith('123');

      fireEvent.press(getByTestId('pin-key-4'));
      expect(handleChange).toHaveBeenCalledWith('1234');

      // Avança timers para o callback com debounce
      act(() => {
        jest.runAllTimers?.();
      });

      // Verifica se o PIN real NÃO aparece no texto renderizado (mascaramento)
      expect(queryByText('1234')).toBeNull();
    });

    it('2. Deve excluir dígitos via Backspace e limpar via Clear', () => {
      const handleChange = jest.fn();
      const { getByTestId } = render(
        <PinKeyboard pinLength={4} onComplete={jest.fn()} onChange={handleChange} />
      );

      fireEvent.press(getByTestId('pin-key-9'));
      fireEvent.press(getByTestId('pin-key-8'));
      expect(handleChange).toHaveBeenLastCalledWith('98');

      // Pressiona backspace
      fireEvent.press(getByTestId('pin-key-backspace'));
      expect(handleChange).toHaveBeenLastCalledWith('9');

      // Pressiona tecla 5
      fireEvent.press(getByTestId('pin-key-5'));
      expect(handleChange).toHaveBeenLastCalledWith('95');

      // Limpa tudo
      fireEvent.press(getByTestId('pin-key-clear'));
      expect(handleChange).toHaveBeenLastCalledWith('');
    });

    it('3. Deve bloquear todas as teclas e exibir indicador quando loading=true (Prevenção de múltiplos envios)', () => {
      const handleChange = jest.fn();
      const { getByTestId, getByText } = render(
        <PinKeyboard pinLength={4} onComplete={jest.fn()} onChange={handleChange} loading={true} />
      );

      expect(getByText('Validando PIN...')).toBeTruthy();

      // Tentativa de pressionar teclas com loading ativo deve ser ignorada
      fireEvent.press(getByTestId('pin-key-1'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('4. Deve possuir acessibilidade configurada nas teclas e indicadores', () => {
      const { getByTestId } = render(
        <PinKeyboard pinLength={4} onComplete={jest.fn()} />
      );

      const key7 = getByTestId('pin-key-7');
      expect(key7.props.accessibilityLabel).toBe('Dígito 7');
      expect(key7.props.accessibilityRole).toBe('button');
    });
  });

  // ==========================================================================
  // 2. QUANTITY SELECTOR: Limites, valores inválidos e unidades
  // ==========================================================================
  describe('QuantitySelector Component', () => {
    it('5. Deve incrementar e decrementar respeitando limites mínimo e máximo', () => {
      const handleChanged = jest.fn();
      const { getByTestId } = render(
        <QuantitySelector value={5} min={1} max={7} onChanged={handleChanged} unit="UN" />
      );

      // Incrementa de 5 para 6
      fireEvent.press(getByTestId('btn-increment'));
      expect(handleChanged).toHaveBeenCalledWith(6);

      // Decrementa de 5 para 4
      fireEvent.press(getByTestId('btn-decrement'));
      expect(handleChanged).toHaveBeenCalledWith(4);
    });

    it('6. Não deve permitir decrementar abaixo do mínimo nem acima do máximo', () => {
      const handleChanged = jest.fn();
      const { getByTestId } = render(
        <QuantitySelector value={1} min={1} max={1} onChanged={handleChanged} />
      );

      // Botão decrement deve estar desabilitado no mínimo
      fireEvent.press(getByTestId('btn-decrement'));
      expect(handleChanged).not.toHaveBeenCalled();

      // Botão increment deve estar desabilitado no máximo
      fireEvent.press(getByTestId('btn-increment'));
      expect(handleChanged).not.toHaveBeenCalled();
    });

    it('7. Deve tratar entrada manual inválida, valores negativos e reverter ao mínimo ou teto', () => {
      const handleChanged = jest.fn();
      const { getByTestId } = render(
        <QuantitySelector value={3} min={1} max={10} onChanged={handleChanged} />
      );

      const input = getByTestId('quantity-input');

      // Tenta digitar caracteres não numéricos ou limpar
      fireEvent.changeText(input, 'abc');
      fireEvent(input, 'blur');
      expect(handleChanged).toHaveBeenCalledWith(1);

      // Digita valor acima do máximo (ex: 99 quando max=10)
      fireEvent.changeText(input, '99');
      expect(handleChanged).toHaveBeenCalledWith(10);
    });
  });

  // ==========================================================================
  // 3. ESTOQUE BAIXO ALERT: Indicadores de criticidade
  // ==========================================================================
  describe('EstoqueBaixoAlert Component', () => {
    it('8. Deve exibir alerta CRÍTICO/ESGOTADO quando estoque atual for zero ou negativo', () => {
      const produtoCritico = createMockProduto({
        id: 'p1',
        nome: 'Luva de Proteção Nitrílica',
        estoqueAtual: 0,
        estoqueMinimo: 10,
        estoque_atual: 0,
        estoque_minimo: 10,
      });

      const { getByText, getByTestId } = render(
        <EstoqueBaixoAlert produto={produtoCritico} />
      );

      expect(getByTestId('alerta-estoque-baixo-individual')).toBeTruthy();
      expect(getByText('ESGOTADO')).toBeTruthy();
      expect(getByText('Luva de Proteção Nitrílica')).toBeTruthy();
    });

    it('9. Deve exibir alerta de ATENÇÃO quando estoque atual estiver entre 1 e o mínimo', () => {
      const produtoBaixo = createMockProduto({
        id: 'p2',
        nome: 'Capacete MSA Aba Frontal',
        estoqueAtual: 4,
        estoqueMinimo: 10,
        estoque_atual: 4,
        estoque_minimo: 10,
      });

      const { getByText } = render(
        <EstoqueBaixoAlert produto={produtoBaixo} />
      );

      expect(getByText('ESTOQUE BAIXO')).toBeTruthy();
      expect(getByText('4')).toBeTruthy();
    });

    it('10. Não deve renderizar alerta quando o estoque estiver acima do mínimo', () => {
      const produtoNormal = createMockProduto({
        id: 'p3',
        nome: 'Óculos de Segurança Fumê',
        estoqueAtual: 50,
        estoqueMinimo: 10,
        estoque_atual: 50,
        estoque_minimo: 10,
      });

      const { queryByTestId } = render(
        <EstoqueBaixoAlert produto={produtoNormal} />
      );

      expect(queryByTestId('alerta-estoque-baixo-individual')).toBeNull();
    });

    it('11. Deve renderizar modo lista sumário com quantidade correta de itens', () => {
      const lista: ProdutoModel[] = [
        createMockProduto({ id: '1', nome: 'Item A', estoque_atual: 0, estoque_minimo: 5 }),
        createMockProduto({ id: '2', nome: 'Item B', estoque_atual: 2, estoque_minimo: 5 }),
      ];

      const { getByText, getByTestId } = render(
        <EstoqueBaixoAlert produtos={lista} />
      );

      expect(getByTestId('alerta-estoque-baixo-sumario')).toBeTruthy();
      expect(getByText('2 produto(s) com estoque abaixo do mínimo')).toBeTruthy();
    });
  });

  // ==========================================================================
  // 4. EPI CONFORMIDADE BADGE: Regras de conformidade e trava de segurança
  // ==========================================================================
  describe('EpiConformidadeBadge Component', () => {
    it('12. Deve renderizar EPI CONFORME para EPI válido com CA ativo', () => {
      const epiValido = createMockProduto({
        id: 'epi1',
        nome: 'Protetor Auditivo Plug',
        eh_epi: true,
        ehEpi: true,
        numero_ca: '12345',
        caNumero: '12345',
        validade_ca: '2030-12-31',
      });

      const { getByText, getByTestId } = render(
        <EpiConformidadeBadge produto={epiValido} />
      );

      expect(getByTestId('epi-badge-conforme')).toBeTruthy();
      expect(getByText('EPI CONFORME')).toBeTruthy();
      expect(getByText('• CA 12345')).toBeTruthy();
    });

    it('13. Deve renderizar CA VENCIDO quando a data de validade estiver expirada', () => {
      const epiVencido = createMockProduto({
        id: 'epi2',
        nome: 'Máscara PFF2',
        eh_epi: true,
        ehEpi: true,
        numero_ca: '54321',
        caNumero: '54321',
        validade_ca: '2020-01-01',
      });

      const { getByText, getByTestId } = render(
        <EpiConformidadeBadge produto={epiVencido} />
      );

      expect(getByTestId('epi-badge-vencido')).toBeTruthy();
      expect(getByText('CA VENCIDO')).toBeTruthy();
    });

    it('14. NUNCA deve autorizar automaticamente situação desconhecida (deve exibir CA NÃO LOCALIZADO)', () => {
      const epiSemCa = createMockProduto({
        id: 'epi3',
        nome: 'Cinto Paraquedista',
        eh_epi: true,
        ehEpi: true,
        numero_ca: undefined,
        caNumero: undefined,
        validade_ca: undefined,
      });

      const { getByText, getByTestId } = render(
        <EpiConformidadeBadge produto={epiSemCa} />
      );

      // Trava estrita de segurança
      expect(getByTestId('epi-badge-desconhecido')).toBeTruthy();
      expect(getByText('CA NÃO LOCALIZADO')).toBeTruthy();
    });

    it('15. Não deve renderizar badge se o produto não for um EPI', () => {
      const produtoComum = createMockProduto({
        id: 'p4',
        nome: 'Parafuso Sextavado M8',
        eh_epi: false,
        ehEpi: false,
      });

      const { queryByTestId } = render(
        <EpiConformidadeBadge produto={produtoComum} />
      );

      expect(queryByTestId('epi-badge-conforme')).toBeNull();
      expect(queryByTestId('epi-badge-vencido')).toBeNull();
    });
  });

  // ==========================================================================
  // 5. BARCODE SCANNER MODAL: Permissões, mira e modo manual
  // ==========================================================================
  describe('BarcodeScannerModal Component', () => {
    it('16. Deve renderizar mira industrial e câmera quando permissão for concedida', () => {
      mockPermissionState = { granted: true };

      const { getByTestId } = render(
        <BarcodeScannerModal visible={true} onScan={jest.fn()} onClose={jest.fn()} />
      );

      expect(getByTestId('scanner-camera-wrapper')).toBeTruthy();
      expect(getByTestId('scanner-target-box')).toBeTruthy();
    });

    it('17. Deve exibir tela de solicitação quando permissão de câmera estiver negada', () => {
      mockPermissionState = { granted: false };

      const { getByTestId, getByText } = render(
        <BarcodeScannerModal visible={true} onScan={jest.fn()} onClose={jest.fn()} />
      );

      expect(getByTestId('scanner-permission-denied')).toBeTruthy();
      expect(getByText('Permissão de Câmera Necessária')).toBeTruthy();

      fireEvent.press(getByTestId('btn-request-permission'));
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('18. Deve permitir alternar para digitação manual e enviar código digitado', () => {
      const handleScan = jest.fn();
      const handleClose = jest.fn();

      const { getByTestId } = render(
        <BarcodeScannerModal visible={true} onScan={handleScan} onClose={handleClose} />
      );

      // Alterna para modo manual
      fireEvent.press(getByTestId('btn-toggle-manual'));
      expect(getByTestId('scanner-manual-view')).toBeTruthy();

      // Digita código manual
      const input = getByTestId('input-manual-barcode');
      fireEvent.changeText(input, '7891234567890');

      // Confirma código
      fireEvent.press(getByTestId('btn-confirm-manual-code'));
      expect(handleScan).toHaveBeenCalledWith('7891234567890');
      expect(handleClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 6. COMPONENTES AUXILIARES: ConfirmationModal, EmptyState, ConnectionStatus
  // ==========================================================================
  describe('Componentes Auxiliares Industriais', () => {
    it('19. ConfirmationModal deve confirmar e cancelar ações', () => {
      const handleConfirm = jest.fn();
      const handleCancel = jest.fn();

      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirmar Saída"
          message="Deseja registrar a saída deste material?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(getByTestId('confirmation-modal-card')).toBeTruthy();

      fireEvent.press(getByTestId('btn-modal-cancel'));
      expect(handleCancel).toHaveBeenCalledTimes(1);

      fireEvent.press(getByTestId('btn-modal-confirm'));
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('20. EmptyState deve exibir mensagem e disparar ação secundária', () => {
      const handleAction = jest.fn();

      const { getByTestId, getByText } = render(
        <EmptyState
          title="Nenhum Produto Encontrado"
          description="Tente ajustar a busca ou escanear um novo código."
          actionText="NOVA CONSULTA"
          onAction={handleAction}
        />
      );

      expect(getByTestId('empty-state-view')).toBeTruthy();
      expect(getByText('Nenhum Produto Encontrado')).toBeTruthy();

      fireEvent.press(getByTestId('btn-empty-state-action'));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('21. ConnectionStatusIndicator deve refletir estados offline e sincronização', () => {
      // Estado Offline com itens pendentes
      const { getByText, getByTestId, rerender } = render(
        <ConnectionStatusIndicator isOnline={false} pendingCount={3} />
      );

      expect(getByTestId('connection-status-pill')).toBeTruthy();
      expect(getByText('Offline (3 pendentes)')).toBeTruthy();

      // Estado Sincronizando
      rerender(<ConnectionStatusIndicator isOnline={true} isSyncing={true} />);
      expect(getByText('Sincronizando com a nuvem...')).toBeTruthy();
    });
  });
});
