import type { FuncionarioModel } from '../types/models';
import { parseFuncionarioFromDb } from '../types/models';
import { supabase } from './supabase/client';
import { syncService } from './offline/syncService';
import type { SyncService } from './offline/syncService';
import { sha256 } from '../utils/crypto';

export interface ValidacaoSenhaResponse {
  success: boolean;
  message?: string;
  offline?: boolean;
}

export class FuncionarioService {
  private client: any;
  private sync: SyncService;

  constructor(client = supabase, sync: SyncService = syncService) {
    this.client = client;
    this.sync = sync;
  }

  private isValidUuid(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
  }

  async listarFuncionarios(empresaId?: string): Promise<FuncionarioModel[]> {
    const empLimpo = (empresaId || '').trim();
    const isUuid = this.isValidUuid(empLimpo);

    try {
      // 1. Tentar RPC oficial segura criada na blindagem LGPD (Script 126)
      if (isUuid) {
        const { data, error } = await this.client.rpc('listar_funcionarios_empresa', {
          p_empresa_id: empLimpo,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const list = data.map((json: Record<string, any>) => parseFuncionarioFromDb(json));
          await this.sync.salvarFuncionariosCache(list, empLimpo);
          return list;
        }
      }

      // 2. Fallback query direta (somente com filtro se for UUID válido para não estourar erro 400 no PostgreSQL)
      let query = this.client
        .from('funcionarios')
        .select('*')
        .eq('excluido', false);

      if (isUuid) {
        query = query.eq('empresa_id', empLimpo);
      }

      query = query.order('nome', { ascending: true });

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map((json: Record<string, any>) => parseFuncionarioFromDb(json));
        await this.sync.salvarFuncionariosCache(list, empLimpo || 'default');
        return list;
      }

      if (error) {
        throw new Error(error.message);
      }

      return [];
    } catch (err: unknown) {
      const cache = await this.sync.obterFuncionariosCache(empLimpo || 'default');
      if (cache.length > 0) {
        return cache;
      }
      throw new Error(`Erro ao listar funcionários (sem conexão): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getFuncionarioByCracha(cracha: string, empresaId?: string): Promise<FuncionarioModel | null> {
    const termo = (cracha || '').trim();
    if (!termo) return null;

    const empLimpo = (empresaId || '').trim();
    const isUuid = this.isValidUuid(empLimpo);

    try {
      // 1. Chamar RPC oficial segura buscar_funcionario_por_cracha (Script 126 - bypass no bloqueio da tabela)
      const { data, error } = await this.client.rpc('buscar_funcionario_por_cracha', {
        p_cracha: termo,
        p_empresa_id: isUuid ? empLimpo : null,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return parseFuncionarioFromDb(data[0]);
      }

      // 2. Fallback query direta (caso esteja em ambiente com permissão)
      let query = this.client
        .from('funcionarios')
        .select('*')
        .eq('cracha', termo)
        .eq('excluido', false);

      if (isUuid) {
        query = query.eq('empresa_id', empLimpo);
      }

      const { data: directData, error: directError } = await query.maybeSingle();

      if (!directError && directData) {
        return parseFuncionarioFromDb(directData);
      }

      return null;
    } catch {
      const cache = await this.sync.obterFuncionariosCache(empLimpo || 'default');
      const found = cache.find(
        (f) => f.cracha.trim().toLowerCase() === termo.toLowerCase()
      );
      return found || null;
    }
  }

  async validarSenhaMovimentacao(funcionarioId: string, senhaDigitada: string): Promise<ValidacaoSenhaResponse> {
    const hash = sha256(senhaDigitada);
    try {
      const { data, error } = await this.client.rpc('validar_senha_movimentacao', {
        p_funcionario_id: funcionarioId,
        p_senha_hash: hash,
      });

      if (!error && data != null) {
        const isValid = data === true || data.valido === true || data.sucesso === true || data.success === true;
        const msg = data.message || data.mensagem || (isValid ? 'Senha confirmada!' : 'Senha de movimentação incorreta.');
        return {
          success: isValid,
          message: msg,
        };
      }

      const { data: func, error: funcError } = await this.client
        .from('funcionarios')
        .select('senha_movimentacao_hash')
        .eq('id', funcionarioId)
        .maybeSingle();

      if (!funcError && func) {
        const dbHash = func.senha_movimentacao_hash;
        if (!dbHash) {
          return { success: false, message: 'Colaborador não possui senha cadastrada.' };
        }
        const matches = dbHash.toLowerCase() === hash.toLowerCase();
        return {
          success: matches,
          message: matches ? 'Senha confirmada!' : 'Senha de movimentação incorreta.',
        };
      }

      return { success: false, message: 'Não foi possível validar a senha.' };
    } catch {
      return { success: true, offline: true, message: 'Validado em contingência offline.' };
    }
  }

  async cadastrarSenhaMovimentacaoInicial(funcionarioId: string, novaSenha: string): Promise<{ success: boolean; message?: string }> {
    const hash = sha256(novaSenha);
    try {
      // 1. Chamar RPC oficial cadastrar_senha_movimentacao_inicial (Script 48 & 134)
      const { data, error } = await this.client.rpc('cadastrar_senha_movimentacao_inicial', {
        p_funcionario_id: funcionarioId,
        p_senha_hash: hash,
      });

      if (!error && data && typeof data === 'object') {
        const res = data as { success?: boolean; message?: string };
        return {
          success: Boolean(res.success),
          message: res.message,
        };
      }

      if (error) {
        // Fallback: tentar update se tiver permissão
        const { error: updError } = await this.client
          .from('funcionarios')
          .update({ senha_movimentacao_hash: hash })
          .eq('id', funcionarioId);

        if (updError) {
          return { success: false, message: error.message || updError.message };
        }
      }

      return { success: true, message: 'Senha cadastrada com sucesso!' };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
}

export const funcionarioService = new FuncionarioService();
