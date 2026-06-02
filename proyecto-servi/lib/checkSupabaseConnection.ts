import { supabase } from './supabaseClient';

export type ConnectionStatus = 'ok' | 'error' | 'missing_env';

export async function checkSupabaseConnection(): Promise<{
  status: ConnectionStatus;
  message: string;
}> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    return {
      status: 'missing_env',
      message: 'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_KEY en .env',
    };
  }

  const { error } = await supabase.auth.getSession();

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'ok', message: 'Conexion con Supabase establecida' };
}
