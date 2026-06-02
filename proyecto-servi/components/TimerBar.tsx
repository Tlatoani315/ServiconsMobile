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

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <View className="mb-4">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-sm text-servi-suave">Próximo reporte</Text>
        <Text className="mb-1 text-sm font-medium text-servi-acento">
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-servi-borde">
        <View className="h-full rounded-full bg-servi-acento" style={{ width: `${progress}%` }} />
      </View>
    </View>
  );
}
