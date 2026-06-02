import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth/login');
    }
  }, [session, loading, router]);

  if (!session) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1F17' } }} />
  );
}
