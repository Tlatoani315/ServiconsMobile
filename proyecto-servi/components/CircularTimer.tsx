import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  intervalMinutes: number;
  onPress: () => void;
  onExpire: () => void;
  resetKey?: number;
};

/** Pantalla 6 — Temporizador circular protagonista (wireframe) */
export function CircularTimer({ intervalMinutes, onPress, onExpire, resetKey = 0 }: Props) {
  const totalSeconds = intervalMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const size = 200;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [resetKey, totalSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      setSecondsLeft(totalSeconds);
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, totalSeconds, onExpire]);

  const urgent = secondsLeft <= 120;
  const critical = secondsLeft <= 30;
  const color = critical ? '#DC2626' : urgent ? '#F97316' : '#22C55E';
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <Pressable className="my-4 items-center active:opacity-90" onPress={onPress}>
      <View className="items-center justify-center">
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2D5A45"
            strokeWidth={stroke}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View className="absolute items-center">
          <Text className="text-xs uppercase text-servi-suave">Proximo reporte</Text>
          <Text className="text-4xl font-black tabular-nums text-servi-texto">
            {mins}:{secs.toString().padStart(2, '0')}
          </Text>
          <Text className="mt-1 text-xs text-servi-acento">Toca para reportar ya</Text>
        </View>
      </View>
    </Pressable>
  );
}
