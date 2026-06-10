import { upsertLiveLocation } from '../services/locationService';
import { reportRoute } from '../services/n8nService';
import { deletePersistedPhoto } from './persistCameraPhoto';
import {
  MAX_REPORT_ATTEMPTS,
  enqueueReport,
  getPendingReports,
  removeReportQueueItem,
  updateReportQueueItem,
  type QueuedReport,
} from './reportQueueStorage';
import {
  formatReportFecha,
  formatReportHora,
  reportEstatusForIndex,
  resolveReportDireccion,
  type ReportRouteEstatus,
} from './reportRouteHelpers';
import type { Ubicacion } from '../types/models';

const RETRY_COOLDOWN_MS = 4_000;

export type EnqueueParams = {
  bitacoraId: string;
  photoUri: string;
  latitud: number;
  longitud: number;
  precision_m?: number | null;
  estatus?: ReportRouteEstatus;
  reportIndex?: number;
  fallbackUbicacion?: Ubicacion | null;
  skipGeocoding?: boolean;
};

export type ProcessQueueResult = {
  sent: number;
  failed: number;
  remaining: number;
};

/** Guarda reporte en cola local (con direccion resuelta al momento de captura). */
export async function enqueueRouteReport(params: EnqueueParams): Promise<QueuedReport> {
  const now = new Date();
  const reportIndex = params.reportIndex ?? 1;
  const direccion = await resolveReportDireccion(
    params.latitud,
    params.longitud,
    params.fallbackUbicacion,
    { skipGeocoding: params.skipGeocoding },
  );

  return enqueueReport({
    bitacoraId: params.bitacoraId,
    photoUri: params.photoUri,
    latitud: params.latitud,
    longitud: params.longitud,
    precision_m: params.precision_m ?? null,
    estatus: params.estatus ?? reportEstatusForIndex(reportIndex),
    reportIndex,
    direccion,
    fecha: formatReportFecha(now),
    hora: formatReportHora(now),
  });
}

async function sendQueuedItem(item: QueuedReport, custodioId?: string): Promise<{ ok: boolean; error?: string }> {
  const result = await reportRoute(
    {
      idBitacora: item.bitacoraId,
      latitud: item.latitud,
      longitud: item.longitud,
      direccion: item.direccion,
      estatus: item.estatus,
      fecha: item.fecha,
      hora: item.hora,
    },
    item.photoUri,
  );

  if (!result.success) {
    return { ok: false, error: result.error ?? 'Error al enviar reporte' };
  }

  if (custodioId) {
    await upsertLiveLocation({
      custodioId,
      bitacoraId: item.bitacoraId,
      latitud: item.latitud,
      longitud: item.longitud,
      precision_m: item.precision_m,
    });
  }

  await deletePersistedPhoto(item.photoUri);
  await removeReportQueueItem(item.id);
  return { ok: true };
}

let processingLock = false;

/** Procesa cola FIFO con reintentos (max 3 por item). */
export async function processReportQueue(options?: {
  bitacoraId?: string;
  custodioId?: string;
  force?: boolean;
}): Promise<ProcessQueueResult> {
  if (processingLock && !options?.force) {
    const pending = await getPendingReports(options?.bitacoraId);
    return { sent: 0, failed: 0, remaining: pending.length };
  }

  processingLock = true;
  let sent = 0;
  let failed = 0;

  try {
    const pending = await getPendingReports(options?.bitacoraId);
    const now = Date.now();

    for (const item of pending) {
      if (item.attempts >= MAX_REPORT_ATTEMPTS) continue;
      if (item.lastAttemptAt && now - item.lastAttemptAt < RETRY_COOLDOWN_MS) continue;

      const outcome = await sendQueuedItem(item, options?.custodioId);
      if (outcome.ok) {
        sent += 1;
        continue;
      }

      const attempts = item.attempts + 1;
      await updateReportQueueItem(item.id, {
        attempts,
        lastError: outcome.error,
        lastAttemptAt: Date.now(),
      });

      if (attempts >= MAX_REPORT_ATTEMPTS) {
        failed += 1;
      }
    }
  } finally {
    processingLock = false;
  }

  const remaining = (await getPendingReports(options?.bitacoraId)).length;
  return { sent, failed, remaining };
}
