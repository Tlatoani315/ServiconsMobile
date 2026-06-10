import type { Tiempos } from '../types/models';
import { parseDateTimeValue } from './dateTimeHelpers';

export type TiempoFieldKey =
  | 'fechaHoraPresentacion'
  | 'fechaHoraCita'
  | 'fechaHoraSalida'
  | 'fechaHoraVerificacion'
  | 'fechaHoraLlegada'
  | 'fechaHoraFin';

type FieldMeta = { key: TiempoFieldKey; label: string; required?: boolean };

/** Orden cronologico esperado del servicio */
export const TIEMPO_FIELDS_ORDER: FieldMeta[] = [
  { key: 'fechaHoraPresentacion', label: 'Presentacion' },
  { key: 'fechaHoraCita', label: 'Cita', required: true },
  { key: 'fechaHoraSalida', label: 'Salida' },
  { key: 'fechaHoraVerificacion', label: 'Verificacion' },
  { key: 'fechaHoraLlegada', label: 'Llegada' },
  { key: 'fechaHoraFin', label: 'Fin' },
];

function getTiempoDate(tiempos: Tiempos, key: TiempoFieldKey): Date | null {
  const raw = tiempos[key];
  return parseDateTimeValue(typeof raw === 'string' ? raw : '');
}

/** Valida toda la cadena; null si OK */
export function validateTiemposChain(tiempos: Tiempos): string | null {
  if (!tiempos.fechaHoraCita?.trim()) {
    return 'Selecciona fecha y hora de cita.';
  }

  let previous: { label: string; date: Date } | null = null;

  for (const { key, label } of TIEMPO_FIELDS_ORDER) {
    const date = getTiempoDate(tiempos, key);
    if (!date) continue;

    if (previous && date.getTime() < previous.date.getTime()) {
      return `${label} no puede ser antes de ${previous.label} (${formatShort(previous.date)}).`;
    }

    previous = { label, date };
  }

  return null;
}

/** Valida tras cambiar un campo concreto */
export function validateTiemposAfterUpdate(
  tiempos: Tiempos,
  _changedKey: TiempoFieldKey,
): string | null {
  return validateTiemposChain(tiempos);
}

function formatShort(d: Date): string {
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
