export class StorageAdapter {
  private static PREFIX = 'zoestock_pwa_';

  static async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.PREFIX + key, value);
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.PREFIX + key);
    } catch {
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.PREFIX + key);
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
