import { formatUbicacionShort } from './ubicacionAddress';
import type { Ubicacion } from '../types/models';

export function cloneUbicacion(u: Ubicacion): Ubicacion {
  return {
    estado: u.estado ?? '',
    municipio: u.municipio ?? '',
    ciudad: u.ciudad ?? '',
    colonia: u.colonia ?? '',
    calle: u.calle ?? '',
    numeroExterior: u.numeroExterior ?? '',
    codigoPostal: u.codigoPostal ?? '',
    referencia: u.referencia ?? '',
    personalAsignado: u.personalAsignado ?? '',
    lat: u.lat ?? '',
    lng: u.lng ?? '',
  };
}

/** Huella para deduplicar ubicaciones en listas recientes */
export function ubicacionFingerprint(u: Ubicacion): string {
  const parts = [
    u.codigoPostal?.trim(),
    u.estado?.trim(),
    u.municipio?.trim(),
    u.colonia?.trim(),
    u.calle?.trim(),
    u.numeroExterior?.trim(),
    u.lat?.trim(),
    u.lng?.trim(),
  ]
    .filter(Boolean)
    .join('|')
    .toLowerCase();

  return parts || 'empty';
}

export function ubicacionDisplayLabel(u: Ubicacion): string {
  const short = formatUbicacionShort(u);
  const calle = u.calle?.trim();
  if (calle && !short.toLowerCase().includes(calle.toLowerCase())) {
    return `${calle} · ${short}`;
  }
  return short || 'Ubicacion sin datos';
}

export function hasUbicacionMinima(u: Ubicacion): boolean {
  return Boolean(u.codigoPostal?.trim() && u.estado?.trim() && u.municipio?.trim());
}
