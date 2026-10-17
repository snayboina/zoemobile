export class StorageAdapter {
  private static PREFIX = 'zoestock_pwa_';

  private static buildKey(key: string, empresaId?: string): string {
    const tenant = empresaId ? `${empresaId}_` : '';
    return `${this.PREFIX}${tenant}${key}`;
  }

  static async setItem(key: string, value: string, empresaId?: string): Promise<void> {
    try {
      localStorage.setItem(this.buildKey(key, empresaId), value);
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  static async getItem(key: string, empresaId?: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.buildKey(key, empresaId));
    } catch {
      return null;
    }
  }

  static async removeItem(key: string, empresaId?: string): Promise<void> {
    try {
      localStorage.removeItem(this.buildKey(key, empresaId));
    } catch (e) {
      console.warn('Erro ao remover do localStorage:', e);
    }
  }

  static async clearTenantData(empresaId: string): Promise<void> {
    try {
      const prefix = `${this.PREFIX}${empresaId}_`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Erro ao limpar tenant:', e);
    }
  }
}
