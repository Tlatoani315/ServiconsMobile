import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SOSButton } from '../../../components/SOSButton';
import { TimerBar } from '../../../components/TimerBar';
import { useAuth } from '../../../hooks/useAuth';
import { useBitacora } from '../../../hooks/useBitacora';
import { useEvidencias } from '../../../hooks/useEvidencias';
import { useLocation } from '../../../hooks/useLocation';
import { supabase } from '../../../lib/supabaseClient';
import * as n8nService from '../../../services/n8nService';
import type { BitacoraResumen } from '../../../types/models';

export default function CustodyActiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { getBitacoraById } = useBitacora();
  const { getCurrentLocation } = useLocation();
  const { uploadFoto, saveEvidencia } = useEvidencias();
  const [bitacora, setBitacora] = useState<BitacoraResumen | null>(null);
  const [reporting, setReporting] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (id) getBitacoraById(id).then(setBitacora);
  }, [id, getBitacoraById]);

  const reportarEvidencia = useCallback(async () => {
    if (!id || !userId || reporting) return;

    setReporting(true);

    try {
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        throw new Error('Permiso de cámara denegado');
      }

      const photo = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: false,
      });

      if (photo.canceled || !photo.assets?.[0]?.uri) {
        setReporting(false);
        return;
      }

      const { latitude, longitude } = await getCurrentLocation();
      const urlImagen = await uploadFoto(photo.assets[0].uri, userId, id);

      if (!urlImagen) {
        throw new Error('No se pudo subir la foto a Storage');
      }

      const saved = await saveEvidencia({
        bitacora_id: id,
        custodio_id: userId,
        url_imagen: urlImagen,
        latitud: latitude,
        longitud: longitude,
      });

      if (!saved) throw new Error('No se guardó la evidencia');

      await n8nService.reportEvidence({
        bitacora_id: id,
        custodio_id: userId,
        url_imagen: urlImagen,
        latitud: latitude,
        longitud: longitude,
        timestamp: new Date().toISOString(),
      });

      setTimerKey((k) => k + 1);
      Alert.alert('Reporte enviado', 'Evidencia registrada correctamente.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al reportar');
    } finally {
      setReporting(false);
    }
  }, [id, userId, reporting, getCurrentLocation, uploadFoto, saveEvidencia]);

  const activarSOS = async () => {
    if (!id || !userId) return;

    try {
      const { latitude, longitude } = await getCurrentLocation();

      const { error } = await supabase.from('sos_alerts').insert({
        custodio_id: userId,
        bitacora_id: id,
        latitud: latitude,
        longitud: longitude,
        estado: 'activa',
      });

      if (error) throw error;

      await n8nService.sendSOS({
        custodio_id: userId,
        bitacora_id: id,
        latitud: latitude,
        longitud: longitude,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('SOS enviado', 'La alerta de emergencia fue registrada.');
    } catch (e) {
      Alert.alert('Error SOS', e instanceof Error ? e.message : 'No se pudo enviar SOS');
    }
  };

  const interval = bitacora?.report_interval_minutes ?? 15;

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <ScrollView className="flex-1 px-4">
        <Text className="mb-2 py-4 text-2xl font-bold text-servi-texto">Servicio en curso</Text>
        <Text className="mb-4 text-servi-suave">{bitacora?.nombre}</Text>

        <TimerBar
          intervalMinutes={interval}
          onExpire={reportarEvidencia}
          resetKey={timerKey}
        />

        <Pressable
          className="mb-4 items-center rounded-xl bg-servi-primario py-4 active:opacity-90"
          onPress={reportarEvidencia}
          disabled={reporting}
        >
          {reporting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="font-semibold text-servi-texto">Reportar ahora</Text>
          )}
        </Pressable>

        <SOSButton onConfirm={activarSOS} disabled={reporting} />

        <Pressable
          className="mb-8 items-center rounded-xl border border-servi-borde py-4"
          onPress={() => router.push({ pathname: '/(app)/custody/finish', params: { id } })}
        >
          <Text className="font-semibold text-servi-texto">Terminar servicio</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
