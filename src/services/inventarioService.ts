import { InventarioModel } from '../types/models';
import { supabase } from './supabase/client';

/**
 * InventarioService - Registro e Auditoria de Inventários Físicos.
 * Paridade com inventario_service.dart.
 */
export class InventarioService {
  constructor(private client = supabase) {}

  /**
   * Registra a conferência física de estoque, criando o cabeçalho e item.
   */
  async registrarInventario(item: InventarioModel, empresaId: string): Promise<string> {
    try {
      // 1. Cabeçalho do inventário
      const { data: invHeader, error: headerError } = await this.client
        .from('inventarios')
        .insert({
          status: 'Concluído',
          observacao: item.observacao || 'Inventário Mobile',
          empresa_id: empresaId,
        })
        .select('id')
        .single();

      if (headerError || !invHeader) {
        throw new Error(headerError?.message || 'Falha ao criar cabeçalho do inventário.');
      }

      const inventarioId = invHeader.id as string;

      // 2. Registro do item auditado
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
