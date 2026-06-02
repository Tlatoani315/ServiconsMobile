import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { ValidationRule } from '../lib/authValidation';

type Props = {
  title: string;
  rules: ValidationRule[];
  visible?: boolean;
};

export function ValidationChecklist({ title, rules, visible = true }: Props) {
  if (!visible) return null;

  const allMet = rules.every((r) => r.met);

  return (
    <View className="mt-2 rounded-xl border border-servi-borde bg-servi-fondo/80 px-3 py-2.5">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-servi-suave">
        {title}
      </Text>
      {rules.map((rule) => (
        <View key={rule.id} className="mb-1.5 flex-row items-start gap-2 last:mb-0">
          <Ionicons
            name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={rule.met ? '#F97316' : '#64748B'}
            style={{ marginTop: 1 }}
          />
          <Text
            className={`flex-1 text-xs leading-4 ${rule.met ? 'text-servi-acentoClaro' : 'text-servi-suave'}`}
          >
            {rule.label}
          </Text>
        </View>
      ))}
      {allMet ? (
        <Text className="mt-2 text-xs font-medium text-servi-acento">Todos los requisitos cumplidos</Text>
      ) : null}
    </View>
  );
}
