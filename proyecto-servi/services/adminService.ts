import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/models';

export type AdminDashboardStats = {
  users: {
    total: number;
    custodios: number;
    clientes: number;
    jefes: number;
  };
  bitacoras: {
    activas: number;
    pendientes: number;
    completadas: number;
    total: number;
  };
  sos: {
    activas: number;
  };
};

type CreateUserParams = {
  email: string;
  password: string;
  nombre: string;
  role: UserRole;
  empresa?: string;
};

export async function getAdminDashboardStats(): Promise<{
  data: AdminDashboardStats | null;
  error: string | null;
}> {
  const [profilesRes, bitacorasRes, sosRes] = await Promise.all([
    supabase.from('profiles').select('role'),
    supabase.from('bitacoras').select('estado'),
    supabase.from('sos_alerts').select('id').eq('estado', 'activa'),
  ]);

  if (profilesRes.error) return { data: null, error: profilesRes.error.message };
  if (bitacorasRes.error) return { data: null, error: bitacorasRes.error.message };
  if (sosRes.error) return { data: null, error: sosRes.error.message };

  const roles = profilesRes.data ?? [];
  const bitacoras = bitacorasRes.data ?? [];

  const stats: AdminDashboardStats = {
    users: {
      total: roles.length,
      custodios: roles.filter((r) => r.role === 'custodio').length,
      clientes: roles.filter((r) => r.role === 'cliente').length,
      jefes: roles.filter((r) => r.role === 'jefe_custodios').length,
    },
    bitacoras: {
      activas: bitacoras.filter((b) => b.estado === 'activo').length,
      pendientes: bitacoras.filter((b) => b.estado === 'pendiente').length,
      completadas: bitacoras.filter((b) => b.estado === 'completado').length,
      total: bitacoras.length,
    },
    sos: {
      activas: sosRes.data?.length ?? 0,
    },
  };

  return { data: stats, error: null };
}

export async function createUserAsAdmin(params: CreateUserParams): Promise<{ error: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: 'Sesion expirada. Vuelve a iniciar sesion.' };
  }

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-user`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      return { error: payload.error ?? 'No se pudo crear el usuario' };
    }

    return { error: null };
  } catch {
    return { error: 'Error de red al crear usuario. Verifica la Edge Function.' };
  }
}

export async function listManagedProfiles(): Promise<{
  data: Array<{
    id: string;
    nombre: string;
    email: string | null;
    role: UserRole;
    empresa: string | null;
    created_at: string;
  }>;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, role, empresa, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}
