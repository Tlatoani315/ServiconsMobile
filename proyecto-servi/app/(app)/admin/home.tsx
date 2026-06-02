import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

import { AdminPreviewCard } from '../../../components/AdminPreviewCard';
import { DashboardShell } from '../../../components/DashboardShell';
import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from '../../../services/adminService';

export default function AdminHomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data, error: statsError } = await getAdminDashboardStats();
    setStats(data);
    setError(statsError);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <DashboardShell title="Panel admin">
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
              icon="document-text-outline"
              title="Bitacoras"
              metric={String(stats.bitacoras.activas)}
              metricLabel="servicios activos"
              previewLines={[
                `${stats.bitacoras.pendientes} pendientes · ${stats.bitacoras.completadas} completadas`,
                `${stats.bitacoras.total} bitacoras en total`,
              ]}
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
            />

            <AdminPreviewCard
              icon="bar-chart-outline"
              title="Reportes"
              metric={String(stats.bitacoras.completadas)}
              metricLabel="servicios cerrados"
              previewLines={[
                `${stats.bitacoras.total} servicios registrados en el sistema`,
                'Modulo de reportes detallados proximamente',
              ]}
              accent="muted"
            />
          </>
        ) : null}
      </ScrollView>
    </DashboardShell>
  );
}
