export interface ValidarSenhaResult {
  valido: boolean;
  mensagem?: string;
  motivo?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
}
