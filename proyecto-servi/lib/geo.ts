import { Alert, Linking, Platform } from 'react-native';
import type { Region } from 'react-native-maps';

export type GeoPoint = {
  lat: number;
  lng: number;
  label?: string;
  id?: string;
};

export function formatCoords(lat: number, lng: number, decimals = 6): string {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

function validPoint(p: GeoPoint): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng);
}

/** URL oficial Google Maps — ver punto en mapa (abre app si esta instalada) */
export function buildGoogleMapsViewUrl(lat: number, lng: number, label?: string): string {
  const coords = `${lat},${lng}`;
  if (label?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${label} (${coords})`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${coords}`;
}

/** URL oficial — navegacion desde ubicacion actual hasta destino */
export function buildGoogleMapsNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/** URL oficial — recorrido con varios puntos GPS (reportes del servicio) */
export function buildGoogleMapsRouteUrl(points: GeoPoint[]): string {
  const valid = points.filter(validPoint);
  if (valid.length === 0) return 'https://www.google.com/maps';
  if (valid.length === 1) {
    return buildGoogleMapsViewUrl(valid[0].lat, valid[0].lng, valid[0].label);
  }

  const origin = `${valid[0].lat},${valid[0].lng}`;
  const destination = `${valid[valid.length - 1].lat},${valid[valid.length - 1].lng}`;
  const middle = valid.slice(1, -1);

  if (middle.length === 0) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  }

  const waypoints = middle.map((p) => `${p.lat},${p.lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

/** Intenta abrir la app nativa de Google Maps; si no, abre en navegador */
export function buildGoogleMapsAppUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(`${label}@${lat},${lng}`) : `${lat},${lng}`;
  if (Platform.OS === 'ios') {
    return `comgooglemaps://?q=${q}&center=${lat},${lng}&zoom=16`;
  }
  return `geo:${lat},${lng}?q=${lat},${lng}${label ? `(${encodeURIComponent(label)})` : ''}`;
}

export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

async function openWithFallback(primary: string, fallback: string): Promise<boolean> {
  const primaryOk = await openExternalUrl(primary);
  if (primaryOk) return true;
  return openExternalUrl(fallback);
}

export async function openGoogleMapsView(
  lat: number,
  lng: number,
  label?: string,
): Promise<boolean> {
  const webUrl = buildGoogleMapsViewUrl(lat, lng, label);
  const appUrl = buildGoogleMapsAppUrl(lat, lng, label);
  const ok = await openWithFallback(appUrl, webUrl);
  if (!ok) {
    Alert.alert(
      'No se pudo abrir Google Maps',
      'Instala Google Maps o revisa tu conexion e intenta de nuevo.',
    );
  }
  return ok;
}

export async function openGoogleMapsNavigate(lat: number, lng: number): Promise<boolean> {
  const url = buildGoogleMapsNavigateUrl(lat, lng);
  const ok = await openExternalUrl(url);
  if (!ok) {
    Alert.alert('No se pudo abrir navegacion', 'Verifica que Google Maps este instalado.');
  }
  return ok;
}

export async function openGoogleMapsRoute(points: GeoPoint[]): Promise<boolean> {
  const url = buildGoogleMapsRouteUrl(points);
  const ok = await openExternalUrl(url);
  if (!ok) {
    Alert.alert('No se pudo abrir el recorrido', 'Verifica que Google Maps este instalado.');
  }
  return ok;
}

/** @deprecated Usa openGoogleMapsView */
export function openInMaps(lat: number, lng: number) {
  void openGoogleMapsView(lat, lng);
}

export function regionForPoints(
  points: GeoPoint[],
  fallback: GeoPoint = { lat: 19.4326, lng: -99.1332 },
): Region {
  if (points.length === 0) {
    return {
      latitude: fallback.lat,
      longitude: fallback.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  if (points.length === 1) {
    return {
      latitude: points[0].lat,
      longitude: points[0].lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.01);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.4, 0.01);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
