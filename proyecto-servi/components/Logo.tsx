import { Image, View } from 'react-native';

type Props = {
  size?: number;
  showRing?: boolean;
};

export function Logo({ size = 88, showRing = true }: Props) {
  return (
    <View
      className={`items-center justify-center ${showRing ? 'rounded-3xl border-4 border-servi-acento bg-servi-superficie p-2' : ''}`}
      style={{ width: showRing ? size + 16 : size, height: showRing ? size + 16 : size }}
    >
      <Image
        source={require('../assets/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Logo Servicons Mobile"
      />
    </View>
  );
}
