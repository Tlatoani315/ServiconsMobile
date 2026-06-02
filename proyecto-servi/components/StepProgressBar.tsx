import { Text, View } from 'react-native';

type Props = {
  step: number;
  total: number;
  labels?: string[];
};

export function StepProgressBar({ step, total, labels }: Props) {
  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase text-emerald-400">
          Paso {step} de {total}
        </Text>
        {labels?.[step - 1] ? (
          <Text className="text-xs text-servi-suave">{labels[step - 1]}</Text>
        ) : null}
      </View>
      <View className="h-2 flex-row overflow-hidden rounded-full bg-servi-borde">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`h-full flex-1 ${i < step ? 'bg-emerald-500' : 'bg-transparent'}`}
          />
        ))}
      </View>
    </View>
  );
}
