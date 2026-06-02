import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { DashboardShell } from '../../../components/DashboardShell';
import { ServiceCard } from '../../../components/ServiceCard';
import { useBitacora } from '../../../hooks/useBitacora';
import type { BitacoraResumen } from '../../../types/models';

export default function ClienteHomeScreen() {
  const { getBitacoras, loading, error } = useBitacora();
  const [bitacoras, setBitacoras] = useState<BitacoraResumen[]>([]);

  useFocusEffect(
    useCallback(() => {
      getBitacoras().then(setBitacoras);
    }, [getBitacoras]),
  );

  return (
    <DashboardShell title="Mis bitacoras">
      {loading ? (
        <ActivityIndicator color="#F97316" />
      ) : error ? (
        <Text className="text-servi-peligro">{error}</Text>
      ) : bitacoras.length === 0 ? (
        <View className="mt-4 rounded-xl border border-dashed border-servi-borde p-6">
          <Text className="text-center text-servi-suave">
            No hay servicios registrados para tu cuenta todavia.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {bitacoras.map((b) => (
            <ServiceCard key={b.id} bitacora={b} onPress={() => {}} />
          ))}
        </ScrollView>
      )}
    </DashboardShell>
  );
}
