import { create } from 'zustand';
import type { FuncionarioModel, SessionInfo, DeviceModel } from '../types/models';
import { AuthService } from '../services/supabase/authService';
import { StorageAdapter } from '../services/offline/storageAdapter';

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: SessionInfo | null;
  funcionario: FuncionarioModel | null;
  empresaId: string | null;

  device: DeviceModel;
  isDevicePending: boolean;
  isDeviceBlocked: boolean;

  hasCompletedOnboarding: boolean;

  blockedUntil: Date | null;
  failedAttempts: number;
  errorMessage: string | null;

  checkInitialState: () => Promise<'onboarding' | 'login' | 'pending_device' | 'home'>;
  login: (cracha: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  recheckDeviceApproval: () => Promise<boolean>;
  clearError: () => void;
}

const getOrCreateDeviceId = (): string => {
  let id = localStorage.getItem('zoestock_device_id');
  if (!id) {
    id = 'PWA-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem('zoestock_device_id', id);
  }
  return id;
};

const DEFAULT_DEVICE: DeviceModel = {
  deviceId: getOrCreateDeviceId(),
  deviceName: navigator.userAgent.includes('Mobile') ? 'Smartphone Mobile' : 'Terminal Desktop',
  manufacturer: navigator.vendor || 'Google / Chrome',
  model: 'PWA Web App',
  platform: 'PWA / Web',
  appVersion: '1.0.0-PWA',
  isPWA: true,
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
      const onboardingDone = await StorageAdapter.getItem('onboarding_completed');
      const hasCompletedOnboarding = onboardingDone === 'true';

      const rawSession = await StorageAdapter.getItem('auth_session');
      const savedEmpresaId = await StorageAdapter.getItem('auth_empresa_id');

      let savedSession: SessionInfo | null = null;
      if (rawSession) {
        try {
          savedSession = JSON.parse(rawSession);
        } catch {
          savedSession = null;
        }
      }

      if (savedSession && savedSession.ativo) {
        const state = get();
        if (state.isDeviceBlocked || state.isDevicePending) {
          set({ isLoading: false, hasCompletedOnboarding });
          return 'pending_device';
        }

        const sessionEmpId = savedSession.empresaId || (savedSession as any).empresa_id || savedEmpresaId || null;
        const funcionarioModel: FuncionarioModel = {
          id: savedSession.id,
          cracha: savedSession.cracha,
          nome: savedSession.nome,
          ativo: savedSession.ativo,
          empresaId: sessionEmpId,
          empresaNome: savedSession.empresaNome || (savedSession as any).empresa_nome,
          empresa_id: sessionEmpId || '',
          permite_login_app: true,
          tem_senha_movimentacao: false,
        };

        set({
          isLoading: false,
          isAuthenticated: true,
          session: savedSession,
          funcionario: funcionarioModel,
          empresaId: sessionEmpId,
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
        const empId = session.empresaId || (session as any).empresa_id || null;

        const funcionarioModel: FuncionarioModel = {
          id: session.id,
          cracha: session.cracha,
          nome: session.nome,
          ativo: session.ativo,
          empresaId: empId,
          empresaNome: session.empresaNome || (session as any).empresa_nome,
          empresa_id: empId || '',
          permite_login_app: true,
          tem_senha_movimentacao: false,
        };

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

      const attempts =
        result.tentativasRestantes !== undefined && result.tentativasRestantes !== null
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
    const { funcionario } = get();
    set({ isLoading: true });

    try {
      const service = getAuthService();
      if (funcionario && typeof service?.registrarAuditoria === 'function') {
        try {
          await service.registrarAuditoria('logout', funcionario.id, get().device.deviceId, {
            motivo: 'logout_manual_usuario',
          });
        } catch {
          // Contingência
        }
      }

      await StorageAdapter.removeItem('auth_session');
      await StorageAdapter.removeItem('auth_empresa_id');

      set({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        funcionario: null,
        empresaId: null,
        isDevicePending: false,
        isDeviceBlocked: false,
        errorMessage: null,
      });
    } catch {
      set({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        funcionario: null,
        empresaId: null,
        isDevicePending: false,
        isDeviceBlocked: false,
      });
    }
  },

  completeOnboarding: async () => {
    await StorageAdapter.setItem('onboarding_completed', 'true');
    set({ hasCompletedOnboarding: true });
  },

  recheckDeviceApproval: async () => {
    const { device } = get();
    set({ isLoading: true });

    try {
      const { supabase } = await import('../services/supabase/client');
      const { data } = await supabase
        .from('dispositivos')
        .select('*')
        .eq('device_id', device.deviceId)
        .maybeSingle();

      if (data) {
        const isApproved =
          data.status === 'aprovado' ||
          data.status === 'autorizado' ||
          data.autorizado === true ||
          (data.ativo === true && data.status !== 'pendente' && data.status !== 'bloqueado');

        if (isApproved) {
          set({
            isLoading: false,
            isDevicePending: false,
            isDeviceBlocked: false,
          });
          return true;
        }

        if (data.status === 'bloqueado' || data.ativo === false) {
          set({
            isLoading: false,
            isDeviceBlocked: true,
            isDevicePending: false,
          });
          return false;
        }
      }

      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },
}));
