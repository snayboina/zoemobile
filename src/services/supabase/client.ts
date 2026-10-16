import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

/**
 * Cliente Supabase com inicialização resiliente.
 * Se as variáveis de ambiente não estiverem configuradas,
 * o cliente utiliza valores de fallback para permitir a execução
 * em modo diagnóstico/desenvolvimento sem quebrar o bundle.
 */
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  env.supabaseUrl || fallbackUrl,
  env.supabaseAnonKey || fallbackKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
