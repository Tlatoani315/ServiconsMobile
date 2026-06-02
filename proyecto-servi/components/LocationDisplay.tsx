import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useLocation } from '../hooks/useLocation';
import { GoogleMapsActions } from './GoogleMapsActions';
import { ReportMapView } from './ReportMapView';

type Props = {
  label?: string;
  refreshKey?: number;
  onCoordsChange?: (coords: { lat: number; lng: number } | null) => void;
};

export function LocationDisplay({
  label = 'Tu ubicacion en el mapa',
  refreshKey = 0,
  onCoordsChange,
}: Props) {
  const { getCurrentLocation, permissionGranted } = useLocation();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { latitude, longitude } = await getCurrentLocation();
      const next = { lat: latitude, lng: longitude };
      setCoords(next);
      onCoordsChange?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo obtener GPS');
      setCoords(null);
      onCoordsChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-servi-borde bg-servi-superficie">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View>
          <Text className="text-sm font-semibold text-servi-texto">{label}</Text>
          <Text className="text-xs text-servi-suave">Toca Google Maps para ver la ubicacion real</Text>
        </View>
        <Pressable onPress={refresh} className="rounded-lg border border-servi-borde px-2 py-1 active:opacity-70">
          <Text className="text-xs text-servi-acento">Actualizar</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#F97316" />
          <Text className="mt-2 text-sm text-servi-suave">Obteniendo GPS...</Text>
        </View>
      ) : error ? (
        <View className="px-4 pb-4">
          <Text className="text-sm text-servi-peligro">{error}</Text>
        </View>
      ) : coords ? (
        <>
          <ReportMapView
            points={[{ lat: coords.lat, lng: coords.lng, label: 'Tu posicion' }]}
            height={200}
            showOpenMaps={false}
          />
          <View className="p-3 pt-0">
            <GoogleMapsActions
              lat={coords.lat}
              lng={coords.lng}
              label="Tu posicion GPS"
              coordsLabel="Coordenadas actuales"
              variant="full"
            />
          </View>
        </>
      ) : (
        <View className="px-4 pb-4">
          <Text className="text-sm text-servi-suave">
            {permissionGranted ? 'Obteniendo coordenadas...' : 'Permiso de ubicacion pendiente'}
          </Text>
        </View>
      )}
    </View>
  );
}
