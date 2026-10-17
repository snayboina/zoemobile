import type { PrateleiraModel } from '../types/models';
import { parsePrateleiraFromDb } from '../types/models';
import { supabase } from './supabase/client';
import { syncService } from './offline/syncService';
import type { SyncService } from './offline/syncService';

export class PrateleiraService {
  private client: any;
  private sync: SyncService;

  constructor(client = supabase, sync: SyncService = syncService) {
    this.client = client;
    this.sync = sync;
  }

  async listarPrateleiras(empresaId: string): Promise<PrateleiraModel[]> {
    try {
      const { data, error } = await this.client
        .from('prateleiras')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('codigo_localizacao', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const list = ((data as Array<Record<string, any>>) || []).map((json) =>
        parsePrateleiraFromDb(json)
      );

      await this.sync.salvarPrateleirasCache(list, empresaId);
      return list;
    } catch (err: unknown) {
      const cache = await this.sync.obterPrateleirasCache(empresaId);
      if (cache.length > 0) {
        return cache;
      }
      throw new Error(`Erro ao carregar prateleiras (sem conexão): ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export const prateleiraService = new PrateleiraService();
