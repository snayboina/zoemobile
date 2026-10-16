import { create } from 'zustand';
import { Funcionario } from '../types';

interface AuthState {
  funcionario: Funcionario | null;
  isAuthenticated: boolean;
  tokenSessao: string | null;
  setFuncionario: (funcionario: Funcionario | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  funcionario: null,
  isAuthenticated: false,
  tokenSessao: null,
  setFuncionario: (funcionario) =>
    set({
      funcionario,
      isAuthenticated: funcionario !== null,
    }),
  logout: () =>
    set({
      funcionario: null,
      isAuthenticated: false,
      tokenSessao: null,
    }),
}));
