import { Alert, Pressable, Text } from 'react-native';

type Props = {
  onConfirm: () => void;
  disabled?: boolean;
};

export function SOSButton({ onConfirm, disabled }: Props) {
  const handlePress = () => {
    Alert.alert('Confirmar SOS', 'Deseas enviar una alerta de emergencia?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar SOS', style: 'destructive', onPress: onConfirm },
    ]);
  };

  return (
    <Pressable
      className={`my-4 items-center rounded-2xl bg-servi-peligro py-6 active:opacity-90 ${disabled ? 'opacity-50' : ''}`}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text className="text-2xl font-bold tracking-widest text-servi-texto">SOS</Text>
      <Text className="text-sm text-servi-texto">Emergencia</Text>
    </Pressable>
  );
}
