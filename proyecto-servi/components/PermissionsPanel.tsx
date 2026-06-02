import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { usePermissions, type PermissionStatus } from '../hooks/usePermissions';

type Props = {
  compact?: boolean;
};

export function PermissionsPanel({ compact = false }: Props) {
  const {
    camera,
    location,
    checking,
    allGranted,
    requestCamera,
    requestLocation,
    openAppSettings,
  } = usePermissions();

  if (checking) {
    return (
      <View className="mb-4 items-center rounded-2xl border border-servi-borde bg-servi-superficie py-4">
        <ActivityIndicator color="#F97316" />
        <Text className="mt-2 text-xs text-servi-suave">Verificando permisos...</Text>
      </View>
    );
  }

  if (allGranted) {
    return compact ? null : (
      <View className="mb-4 flex-row items-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
        <Ionicons name="shield-checkmark" size={22} color="#22C55E" />
        <Text className="ml-2 flex-1 text-sm text-emerald-200">
          Camara y GPS listos para monitoreo
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/10">
      <View className="border-b border-amber-500/20 px-4 py-3">
        <Text className="font-semibold text-amber-100">Permisos requeridos</Text>
        <Text className="text-xs text-amber-200/80">
          Activa camara y ubicacion para reportes y mapa en vivo
        </Text>
      </View>
      <PermissionRow
        icon="camera"
        label="Camara"
        detail="Evidencias fotograficas"
        status={camera}
        onPress={requestCamera}
      />
      <PermissionRow
        icon="location"
        label="Ubicacion"
        detail="GPS en mapa y reportes"
        status={location}
        onPress={requestLocation}
      />
      {(camera === 'denied' || location === 'denied') && (
        <Pressable className="border-t border-amber-500/20 px-4 py-3 active:opacity-80" onPress={openAppSettings}>
          <Text className="text-center text-sm font-semibold text-amber-300">Abrir ajustes del telefono</Text>
        </Pressable>
      )}
    </View>
  );
}

function PermissionRow({
  icon,
  label,
  detail,
  status,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  status: PermissionStatus;
  onPress: () => void;
}) {
  const ok = status === 'granted';

  return (
    <Pressable
      className="flex-row items-center border-t border-amber-500/10 px-4 py-3 active:opacity-80"
      onPress={ok ? undefined : onPress}
      disabled={ok}
    >
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
          ok ? 'bg-emerald-600' : 'bg-amber-600'
        }`}
      >
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-servi-texto">{label}</Text>
        <Text className="text-xs text-servi-suave">{detail}</Text>
      </View>
      {ok ? (
        <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
      ) : (
        <View className="rounded-lg bg-servi-acento px-3 py-1.5">
          <Text className="text-xs font-bold text-servi-fondo">Activar</Text>
        </View>
      )}
    </Pressable>
  );
}
