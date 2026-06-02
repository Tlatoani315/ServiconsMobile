import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Redirige al wizard paso 1 */
export default function BitacoraIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(app)/bitacora/wizard/step1');
  }, [router]);

  return null;
}
