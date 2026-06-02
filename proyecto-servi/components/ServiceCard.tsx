import { Pressable, Text, View } from 'react-native';

import type { BitacoraResumen } from '../types/models';

const estadoStyles: Record<string, { bg: string; label: string }> = {
  pendiente: { bg: 'bg-servi-pendiente', label: 'Pendiente' },
  activo: { bg: 'bg-servi-exito', label: 'Activo' },
  completado: { bg: 'bg-servi-completado', label: 'Completado' },
  cancelado: { bg: 'bg-servi-peligro', label: 'Cancelado' },
};

type Props = {
  bitacora: BitacoraResumen;
  onPress: () => void;
};

export function ServiceCard({ bitacora, onPress }: Props) {
  const badge = estadoStyles[bitacora.estado] ?? estadoStyles.pendiente;

  return (
    <Pressable
      className="mb-3 rounded-xl border border-servi-borde bg-servi-superficie p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="flex-1 text-lg font-semibold text-servi-texto">
          {bitacora.nombre ?? 'Sin nombre'}
        </Text>
        <View className={`rounded-full px-3 py-1 ${badge.bg}`}>
          <Text className="text-xs font-medium text-servi-texto">{badge.label}</Text>
        </View>
      </View>
      <Text className="text-sm text-servi-suave">{bitacora.ruta ?? '—'}</Text>
      <Text className="mt-1 text-sm text-servi-suave">
        Unidad: {bitacora.unidad ?? '—'} · {bitacora.empresa_contratante ?? '—'}
      </Text>
    </Pressable>
  );
}
