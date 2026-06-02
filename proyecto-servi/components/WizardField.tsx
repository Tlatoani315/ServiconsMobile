import { Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
};

export function WizardField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  required,
}: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-servi-suave">
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        className="rounded-xl border border-servi-borde bg-servi-fondo px-4 py-3 text-servi-texto"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#A8B8CC"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}
