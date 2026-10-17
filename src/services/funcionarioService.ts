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

      const list = ((data as Array<Record<string, any>>) || []).map((json) =>
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

  async getFuncionarioByCracha(cracha: string, empresaId?: string): Promise<FuncionarioModel | null> {
    try {
      let query = this.client
        .from('funcionarios')
        .select('*')
        .eq('cracha', cracha.trim())
        .eq('excluido', false);

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        return parseFuncionarioFromDb(data);
      }
      return null;
    } catch {
      const cache = await this.sync.obterFuncionariosCache(empresaId);
      const found = cache.find((f) => f.cracha === cracha.trim());
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
        const isValid = data === true || data.valido === true || data.sucesso === true;
        return {
          success: isValid,
          message: isValid ? 'Senha confirmada!' : 'Senha de movimentação incorreta.',
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
      const { error } = await this.client
        .from('funcionarios')
        .update({ senha_movimentacao_hash: hash })
        .eq('id', funcionarioId);

      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Senha cadastrada com sucesso!' };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
}

export const funcionarioService = new FuncionarioService();
