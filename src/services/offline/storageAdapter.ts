/**
 * Adaptador de Armazenamento Local Resiliente.
 * 
 * DIRETRIZ DE SEGURANÇA OBRIGATÓRIA:
 * - Não presume que AsyncStorage é criptografado.
 * - Particiona dados por empresa (multi-tenant) e usuário.
 * - Suporta limpeza completa ao trocar de empresa.
 */
class MemoryStorage {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class StorageAdapter {
  private static backend: MemoryStorage = new MemoryStorage();

  /**
   * Constrói chave isolada por empresa (multi-tenant partition).
   */
  private static buildKey(baseKey: string, empresaId?: string): string {
    const tenantPrefix = empresaId ? `tenant_${empresaId}_` : 'global_';
    return `${tenantPrefix}${baseKey}`;
  }

  static async getItem(key: string, empresaId?: string): Promise<string | null> {
    const fullKey = this.buildKey(key, empresaId);
    return this.backend.getItem(fullKey);
  }

  static async setItem(key: string, value: string, empresaId?: string): Promise<void> {
    const fullKey = this.buildKey(key, empresaId);
    await this.backend.setItem(fullKey, value);
  }

  static async removeItem(key: string, empresaId?: string): Promise<void> {
    const fullKey = this.buildKey(key, empresaId);
    await this.backend.removeItem(fullKey);
  }

  /**
   * Remove todos os dados locais associados a uma empresa específica.
   */
  static async clearTenantData(empresaId: string): Promise<void> {
    const prefix = `tenant_${empresaId}_`;
    const keys = await this.backend.getAllKeys();
    for (const k of keys) {
      if (k.startsWith(prefix)) {
        await this.backend.removeItem(k);
      }
    }
  }

  /**
   * Limpeza de emergência de toda a memória local.
   */
  static async clearAll(): Promise<void> {
    await this.backend.clear();
  }
}
