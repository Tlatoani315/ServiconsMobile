import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  formatCoords,
  openGoogleMapsNavigate,
  openGoogleMapsRoute,
  openGoogleMapsView,
  type GeoPoint,
} from '../lib/geo';

type Props = {
  lat: number;
  lng: number;
  label?: string;
  /** Puntos extra para boton "Ver recorrido completo" */
  routePoints?: GeoPoint[];
  variant?: 'full' | 'compact' | 'inline';
  showNavigate?: boolean;
  showRoute?: boolean;
  coordsLabel?: string;
};

export function GoogleMapsActions({
  lat,
  lng,
  label,
  routePoints,
  variant = 'full',
  showNavigate = true,
  showRoute,
  coordsLabel = 'Coordenadas GPS',
}: Props) {
  const hasRoute = (showRoute ?? (routePoints?.length ?? 0) > 1) && (routePoints?.length ?? 0) > 1;
  const placeLabel = label ?? 'Ubicacion';

  if (variant === 'inline') {
    return (
      <Pressable
        className="flex-row items-center gap-2 rounded-xl bg-[#4285F4] px-4 py-2.5 active:opacity-90"
        onPress={() => openGoogleMapsView(lat, lng, placeLabel)}
      >
        <Ionicons name="logo-google" size={18} color="#FFF" />
        <Text className="text-sm font-bold text-white">Google Maps</Text>
      </Pressable>
    );
  }

  if (variant === 'compact') {
    return (
      <View className="gap-2">
        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-xl bg-[#4285F4] py-3 active:opacity-90"
          onPress={() => openGoogleMapsView(lat, lng, placeLabel)}
        >
          <Ionicons name="logo-google" size={20} color="#FFF" />
          <Text className="text-sm font-bold text-white">Abrir en Google Maps</Text>
        </Pressable>
        {showNavigate ? (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl border border-servi-borde bg-servi-fondo py-2.5 active:opacity-90"
            onPress={() => openGoogleMapsNavigate(lat, lng)}
          >
            <Ionicons name="navigate" size={18} color="#F97316" />
            <Text className="text-sm font-semibold text-servi-texto">Navegar hasta aqui</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-[#4285F4]/30 bg-[#4285F4]/5">
      <View className="border-b border-[#4285F4]/20 px-4 py-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#4285F4]">
            <Ionicons name="location" size={20} color="#FFF" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase text-servi-suave">{coordsLabel}</Text>
            <Text className="font-mono text-base font-semibold text-servi-texto">
              {formatCoords(lat, lng)}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-2 p-3">
        <Pressable
          className="flex-row items-center justify-center gap-2.5 rounded-xl bg-[#4285F4] py-4 active:opacity-90"
          onPress={() => openGoogleMapsView(lat, lng, placeLabel)}
        >
          <Ionicons name="logo-google" size={22} color="#FFF" />
          <Text className="text-base font-bold text-white">Ver en Google Maps</Text>
          <Ionicons name="open-outline" size={18} color="#FFF" />
        </Pressable>

        {showNavigate ? (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 active:opacity-90"
            onPress={() => openGoogleMapsNavigate(lat, lng)}
          >
            <Ionicons name="navigate-circle" size={20} color="#22C55E" />
            <Text className="text-sm font-bold text-emerald-400">Iniciar navegacion</Text>
          </Pressable>
        ) : null}

        {hasRoute && routePoints ? (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 py-3 active:opacity-90"
            onPress={() => openGoogleMapsRoute(routePoints)}
          >
            <Ionicons name="git-network-outline" size={20} color="#F97316" />
            <Text className="text-sm font-bold text-orange-400">
              Ver recorrido completo ({routePoints.length} puntos)
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
