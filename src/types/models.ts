export interface FuncionarioModel {
  id: string;
  cracha: string;
  nome: string;
  ativo: boolean;
  empresaId?: string;
  empresaNome?: string;
  empresa_id: string;
  permite_login_app: boolean;
  tem_senha_movimentacao: boolean;
  created_at?: string;
}

export interface DeviceModel {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  platform: string;
  androidVersion?: string;
  appVersion: string;
  isPWA?: boolean;
}

export interface SessionInfo {
  id: string;
  cracha: string;
  nome: string;
  empresaId: string;
  empresaNome: string;
  ativo: boolean;
  requerTrocaSenha?: boolean;
}

export interface AuthResultModel {
  sucesso: boolean;
  funcionario?: SessionInfo;
  erro?: string;
  mensagem?: string;
  tentativasRestantes?: number;
  bloqueadoAte?: string;
}

export interface OnboardingModel {
  id: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  imagemUrl: string;
  icone: string;
}
