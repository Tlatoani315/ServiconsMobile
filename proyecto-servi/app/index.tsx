import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../components/AppButton';
import { Logo } from '../components/Logo';

const features = [
  { icon: 'map' as const, title: 'Mapa GPS', desc: 'Ubicacion en tiempo real en cada reporte' },
  { icon: 'camera' as const, title: 'Evidencias', desc: 'Fotos georreferenciadas cada X minutos' },
  { icon: 'warning' as const, title: 'SOS', desc: 'Alerta de emergencia con un toque' },
  { icon: 'document-text' as const, title: 'Bitacoras', desc: 'Wizard completo y cierre con firmas' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <View className="flex-1 px-6 py-8">
        <View className="items-center">
          <Logo size={88} />
          <Text className="mb-1 mt-6 text-center text-3xl font-bold text-servi-texto">
            Servicons Mobile
          </Text>
          <Text className="text-center text-base text-servi-suave">
            Monitoreo de custodia en campo
          </Text>
        </View>

        <View className="my-8 gap-3">
          {features.map((f) => (
            <View
              key={f.title}
              className="flex-row items-center rounded-2xl border border-servi-borde bg-servi-superficie p-4"
            >
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-servi-acento/20">
                <Ionicons name={f.icon} size={22} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-servi-texto">{f.title}</Text>
                <Text className="text-xs text-servi-suave">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <AppButton
          label="Iniciar sesion"
          variant="accent"
          onPress={() => router.push('/auth/login')}
        />
      </View>
    </SafeAreaView>
  );
}
