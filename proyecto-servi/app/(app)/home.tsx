import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { DashboardHeader } from '../../components/DashboardShell';
import { ServiceCard } from '../../components/ServiceCard';
import { canCreateBitacora } from '../../lib/roles';
import { useAuth } from '../../hooks/useAuth';
import { useBitacora } from '../../hooks/useBitacora';
import { createEmptyFormulario, useBitacoraStore } from '../../store/useBitacoraStore';
import type { BitacoraResumen } from '../../types/models';

type Filtro = 'pendiente' | 'activo' | 'completado' | 'todos';

const tabs: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'activo', label: 'Activas' },
  { key: 'completado', label: 'Completadas' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { getBitacoras, loading, error } = useBitacora();
  const [bitacoras, setBitacoras] = useState<BitacoraResumen[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useFocusEffect(
    useCallback(() => {
      getBitacoras().then(setBitacoras);
    }, [getBitacoras]),
  );

  const filtradas =
    filtro === 'todos' ? bitacoras : bitacoras.filter((b) => b.estado === filtro);

  const showFab = canCreateBitacora(profile?.role);

  return (
    <View className="flex-1 bg-servi-fondo">
      <DashboardHeader title="Mis servicios" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            className={`ml-3 rounded-full px-4 py-2 ${
              filtro === tab.key ? 'bg-servi-acento' : 'border border-servi-borde bg-servi-superficie'
            }`}
            onPress={() => setFiltro(tab.key)}
          >
            <Text
              className={`text-sm font-medium ${
                filtro === tab.key ? 'text-servi-fondo' : 'text-servi-suave'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator className="mt-8" color="#F97316" />
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
          {error ? <Text className="mb-4 text-servi-peligro">{error}</Text> : null}
          {filtradas.length === 0 ? (
            <View className="mt-8 rounded-xl border border-dashed border-servi-borde p-6">
              <Text className="text-center text-servi-suave">
                Aun no tienes bitacoras.{'\n'}
                {showFab ? 'Toca + para crear tu primer servicio.' : ''}
              </Text>
            </View>
          ) : (
            filtradas.map((b) => (
              <ServiceCard
                key={b.id}
                bitacora={b}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/custody/details',
                    params: { id: b.id },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}

      {showFab ? (
        <Pressable
          className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-servi-acento active:opacity-90"
          onPress={() => {
            useBitacoraStore.setState({ formulario: createEmptyFormulario() });
            router.push('/(app)/bitacora/wizard/step1');
          }}
        >
          <Text className="text-3xl font-bold text-servi-fondo">+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
