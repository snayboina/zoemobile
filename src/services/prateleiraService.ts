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

  async listarPrateleiras(empresaId?: string): Promise<PrateleiraModel[]> {
    try {
      const empFiltro = (empresaId || '').trim();

      if (empFiltro) {
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

      // Busca geral de prateleiras ativas do Supabase
      const resGeral = await this.client
        .from('prateleiras')
        .select('*')
        .eq('excluido', false)
        .order('codigo_localizacao', { ascending: true });

      if (!resGeral.error && resGeral.data && resGeral.data.length > 0) {
        const list = (resGeral.data as Array<Record<string, any>>).map((json) =>
          parsePrateleiraFromDb(json)
        );
        await this.sync.salvarPrateleirasCache(list, empFiltro || 'default');
        return list;
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
