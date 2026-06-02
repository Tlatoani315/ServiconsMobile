import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationDisplay } from '../../../components/LocationDisplay';
import { PermissionsPanel } from '../../../components/PermissionsPanel';
import { ReportMapView } from '../../../components/ReportMapView';
import { useAuth } from '../../../hooks/useAuth';
import { useBitacora, type BitacoraDetalle } from '../../../hooks/useBitacora';
import { useLocation } from '../../../hooks/useLocation';
import { startRoute } from '../../../services/n8nService';

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Listo para iniciar',
  activo: 'En curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export default function CustodyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { getBitacoraDetalle, iniciarCustodia } = useBitacora();
  const { getCurrentLocation } = useLocation();
  const [bitacora, setBitacora] = useState<BitacoraDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (id) {
      getBitacoraDetalle(id).then((data) => {
        setBitacora(data);
        setLoading(false);
      });
    }
  }, [id, getBitacoraDetalle]);

  useEffect(() => {
    getCurrentLocation()
      .then(({ latitude, longitude }) => setStartCoords({ lat: latitude, lng: longitude }))
      .catch(() => setStartCoords(null));
  }, [getCurrentLocation]);

  const iniciar = async () => {
    if (!id || !session?.user?.id || !bitacora) return;

    const remoteJid = bitacora.formulario?.whatsappGrupo?.remoteJid;
    if (!remoteJid) {
      Alert.alert(
        'Falta grupo WhatsApp',
        'Esta bitacora no tiene grupo de WhatsApp. Crea una nueva bitacora y selecciona el grupo en el paso 1.',
      );
      return;
    }

    setStarting(true);

    try {
      const { latitude, longitude } = await getCurrentLocation();
      setStartCoords({ lat: latitude, lng: longitude });

      const ok = await iniciarCustodia(id, session.user.id);
      if (!ok) {
        Alert.alert('Error', 'No se pudo activar la bitacora en Supabase.');
        return;
      }

      const n8nResult = await startRoute({
        bitacora_id: id,
        custodio_id: session.user.id,
        empresa: bitacora.empresa_contratante ?? bitacora.formulario?.empresaContratante ?? '',
        remoteJid,
        timestamp_inicio: new Date().toISOString(),
        ubicacion_inicio: { lat: latitude, lng: longitude },
      });

      if (n8nResult.success) {
        Alert.alert(
          'Servicio iniciado',
          `Ruta activa. WhatsApp: ${bitacora.formulario?.whatsappGrupo?.pushName ?? 'grupo cliente'}`,
        );
      } else {
        Alert.alert(
          'Servicio iniciado (sin WhatsApp)',
          `La ruta quedo activa en Supabase, pero n8n respondio: ${n8nResult.error ?? 'error desconocido'}. Revisa la consola [n8n/start-route].`,
        );
      }

      router.replace({ pathname: '/(app)/custody/active', params: { id } });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar el servicio.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-servi-fondo">
        <ActivityIndicator color="#F97316" size="large" />
        <Text className="mt-3 text-servi-suave">Cargando servicio...</Text>
      </View>
    );
  }

  const whatsapp = bitacora?.formulario?.whatsappGrupo;

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Pressable className="py-4" onPress={() => router.back()}>
          <Text className="text-servi-acento">← Volver</Text>
        </Pressable>

        <View className="mb-4 overflow-hidden rounded-3xl border border-servi-borde bg-servi-superficie">
          <View className="bg-servi-primario/20 px-5 py-4">
            <Text className="text-xs uppercase text-servi-suave">Pre-arranque</Text>
            <Text className="text-2xl font-bold text-servi-texto">{bitacora?.nombre}</Text>
            <Text className="mt-1 text-sm text-servi-suave">
              {ESTADO_LABEL[bitacora?.estado ?? ''] ?? bitacora?.estado}
            </Text>
          </View>

          <View className="gap-3 p-5">
            <InfoRow icon="map-outline" label="Ruta" value={bitacora?.ruta ?? '—'} />
            <InfoRow icon="bus-outline" label="Unidad" value={bitacora?.unidad ?? '—'} />
            <InfoRow icon="business-outline" label="Empresa" value={bitacora?.empresa_contratante ?? '—'} />
            <InfoRow
              icon="time-outline"
              label="Reportes"
              value={`Cada ${bitacora?.report_interval_minutes ?? 15} min · foto + GPS`}
            />
          </View>
        </View>

        {whatsapp ? (
          <View className="mb-4 flex-row items-center rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
            <Ionicons name="logo-whatsapp" size={28} color="#16A34A" />
            <View className="ml-3 flex-1">
              <Text className="text-xs uppercase text-emerald-700">Notificaciones WhatsApp</Text>
              <Text className="font-semibold text-servi-texto">{whatsapp.pushName}</Text>
            </View>
          </View>
        ) : (
          <View className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <Text className="text-sm text-amber-800">
              Sin grupo WhatsApp en esta bitacora. n8n no podra notificar al cliente.
            </Text>
          </View>
        )}

        <PermissionsPanel compact />

        {startCoords ? (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-servi-texto">Punto de salida</Text>
            <ReportMapView
              points={[{ lat: startCoords.lat, lng: startCoords.lng, label: 'Inicio' }]}
              height={180}
              title="Ubicacion de inicio del servicio"
            />
          </View>
        ) : (
          <LocationDisplay label="Obteniendo GPS de inicio..." />
        )}

        {bitacora?.estado === 'pendiente' ? (
          <Pressable
            className="mt-2 items-center rounded-2xl bg-emerald-600 py-5 shadow-lg active:opacity-90"
            onPress={iniciar}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="play-circle" size={28} color="#FFF" />
                <Text className="mt-1 text-xl font-bold text-white">Iniciar servicio</Text>
                <Text className="text-xs text-emerald-100">Activa ruta + aviso WhatsApp</Text>
              </>
            )}
          </Pressable>
        ) : bitacora?.estado === 'activo' ? (
          <Pressable
            className="items-center rounded-2xl bg-servi-acento py-5 active:opacity-90"
            onPress={() => router.push({ pathname: '/(app)/custody/active', params: { id } })}
          >
            <Text className="text-lg font-bold text-servi-fondo">Continuar servicio en curso</Text>
          </Pressable>
        ) : (
          <Text className="text-center text-servi-suave">Este servicio ya fue cerrado.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={18} color="#64748B" />
      <View className="ml-3">
        <Text className="text-[10px] uppercase text-servi-suave">{label}</Text>
        <Text className="text-base text-servi-texto">{value}</Text>
      </View>
    </View>
  );
}
