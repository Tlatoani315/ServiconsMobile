import { Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';

type Props = {
  size?: number;
};

export function UserAvatar({ size = 44 }: Props) {
  const { profile } = useAuth();
  const initial = (profile?.nombre ?? 'U').charAt(0).toUpperCase();

  return (
    <View
      className="items-center justify-center rounded-full border border-servi-acento/80 bg-servi-superficie"
      style={{ width: size, height: size }}
    >
      <Text className="font-semibold text-servi-acento" style={{ fontSize: size * 0.38 }}>
        {initial}
      </Text>
    </View>
  );
}
