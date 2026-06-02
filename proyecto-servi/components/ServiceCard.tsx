import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { BitacoraResumen } from '../types/models';

const estadoConfig: Record<
  string,
  { bg: string; borderColor: string; label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pendiente: {
    bg: 'bg-slate-600',
    borderColor: '#94A3B8',
    label: 'Pendiente',
    icon: 'time-outline',
  },
  activo: {
    bg: 'bg-emerald-600',
    borderColor: '#34D399',
    label: 'En curso',
    icon: 'radio-outline',
  },
  completado: {
    bg: 'bg-sky-600',
    borderColor: '#38BDF8',
    label: 'Completado',
    icon: 'checkmark-circle-outline',
  },
  cancelado: {
    bg: 'bg-red-600',
    borderColor: '#F87171',
    label: 'Cancelado',
    icon: 'close-circle-outline',
  },
};

type Props = {
  bitacora: BitacoraResumen;
  onPress: () => void;
};

export function ServiceCard({ bitacora, onPress }: Props) {
  const cfg = estadoConfig[bitacora.estado] ?? estadoConfig.pendiente;
  const isActive = bitacora.estado === 'activo';

  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-2xl border border-servi-borde bg-servi-superficie active:opacity-90"
      style={{ borderLeftWidth: 4, borderLeftColor: cfg.borderColor }}
      onPress={onPress}
    >
      <View className="flex-row items-start p-4">
        <View
          className={`mr-3 h-12 w-12 items-center justify-center rounded-2xl ${
            isActive ? 'bg-emerald-500/20' : 'bg-servi-fondo'
          }`}
        >
          <Ionicons
            name={cfg.icon}
            size={24}
            color={isActive ? '#22C55E' : '#F97316'}
          />
        </View>

        <View className="flex-1">
          <View className="mb-1 flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-lg font-bold text-servi-texto">
              {bitacora.nombre ?? 'Sin nombre'}
            </Text>
            <View className={`rounded-full px-2.5 py-1 ${cfg.bg}`}>
              <Text className="text-[10px] font-bold uppercase text-white">{cfg.label}</Text>
            </View>
          </View>

          <View className="mb-1 flex-row items-center">
            <Ionicons name="navigate-outline" size={14} color="#A7C4B5" />
            <Text className="ml-1 flex-1 text-sm text-servi-suave">{bitacora.ruta ?? '—'}</Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="business-outline" size={14} color="#A7C4B5" />
            <Text className="ml-1 text-xs text-servi-suave">
              {bitacora.empresa_contratante ?? '—'} · {bitacora.unidad ?? '—'}
            </Text>
          </View>

          {isActive ? (
            <View className="mt-2 flex-row items-center">
              <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400" />
              <Text className="text-xs font-semibold text-emerald-400">Monitoreo activo</Text>
            </View>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </View>
    </Pressable>
  );
}
