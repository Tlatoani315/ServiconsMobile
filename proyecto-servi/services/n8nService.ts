import * as FileSystem from 'expo-file-system';

/** Base documentada: https://n8n.pymemind.com/webhook/ */
function resolveWebhookBase(): string {
  const raw = (process.env.EXPO_PUBLIC_N8N_BASE_URL ?? 'https://n8n.pymemind.com').replace(/\/$/, '');
  return raw.endsWith('/webhook') ? raw : `${raw}/webhook`;
}

const WEBHOOK_BASE = resolveWebhookBase();

const WEBHOOK_TOKEN =
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_TOKEN ?? 'servicons-token-2025';

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

/** GET /get-channels — contactos y grupos WhatsApp */
export async function getChannels(): Promise<N8nResult<N8nChannel[]>> {
  const endpoint = 'get-channels';
  const url = webhookUrl(endpoint);

  log(endpoint, 'request', { method: 'GET', url });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-Webhook-Token': WEBHOOK_TOKEN },
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en get-channels'}`);
    }

    const data = Array.isArray(parsed) ? (parsed as N8nChannel[]) : [];
    return { success: true, data, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en get-channels');
  }
}

export type StartRoutePayload = {
  bitacora_id: string;
  custodio_id: string;
  empresa: string;
  remoteJid: string;
  timestamp_inicio: string;
  ubicacion_inicio: { lat: number; lng: number };
};

/** POST /start-route — inicio de custodia + WhatsApp al cliente */
export async function startRoute(data: StartRoutePayload): Promise<N8nResult> {
  const endpoint = 'start-route';
  const url = webhookUrl(endpoint);

  log(endpoint, 'request', { method: 'POST', url, body: data });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN,
      },
      body: JSON.stringify(data),
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      // TODO: endpoint pendiente en n8n si responde 404
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en start-route'}`);
    }

    return { success: true, data: parsed, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en start-route');
  }
}

export type ReportEvidencePayload = {
  bitacora_id: string;
  custodio_id: string;
  latitud: number;
  longitud: number;
  custodio?: string;
  estatus?: string;
  contactos: N8nChannel[];
};

/** POST /report-evidence — multipart/form-data con foto real */
export async function reportEvidence(
  data: ReportEvidencePayload,
  photoUri: string,
): Promise<N8nResult> {
  const endpoint = 'report-evidence';
  const url = webhookUrl(endpoint);
  const now = new Date();

  try {
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (!fileInfo.exists) {
      return fail(endpoint, 'No se encontro el archivo de la foto');
    }

    const formData = new FormData();
    formData.append('data', {
      uri: photoUri,
      name: `evidencia_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
    formData.append('bitacora_id', data.bitacora_id);
    formData.append('custodio_id', data.custodio_id);
    formData.append('latitud', String(data.latitud));
    formData.append('longitud', String(data.longitud));
    formData.append('fecha', now.toLocaleDateString('es-MX'));
    formData.append('hora', now.toLocaleTimeString('es-MX'));
    formData.append('custodio', data.custodio ?? '');
    formData.append('estatus', data.estatus ?? 'evidencia');
    formData.append('contactos', JSON.stringify(data.contactos));

    log(endpoint, 'request', {
      method: 'POST',
      url,
      bitacora_id: data.bitacora_id,
      latitud: data.latitud,
      longitud: data.longitud,
      contactos: data.contactos.length,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Webhook-Token': WEBHOOK_TOKEN,
      },
      body: formData,
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      // TODO: endpoint pendiente en n8n si responde 404
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en report-evidence'}`);
    }

    return { success: true, data: parsed, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en report-evidence');
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN,
      },
      body: JSON.stringify(data),
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      // TODO: endpoint pendiente en n8n si responde 404
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en sos'}`);
    }

    return { success: true, data: parsed, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en sos');
  }
}

export type FinishRoutePayload = {
  bitacora_id: string;
  custodio_id: string;
  firma_custodio: string;
  firma_receptor: string;
  timestamp_fin: string;
  remoteJid: string;
};

/** POST /finish-route — cierre con firmas */
export async function finishRoute(data: FinishRoutePayload): Promise<N8nResult> {
  const endpoint = 'finish-route';
  const url = webhookUrl(endpoint);

  log(endpoint, 'request', { method: 'POST', url, body: { ...data, firma_custodio: '[base64]', firma_receptor: '[base64]' } });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN,
      },
      body: JSON.stringify(data),
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      // TODO: endpoint pendiente en n8n si responde 404
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en finish-route'}`);
    }

    return { success: true, data: parsed, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en finish-route');
  }
}

/** POST /export-pdf — genera PDF de bitacora */
export async function exportPDF(
  bitacoraId: string,
  incluirFirmas = true,
): Promise<N8nResult<{ url?: string }>> {
  const endpoint = 'export-pdf';
  const url = webhookUrl(endpoint);
  const body = { bitacora_id: bitacoraId, incluir_firmas: incluirFirmas };

  log(endpoint, 'request', { method: 'POST', url, body });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const { parsed, raw } = await readResponse(response);
    log(endpoint, 'response', { status: response.status, body: parsed ?? raw });

    if (!response.ok) {
      // TODO: endpoint pendiente en n8n si responde 404
      return fail(endpoint, `HTTP ${response.status}: ${raw || 'Error en export-pdf'}`);
    }

    return { success: true, data: (parsed as { url?: string }) ?? null, error: null };
  } catch (e) {
    return fail(endpoint, e instanceof Error ? e.message : 'Error de red en export-pdf');
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

/** @deprecated usar exportPDF */
export const exportPdf = (payload: { bitacora_id: string }) =>
  exportPDF(payload.bitacora_id, true);
