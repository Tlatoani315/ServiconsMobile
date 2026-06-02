import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DashboardShell } from '../../../components/DashboardShell';
import { LivePulseBanner } from '../../../components/LivePulseBanner';
import { MonitoringKpiStrip } from '../../../components/MonitoringKpiStrip';
import { ServiceCard } from '../../../components/ServiceCard';
import { useAuth } from '../../../hooks/useAuth';
import { useBitacora } from '../../../hooks/useBitacora';
import type { BitacoraResumen } from '../../../types/models';

type Tab = 'activo' | 'completado';

/** Pantalla II — Portal del cliente */
export default function ClienteHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { getClienteBitacoras, loading, error } = useBitacora();
  const [bitacoras, setBitacoras] = useState<BitacoraResumen[]>([]);
  const [tab, setTab] = useState<Tab>('activo');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getClienteBitacoras();
    setBitacoras(data);
  }, [getClienteBitacoras]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = bitacoras.filter((b) =>
    tab === 'activo' ? b.estado === 'activo' || b.estado === 'pendiente' : b.estado === 'completado',
  );

  const enTransito = bitacoras.filter((b) => b.estado === 'activo' || b.estado === 'pendiente').length;
  const enVivo = bitacoras.filter((b) => b.estado === 'activo').length;
  const historial = bitacoras.filter((b) => b.estado === 'completado').length;

  return (
    <DashboardShell role="cliente">
      <LivePulseBanner
        count={enVivo}
        label="custodias activas de tu empresa — mapa y evidencias en tiempo real"
        tone="sky"
      />

      <MonitoringKpiStrip
        items={[
          { label: 'En transito', value: enTransito, icon: 'car-outline', tone: 'info' },
          { label: 'En vivo', value: enVivo, icon: 'radio', tone: enVivo > 0 ? 'live' : 'neutral' },
          { label: 'Historial', value: historial, icon: 'archive-outline', tone: 'neutral' },
          { label: 'Total', value: bitacoras.length, icon: 'layers-outline', tone: 'neutral' },
        ]}
      />

      <View className="mb-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <Text className="text-xs uppercase text-sky-300">Empresa</Text>
        <Text className="text-lg font-bold text-servi-texto">{profile?.empresa ?? 'Sin empresa'}</Text>
        <Text className="mt-1 text-xs text-servi-suave">
          Solo ves servicios de tu empresa — lectura exclusiva
        </Text>
      </View>

      <View className="mb-4 flex-row gap-2">
        {(['activo', 'completado'] as Tab[]).map((key) => (
          <Pressable
            key={key}
            className={`flex-1 items-center rounded-2xl border py-3 ${
              tab === key ? 'border-sky-500 bg-sky-500/15' : 'border-servi-borde bg-servi-superficie'
            }`}
            onPress={() => setTab(key)}
          >
            <Text className={`font-bold ${tab === key ? 'text-sky-400' : 'text-servi-texto'}`}>
              {bitacoras.filter((b) =>
                key === 'activo'
                  ? b.estado === 'activo' || b.estado === 'pendiente'
                  : b.estado === 'completado',
              ).length}
            </Text>
            <Text className="text-[10px] uppercase text-servi-suave">
              {key === 'activo' ? 'En transito' : 'Historial'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#0EA5E9" />
      ) : error ? (
        <Text className="text-servi-peligro">{error}</Text>
      ) : filtered.length === 0 ? (
        <View className="mt-4 rounded-xl border border-dashed border-servi-borde p-6">
          <Text className="text-center text-servi-suave">
            {tab === 'activo'
              ? 'No hay servicios activos de tu empresa ahora.'
              : 'Aun no hay servicios completados en tu historial.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor="#0EA5E9"
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {filtered.map((b) => (
            <ServiceCard
              key={b.id}
              bitacora={b}
              onPress={() => router.push(`/(app)/cliente/details?id=${b.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </DashboardShell>
  );
}
