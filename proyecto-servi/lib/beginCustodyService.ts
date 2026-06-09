import type { BitacoraDetalle } from '../hooks/useBitacora';
import type { ReportRouteEstatus } from '../lib/reportRouteHelpers';
import type { Ubicacion } from '../types/models';

type LocationResult = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type SendRouteReportFn = (params: {
  bitacoraId: string;
  photoUri: string;
  latitud: number;
  longitud: number;
  precision_m?: number | null;
  estatus?: ReportRouteEstatus;
  reportIndex?: number;
  fallbackUbicacion?: Ubicacion | null;
}) => Promise<{ ok: boolean; error: string | null }>;

/** Envía reporte inicio a n8n. La activación en Supabase la hace el workflow (Activar bitacora). */
export async function beginCustodyService(params: {
  bitacoraId: string;
  bitacora: BitacoraDetalle;
  photoUri: string;
  getCurrentLocation: () => Promise<LocationResult>;
  sendRouteReport: SendRouteReportFn;
  prefetchedLocation?: LocationResult | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { bitacoraId, bitacora, photoUri, getCurrentLocation, sendRouteReport, prefetchedLocation } =
    params;

  try {
    const { latitude, longitude, accuracy } =
      prefetchedLocation ?? (await getCurrentLocation());

    const sent = await sendRouteReport(
      {
        bitacoraId,
        photoUri,
        latitud: latitude,
        longitud: longitude,
        precision_m: accuracy ?? null,
        estatus: 'inicio',
        reportIndex: 1,
        fallbackUbicacion: bitacora.formulario?.origen ?? null,
      },
      { awaitLiveLocation: false, skipGeocoding: true },
    );

    if (!sent.ok) {
      return { ok: false, error: sent.error ?? 'No se pudo enviar el reporte de inicio a n8n.' };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo iniciar el servicio.',
    };
  }
}
