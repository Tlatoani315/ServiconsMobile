import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignaturePad } from '../../../components/SignaturePad';
import { useAuth } from '../../../hooks/useAuth';
import { useBitacora } from '../../../hooks/useBitacora';
import * as n8nService from '../../../services/n8nService';

export default function CustodyFinishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { cerrarCustodia } = useBitacora();
  const [firmaOperador, setFirmaOperador] = useState('');
  const [firmaCustodio, setFirmaCustodio] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmar = async () => {
    if (!id || !session?.user?.id) return;

    if (!firmaOperador || !firmaCustodio) {
      Alert.alert('Firmas requeridas', 'Captura la firma del operador y del custodio.');
      return;
    }

    setLoading(true);
    const ok = await cerrarCustodia(
      id,
      session.user.id,
      JSON.stringify({ data: firmaOperador }),
      JSON.stringify({ data: firmaCustodio }),
    );
    setLoading(false);

    if (!ok) {
      Alert.alert('Error', 'No se pudo cerrar el servicio.');
      return;
    }

    await n8nService.finishRoute({
      bitacora_id: id,
      custodio_id: session.user.id,
      timestamp: new Date().toISOString(),
    });

    Alert.alert('Servicio completado', 'La bitácora fue cerrada.', [
      { text: 'OK', onPress: () => router.replace('/(app)/home') },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <ScrollView className="flex-1 px-4">
        <Pressable className="py-4" onPress={() => router.back()}>
          <Text className="text-servi-acento">← Volver</Text>
        </Pressable>

        <Text className="mb-6 text-2xl font-bold text-servi-texto">Cierre de servicio</Text>

        <SignaturePad label="Firma del operador" value={firmaOperador} onCapture={setFirmaOperador} />
        <SignaturePad label="Firma del custodio" value={firmaCustodio} onCapture={setFirmaCustodio} />

        <Pressable
          className="mb-8 mt-4 items-center rounded-xl bg-servi-exito py-4 active:opacity-90"
          onPress={confirmar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="font-semibold text-servi-texto">Confirmar cierre</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
