import type { InventarioModel } from '../types/models';
import { supabase } from './supabase/client';
import { StorageAdapter } from './offline/storageAdapter';

export class InventarioService {
  private client: any;

  constructor(client = supabase) {
    this.client = client;
  }

  private isValidUuid(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
  }

  async registrarInventario(item: InventarioModel, empresaId?: string): Promise<string> {
    let empLimpo = (empresaId || item.empresaId || (item as any).empresa_id || '').trim();

    if (!this.isValidUuid(empLimpo)) {
      try {
        const savedEmpId = await StorageAdapter.getItem('auth_empresa_id');
        if (this.isValidUuid(savedEmpId)) {
          empLimpo = savedEmpId!.trim();
        } else {
          const rawSess = await StorageAdapter.getItem('auth_session');
          if (rawSess) {
            const s = JSON.parse(rawSess);
            const sEmp = s.empresaId || s.empresa_id;
            if (this.isValidUuid(sEmp)) empLimpo = sEmp.trim();
          }
        }
      } catch (_) {}
    }

    if (!this.isValidUuid(empLimpo)) {
      throw new Error('Empresa não identificada. Por favor, recarregue a página.');
    }

    try {
      // 1. Inserir cabeçalho na tabela inventarios
      const headerPayload: Record<string, any> = {
        observacao: item.observacao || 'Inventário Mobile PWA',
        empresa_id: empLimpo,
      };

      const { data: invHeader, error: headerError } = await this.client
        .from('inventarios')
        .insert(headerPayload)
        .select('id')
        .single();

      if (headerError || !invHeader) {
        throw new Error(headerError?.message || 'Falha ao criar cabeçalho do inventário.');
      }

      const inventarioId = invHeader.id as string;

      // 2. Inserir item na tabela inventario_itens
      // Nota: A coluna "diferenca" é GENERATED ALWAYS no PostgreSQL (calculada automaticamente a partir de quantidade_fisica e quantidade_sistema)
      const itemPayload: Record<string, any> = {
        inventario_id: inventarioId,
        produto_id: item.produtoId || item.produto_id,
        quantidade_sistema: item.quantidadeSistema,
        quantidade_fisica: item.quantidadeReal,
        empresa_id: empLimpo,
      };

      const pratId = item.prateleiraId || (item as any).prateleira_id;
      if (this.isValidUuid(pratId)) {
        itemPayload.prateleira_id = pratId.trim();
      }

      const { error: itemError } = await this.client
        .from('inventario_itens')
        .insert(itemPayload);

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
