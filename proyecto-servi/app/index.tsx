import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../components/AppButton';
import { Logo } from '../components/Logo';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <View className="flex-1 items-center justify-center px-6">
        <Logo size={88} />
        <Text className="mb-2 mt-8 text-center text-3xl font-bold text-servi-texto">
          Servicons Mobile
        </Text>
        <Text className="mb-10 text-center text-base text-servi-suave">
          Seguridad privada y logistica en tiempo real
        </Text>

        <View className="w-full max-w-xs gap-3">
          <AppButton
            label="Iniciar sesion"
            variant="accent"
            onPress={() => router.push('/auth/login')}
          />
          <AppButton
            label="Crear cuenta"
            variant="outline"
            onPress={() => router.push('/auth/register')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
