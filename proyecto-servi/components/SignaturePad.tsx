import { Pressable, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onCapture: (base64DataUrl: string) => void;
};

/** Placeholder de firma — sustituir por canvas táctil en iteración futura */
export function SignaturePad({ label, value, onCapture }: Props) {
  const simularFirma = () => {
    onCapture(`data:image/png;base64,FIRMA_${Date.now()}`);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-servi-suave">{label}</Text>
      <Pressable
        className="h-28 items-center justify-center rounded-xl border border-dashed border-servi-borde bg-servi-fondo"
        onPress={simularFirma}
      >
        <Text className="text-servi-suave">
          {value ? 'Firma capturada' : 'Toca para capturar firma'}
        </Text>
      </Pressable>
    </View>
  );
}
