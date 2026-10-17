import type { InventarioModel } from '../types/models';
import { supabase } from './supabase/client';

export class InventarioService {
  private client: any;

  constructor(client = supabase) {
    this.client = client;
  }

  async registrarInventario(item: InventarioModel, empresaId: string): Promise<string> {
    try {
      const { data: invHeader, error: headerError } = await this.client
        .from('inventarios')
        .insert({
          status: 'Concluído',
          observacao: item.observacao || 'Inventário Mobile PWA',
          empresa_id: empresaId,
        })
        .select('id')
        .single();

      if (headerError || !invHeader) {
        throw new Error(headerError?.message || 'Falha ao criar cabeçalho do inventário.');
      }

      const inventarioId = invHeader.id as string;

      const { error: itemError } = await this.client
        .from('inventario_itens')
        .insert({
          inventario_id: inventarioId,
          produto_id: item.produtoId || item.produto_id,
          quantidade_sistema: item.quantidadeSistema,
          quantidade_fisica: item.quantidadeReal,
        });

      if (itemError) {
        throw new Error(itemError.message);
      }

      return inventarioId;
    } catch (err: unknown) {
      throw new Error(`Erro ao registrar inventário: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export const inventarioService = new InventarioService();
