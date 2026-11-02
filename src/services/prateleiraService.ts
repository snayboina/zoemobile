import type { PrateleiraModel } from '../types/models';
import { parsePrateleiraFromDb } from '../types/models';
import { supabase } from './supabase/client';
import { syncService } from './offline/syncService';
import type { SyncService } from './offline/syncService';
import { StorageAdapter } from './offline/storageAdapter';

export class PrateleiraService {
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

  async listarPrateleiras(empresaId?: string): Promise<PrateleiraModel[]> {
    let empFiltro = (empresaId || '').trim();

    // Se empresaId não foi fornecido ou não é UUID válido, recuperar da sessão salva
    if (!this.isValidUuid(empFiltro)) {
      try {
        const savedEmpId = await StorageAdapter.getItem('auth_empresa_id');
        if (this.isValidUuid(savedEmpId)) {
          empFiltro = savedEmpId!.trim();
        } else {
          const rawSess = await StorageAdapter.getItem('auth_session');
          if (rawSess) {
            const s = JSON.parse(rawSess);
            const sEmp = s.empresaId || s.empresa_id;
            if (this.isValidUuid(sEmp)) empFiltro = sEmp.trim();
          }
        }
      } catch (_) {}
    }

    try {
      // 1. Chamar RPC oficial segura listar_prateleiras_empresa (usada no ZoeStock Web)
      if (this.isValidUuid(empFiltro)) {
        const { data: rpcPrats, error: rpcErr } = await this.client.rpc('listar_prateleiras_empresa', {
          p_empresa_id: empFiltro,
        });

        if (!rpcErr && Array.isArray(rpcPrats) && rpcPrats.length > 0) {
          const list = (rpcPrats as Array<Record<string, any>>).map((json) =>
            parsePrateleiraFromDb(json)
          );
          await this.sync.salvarPrateleirasCache(list, empFiltro);
          return list;
        }
      }

      // 2. Fallback query direta se o RLS permitir
      if (this.isValidUuid(empFiltro)) {
        const { data, error } = await this.client
          .from('prateleiras')
          .select('*')
          .eq('empresa_id', empFiltro)
          .eq('excluido', false)
          .order('codigo_localizacao', { ascending: true });

        if (!error && data && data.length > 0) {
          const list = (data as Array<Record<string, any>>).map((json) =>
            parsePrateleiraFromDb(json)
          );
          await this.sync.salvarPrateleirasCache(list, empFiltro);
          return list;
        }
      }
    } catch (err: unknown) {
      console.warn('Falha na busca de prateleiras no Supabase:', err);
    }

    const cache = await this.sync.obterPrateleirasCache(empresaId || 'default');
    if (cache.length > 0) {
      return cache;
    }
    return [];
  }
}

export const prateleiraService = new PrateleiraService();
