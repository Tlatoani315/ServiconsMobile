import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type Props = {
  intervalMinutes: number;
  onExpire: () => void;
  resetKey?: number;
};

export function TimerBar({ intervalMinutes, onExpire, resetKey = 0 }: Props) {
  const totalSeconds = intervalMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [resetKey, totalSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      setSecondsLeft(totalSeconds);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, totalSeconds, onExpire]);

  const remainingPct = (secondsLeft / totalSeconds) * 100;
  const urgent = secondsLeft <= 120;
  const critical = secondsLeft <= 30;

  const barColor = critical ? '#DC2626' : urgent ? '#F97316' : '#22C55E';
  const textColor = critical ? 'text-red-400' : urgent ? 'text-servi-acento' : 'text-emerald-400';

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-servi-borde bg-servi-superficie p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xs uppercase text-servi-suave">Proximo reporte</Text>
          <Text className={`text-3xl font-bold tabular-nums ${textColor}`}>
            {mins}:{secs.toString().padStart(2, '0')}
          </Text>
        </View>
        {urgent ? (
          <View className="rounded-full bg-red-600/20 px-3 py-1">
            <Text className="text-xs font-bold text-red-400">
              {critical ? 'URGENTE' : 'PRONTO'}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="h-4 overflow-hidden rounded-full bg-servi-fondo">
        <View
          className="h-full rounded-full"
          style={{ width: `${remainingPct}%`, backgroundColor: barColor }}
        />
      </View>
      <Text className="mt-2 text-xs text-servi-suave">
        Al llegar a 0 se abrira la camara automaticamente
      </Text>
    </View>
  );
}
