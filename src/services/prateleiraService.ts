import { PrateleiraModel, parsePrateleiraFromDb } from '../types/models';
import { supabase } from './supabase/client';
import { syncService, SyncService } from './offline/syncService';

/**
 * PrateleiraService - Consulta e Mapeamento de Prateleiras e Zonas.
 * Paridade com prateleira_service.dart.
 */
export class PrateleiraService {
  constructor(
    private client = supabase,
    private sync: SyncService = syncService
  ) {}

  /**
   * Lista todas as prateleiras da empresa ordenadas por código de localização.
   */
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

      const list = ((data as Record<string, unknown>[]) || []).map((json) =>
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
