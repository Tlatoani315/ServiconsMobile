import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { formatCoords, openGoogleMapsView, regionForPoints, type GeoPoint } from '../lib/geo';
import { GoogleMapsActions } from './GoogleMapsActions';

type Props = {
  points: GeoPoint[];
  height?: number;
  showCoords?: boolean;
  showOpenMaps?: boolean;
  title?: string;
  interactive?: boolean;
};

export function ReportMapView({
  points,
  height = 180,
  showCoords = true,
  showOpenMaps = true,
  title,
  interactive = true,
}: Props) {
  const validPoints = useMemo(
    () => points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [points],
  );
  const region = useMemo(() => regionForPoints(validPoints), [validPoints]);
  const primary = validPoints[validPoints.length - 1] ?? validPoints[0];
  const primaryLabel = primary?.label ?? title ?? 'Ubicacion';

  if (validPoints.length === 0) {
    return (
      <View
        className="items-center justify-center rounded-xl border border-dashed border-servi-borde bg-servi-fondo"
        style={{ height }}
      >
        <Text className="text-sm text-servi-suave">Sin ubicacion GPS aun</Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-servi-borde">
      {title ? (
        <View className="border-b border-servi-borde bg-servi-superficie px-3 py-2">
          <Text className="text-xs font-semibold text-servi-texto">{title}</Text>
        </View>
      ) : null}

      <View className="relative">
        <MapView
          style={{ width: '100%', height }}
          region={region}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {validPoints.map((point, index) => (
            <Marker
              key={point.id ?? `${point.lat}-${point.lng}-${index}`}
              coordinate={{ latitude: point.lat, longitude: point.lng }}
              title={point.label ?? `Punto ${index + 1}`}
              pinColor={index === validPoints.length - 1 ? '#F97316' : '#1B7A4E'}
            />
          ))}

          {validPoints.length > 1 ? (
            <Polyline
              coordinates={validPoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor="#F97316"
              strokeWidth={3}
            />
          ) : null}
        </MapView>

        {showOpenMaps && primary ? (
          <Pressable
            className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full bg-[#4285F4] px-3 py-2 shadow-lg active:opacity-90"
            onPress={() => openGoogleMapsView(primary.lat, primary.lng, primaryLabel)}
          >
            <Ionicons name="logo-google" size={16} color="#FFF" />
            <Text className="text-xs font-bold text-white">Google Maps</Text>
          </Pressable>
        ) : null}
      </View>

      {showCoords && primary ? (
        <View className="border-t border-servi-borde bg-servi-superficie px-3 py-2">
          <Text className="text-[10px] uppercase text-servi-suave">Ultima coordenada</Text>
          <Text className="font-mono text-xs text-servi-texto">
            {formatCoords(primary.lat, primary.lng)}
          </Text>
        </View>
      ) : null}

      {showOpenMaps && primary ? (
        <View className="border-t border-servi-borde p-3">
          <GoogleMapsActions
            lat={primary.lat}
            lng={primary.lng}
            label={primaryLabel}
            routePoints={validPoints.length > 1 ? validPoints : undefined}
            variant="compact"
            showRoute={validPoints.length > 1}
          />
        </View>
      ) : null}
    </View>
  );
}
