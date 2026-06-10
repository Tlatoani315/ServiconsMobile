import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type ReportSyncStatus = 'ok' | 'pending' | 'error';

type Props = {
  status?: ReportSyncStatus;
  pendingCount?: number;
  onRetry?: () => void;
};

/** Pantalla 6 — Estatus de sincronizacion de reportes con n8n */
export function ReportStatusBar({ status = 'ok', pendingCount = 0, onRetry }: Props) {
  const config = {
    ok: {
      icon: 'checkmark-circle' as const,
      color: '#22C55E',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      label: 'Al corriente',
    },
    pending: {
      icon: 'cloud-upload-outline' as const,
      color: '#F97316',
      bg: 'bg-amber-500/10 border-amber-500/30',
      label:
        pendingCount > 0
          ? `Pendiente de envio (${pendingCount})`
          : 'Pendiente de envio',
    },
    error: {
      icon: 'alert-circle' as const,
      color: '#DC2626',
      bg: 'bg-red-500/10 border-red-500/30',
      label: 'Error al enviar',
    },
  }[status];

  return (
    <View className={`mb-4 flex-row items-center rounded-2xl border px-4 py-3 ${config.bg}`}>
      <Ionicons name={config.icon} size={22} color={config.color} />
      <Text className="ml-2 flex-1 font-semibold text-servi-texto">Estatus: {config.label}</Text>
      {status === 'error' && onRetry ? (
        <Pressable className="rounded-lg bg-servi-fondo px-3 py-1.5 active:opacity-90" onPress={onRetry}>
          <Text className="text-xs font-bold text-servi-acento">Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
