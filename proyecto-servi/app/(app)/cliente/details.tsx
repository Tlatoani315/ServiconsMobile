import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBitacora } from '../../../hooks/useBitacora';
import type { BitacoraResumen } from '../../../types/models';

export default function ClienteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getBitacoraById } = useBitacora();
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-servi-fondo">
        <ActivityIndicator color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <View className="flex-1 px-4">
        <Pressable className="py-4" onPress={() => router.back()}>
          <Text className="text-servi-acento">Volver</Text>
        </Pressable>

        <Text className="mb-4 text-2xl font-bold text-servi-texto">
          {bitacora?.nombre ?? 'Bitacora'}
        </Text>

        <View className="rounded-xl border border-servi-borde bg-servi-superficie p-4">
          <Row label="Estado" value={bitacora?.estado ?? '—'} />
          <Row label="Ruta" value={bitacora?.ruta ?? '—'} />
          <Row label="Unidad" value={bitacora?.unidad ?? '—'} />
          <Row label="Empresa" value={bitacora?.empresa_contratante ?? '—'} />
        </View>
      </View>
    </SafeAreaView>
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
