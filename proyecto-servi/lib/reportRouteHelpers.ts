import * as Location from 'expo-location';

import { formatUbicacionAddress } from './ubicacionAddress';
import type { Ubicacion } from '../types/models';

export function formatReportFecha(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatReportHora(date = new Date()): string {
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Direccion legible para el webhook report-route */
export async function resolveReportDireccion(
  lat: number,
  lng: number,
  fallbackUbicacion?: Ubicacion | null,
  options?: { skipGeocoding?: boolean },
): Promise<string> {
  const fromForm = fallbackUbicacion ? formatUbicacionAddress(fallbackUbicacion).trim() : '';
  if (fromForm) return fromForm;

  if (options?.skipGeocoding) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  try {
    const rows = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const row = rows[0];
    if (row) {
      const parts = [
        [row.street, row.streetNumber].filter(Boolean).join(' '),
        row.district || row.subregion,
        row.postalCode ? `CP ${row.postalCode}` : null,
        row.city || row.region,
        row.country,
      ].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
  } catch {
    /* geocoding opcional */
  }

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export type ReportRouteEstatus = 'inicio' | 'reporte' | 'termino';

export function reportEstatusForIndex(reportIndex: number): ReportRouteEstatus {
  if (reportIndex <= 1) return 'inicio';
  return 'reporte';
}
