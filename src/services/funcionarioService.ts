import { FuncionarioModel, parseFuncionarioFromDb } from '../types/models';
import { supabase } from './supabase/client';
import { syncService, SyncService } from './offline/syncService';
import { sha256 } from '../utils/crypto';

export interface ValidacaoSenhaResponse {
  success: boolean;
  message?: string;
  offline?: boolean;
}

/**
 * FuncionarioService - Gestão e Validação de Colaboradores.
 * Paridade com funcionario_service.dart.
 */
export class FuncionarioService {
  constructor(
    private client = supabase,
    private sync: SyncService = syncService
  ) {}

  /**
   * Lista funcionários ativos da empresa.
   */
  async listarFuncionarios(empresaId: string): Promise<FuncionarioModel[]> {
    try {
      const { data, error } = await this.client
        .from('funcionarios')
        .select('*')
        .eq('excluido', false)
        .eq('empresa_id', empresaId)
        .order('nome', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const list = ((data as Record<string, unknown>[]) || []).map((json) =>
        parseFuncionarioFromDb(json)
      );

      await this.sync.salvarFuncionariosCache(list, empresaId);
      return list;
    } catch (err: unknown) {
      const cache = await this.sync.obterFuncionariosCache(empresaId);
      if (cache.length > 0) {
        return cache;
      }
      throw new Error(`Erro ao listar funcionários (sem conexão): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Busca funcionário por número de crachá/matrícula.
   */
  async getFuncionarioByCracha(cracha: string, empresaId: string): Promise<FuncionarioModel | null> {
    try {
      const { data, error } = await this.client
        .from('funcionarios')
        .select('*')
        .eq('cracha', cracha)
        .eq('excluido', false)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        return parseFuncionarioFromDb(data as Record<string, unknown>);
      }
      return null;
    } catch {
      const cache = await this.sync.obterFuncionariosCache(empresaId);
      if (cache.length > 0) {
        const found = cache.find((f) => f.cracha === cracha);
        return found || null;
      }
      return null;
    }
  }

  /**
   * Valida a senha/PIN de 4 dígitos do colaborador via RPC segura.
   * Se offline, permite a operação com aviso de contingência.
   */
  async validarSenhaMovimentacao(
    funcionarioId: string,
    senha: string
  ): Promise<ValidacaoSenhaResponse> {
    try {
      const senhaHash = sha256(senha);
      const { data, error } = await this.client.rpc('validar_senha_movimentacao', {
        p_funcionario_id: funcionarioId,
        p_senha_hash: senhaHash,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && typeof data === 'object') {
        const res = data as Record<string, unknown>;
        return {
          success: Boolean(res.success ?? res.valido ?? false),
          message: res.message != null ? String(res.message) : undefined,
        };
      }
      return { success: false, message: 'Resposta inválida do servidor.' };
    } catch {
      // Modo offline: permite prosseguir registrando aviso
      return {
        success: true,
        offline: true,
        message: 'Modo offline: Validação de senha adiada para posterior sincronização.',
      };
    }
  }

  /**
   * Cadastra a senha inicial do colaborador via RPC segura.
   */
  async cadastrarSenhaMovimentacaoInicial(
    funcionarioId: string,
    senha: string
  ): Promise<ValidacaoSenhaResponse> {
    try {
      const senhaHash = sha256(senha);
      const { data, error } = await this.client.rpc('cadastrar_senha_movimentacao_inicial', {
        p_funcionario_id: funcionarioId,
        p_senha_hash: senhaHash,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && typeof data === 'object') {
        const res = data as Record<string, unknown>;
        return {
          success: Boolean(res.success ?? true),
          message: res.message != null ? String(res.message) : undefined,
        };
      }
      return { success: false, message: 'Resposta inválida do servidor.' };
    } catch {
      return {
        success: false,
        message: 'Sem conexão com a internet. Conecte-se para cadastrar sua senha pela primeira vez.',
      };
    }
  }
}

export const funcionarioService = new FuncionarioService();
