import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export function useLocation() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    void Location.getForegroundPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === 'granted');
    });
  }, []);

  const getCurrentLocation = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permiso de ubicacion denegado. Activalo en Ajustes.');
    }

    const lastKnown = await Location.getLastKnownPositionAsync();
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<Location.LocationObject | null>((resolve) => {
        setTimeout(() => resolve(null), 15_000);
      }),
    ]);

    const resolved = position ?? lastKnown;
    if (!resolved) {
      throw new Error('No se pudo obtener la ubicacion GPS. Activa el GPS e intenta de nuevo.');
    }

    return {
      latitude: resolved.coords.latitude,
      longitude: resolved.coords.longitude,
      accuracy: resolved.coords.accuracy ?? null,
      altitude: resolved.coords.altitude ?? null,
    };
  }, []);

  return { permissionGranted, getCurrentLocation };
}
