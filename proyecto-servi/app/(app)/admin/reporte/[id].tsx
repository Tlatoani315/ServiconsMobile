import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { EvidenciaReportCard } from '../../../../components/EvidenciaReportCard';
import { GoogleMapsActions } from '../../../../components/GoogleMapsActions';
import { ReportMapView } from '../../../../components/ReportMapView';
import { AppButton } from '../../../../components/AppButton';
import { DashboardShell } from '../../../../components/DashboardShell';
import {
  getAdminBitacoraDetail,
  listAdminBitacoraEvidencias,
  type AdminEvidenciaRow,
} from '../../../../services/adminService';
import { exportPDF } from '../../../../services/n8nService';

export default function AdminReporteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [bitacora, setBitacora] = useState<Awaited<
    ReturnType<typeof getAdminBitacoraDetail>
  >['data']>(null);
  const [evidencias, setEvidencias] = useState<AdminEvidenciaRow[]>([]);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const [detailRes, evidenciasRes] = await Promise.all([
      getAdminBitacoraDetail(id),
      listAdminBitacoraEvidencias(id),
    ]);

    setBitacora(detailRes.data);
    setEvidencias(evidenciasRes.data);
    setError(detailRes.error ?? evidenciasRes.error);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const routePoints = useMemo(
    () =>
      [...evidencias]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map((ev, index) => ({
          id: ev.id,
          lat: ev.latitud,
          lng: ev.longitud,
          label: `Reporte ${index + 1}`,
        })),
    [evidencias],
  );

  const handleExportPdf = async () => {
    if (!id) return;
    setExporting(true);
    const result = await exportPDF(id, true);
    setExporting(false);
    Alert.alert(
      result.success ? 'PDF solicitado' : 'Error en PDF',
      result.success
        ? 'n8n procesara el PDF. Revisa consola [n8n/export-pdf].'
        : result.error ?? 'No se pudo solicitar el PDF',
    );
  };

  return (
    <DashboardShell title="Reporte visual">
      <Pressable className="mb-3 py-1" onPress={() => router.back()}>
        <Text className="text-servi-acento">Volver</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="#F97316" />
      ) : error ? (
        <Text className="text-servi-peligro">{error}</Text>
      ) : !bitacora ? (
        <Text className="text-servi-suave">Reporte no encontrado.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="mb-4 overflow-hidden rounded-2xl border border-servi-borde bg-servi-superficie">
            <View className="px-4 py-3">
              <Text className="text-lg font-semibold text-servi-texto">
                {bitacora.nombre ?? 'Sin nombre'}
              </Text>
              <Text className="mt-1 text-sm text-servi-suave">{bitacora.ruta ?? '—'}</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <Badge label={bitacora.estado} />
                <Badge label={`${evidencias.length} reportes`} accent />
                {bitacora.custodio_nombre ? <Badge label={bitacora.custodio_nombre} /> : null}
              </View>
            </View>
          </View>

          {routePoints.length > 0 ? (
            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-servi-texto">
                Recorrido de reportes
              </Text>
              <ReportMapView
                title="Todos los puntos GPS del servicio"
                height={240}
                points={routePoints}
                showOpenMaps={false}
              />
              <View className="mt-3">
                <GoogleMapsActions
                  lat={routePoints[routePoints.length - 1].lat}
                  lng={routePoints[routePoints.length - 1].lng}
                  label={bitacora.nombre ?? 'Servicio'}
                  routePoints={routePoints}
                  coordsLabel="Ultimo reporte GPS"
                  variant="full"
                  showRoute
                />
              </View>
            </View>
          ) : null}

          <View className="mb-4 flex-row gap-2">
            <View className="flex-1 rounded-xl border border-servi-borde bg-servi-superficie p-3">
              <Text className="text-[10px] uppercase text-servi-suave">Empresa</Text>
              <Text className="text-sm font-medium text-servi-texto">
                {bitacora.empresa_contratante ?? '—'}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-servi-borde bg-servi-superficie p-3">
              <Text className="text-[10px] uppercase text-servi-suave">Unidad</Text>
              <Text className="text-sm font-medium text-servi-texto">{bitacora.unidad ?? '—'}</Text>
            </View>
          </View>

          {bitacora.estado === 'completado' ? (
            <AppButton
              label="Exportar PDF"
              variant="accent"
              loading={exporting}
              onPress={handleExportPdf}
            />
          ) : null}

          <Text className="mb-3 mt-6 text-base font-semibold text-servi-texto">
            Detalle por reporte
          </Text>

          {evidencias.length === 0 ? (
            <Text className="text-servi-suave">
              Este servicio aun no tiene reportes con foto y GPS.
            </Text>
          ) : (
            evidencias.map((ev, index) => (
              <EvidenciaReportCard
                key={ev.id}
                index={evidencias.length - index}
                latitud={ev.latitud}
                longitud={ev.longitud}
                timestamp={ev.timestamp}
                urlImagen={ev.url_imagen}
                observaciones={ev.observaciones}
              />
            ))
          )}
        </ScrollView>
      )}
    </DashboardShell>
  );
}

function Badge({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View className={`rounded-full px-3 py-1 ${accent ? 'bg-servi-acento' : 'bg-servi-fondo'}`}>
      <Text className={`text-xs font-semibold ${accent ? 'text-servi-fondo' : 'text-servi-texto'}`}>
        {label}
      </Text>
    </View>
  );
}
