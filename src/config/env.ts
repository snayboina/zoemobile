export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appEnv: 'development' | 'staging' | 'production';
  enableOfflineMock: boolean;
  isConfigured: boolean;
}

export const env: AppConfig = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV as AppConfig['appEnv']) || 'development',
  enableOfflineMock: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MOCK === 'true' || true,
  isConfigured: Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL && 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('seu-projeto')
  ),
};
