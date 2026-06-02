import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EvidenciaReportCard } from '../../../components/EvidenciaReportCard';
import { GoogleMapsActions } from '../../../components/GoogleMapsActions';
import { LivePulseBanner } from '../../../components/LivePulseBanner';
import { MonitoringKpiStrip } from '../../../components/MonitoringKpiStrip';
import { ReportMapView } from '../../../components/ReportMapView';
import { useBitacora, type BitacoraDetalle } from '../../../hooks/useBitacora';

/** Pantalla III — Detalle de servicio (cliente, solo lectura) */
export default function ClienteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getBitacoraDetalle, getBitacoraEvidencias } = useBitacora();
  const [bitacora, setBitacora] = useState<BitacoraDetalle | null>(null);
  const [evidencias, setEvidencias] = useState<
    Awaited<ReturnType<typeof getBitacoraEvidencias>>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getBitacoraDetalle(id), getBitacoraEvidencias(id)]).then(
      ([detail, evs]) => {
        setBitacora(detail);
        setEvidencias(evs);
        setLoading(false);
      },
    );
  }, [id, getBitacoraDetalle, getBitacoraEvidencias]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-servi-fondo">
        <ActivityIndicator color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  const form = bitacora?.formulario;
  const isLive = bitacora?.estado === 'activo';
  const routePoints = evidencias.map((ev, i) => ({
    id: ev.id,
    lat: ev.latitud,
    lng: ev.longitud,
    label: `Reporte ${i + 1}`,
  }));

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Pressable className="py-4" onPress={() => router.back()}>
          <Text className="text-sky-400">← Volver al portal</Text>
        </Pressable>

        <View className="mb-4 rounded-3xl border border-sky-500/30 bg-sky-500/10 p-5">
          <Text className="text-xs uppercase text-sky-300">Servicio de tu empresa</Text>
          <Text className="text-2xl font-bold text-servi-texto">{bitacora?.nombre ?? 'Bitacora'}</Text>
          <Text className="mt-1 text-sm text-servi-suave">{bitacora?.ruta}</Text>
        </View>

        {isLive ? (
          <LivePulseBanner count={1} label="Monitoreo en curso — el recorrido se actualiza con cada reporte" tone="sky" />
        ) : null}

        <MonitoringKpiStrip
          items={[
            { label: 'Reportes GPS', value: evidencias.length, icon: 'camera-outline', tone: 'info' },
            { label: 'Estado', value: bitacora?.estado ?? '—', icon: 'flag-outline', tone: isLive ? 'live' : 'neutral' },
          ]}
        />

        <Section title="Resumen">
          <Row label="Estado" value={bitacora?.estado ?? '—'} />
          <Row label="Unidad" value={bitacora?.unidad ?? '—'} />
          <Row label="Operador" value={form?.operador1?.nombre ?? '—'} />
        </Section>

        {routePoints.length > 0 ? (
          <View className="mb-4">
            <Text className="mb-2 font-semibold text-servi-texto">Recorrido GPS</Text>
            <ReportMapView
              points={routePoints}
              height={200}
              title="Evidencias en mapa"
              showOpenMaps={false}
            />
            <View className="mt-3">
              <GoogleMapsActions
                lat={routePoints[routePoints.length - 1].lat}
                lng={routePoints[routePoints.length - 1].lng}
                label={bitacora?.nombre ?? 'Servicio'}
                routePoints={routePoints}
                coordsLabel="Ultimo punto del recorrido"
                variant="full"
                showRoute
              />
            </View>
          </View>
        ) : null}

        <Text className="mb-3 font-semibold text-servi-texto">
          Galeria de evidencias ({evidencias.length})
        </Text>

        {evidencias.length === 0 ? (
          <Text className="text-servi-suave">Aun no hay reportes con GPS para este servicio.</Text>
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
              compact
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4 rounded-xl border border-servi-borde bg-servi-superficie p-4">
      <Text className="mb-3 text-sm font-semibold text-sky-400">{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-xs text-servi-suave">{label}</Text>
      <Text className="text-base text-servi-texto">{value}</Text>
    </View>
  );
}
