import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'servi:cp-cache-v1';
const CACHE_MAX = 250;
const API_BASE = 'https://sepomex.nitrostudio.com.mx/api/latest/cp';

export type CpLookupResult = {
  cp: string;
  estado: string;
  municipio: string;
  ciudad: string;
  colonias: string[];
};

type SepomexRow = {
  d_codigo?: string;
  d_asenta?: string;
  d_mnpio?: string;
  d_estado?: string;
  d_ciudad?: string;
};

type SepomexResponse = {
  data?: { postcodes?: SepomexRow[] };
  error?: unknown;
};

const memoryCache = new Map<string, CpLookupResult>();
let diskCacheLoaded = false;
let diskCache: Record<string, CpLookupResult> = {};

async function ensureDiskCache() {
  if (diskCacheLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    diskCache = raw ? (JSON.parse(raw) as Record<string, CpLookupResult>) : {};
  } catch {
    diskCache = {};
  }
  diskCacheLoaded = true;
  for (const [cp, entry] of Object.entries(diskCache)) {
    memoryCache.set(cp, entry);
  }
}

async function persistDiskCache() {
  const entries = [...memoryCache.entries()]
    .sort((a, b) => b[1].cp.localeCompare(a[1].cp))
    .slice(0, CACHE_MAX);
  diskCache = Object.fromEntries(entries);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(diskCache));
}

function parseSepomexRows(cp: string, rows: SepomexRow[]): CpLookupResult | null {
  if (!rows.length) return null;

  const colonias = [...new Set(rows.map((r) => r.d_asenta?.trim()).filter(Boolean) as string[])];
  const first = rows[0];

  return {
    cp,
    estado: first.d_estado?.trim() ?? '',
    municipio: first.d_mnpio?.trim() ?? '',
    ciudad: first.d_ciudad?.trim() ?? first.d_mnpio?.trim() ?? '',
    colonias,
  };
}

async function fetchCpFromApi(cp: string): Promise<CpLookupResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${API_BASE}/${cp}.json`, { signal: controller.signal });
    if (!res.ok) return null;

    const json = (await res.json()) as SepomexResponse;
    const rows = json.data?.postcodes ?? [];
    return parseSepomexRows(cp, rows);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Consulta CP (memoria → disco → API SEPOMEX). Una peticion por CP nuevo. */
export async function lookupCodigoPostal(cpRaw: string): Promise<CpLookupResult | null> {
  const cp = cpRaw.replace(/\D/g, '').slice(0, 5);
  if (cp.length !== 5) return null;

  await ensureDiskCache();

  const cached = memoryCache.get(cp);
  if (cached) return cached;

  const remote = await fetchCpFromApi(cp);
  if (!remote) return null;

  memoryCache.set(cp, remote);
  await persistDiskCache();
  return remote;
}

import type { Ubicacion } from '../types/models';

export function applyCpLookupToUbicacion(
  ubicacion: Ubicacion,
  lookup: CpLookupResult,
  colonia?: string,
): Ubicacion {
  return {
    ...ubicacion,
    codigoPostal: lookup.cp,
    estado: lookup.estado,
    municipio: lookup.municipio,
    ciudad: lookup.ciudad || ubicacion.ciudad,
    colonia: colonia ?? (lookup.colonias.length === 1 ? lookup.colonias[0] : ubicacion.colonia),
  };
}
