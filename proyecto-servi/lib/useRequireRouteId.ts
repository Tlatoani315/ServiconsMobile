import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { normalizeRouteParam } from './routeParams';

/** Valida param de ruta; si falta, vuelve atras. */
export function useRequireRouteId(
  param: string | string[] | undefined,
): string | null {
  const router = useRouter();
  const id = normalizeRouteParam(param);

  useEffect(() => {
    if (!id) router.back();
  }, [id, router]);

  return id;
}
