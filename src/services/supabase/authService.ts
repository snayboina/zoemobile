import { AuthResultModel, DeviceModel, SessionInfo } from '../../types/models';
import { supabase } from './client';
import { sha256 } from '../../utils/crypto';
import { env } from '../../config/env';

export interface LoginParams {
  cracha: string;
  pin: string;
  device: DeviceModel;
  latitude?: number;
  longitude?: number;
}

/**
 * AuthService - Autenticação Industrial ZOESTOCK.
 * Consome a RPC validar_login_funcionario com validação no backend.
 */
export class AuthService {
  constructor(private client = supabase) {}

  /**
   * Valida crachá e PIN de 4 dígitos via RPC segura.
   */
  async validarLogin(params: LoginParams): Promise<AuthResultModel> {
    if (!env.isConfigured) {
      return {
        sucesso: false,
        erro: 'ENV_NAO_CONFIGURADA',
        mensagem: 'Ambiente Supabase de produção ainda não configurado no cliente local.',
      };
    }

    try {
      const pinHash = sha256(params.pin);
      const { data, error } = await this.client.rpc('validar_login_funcionario', {
        p_cracha: params.cracha,
        p_pin_hash: pinHash,
        p_device_id: params.device.deviceId,
        p_device_metadata: {
          device_id: params.device.deviceId,
          device_name: params.device.deviceName,
          manufacturer: params.device.manufacturer,
          model: params.device.model,
          platform: params.device.platform,
          android_version: params.device.androidVersion,
          app_version: params.device.appVersion,
        },
        p_latitude: params.latitude,
        p_longitude: params.longitude,
      });

      if (error) {
        return {
          sucesso: false,
          erro: error.code || 'RPC_ERROR',
          mensagem: error.message,
        };
      }

      if (data && typeof data === 'object') {
        const res = data as Record<string, unknown>;
        return {
          sucesso: Boolean(res.sucesso ?? false),
          erro: res.erro != null ? String(res.erro) : undefined,
          mensagem: res.mensagem != null ? String(res.mensagem) : undefined,
          bloqueadoAte: res.bloqueado_ate != null ? String(res.bloqueado_ate) : undefined,
          tentativasRestantes: res.tentativas_restantes != null ? Number(res.tentativas_restantes) : undefined,
          funcionario: (res.funcionario as unknown as SessionInfo) || null,
        };
      }

      return {
        sucesso: false,
        erro: 'RESPOSTA_INVALIDA',
        mensagem: 'Resposta inesperada do servidor de autenticação.',
      };
    } catch (err: unknown) {
      return {
        sucesso: false,
        erro: 'CONEXAO_FALHOU',
        mensagem: `Erro de conexão: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Registra log de auditoria de login ou evento de segurança.
   */
  async registrarAuditoria(
    acao: string,
    funcionarioId?: string,
    deviceId?: string,
    detalhes?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.client.from('audit_log').insert({
        action: acao,
        funcionario_id: funcionarioId,
        device_id: deviceId,
        details: detalhes,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignora erro de auditoria
    }
  }
}

export const authService = new AuthService();
