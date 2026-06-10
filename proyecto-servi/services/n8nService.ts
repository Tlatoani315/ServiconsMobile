import { getInfoAsync } from 'expo-file-system/legacy';

import { getEnvConfig } from '../lib/envConfig';

const FETCH_TIMEOUT_MS = 45_000;

function resolveWebhookBase(): string {
  const raw = (getEnvConfig()?.n8nBaseUrl ?? 'https://n8n.pymemind.com').replace(/\/$/, '');
  return raw.endsWith('/webhook') ? raw : `${raw}/webhook`;
}

const WEBHOOK_BASE = resolveWebhookBase();

function getWebhookToken(): string {
  return getEnvConfig()?.n8nWebhookToken ?? process.env.EXPO_PUBLIC_N8N_WEBHOOK_TOKEN ?? '';
}

export type N8nChannel = {
  remoteJid: string;
  pushName: string;
};

export type N8nResult<T = unknown> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

function webhookUrl(path: string) {
  return `${WEBHOOK_BASE}/${path.replace(/^\//, '')}`;
}

function log(endpoint: string, phase: 'request' | 'response' | 'error', payload: unknown) {
  console.log(`[n8n/${endpoint}] ${phase}:`, payload);
}

async function readResponse(response: Response): Promise<{ parsed: unknown; raw: string }> {
  const raw = await response.text();
  if (!raw) return { parsed: null, raw: '' };
  try {
    return { parsed: JSON.parse(raw), raw };
  } catch {
    return { parsed: raw, raw };
  }
}

function fail<T>(endpoint: string, error: string): N8nResult<T> {
  log(endpoint, 'error', error);
  return { success: false, data: null, error };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado (${Math.round(timeoutMs / 1000)}s)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function n8nHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Webhook-Token': getWebhookToken(),
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function extractChannels(parsed: unknown): N8nChannel[] {
  if (Array.isArray(parsed)) return parsed as N8nChannel[];
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    for (const key of ['channels', 'data', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as N8nChannel[];
    }
  }
  return [];
}

/** Tipo inferido del remoteJid (Evolution API / WhatsApp) */
export function getChannelKind(remoteJid: string): 'grupo' | 'contacto' | 'lid' | 'otro' {
  if (remoteJid.endsWith('@g.us')) return 'grupo';
  if (remoteJid.endsWith('@lid')) return 'lid';
  if (remoteJid.endsWith('@s.whatsapp.net')) return 'contacto';
  return 'otro';
}

export function getChannelKindLabel(remoteJid: string): string {
  switch (getChannelKind(remoteJid)) {
    case 'grupo':
      return 'Grupo';
    case 'lid':
      return 'Contacto';
    case 'contacto':
      return 'Contacto';
    default:
      return 'Chat';
  }
}

/** Excluye chats especiales del sistema (p. ej. 0@s.whatsapp.net) */
export function filterMessagingChannels(channels: N8nChannel[]): N8nChannel[] {
  return channels.filter(
    (c) =>
      c.remoteJid &&
      c.remoteJid !== '0@s.whatsapp.net' &&
      typeof c.pushName === 'string',
  );
}

/** GET /get-channels — contactos y grupos WhatsApp (Evolution API) */
export async function getChannels(): Promise<N8nResult<N8nChannel[]>> {
  const endpoint = 'get-channels';
  const url = webhookUrl(endpoint);

  log(endpoint, 'request', { method: 'GET', url });

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: n8nHeaders(),
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en get-channels'}`);
    }

    const data = filterMessagingChannels(extractChannels(parsed));
    return { success: true, data, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en get-channels');
  }
}

/** POST /report-route — reporte de ruta (foto + GPS). Contactos los resuelve n8n desde bitacoras.contactos */
export type ReportRoutePayload = {
  idBitacora: string;
  latitud: number;
  longitud: number;
  direccion: string;
  estatus: 'inicio' | 'reporte' | 'termino' | string;
  fecha?: string;
  hora?: string;
};

export async function reportRoute(
  data: ReportRoutePayload,
  photoUri: string,
): Promise<N8nResult> {
  const endpoint = 'report-route';
  const url = webhookUrl(endpoint);
  const now = new Date();
  const fecha = data.fecha ?? now.toISOString().slice(0, 10);
  const hora =
    data.hora ??
    now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

  try {
    const fileInfo = await getInfoAsync(photoUri);
    if (!fileInfo.exists) {
      return fail(endpoint, 'No se encontro el archivo de la foto');
    }

    const formData = new FormData();
    formData.append('data', {
      uri: photoUri,
      name: `reporte_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
    formData.append('idBitacora', data.idBitacora);
    formData.append('latitud', String(data.latitud));
    formData.append('longitud', String(data.longitud));
    formData.append('direccion', data.direccion);
    formData.append('fecha', fecha);
    formData.append('hora', hora);
    formData.append('estatus', data.estatus);

    log(endpoint, 'request', {
      method: 'POST',
      url,
      idBitacora: data.idBitacora,
      latitud: data.latitud,
      longitud: data.longitud,
      estatus: data.estatus,
    });

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: n8nHeaders(),
      body: formData,
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en report-route'}`);
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'success' in parsed &&
      (parsed as { success?: boolean }).success === false
    ) {
      const body = parsed as { message?: unknown };
      const msg =
        typeof body.message === 'string' ? body.message : 'n8n respondio sin exito';
      return fail(endpoint, msg);
    }

    return { success: true, data: parsed, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en report-route');
  }
}

export type TriggerSOSPayload = {
  custodio_id: string;
  custodio_nombre: string;
  bitacora_id: string;
  latitud: number;
  longitud: number;
  timestamp: string;
  contactos_emergencia: N8nChannel[];
};

/** POST /sos — alerta de panico */
export async function triggerSOS(data: TriggerSOSPayload): Promise<N8nResult> {
  const endpoint = 'sos';
  const url = webhookUrl(endpoint);

  log(endpoint, 'request', { method: 'POST', url, body: data });

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: n8nHeaders(true),
      body: JSON.stringify(data),
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en sos'}`);
    }

    return { success: true, data: parsed, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en sos');
  }
}

/** Extrae base64 puro de un data URL de firma */
export function signatureToBase64(dataUrl: string): string {
  if (!dataUrl) return '';
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/** Filtra solo grupos WhatsApp (@g.us) */
export function filterWhatsAppGroups(channels: N8nChannel[]): N8nChannel[] {
  return channels.filter((c) => c.remoteJid.endsWith('@g.us'));
}

/** @deprecated usar triggerSOS */
export const sendSOS = triggerSOS;
