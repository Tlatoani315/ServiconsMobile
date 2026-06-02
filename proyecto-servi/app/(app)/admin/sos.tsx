import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { DashboardShell } from '../../../components/DashboardShell';
import { GoogleMapsActions } from '../../../components/GoogleMapsActions';
import { ReportMapView } from '../../../components/ReportMapView';
import {
  listAdminSosAlerts,
  updateSosEstado,
  type AdminSosRow,
} from '../../../services/adminService';

const ESTADO_LABEL: Record<AdminSosRow['estado'], string> = {
  activa: 'Activa',
  atendida: 'Atendida',
  falsa_alarma: 'Falsa alarma',
};

export default function AdminSosScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AdminSosRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: listError } = await listAdminSosAlerts();
    setItems(data);
    setError(listError);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const marcarEstado = (alert: AdminSosRow, estado: AdminSosRow['estado']) => {
    Alert.alert('Actualizar alerta', `Marcar como ${ESTADO_LABEL[estado]}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const { error: updateError } = await updateSosEstado(alert.id, estado);
          if (updateError) {
            Alert.alert('Error', updateError);
            return;
          }
          load();
        },
      },
    ]);
  };

  return (
    <DashboardShell title="Alertas SOS">
      {loading ? (
        <ActivityIndicator color="#F97316" />
      ) : error ? (
        <Text className="text-servi-peligro">{error}</Text>
      ) : items.length === 0 ? (
        <Text className="text-servi-suave">No hay alertas SOS registradas.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {items.map((alert) => (
            <View
              key={alert.id}
              className={`mb-3 rounded-xl border p-4 ${
                alert.estado === 'activa'
                  ? 'border-servi-peligro/50 bg-servi-peligro/10'
                  : 'border-servi-borde bg-servi-superficie'
              }`}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-base font-semibold text-servi-texto">
                  {ESTADO_LABEL[alert.estado]}
                </Text>
                <Text className="text-xs text-servi-suave">
                  {new Date(alert.created_at).toLocaleString()}
                </Text>
              </View>
              <ReportMapView
                points={[
                  {
                    id: alert.id,
                    lat: alert.latitud,
                    lng: alert.longitud,
                    label: 'Alerta SOS',
                  },
                ]}
                height={150}
                title="Ubicacion de la emergencia"
                showOpenMaps={false}
              />
              <View className="mt-2 px-1">
                <GoogleMapsActions
                  lat={alert.latitud}
                  lng={alert.longitud}
                  label="Emergencia SOS"
                  coordsLabel="GPS de la alerta"
                  variant="full"
                />
              </View>
              {alert.bitacora_id ? (
                <Text className="mt-1 text-xs text-servi-suave">Bitacora: {alert.bitacora_id}</Text>
              ) : null}

              {alert.estado === 'activa' ? (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    className="flex-1 items-center rounded-lg bg-servi-exito py-2"
                    onPress={() => marcarEstado(alert, 'atendida')}
                  >
                    <Text className="text-xs font-semibold text-servi-texto">Atendida</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 items-center rounded-lg border border-servi-borde py-2"
                    onPress={() => marcarEstado(alert, 'falsa_alarma')}
                  >
                    <Text className="text-xs font-semibold text-servi-suave">Falsa alarma</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable className="mt-2 py-2" onPress={() => router.back()}>
        <Text className="text-center text-servi-acento">Volver al panel</Text>
      </Pressable>
    </DashboardShell>
  );
}
