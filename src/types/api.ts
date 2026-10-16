import { Funcionario } from './models';

export interface ValidarLoginResult {
  sucesso: boolean;
  mensagem?: string;
  funcionario?: Funcionario;
  token_sessao?: string;
  erro_codigo?: string;
}

export interface ValidarSenhaResult {
  valido: boolean;
  mensagem?: string;
}

export interface DeviceMetadata {
  brand: string;
  modelName: string;
  osVersion: string;
  isRooted: boolean;
  appVersion: string;
  uniqueDeviceId: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
}
