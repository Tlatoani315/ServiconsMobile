const baseUrl = process.env.EXPO_PUBLIC_N8N_BASE_URL ?? '';

async function postWebhook(path: string, body: Record<string, unknown>) {
  if (!baseUrl) return;

  try {
    await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // n8n es secundario — no bloquear la app
  }
}

export function reportEvidence(payload: {
  bitacora_id: string;
  custodio_id: string;
  url_imagen: string;
  latitud: number;
  longitud: number;
  timestamp: string;
}) {
  return postWebhook('/webhook/report-evidence', payload);
}

export function sendSOS(payload: {
  custodio_id: string;
  bitacora_id: string;
  latitud: number;
  longitud: number;
  timestamp: string;
}) {
  return postWebhook('/webhook/sos', payload);
}

export function finishRoute(payload: {
  bitacora_id: string;
  custodio_id: string;
  timestamp: string;
}) {
  return postWebhook('/webhook/finish-route', payload);
}
