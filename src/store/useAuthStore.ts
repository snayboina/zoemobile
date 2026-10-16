import { create } from 'zustand';
import { Platform } from 'react-native';
import { FuncionarioModel, SessionInfo, DeviceModel } from '../types/models';
import { AuthService } from '../services/supabase/authService';
import { StorageAdapter } from '../services/offline/storageAdapter';

export interface AuthState {
  // Estados de Sessão
  isLoading: boolean;
  isAuthenticated: boolean;
  session: SessionInfo | null;
  funcionario: FuncionarioModel | null;
  empresaId: string | null;

  // Estados de Dispositivo e Aprovação
  device: DeviceModel;
  isDevicePending: boolean;
  isDeviceBlocked: boolean;

  // Primeiro Acesso
  hasCompletedOnboarding: boolean;

  // Bloqueio por Força Bruta
  blockedUntil: Date | null;
  failedAttempts: number;
  errorMessage: string | null;

  // Ações
  checkInitialState: () => Promise<'onboarding' | 'login' | 'pending_device' | 'home'>;
  login: (cracha: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  recheckDeviceApproval: () => Promise<boolean>;
  clearError: () => void;
}

const DEFAULT_DEVICE: DeviceModel = {
  deviceId: 'ZOE-DEV-UNKNOWN',
  deviceName: 'Industrial Handheld',
  manufacturer: Platform.OS === 'android' ? 'Zebra / Android' : 'Apple / iOS',
  model: Platform.OS === 'android' ? 'TC21 / Industrial' : 'iPhone Industrial',
  platform: Platform.OS,
  androidVersion: String(Platform.Version),
  appVersion: '1.0.0',
};

let authServiceInstance = new AuthService();

export const setAuthService = (service: AuthService) => {
  authServiceInstance = service;
};

export const getAuthService = () => authServiceInstance;

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  session: null,
  funcionario: null,
  empresaId: null,

  device: DEFAULT_DEVICE,
  isDevicePending: false,
  isDeviceBlocked: false,

  hasCompletedOnboarding: false,

  blockedUntil: null,
  failedAttempts: 0,
  errorMessage: null,

  clearError: () => set({ errorMessage: null }),

  checkInitialState: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      // 1. Verifica flag de onboarding no storage local
      const onboardingDone = await StorageAdapter.getItem('onboarding_completed');
      const hasCompletedOnboarding = onboardingDone === 'true';

      // 2. Tenta recuperar sessão persistida do storage local
      const rawSession = await StorageAdapter.getItem('auth_session');
      const savedEmpresaId = await StorageAdapter.getItem('auth_empresa_id');

      let savedSession: SessionInfo | null = null;
      if (rawSession) {
        try {
          savedSession = JSON.parse(rawSession) as SessionInfo;
        } catch {
          savedSession = null;
        }
      }

      if (savedSession && savedSession.ativo) {
        // Sessão localizada - valida integridade do dispositivo
        const state = get();
        if (state.isDeviceBlocked || state.isDevicePending) {
          set({ isLoading: false, hasCompletedOnboarding });
          return 'pending_device';
        }

        const funcionarioModel: FuncionarioModel = {
          id: savedSession.id,
          cracha: savedSession.cracha,
          nome: savedSession.nome,
          ativo: savedSession.ativo,
          empresaId: savedSession.empresaId,
          empresaNome: savedSession.empresaNome,
          empresa_id: savedSession.empresaId || '',
          permite_login_app: true,
          tem_senha_movimentacao: false,
        };

        set({
          isLoading: false,
          isAuthenticated: true,
          session: savedSession,
          funcionario: funcionarioModel,
          empresaId: savedEmpresaId || savedSession.empresaId || null,
          hasCompletedOnboarding,
        });
        return 'home';
      }

      set({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        funcionario: null,
        hasCompletedOnboarding,
      });

      if (!hasCompletedOnboarding) {
        return 'onboarding';
      }
      return 'login';
    } catch {
      set({ isLoading: false });
      return 'login';
    }
  },

  login: async (cracha: string, pin: string) => {
    const { device, blockedUntil } = get();

    // Trava de segurança no cliente contra envio durante bloqueio ativo
    if (blockedUntil && blockedUntil.getTime() > Date.now()) {
      set({
        errorMessage: 'Acesso bloqueado por tentativas excedidas. Aguarde o tempo restante.',
      });
      return false;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const result = await getAuthService().validarLogin({
        cracha: cracha.trim(),
        pin: pin.trim(),
        device,
      });

      if (!result) {
        set({
          isLoading: false,
          errorMessage: 'Resposta inválida do serviço de autenticação.',
        });
        return false;
      }

      if (result.sucesso && result.funcionario) {
        const session = result.funcionario;
        const empId = session.empresaId || null;

        const funcionarioModel: FuncionarioModel = {
          id: session.id,
          cracha: session.cracha,
          nome: session.nome,
          ativo: session.ativo,
          empresaId: session.empresaId,
          empresaNome: session.empresaNome,
          empresa_id: session.empresaId || '',
          permite_login_app: true,
          tem_senha_movimentacao: false,
        };

        // Persiste sessão segura localmente
        await StorageAdapter.setItem('auth_session', JSON.stringify(session));
        if (empId) {
          await StorageAdapter.setItem('auth_empresa_id', empId);
        }

        set({
          isLoading: false,
          isAuthenticated: true,
          session,
          funcionario: funcionarioModel,
          empresaId: empId,
          isDevicePending: false,
          isDeviceBlocked: false,
          failedAttempts: 0,
          blockedUntil: null,
          errorMessage: null,
        });

        return true;
      }

      // Tratamento de falhas de autenticação
      let isPending = false;
      let isBlocked = false;
      let blockedTime: Date | null = null;
      let errorMsg = result.mensagem || 'Credenciais inválidas. Verifique crachá e PIN.';

      if (result.erro === 'dispositivo_pendente') {
        isPending = true;
        errorMsg = 'Aparelho aguardando aprovação do administrador do sistema.';
      } else if (result.erro === 'dispositivo_bloqueado') {
        isBlocked = true;
        errorMsg = 'Este aparelho foi bloqueado ou revogado pelo administrador.';
      }

      if (result.bloqueadoAte) {
        try {
          blockedTime = new Date(result.bloqueadoAte);
        } catch {
          blockedTime = null;
        }
      }

      const attempts = result.tentativasRestantes !== undefined && result.tentativasRestantes !== null
        ? Math.max(0, 5 - result.tentativasRestantes)
        : get().failedAttempts + 1;

      set({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        funcionario: null,
        isDevicePending: isPending,
        isDeviceBlocked: isBlocked,
        blockedUntil: blockedTime,
        failedAttempts: attempts,
        errorMessage: errorMsg,
      });

      return false;
    } catch (err: unknown) {
      set({
        isLoading: false,
        errorMessage: `Falha de conexão: ${err instanceof Error ? err.message : String(err)}`,
      });
      return false;
    }
  },

  logout: async () => {
    const { funcionario, empresaId } = get();
    set({ isLoading: true });

    try {
      const service = getAuthService();
    if (funcionario && typeof service?.registrarAuditoria === 'function') {
      try {
        await service.registrarAuditoria('logout', funcionario.id, get().device.deviceId, {
            cracha: funcionario.cracha,
            nome: funcionario.nome,
          });
        } catch {
          // Auditoria não bloqueia logout
        }
      }

      // Limpeza de sessão e dados do tenant atual
      await StorageAdapter.removeItem('auth_session');
      await StorageAdapter.removeItem('auth_empresa_id');

      if (empresaId) {
        await StorageAdapter.clearTenantData(empresaId);
      }
    } finally {
      set({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        funcionario: null,
        empresaId: null,
        errorMessage: null,
      });
    }
  },

  completeOnboarding: async () => {
    await StorageAdapter.setItem('onboarding_completed', 'true');
    set({ hasCompletedOnboarding: true });
  },

  recheckDeviceApproval: async () => {
    set({ isLoading: true });
    try {
      // Simula rechecagem ou consulta status da sessão existente
      const nextRoute = await get().checkInitialState();
      return nextRoute === 'home';
    } finally {
      set({ isLoading: false });
    }
  },
}));
