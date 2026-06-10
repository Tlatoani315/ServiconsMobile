import type { BitacoraDetalle } from '../hooks/useBitacora';
import type { EnqueueParams } from './reportQueueService';

type LocationResult = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type EnqueueFn = (params: EnqueueParams) => Promise<unknown>;

/** Encola reporte inicio. El envio a n8n continua en segundo plano. */
export async function beginCustodyService(params: {
  bitacoraId: string;
  bitacora: BitacoraDetalle;
  photoUri: string;
  getCurrentLocation: () => Promise<LocationResult>;
  enqueue: EnqueueFn;
  prefetchedLocation?: LocationResult | null;
  onActivated?: () => Promise<void>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    bitacoraId,
    bitacora,
    photoUri,
    getCurrentLocation,
    enqueue,
    prefetchedLocation,
    onActivated,
  } = params;

  try {
    const { latitude, longitude, accuracy } =
      prefetchedLocation ?? (await getCurrentLocation());

    await enqueue({
      bitacoraId,
      photoUri,
      latitud: latitude,
      longitud: longitude,
      precision_m: accuracy ?? null,
      estatus: 'inicio',
      reportIndex: 1,
      fallbackUbicacion: bitacora.formulario?.origen ?? null,
      skipGeocoding: true,
    });

    if (onActivated) {
      await onActivated();
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo iniciar el servicio.',
    };
  }
}
