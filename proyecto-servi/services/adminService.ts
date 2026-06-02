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

export async function updateUserAsAdmin(params: {
  userId: string;
  role?: UserRole;
  activo?: boolean;
  empresa?: string;
}): Promise<{ error: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: 'Sesion expirada. Vuelve a iniciar sesion.' };
  }

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update-user`;

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
      return { error: payload.error ?? 'No se pudo actualizar el usuario' };
    }

    return { error: null };
  } catch {
    return { error: 'Error de red al actualizar usuario. Verifica la Edge Function update-user.' };
  }
}

export type AdminBitacoraRow = {
  id: string;
  nombre: string | null;
  ruta: string | null;
  unidad: string | null;
  empresa_contratante: string | null;
  estado: string;
  created_at: string;
  completed_at: string | null;
  custodio_id: string;
};

export type AdminReportRow = AdminBitacoraRow & {
  evidencias_count: number;
  custodio_nombre: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_report_at: string | null;
};

export type AdminActiveServiceRow = AdminBitacoraRow & {
  custodio_nombre: string | null;
  evidencias_count: number;
  last_lat: number | null;
  last_lng: number | null;
  last_report_at: string | null;
};

function indexEvidencias(
  rows: Array<{
    bitacora_id: string;
    latitud: number;
    longitud: number;
    timestamp: string;
  }>,
) {
  const counts = new Map<string, number>();
  const last = new Map<string, { lat: number; lng: number; at: string }>();

  for (const row of rows) {
    counts.set(row.bitacora_id, (counts.get(row.bitacora_id) ?? 0) + 1);
    const prev = last.get(row.bitacora_id);
    if (!prev || row.timestamp > prev.at) {
      last.set(row.bitacora_id, { lat: row.latitud, lng: row.longitud, at: row.timestamp });
    }
  }

  return { counts, last };
}

export type AdminEvidenciaRow = {
  id: string;
  bitacora_id: string;
  url_imagen: string | null;
  latitud: number;
  longitud: number;
  observaciones: string | null;
  timestamp: string;
};

export async function listAdminReports(): Promise<{
  data: AdminReportRow[];
  error: string | null;
}> {
  const [bitacorasRes, evidenciasRes, profilesRes] = await Promise.all([
    supabase
      .from('bitacoras')
      .select(
        'id, nombre, ruta, unidad, empresa_contratante, estado, created_at, completed_at, custodio_id',
      )
      .eq('estado', 'completado')
      .order('completed_at', { ascending: false }),
    supabase.from('evidencias').select('bitacora_id, latitud, longitud, timestamp'),
    supabase.from('profiles').select('id, nombre'),
  ]);

  if (bitacorasRes.error) return { data: [], error: bitacorasRes.error.message };
  if (evidenciasRes.error) return { data: [], error: evidenciasRes.error.message };
  if (profilesRes.error) return { data: [], error: profilesRes.error.message };

  const { counts, last } = indexEvidencias(evidenciasRes.data ?? []);
  const names = new Map((profilesRes.data ?? []).map((p) => [p.id, p.nombre]));

  const data: AdminReportRow[] = (bitacorasRes.data ?? []).map((item) => {
    const latest = last.get(item.id);
    return {
      ...(item as AdminBitacoraRow),
      evidencias_count: counts.get(item.id) ?? 0,
      custodio_nombre: names.get(item.custodio_id) ?? null,
      last_lat: latest?.lat ?? null,
      last_lng: latest?.lng ?? null,
      last_report_at: latest?.at ?? null,
    };
  });

  return { data, error: null };
}

export async function listAdminActiveServices(): Promise<{
  data: AdminActiveServiceRow[];
  error: string | null;
}> {
  const [bitacorasRes, evidenciasRes, profilesRes] = await Promise.all([
    supabase
      .from('bitacoras')
      .select(
        'id, nombre, ruta, unidad, empresa_contratante, estado, created_at, completed_at, custodio_id',
      )
      .eq('estado', 'activo')
      .order('created_at', { ascending: false }),
    supabase.from('evidencias').select('bitacora_id, latitud, longitud, timestamp'),
    supabase.from('profiles').select('id, nombre'),
  ]);

  if (bitacorasRes.error) return { data: [], error: bitacorasRes.error.message };
  if (evidenciasRes.error) return { data: [], error: evidenciasRes.error.message };
  if (profilesRes.error) return { data: [], error: profilesRes.error.message };

  const { counts, last } = indexEvidencias(evidenciasRes.data ?? []);
  const names = new Map((profilesRes.data ?? []).map((p) => [p.id, p.nombre]));

  const data: AdminActiveServiceRow[] = (bitacorasRes.data ?? []).map((item) => {
    const latest = last.get(item.id);
    return {
      ...(item as AdminBitacoraRow),
      custodio_nombre: names.get(item.custodio_id) ?? null,
      evidencias_count: counts.get(item.id) ?? 0,
      last_lat: latest?.lat ?? null,
      last_lng: latest?.lng ?? null,
      last_report_at: latest?.at ?? null,
    };
  });

  return { data, error: null };
}

export async function getAdminBitacoraDetail(bitacoraId: string): Promise<{
  data: (AdminBitacoraRow & { custodio_nombre: string | null }) | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('bitacoras')
    .select(
      'id, nombre, ruta, unidad, empresa_contratante, estado, created_at, completed_at, custodio_id',
    )
    .eq('id', bitacoraId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: 'Bitacora no encontrada' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', data.custodio_id)
    .maybeSingle();

  return {
    data: {
      ...(data as AdminBitacoraRow),
      custodio_nombre: profile?.nombre ?? null,
    },
    error: null,
  };
}

export async function listAdminBitacoraEvidencias(bitacoraId: string): Promise<{
  data: AdminEvidenciaRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('evidencias')
    .select('id, bitacora_id, url_imagen, latitud, longitud, observaciones, timestamp')
    .eq('bitacora_id', bitacoraId)
    .order('timestamp', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AdminEvidenciaRow[], error: null };
}

export async function listManagedProfiles(): Promise<{
  data: Array<{
    id: string;
    nombre: string;
    email: string | null;
    role: UserRole;
    empresa: string | null;
    created_at: string;
    activo: boolean | null;
  }>;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, role, empresa, created_at, activo')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export type AdminSosRow = {
  id: string;
  bitacora_id: string | null;
  custodio_id: string;
  latitud: number;
  longitud: number;
  estado: 'activa' | 'atendida' | 'falsa_alarma';
  created_at: string;
};

export async function listAdminBitacoras(): Promise<{
  data: AdminBitacoraRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('bitacoras')
    .select(
      'id, nombre, ruta, unidad, empresa_contratante, estado, created_at, completed_at, custodio_id',
    )
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AdminBitacoraRow[], error: null };
}

export async function listAdminSosAlerts(): Promise<{
  data: AdminSosRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('id, bitacora_id, custodio_id, latitud, longitud, estado, created_at')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AdminSosRow[], error: null };
}

export async function updateSosEstado(
  alertId: string,
  estado: AdminSosRow['estado'],
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sos_alerts').update({ estado }).eq('id', alertId);
  if (error) return { error: error.message };
  return { error: null };
}
