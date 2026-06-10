import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useImmersiveAndroidNav } from '../../hooks/useImmersiveAndroidNav';

export default function AppLayout() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useImmersiveAndroidNav(true);

  useEffect(() => {
    if (!loading && (!session || !profile)) {
      router.replace('/auth/login');
    }
  }, [session, profile, loading, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-servi-fondo">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!session || !profile) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1F17' } }} />
  );
}
