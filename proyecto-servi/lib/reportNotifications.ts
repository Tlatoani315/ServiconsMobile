import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initReportNotifications(): Promise<boolean> {
  if (initialized) return true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reportes-custodia', {
      name: 'Reportes de custodia',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 120, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  initialized = finalStatus === 'granted';
  return initialized;
}

export async function notifyReportDue(serviceName?: string): Promise<void> {
  const ok = await initReportNotifications();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de reportar',
      body: serviceName
        ? `Toma la foto del reporte de "${serviceName}".`
        : 'Abre la app y toma la foto del reporte de custodia.',
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'reportes-custodia' } : {}),
    },
    trigger: null,
  });
}
