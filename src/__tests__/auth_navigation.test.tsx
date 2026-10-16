/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuthStore, setAuthService } from '../store/useAuthStore';
import { StorageAdapter } from '../services/offline/storageAdapter';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { PendingDeviceScreen } from '../screens/auth/PendingDeviceScreen';
import { EnvironmentDiagnosticScreen } from '../screens/diagnostic/EnvironmentDiagnosticScreen';

// Mocks essenciais
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

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock do AuthService
const mockValidarLogin = jest.fn();
const mockRegistrarAuditoria = jest.fn().mockResolvedValue(undefined);

jest.mock('../services/supabase/authService', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      validarLogin: mockValidarLogin,
      registrarAuditoria: mockRegistrarAuditoria,
    })),
  };
});

describe('Fase 4 — Suíte de Testes de Autenticação, Onboarding e Navegação', () => {
  let mockNavigation: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    setAuthService({
      validarLogin: mockValidarLogin,
      registrarAuditoria: mockRegistrarAuditoria,
    } as any);
    await StorageAdapter.clearTenantData('emp-teste');
    await StorageAdapter.removeItem('auth_session');
    await StorageAdapter.removeItem('auth_empresa_id');
    await StorageAdapter.removeItem('onboarding_completed');

    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: false,
      session: null,
      funcionario: null,
      empresaId: null,
      isDevicePending: false,
      isDeviceBlocked: false,
      hasCompletedOnboarding: false,
      blockedUntil: null,
      failedAttempts: 0,
      errorMessage: null,
    });

    mockNavigation = {
      replace: jest.fn(),
      navigate: jest.fn(),
      goBack: jest.fn(),
    };
  });

  // ==========================================================================
  // 1. SPLASH SCREEN E FLUXO DE INICIALIZAÇÃO
  // ==========================================================================
  describe('SplashScreen e Primeiro Acesso', () => {
    it('1. Primeiro acesso: deve redirecionar para Onboarding quando não concluído', async () => {
      const { getByTestId, getByText } = render(<SplashScreen navigation={mockNavigation} />);

      expect(getByTestId('splash-screen-container')).toBeTruthy();
      expect(getByText('ZOESTOCK')).toBeTruthy();

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('Onboarding');
      }, { timeout: 3000 });
    });

    it('2. Onboarding concluído sem sessão: deve redirecionar para Login', async () => {
      await StorageAdapter.setItem('onboarding_completed', 'true');

      render(<SplashScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
      }, { timeout: 3000 });
    });

    it('3. Sessão válida existente: deve redirecionar diretamente para DiagnosticHome (Área Operacional)', async () => {
      await StorageAdapter.setItem('onboarding_completed', 'true');
      await StorageAdapter.setItem(
        'auth_session',
        JSON.stringify({
          id: 'func-123',
          cracha: 'OP-001',
          nome: 'Carlos Almoxarife',
          ativo: true,
          forceChangePin: false,
          empresaId: 'emp-matriz',
          empresaNome: 'ZOESTOCK Matriz',
        })
      );

      render(<SplashScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('DiagnosticHome');
      }, { timeout: 3000 });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().funcionario?.nome).toBe('Carlos Almoxarife');
    });
  });

  // ==========================================================================
  // 2. ONBOARDING SCREEN
  // ==========================================================================
  describe('OnboardingScreen', () => {
    it('4. Deve permitir navegar entre os slides e finalizar com persistência', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen navigation={mockNavigation} />);

      expect(getByTestId('onboarding-screen-container')).toBeTruthy();
      expect(getByText('Bem-vindo ao ZOESTOCK')).toBeTruthy();

      // Avança para o slide 1
      fireEvent.press(getByTestId('btn-onboarding-next'));
      expect(getByText('Entradas e Saídas Simplificadas')).toBeTruthy();

      // Avança para o slide 2
      fireEvent.press(getByTestId('btn-onboarding-next'));
      expect(getByText('Inventário em Tempo Real')).toBeTruthy();

      // Avança para o slide final
      fireEvent.press(getByTestId('btn-onboarding-next'));
      expect(getByText('Segurança em Primeiro Lugar')).toBeTruthy();

      // Clica em COMEÇAR AGORA
      await fireEvent.press(getByTestId('btn-onboarding-start'));

      expect(useAuthStore.getState().hasCompletedOnboarding).toBe(true);
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');

      // Verifica persistência no storage local
      const isSaved = await StorageAdapter.getItem('onboarding_completed');
      expect(isSaved).toBe('true');
    });

    it('5. Deve permitir pular direto para o Login via botão PULAR', async () => {
      const { getByTestId } = render(<OnboardingScreen navigation={mockNavigation} />);

      fireEvent.press(getByTestId('btn-onboarding-skip'));

      await waitFor(() => {
        expect(useAuthStore.getState().hasCompletedOnboarding).toBe(true);
        expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
      });
    });
  });

  // ==========================================================================
  // 3. LOGIN SCREEN E SEGURANÇA DE AUTENTICAÇÃO
  // ==========================================================================
  describe('LoginScreen e Autenticação', () => {
    it('6. Deve validar crachá obrigatório antes de autenticar', async () => {
      const { getByTestId, getByText } = render(<LoginScreen navigation={mockNavigation} />);

      // Digita PIN sem preencher crachá
      fireEvent.press(getByTestId('pin-key-1'));
      fireEvent.press(getByTestId('pin-key-2'));
      fireEvent.press(getByTestId('pin-key-3'));
      fireEvent.press(getByTestId('pin-key-4'));

      await waitFor(() => {
        expect(getByText('Informe a matrícula ou número do crachá.')).toBeTruthy();
      });

      expect(mockValidarLogin).not.toHaveBeenCalled();
    });

    it('7. Login com sucesso: deve autenticar e navegar para a Área Operacional', async () => {
      mockValidarLogin.mockResolvedValueOnce({
        sucesso: true,
        funcionario: {
          id: 'func-456',
          cracha: 'CR-888',
          nome: 'Mariana Estoquista',
          ativo: true,
          empresaId: 'emp-filial-1',
          empresaNome: 'ZOESTOCK Filial 1',
        },
      });

      const { getByTestId } = render(<LoginScreen navigation={mockNavigation} />);

      // Preenche crachá
      const inputCracha = getByTestId('input-cracha');
      fireEvent.changeText(inputCracha, 'CR-888');

      // Digita PIN de 4 dígitos
      fireEvent.press(getByTestId('pin-key-1'));
      fireEvent.press(getByTestId('pin-key-2'));
      fireEvent.press(getByTestId('pin-key-3'));
      fireEvent.press(getByTestId('pin-key-4'));

      await waitFor(() => {
        expect(mockValidarLogin).toHaveBeenCalled();
        expect(mockNavigation.replace).toHaveBeenCalledWith('DiagnosticHome');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().funcionario?.nome).toBe('Mariana Estoquista');
    });

    it('8. PIN incorreto ou credencial inválida: deve exibir mensagem de erro e não autenticar', async () => {
      mockValidarLogin.mockResolvedValueOnce({
        sucesso: false,
        erro: 'SENHA_INCORRETA',
        mensagem: 'PIN incorreto. 3 tentativas restantes.',
        tentativasRestantes: 3,
      });

      const { getByTestId, getByText } = render(<LoginScreen navigation={mockNavigation} />);

      const inputCracha = getByTestId('input-cracha');
      fireEvent.changeText(inputCracha, 'CR-888');

      fireEvent.press(getByTestId('pin-key-9'));
      fireEvent.press(getByTestId('pin-key-9'));
      fireEvent.press(getByTestId('pin-key-9'));
      fireEvent.press(getByTestId('pin-key-9'));

      await waitFor(() => {
        expect(getByTestId('login-error-banner')).toBeTruthy();
        expect(getByText('PIN incorreto. 3 tentativas restantes.')).toBeTruthy();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockNavigation.replace).not.toHaveBeenCalledWith('DiagnosticHome');
    });

    it('9. Conta/Dispositivo bloqueado por força bruta: deve exibir banner de bloqueio e desabilitar teclado', async () => {
      const blockedFuture = new Date(Date.now() + 180000); // 3 minutos
      useAuthStore.setState({
        blockedUntil: blockedFuture,
        errorMessage: 'Acesso bloqueado por tentativas excedidas.',
      });

      const { getByTestId, getByText } = render(<LoginScreen navigation={mockNavigation} />);

      expect(getByTestId('login-blocked-banner')).toBeTruthy();
      expect(getByText('Acesso Temporariamente Bloqueado')).toBeTruthy();
    });

    it('10. Dispositivo pendente de aprovação: deve redirecionar para PendingDeviceScreen', async () => {
      mockValidarLogin.mockResolvedValueOnce({
        sucesso: false,
        erro: 'dispositivo_pendente',
        mensagem: 'Aparelho aguardando aprovação do administrador do sistema.',
      });

      const { getByTestId } = render(<LoginScreen navigation={mockNavigation} />);

      const inputCracha = getByTestId('input-cracha');
      fireEvent.changeText(inputCracha, 'CR-888');

      fireEvent.press(getByTestId('pin-key-1'));
      fireEvent.press(getByTestId('pin-key-1'));
      fireEvent.press(getByTestId('pin-key-1'));
      fireEvent.press(getByTestId('pin-key-1'));

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('PendingDevice');
      });
    });
  });

  // ==========================================================================
  // 4. PENDING DEVICE SCREEN
  // ==========================================================================
  describe('PendingDeviceScreen', () => {
    it('11. Deve exibir metadados do dispositivo móvel e permitir rechecagem de aprovação', async () => {
      useAuthStore.setState({
        isDevicePending: true,
        isDeviceBlocked: false,
      });

      const { getByTestId, getByText } = render(<PendingDeviceScreen navigation={mockNavigation} />);

      expect(getByTestId('pending-device-screen-container')).toBeTruthy();
      expect(getByText('Aguardando Aprovação')).toBeTruthy();
      expect(getByTestId('device-metadata-card')).toBeTruthy();

      // Botão verificar aprovação
      fireEvent.press(getByTestId('btn-recheck-approval'));
    });

    it('12. Aparelho bloqueado: deve exibir ícone de bloqueio e voltar ao login', async () => {
      useAuthStore.setState({
        isDevicePending: false,
        isDeviceBlocked: true,
      });

      const { getByTestId, getByText, queryByTestId } = render(
        <PendingDeviceScreen navigation={mockNavigation} />
      );

      expect(getByTestId('icon-device-blocked')).toBeTruthy();
      expect(getByText('Aparelho Bloqueado')).toBeTruthy();
      expect(queryByTestId('btn-recheck-approval')).toBeNull();

      // Permite voltar ao login
      fireEvent.press(getByTestId('btn-back-login'));

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
      });
    });
  });

  // ==========================================================================
  // 5. DIAGNOSTIC HOME E LOGOUT SEGURO
  // ==========================================================================
  describe('EnvironmentDiagnosticScreen e Logout Seguro', () => {
    it('13. Deve exibir banner de homologação, dados do operador e permitir logout', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        session: {
          id: 'func-01',
          cracha: 'OP-01',
          nome: 'Roberto Segurança',
          ativo: true,
          forceChangePin: false,
          empresaId: 'emp-matriz',
          empresaNome: 'ZOESTOCK Matriz',
        },
        funcionario: {
          id: 'func-01',
          cracha: 'OP-01',
          nome: 'Roberto Segurança',
          ativo: true,
          empresa_id: 'emp-matriz',
          permite_login_app: true,
          tem_senha_movimentacao: false,
        },
        empresaId: 'emp-matriz',
      });

      const { getByTestId, getByText } = render(
        <EnvironmentDiagnosticScreen navigation={mockNavigation} />
      );

      expect(getByTestId('staging-environment-banner')).toBeTruthy();
      expect(getByText('AMBIENTE DE HOMOLOGAÇÃO — FASE 4')).toBeTruthy();
      expect(getByText('Roberto Segurança')).toBeTruthy();

      // Executa logout seguro
      fireEvent.press(getByTestId('btn-staging-logout'));

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().session).toBeNull();
        expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
      });
    });

    it('14. Tratamento de falhas de rede no login não deve quebrar a aplicação', async () => {
      mockValidarLogin.mockRejectedValueOnce(new Error('Conexão recusada / Timeout'));

      const { getByTestId, getByText } = render(<LoginScreen navigation={mockNavigation} />);

      const inputCracha = getByTestId('input-cracha');
      fireEvent.changeText(inputCracha, 'CR-888');

      fireEvent.press(getByTestId('pin-key-1'));
      fireEvent.press(getByTestId('pin-key-2'));
      fireEvent.press(getByTestId('pin-key-3'));
      fireEvent.press(getByTestId('pin-key-4'));

      await waitFor(() => {
        expect(getByTestId('login-error-banner')).toBeTruthy();
        expect(getByText(/Falha de conexão/)).toBeTruthy();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
