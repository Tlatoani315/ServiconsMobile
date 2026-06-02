import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../../hooks/useAuth';
import { useBitacora } from '../../../hooks/useBitacora';
import type { BitacoraResumen } from '../../../types/models';

export default function CustodyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { getBitacoraById, iniciarCustodia } = useBitacora();
  const [bitacora, setBitacora] = useState<BitacoraResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getBitacoraById(id).then((data) => {
        setBitacora(data);
        setLoading(false);
      });
    }
  }, [id, getBitacoraById]);

  const iniciar = async () => {
    if (!id || !session?.user?.id) return;

    const ok = await iniciarCustodia(id, session.user.id);
    if (!ok) {
      Alert.alert('Error', 'No se pudo iniciar la custodia.');
      return;
    }

    router.replace({ pathname: '/(app)/custody/active', params: { id } });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-servi-fondo">
        <ActivityIndicator color="#F0B429" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo px-4">
      <Pressable className="py-4" onPress={() => router.back()}>
        <Text className="text-servi-acento">← Volver</Text>
      </Pressable>

      <Text className="mb-2 text-2xl font-bold text-servi-texto">{bitacora?.nombre}</Text>
      <Text className="mb-1 text-servi-suave">{bitacora?.ruta}</Text>
      <Text className="mb-1 text-servi-suave">Unidad: {bitacora?.unidad}</Text>
      <Text className="mb-6 text-servi-suave">Estado: {bitacora?.estado}</Text>

      {bitacora?.estado === 'pendiente' ? (
        <Pressable className="rounded-xl bg-servi-exito py-4 active:opacity-90" onPress={iniciar}>
          <Text className="text-center text-lg font-semibold text-servi-texto">Iniciar custodia</Text>
        </Pressable>
      ) : bitacora?.estado === 'activo' ? (
        <Pressable
          className="rounded-xl bg-servi-primario py-4 active:opacity-90"
          onPress={() => router.push({ pathname: '/(app)/custody/active', params: { id } })}
        >
          <Text className="text-center text-lg font-semibold text-servi-texto">Continuar servicio</Text>
        </Pressable>
      ) : (
        <Text className="text-servi-suave">Este servicio ya fue cerrado.</Text>
      )}
    </SafeAreaView>
  );
}
