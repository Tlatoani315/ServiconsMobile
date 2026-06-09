import { useCallback, useState } from 'react';

import { upsertLiveLocation } from '../services/locationService';
import { reportRoute } from '../services/n8nService';
import {
  formatReportFecha,
  formatReportHora,
  reportEstatusForIndex,
  resolveReportDireccion,
  type ReportRouteEstatus,
} from '../lib/reportRouteHelpers';
import { supabase } from '../lib/supabaseClient';
import type { Ubicacion } from '../types/models';

export function useRouteReports() {
  const [localReportCount, setLocalReportCount] = useState(0);

  const sendRouteReport = useCallback(
    async (
      params: {
        bitacoraId: string;
        photoUri: string;
        latitud: number;
        longitud: number;
        precision_m?: number | null;
        estatus?: ReportRouteEstatus;
        reportIndex?: number;
        fallbackUbicacion?: Ubicacion | null;
      },
      options?: { awaitLiveLocation?: boolean; skipGeocoding?: boolean },
    ) => {
      const reportIndex = params.reportIndex ?? localReportCount + 1;
      const estatus = params.estatus ?? reportEstatusForIndex(reportIndex);
      const direccion = await resolveReportDireccion(
        params.latitud,
        params.longitud,
        params.fallbackUbicacion,
        { skipGeocoding: options?.skipGeocoding },
      );
      const now = new Date();

      const result = await reportRoute(
        {
          idBitacora: params.bitacoraId,
          latitud: params.latitud,
          longitud: params.longitud,
          direccion,
          estatus,
          fecha: formatReportFecha(now),
          hora: formatReportHora(now),
        },
        params.photoUri,
      );

      if (!result.success) {
        return { ok: false as const, error: result.error ?? 'Error al enviar reporte a n8n' };
      }

      setLocalReportCount((c) => Math.max(c, reportIndex));

      if (options?.awaitLiveLocation !== false) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          await upsertLiveLocation({
            custodioId: session.user.id,
            bitacoraId: params.bitacoraId,
            latitud: params.latitud,
            longitud: params.longitud,
            precision_m: params.precision_m ?? null,
          });
        }
      } else {
        void supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user?.id) return;
          void upsertLiveLocation({
            custodioId: session.user.id,
            bitacoraId: params.bitacoraId,
            latitud: params.latitud,
            longitud: params.longitud,
            precision_m: params.precision_m ?? null,
          });
        });
      }

      return { ok: true as const, error: null, estatus, direccion };
    },
    [localReportCount],
  );

  const syncReportCountFromDb = useCallback(async (bitacoraId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return 0;

    const { count } = await supabase
      .from('evidencias')
      .select('id', { count: 'exact', head: true })
      .eq('bitacora_id', bitacoraId)
      .eq('custodio_id', session.user.id);

    const total = count ?? 0;
    setLocalReportCount(total);
    return total;
  }, []);

  const resetLocalReportCount = useCallback(() => setLocalReportCount(0), []);

  return {
    localReportCount,
    sendRouteReport,
    syncReportCountFromDb,
    resetLocalReportCount,
  };
}
