import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

function openAppSettings() {
  Linking.openSettings().catch(() => {
    Alert.alert('Configuracion', 'Abre Ajustes del telefono y habilita camara y ubicacion para Servicons.');
  });
}

export function usePermissions() {
  const [camera, setCamera] = useState<PermissionStatus>('undetermined');
  const [location, setLocation] = useState<PermissionStatus>('undetermined');
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    setChecking(true);
    const [cam, loc] = await Promise.all([
      Camera.getCameraPermissionsAsync(),
      Location.getForegroundPermissionsAsync(),
    ]);
    setCamera(cam.granted ? 'granted' : cam.canAskAgain ? 'undetermined' : 'denied');
    setLocation(loc.granted ? 'granted' : loc.canAskAgain ? 'undetermined' : 'denied');
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    const current = await Camera.getCameraPermissionsAsync();
    if (current.granted) {
      setCamera('granted');
      return true;
    }

    const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    setCamera(granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied');

    if (!granted) {
      Alert.alert(
        'Camara necesaria',
        'Servicons usa la camara para evidencias fotograficas del servicio en monitoreo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          canAskAgain
            ? { text: 'Reintentar', onPress: () => requestCamera() }
            : { text: 'Abrir ajustes', onPress: openAppSettings },
        ],
      );
    }

    return granted;
  }, []);

  const requestLocation = useCallback(async (): Promise<boolean> => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) {
      setLocation('granted');
      return true;
    }

    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setLocation(granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied');

    if (!granted) {
      Alert.alert(
        'Ubicacion necesaria',
        'Servicons registra GPS en cada reporte y alerta SOS para monitoreo en tiempo real.',
        [
          { text: 'Cancelar', style: 'cancel' },
          canAskAgain
            ? { text: 'Reintentar', onPress: () => requestLocation() }
            : { text: 'Abrir ajustes', onPress: openAppSettings },
        ],
      );
    }

    return granted;
  }, []);

  const ensureFieldPermissions = useCallback(async (): Promise<boolean> => {
    const camOk = await requestCamera();
    if (!camOk) return false;
    const locOk = await requestLocation();
    return locOk;
  }, [requestCamera, requestLocation]);

  const allGranted = camera === 'granted' && location === 'granted';

  return {
    camera,
    location,
    checking,
    allGranted,
    refresh,
    requestCamera,
    requestLocation,
    ensureFieldPermissions,
    openAppSettings,
    platform: Platform.OS,
  };
}
