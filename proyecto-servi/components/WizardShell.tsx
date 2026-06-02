import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from './AppButton';

type Props = {
  title: string;
  step: number;
  total?: number;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  onSkip?: () => void;
};

export function WizardShell({
  title,
  step,
  total = 7,
  children,
  onNext,
  nextLabel = 'Siguiente',
  onSkip,
}: Props) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()}>
          <Text className="text-servi-acento">← Atrás</Text>
        </Pressable>
        <Text className="text-servi-suave">
          Paso {step}/{total}
        </Text>
      </View>

      <View className="mx-4 mb-4 h-2 overflow-hidden rounded-full bg-servi-borde">
        <View
          className="h-full rounded-full bg-servi-acento"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </View>

      <Text className="mb-4 px-4 text-xl font-bold text-servi-texto">{title}</Text>

      <ScrollView className="flex-1 px-4">{children}</ScrollView>

      <View className="border-t border-servi-borde px-4 py-4">
        {onSkip ? (
          <Pressable className="mb-3 items-center py-2" onPress={onSkip}>
            <Text className="text-servi-suave">Omitir</Text>
          </Pressable>
        ) : null}
        <AppButton label={nextLabel} variant="accent" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}
