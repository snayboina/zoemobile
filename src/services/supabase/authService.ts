import type { AuthResultModel, DeviceModel } from '../../types/models';
import { supabase, isConfigured } from './client';
import { sha256 } from '../../utils/crypto';

export interface LoginParams {
  cracha: string;
  pin: string;
  device: DeviceModel;
}

export class AuthService {
  private client;
  constructor(client = supabase) {
    this.client = client;
  }

  async validarLogin(params: LoginParams): Promise<AuthResultModel> {
    if (!isConfigured) {
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
          platform: 'PWA Web / Chrome',
          app_version: params.device.appVersion,
          is_pwa: true,
        },
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
          sucesso: Boolean(res.sucesso),
          funcionario: res.funcionario as any,
          erro: (res.erro as string) || undefined,
          mensagem: (res.mensagem as string) || undefined,
          tentativasRestantes: res.tentativas_restantes as number,
          bloqueadoAte: (res.bloqueado_ate as string) || undefined,
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
        erro: 'NETWORK_ERROR',
        mensagem: err instanceof Error ? err.message : 'Falha na conexão com o servidor.',
      };
    }
  }

  async registrarAuditoria(
    acao: string,
    funcionarioId: string,
    deviceId: string,
    detalhes: Record<string, unknown>
  ): Promise<void> {
    if (!isConfigured) return;
    try {
      await this.client.from('auditoria_acessos').insert({
        acao,
        funcionario_id: funcionarioId,
        device_id: deviceId,
        detalhes: { ...detalhes, platform: 'PWA' },
        criado_em: new Date().toISOString(),
      });
    } catch {
      // Falha silenciosa de auditoria em contingência
    }
  }
}
