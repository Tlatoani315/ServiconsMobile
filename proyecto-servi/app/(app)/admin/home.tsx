import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { AdminPreviewCard } from '../../../components/AdminPreviewCard';
import { DashboardShell } from '../../../components/DashboardShell';
import { MonitoringKpiStrip } from '../../../components/MonitoringKpiStrip';
import { ReportMapView } from '../../../components/ReportMapView';
import { useAuth } from '../../../hooks/useAuth';
import {
  getAdminDashboardStats,
  listAdminActiveServices,
  type AdminActiveServiceRow,
  type AdminDashboardStats,
} from '../../../services/adminService';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activos, setActivos] = useState<AdminActiveServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [statsRes, activosRes] = await Promise.all([
      getAdminDashboardStats(),
      listAdminActiveServices(),
    ]);
    setStats(statsRes.data);
    setActivos(activosRes.data);
    setError(statsRes.error ?? activosRes.error);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <DashboardShell role={profile?.role}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor="#F97316" />}
      >
        {loading && !stats ? (
          <ActivityIndicator className="mt-8" color="#F97316" />
        ) : error ? (
          <Text className="mt-4 text-center text-sm text-servi-peligro">{error}</Text>
        ) : stats ? (
          <>
            <MonitoringKpiStrip
              items={[
                {
                  label: 'En vivo',
                  value: stats.bitacoras.activas,
                  icon: 'radio',
                  tone: stats.bitacoras.activas > 0 ? 'live' : 'neutral',
                },
                {
                  label: 'SOS activas',
                  value: stats.sos.activas,
                  icon: 'warning',
                  tone: stats.sos.activas > 0 ? 'warn' : 'neutral',
                },
                {
                  label: 'Pendientes',
                  value: stats.bitacoras.pendientes,
                  icon: 'time-outline',
                  tone: 'info',
                },
                {
                  label: 'Completadas',
                  value: stats.bitacoras.completadas,
                  icon: 'checkmark-done',
                  tone: 'neutral',
                },
              ]}
            />

            {(() => {
              const withGps = activos.filter((a) => a.last_lat != null && a.last_lng != null);
              if (withGps.length === 0) return null;
              return (
                <Pressable
                  className="mb-4 overflow-hidden rounded-2xl border border-emerald-500/30 active:opacity-95"
                  onPress={() => router.push('/(app)/admin/activos')}
                >
                  <ReportMapView
                    title={`Flota en mapa · ${withGps.length} unidades con GPS`}
                    height={200}
                    interactive={false}
                    points={withGps.map((item) => ({
                      id: item.id,
                      lat: item.last_lat!,
                      lng: item.last_lng!,
                      label: item.unidad ?? item.nombre ?? 'Unidad',
                    }))}
                  />
                  <View className="bg-emerald-900/40 px-4 py-2">
                    <Text className="text-center text-xs font-semibold text-emerald-300">
                      Toca para ver monitoreo en vivo completo →
                    </Text>
                  </View>
                </Pressable>
              );
            })()}

            <AdminPreviewCard
              icon="people-outline"
              title="Gestion de usuarios"
              metric={String(stats.users.total)}
              metricLabel="cuentas registradas"
              previewLines={[
                `${stats.users.custodios} custodios · ${stats.users.clientes} clientes`,
                `${stats.users.jefes} jefes de custodia en el sistema`,
              ]}
              onPress={() => router.push('/(app)/admin/users')}
            />

            <AdminPreviewCard
              icon="radio-outline"
              title="En vivo"
              metric={String(stats.bitacoras.activas)}
              metricLabel="servicios activos ahora"
              previewLines={[
                'Mapa con ultima ubicacion GPS de cada custodio',
                'Se actualiza con cada reporte del servicio',
              ]}
              accent={stats.bitacoras.activas > 0 ? 'warning' : 'default'}
              onPress={() => router.push('/(app)/admin/activos')}
            />

            <AdminPreviewCard
              icon="document-text-outline"
              title="Bitacoras"
              metric={String(stats.bitacoras.total)}
              metricLabel="registradas en total"
              previewLines={[
                `${stats.bitacoras.pendientes} pendientes · ${stats.bitacoras.completadas} completadas`,
                'Lista completa con filtros por estado',
              ]}
              onPress={() => router.push('/(app)/admin/bitacoras')}
            />

            <AdminPreviewCard
              icon="warning-outline"
              title="Alertas SOS"
              metric={String(stats.sos.activas)}
              metricLabel="alertas activas"
              previewLines={[
                stats.sos.activas > 0
                  ? 'Hay emergencias que requieren atencion'
                  : 'Sin emergencias activas en este momento',
              ]}
              accent={stats.sos.activas > 0 ? 'warning' : 'default'}
              onPress={() => router.push('/(app)/admin/sos')}
            />

            <AdminPreviewCard
              icon="bar-chart-outline"
              title="Reportes"
              metric={String(stats.bitacoras.completadas)}
              metricLabel="servicios cerrados"
              previewLines={[
                `${stats.bitacoras.total} servicios registrados en el sistema`,
                'Ver evidencias con GPS por servicio completado',
              ]}
              onPress={() => router.push('/(app)/admin/reportes')}
            />
          </>
        ) : null}
      </ScrollView>
    </DashboardShell>
  );
}
