import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CustodyConfirmModal } from '../../components/CustodyConfirmModal';
import { DashboardHeader } from '../../components/DashboardShell';
import { LivePulseBanner } from '../../components/LivePulseBanner';
import { MonitoringKpiStrip } from '../../components/MonitoringKpiStrip';
import { getDashboardTitleForRole } from '../../lib/roles';
import { useAuth } from '../../hooks/useAuth';
import { useBitacora, type BitacoraDetalle } from '../../hooks/useBitacora';
import { createEmptyFormulario, useBitacoraStore } from '../../store/useBitacoraStore';
import type { BitacoraResumen } from '../../types/models';

type Filtro = 'pendiente' | 'activo' | 'completado';

const tabs: { key: Filtro; label: string }[] = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'activo', label: 'Activos' },
  { key: 'completado', label: 'Completados' },
];

/** Pantalla 3 — Home del custodio */
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { filtro: filtroParam } = useLocalSearchParams<{ filtro?: string }>();
  const { getBitacoras, getBitacoraDetalle, loading, error } = useBitacora();
  const [bitacoras, setBitacoras] = useState<BitacoraResumen[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('pendiente');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<BitacoraDetalle | null>(null);

  useEffect(() => {
    if (filtroParam === 'pendiente' || filtroParam === 'activo' || filtroParam === 'completado') {
      setFiltro(filtroParam);
    }
  }, [filtroParam]);

  const loadBitacoras = useCallback(async () => {
    const data = await getBitacoras();
    setBitacoras(data);
  }, [getBitacoras]);

  useFocusEffect(
    useCallback(() => {
      loadBitacoras();
    }, [loadBitacoras]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBitacoras();
    setRefreshing(false);
  }, [loadBitacoras]);

  const filtradas = bitacoras.filter((b) => b.estado === filtro);

  const counts = {
    pendiente: bitacoras.filter((b) => b.estado === 'pendiente').length,
    activo: bitacoras.filter((b) => b.estado === 'activo').length,
    completado: bitacoras.filter((b) => b.estado === 'completado').length,
  };

  const openService = async (item: BitacoraResumen) => {
    if (item.estado === 'activo') {
      router.push({ pathname: '/(app)/custody/active', params: { id: item.id } });
      return;
    }
    if (item.estado === 'completado') {
      router.push({ pathname: '/(app)/custody/details', params: { id: item.id } });
      return;
    }
    const detail = await getBitacoraDetalle(item.id);
    setConfirmData(detail);
    setConfirmId(item.id);
  };

  const iniciarCustodia = () => {
    if (!confirmId) return;
    setConfirmId(null);
    router.push({ pathname: '/(app)/custody/permissions', params: { id: confirmId } });
  };

  return (
    <View className="flex-1 bg-servi-fondo">
      <DashboardHeader title={getDashboardTitleForRole(profile?.role)} role={profile?.role} />

      <View className="px-4">
        <LivePulseBanner
          count={counts.activo}
          label="custodias activas — reportes GPS en mapa"
          tone="emerald"
        />

        <MonitoringKpiStrip
          items={[
            { label: 'Pendientes', value: counts.pendiente, icon: 'time-outline', tone: 'info' },
            { label: 'En vivo', value: counts.activo, icon: 'radio', tone: counts.activo > 0 ? 'live' : 'neutral' },
            { label: 'Completados', value: counts.completado, icon: 'checkmark-done', tone: 'neutral' },
            { label: 'Total', value: bitacoras.length, icon: 'layers-outline', tone: 'neutral' },
          ]}
        />
      </View>

      <View className="mx-4 mb-2 flex-row gap-2">
        {tabs.map((tab) => {
          const count = bitacoras.filter((b) => b.estado === tab.key).length;
          return (
            <Pressable
              key={tab.key}
              className={`flex-1 items-center rounded-2xl border py-3 ${
                filtro === tab.key
                  ? 'border-emerald-500 bg-emerald-500/15'
                  : 'border-servi-borde bg-servi-superficie'
              }`}
              onPress={() => setFiltro(tab.key)}
            >
              <Text
                className={`text-2xl font-bold ${
                  filtro === tab.key ? 'text-emerald-400' : 'text-servi-texto'
                }`}
              >
                {count}
              </Text>
              <Text
                className={`text-[10px] font-semibold uppercase ${
                  filtro === tab.key ? 'text-emerald-400' : 'text-servi-suave'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator className="mt-8" color="#22C55E" />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
          }
        >
          {error ? <Text className="mb-4 text-servi-peligro">{error}</Text> : null}

          <View className="mb-2 flex-row border-b border-servi-borde pb-2">
            <Text className="flex-1 text-xs font-bold uppercase text-emerald-400">Unidad</Text>
            <Text className="flex-[2] text-xs font-bold uppercase text-emerald-400">Ruta</Text>
            <Text className="w-16 text-right text-xs font-bold uppercase text-emerald-400">Estado</Text>
          </View>

          {filtradas.length === 0 ? (
            <View className="mt-8 rounded-xl border border-dashed border-servi-borde p-6">
              <Text className="text-center text-servi-suave">
                No hay servicios {tabs.find((t) => t.key === filtro)?.label.toLowerCase()}.{'\n'}
                Toca + para crear uno.
              </Text>
            </View>
          ) : (
            filtradas.map((b) => (
              <Pressable
                key={b.id}
                className="flex-row items-center border-b border-servi-borde/50 py-4 active:bg-servi-superficie/50"
                onPress={() => openService(b)}
              >
                <Text className="flex-1 font-semibold text-servi-texto">{b.unidad ?? '—'}</Text>
                <Text className="flex-[2] text-sm text-servi-suave" numberOfLines={2}>
                  {b.ruta ?? b.nombre ?? '—'}
                </Text>
                <Text className="w-16 text-right text-[10px] font-bold uppercase text-servi-acento">
                  {b.estado === 'pendiente' ? 'Nuevo' : b.estado === 'activo' ? 'Vivo' : 'Fin'}
                </Text>
              </Pressable>
            ))
          )}

          {filtro === 'pendiente' && filtradas.length > 0 ? (
            <Text className="mt-4 text-center text-xs text-servi-suave">
              Toca una fila → confirmar → permisos → monitoreo en mapa
            </Text>
          ) : null}
        </ScrollView>
      )}

      <Pressable
        className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 active:opacity-90"
        onPress={() => {
          useBitacoraStore.setState({ formulario: createEmptyFormulario() });
          router.push('/(app)/bitacora/wizard/step1');
        }}
      >
        <Text className="text-3xl font-bold text-white">+</Text>
      </Pressable>

      <CustodyConfirmModal
        visible={Boolean(confirmId)}
        bitacora={confirmData}
        onCancel={() => setConfirmId(null)}
        onConfirm={iniciarCustodia}
      />
    </View>
  );
}
