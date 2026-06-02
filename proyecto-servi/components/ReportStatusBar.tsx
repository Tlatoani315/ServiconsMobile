import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export type ReportSyncStatus = 'ok' | 'offline' | 'error';

type Props = {
  status?: ReportSyncStatus;
};

/** Pantalla 6 — Estatus de reporte (wireframe) */
export function ReportStatusBar({ status = 'ok' }: Props) {
  const config = {
    ok: {
      icon: 'checkmark-circle' as const,
      color: '#22C55E',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      label: 'Al corriente',
    },
    offline: {
      icon: 'cloud-offline' as const,
      color: '#F97316',
      bg: 'bg-amber-500/10 border-amber-500/30',
      label: 'Falta internet',
    },
    error: {
      icon: 'alert-circle' as const,
      color: '#DC2626',
      bg: 'bg-red-500/10 border-red-500/30',
      label: 'Error, enviar manualmente',
    },
  }[status];

  return (
    <View className={`mb-4 flex-row items-center rounded-2xl border px-4 py-3 ${config.bg}`}>
      <Ionicons name={config.icon} size={22} color={config.color} />
      <Text className="ml-2 font-semibold text-servi-texto">Estatus: {config.label}</Text>
    </View>
  );
}
