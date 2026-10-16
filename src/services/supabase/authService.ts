import { ValidarLoginResult, ValidarSenhaResult } from '../../types';
import { env } from '../../config/env';

/**
 * Serviço de Autenticação preparado para o contrato da RPC:
 * validar_login_funcionario(p_cracha, p_pin_hash, p_device_id, p_device_metadata, p_latitude, p_longitude)
 * 
 * NOTA DE SEGURANÇA (Módulo 1):
 * Em modo de fundação/diagnóstico, não realiza chamadas com dados reais ao banco de produção.
 */
export class AuthService {
  static async validarCracha(cracha: string): Promise<ValidarLoginResult> {
    if (!env.isConfigured) {
      return {
        sucesso: false,
        erro_codigo: 'ENV_NAO_CONFIGURADA',
        mensagem: 'Ambiente Supabase de produção ainda não configurado no cliente local.',
      };
    }

    // A chamada real via RPC será ativada no Módulo 2 sob autorização
    return {
      sucesso: false,
      mensagem: 'Módulo 2 (Autenticação) aguardando liberação formal.',
    };
  }

  static async validarSenhaMovimentacao(
    _funcionarioId: string,
    _pin: string
  ): Promise<ValidarSenhaResult> {
    return {
      valido: false,
      mensagem: 'Validação de senha de movimentação restrita ao Módulo 2.',
    };
  }
}
