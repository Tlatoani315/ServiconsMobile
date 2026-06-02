import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ReportMapView } from '../../../components/ReportMapView';
import { DashboardShell } from '../../../components/DashboardShell';
import { listAdminReports, type AdminReportRow } from '../../../services/adminService';

export default function AdminReportesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: listError } = await listAdminReports();
    setItems(data);
    setError(listError);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalEvidencias = items.reduce((sum, item) => sum + item.evidencias_count, 0);

  return (
    <DashboardShell title="Reportes">
      <View className="mb-4 rounded-2xl border border-servi-borde bg-servi-superficie p-4">
        <Text className="text-3xl font-bold text-servi-texto">{items.length}</Text>
        <Text className="text-sm text-servi-suave">servicios completados</Text>
        <Text className="mt-2 text-sm text-servi-acento">
          {totalEvidencias} reportes con mapa y GPS
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#F97316" />
      ) : error ? (
        <Text className="text-servi-peligro">{error}</Text>
      ) : items.length === 0 ? (
        <Text className="text-servi-suave">
          Aun no hay servicios completados. Cuando un custodio cierre una custodia, veras aqui el
          mapa de cada reporte.
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#F97316" />}
        >
          {items.map((item) => (
            <Pressable
              key={item.id}
              className="mb-4 overflow-hidden rounded-2xl border border-servi-borde bg-servi-superficie active:opacity-90"
              onPress={() => router.push(`/(app)/admin/reporte/${item.id}`)}
            >
              <View className="px-4 py-3">
                <Text className="text-base font-semibold text-servi-texto">
                  {item.nombre ?? 'Sin nombre'}
                </Text>
                <Text className="mt-1 text-sm text-servi-suave">{item.ruta ?? '—'}</Text>
                <Text className="mt-1 text-xs text-servi-suave">
                  {item.custodio_nombre ?? 'Custodio'} · {item.empresa_contratante ?? '—'}
                </Text>
              </View>

              {item.last_lat != null && item.last_lng != null ? (
                <ReportMapView
                  points={[{ id: item.id, lat: item.last_lat, lng: item.last_lng }]}
                  height={130}
                  interactive={false}
                  title="Ultimo punto GPS"
                />
              ) : (
                <View className="items-center border-t border-dashed border-servi-borde py-6">
                  <Text className="text-sm text-servi-suave">Sin mapa — no hubo reportes GPS</Text>
                </View>
              )}

              <View className="flex-row items-center justify-between border-t border-servi-borde px-4 py-2">
                <Text className="text-xs text-servi-acento">{item.evidencias_count} reportes</Text>
                <Text className="text-xs text-servi-suave">Toca para ver detalle visual</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Pressable className="mt-2 py-2" onPress={() => router.back()}>
        <Text className="text-center text-servi-acento">Volver al panel</Text>
      </Pressable>
    </DashboardShell>
  );
}
