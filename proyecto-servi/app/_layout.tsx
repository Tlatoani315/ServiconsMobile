import 'react-native-url-polyfill/auto';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../hooks/useAppToast';
import { getMissingEnvVars } from '../lib/envConfig';
import { getHomeRouteForRole, isRouteAllowedForRole, isValidRole } from '../lib/roles';

function EnvErrorScreen() {
  const missing = getMissingEnvVars();
  return (
    <View className="flex-1 items-center justify-center bg-servi-fondo px-8">
      <Text className="mb-4 text-center text-xl font-bold text-servi-texto">
        Configuracion incompleta
      </Text>
      <Text className="text-center text-servi-suave">
        Faltan variables de entorno: {missing.join(', ')}. Copia .env.example a .env o configura EAS
        Secrets antes de generar el APK.
      </Text>
    </View>
  );
}

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const routePath = segments.join('/');
    const segment = String(segments[0] ?? '');
    const inApp = segment === '(app)';
    const inAuth = segment === 'auth';
    const inLegal = segment === 'legal';
    const onRegister = routePath.includes('register');
    const onResetPassword = routePath.includes('reset-password');
    const onWelcome = segment === '' || segment === 'index';

    if (!session && inApp) {
      router.replace('/auth/login');
      return;
    }

    if (session && profile && isValidRole(profile.role) && !onRegister && !onResetPassword) {
      const homeRoute = getHomeRouteForRole(profile.role);

      if ((inAuth && !onResetPassword) || onWelcome) {
        router.replace(homeRoute);
        return;
      }

      if (inApp && !isRouteAllowedForRole(profile.role, routePath)) {
        router.replace(homeRoute);
      }
    }

    if (session && !profile && !onRegister && !onResetPassword && !inLegal) {
      if (inApp) {
        router.replace('/auth/login');
      }
    }
  }, [session, profile, loading, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-servi-fondo">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1F17' } }} />
    </>
  );
}

export default function RootLayout() {
  const missingEnv = getMissingEnvVars();

  if (missingEnv.length > 0) {
    return (
      <SafeAreaProvider>
        <EnvErrorScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
