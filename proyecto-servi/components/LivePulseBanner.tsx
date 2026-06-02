import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type Props = {
  count: number;
  label?: string;
  tone?: 'emerald' | 'sky' | 'orange';
};

const tones = {
  emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  sky: { border: 'border-sky-500/40', bg: 'bg-sky-500/10', dot: 'bg-sky-400', text: 'text-sky-400' },
  orange: { border: 'border-orange-500/40', bg: 'bg-orange-500/10', dot: 'bg-orange-400', text: 'text-orange-400' },
};

/** Banner de monitoreo en vivo con indicador pulsante */
export function LivePulseBanner({ count, label = 'servicios en monitoreo ahora', tone = 'emerald' }: Props) {
  if (count <= 0) return null;

  const t = tones[tone];

  return (
    <View className={`mb-4 flex-row items-center rounded-2xl border px-4 py-3 ${t.border} ${t.bg}`}>
      <View className="mr-3 items-center justify-center">
        <View className={`h-3 w-3 rounded-full ${t.dot}`} />
        <View className={`absolute h-5 w-5 rounded-full opacity-30 ${t.dot}`} />
      </View>
      <View className="flex-1">
        <Text className={`text-lg font-black ${t.text}`}>{count} en vivo</Text>
        <Text className="text-xs text-servi-suave">{label}</Text>
      </View>
      <Ionicons name="pulse" size={22} color={tone === 'sky' ? '#0EA5E9' : tone === 'orange' ? '#F97316' : '#22C55E'} />
    </View>
  );
}
