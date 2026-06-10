const STORAGE_RE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Inicio del dia local (hoy 00:00) — minimo para calendario */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formato almacenado: DD/MM/AAAA HH:mm */
export function formatDateTimeStorage(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Etiqueta legible en UI */
export function formatDateTimeDisplay(value: string | undefined | null): string {
  const parsed = parseDateTimeValue(value);
  if (!parsed) return '';
  return parsed.toLocaleString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Interpreta DD/MM/AAAA HH:mm o ISO; null si vacio/invalido */
export function parseDateTimeValue(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;

  const m = value.trim().match(STORAGE_RE);
  if (m) {
    const [, dd, mm, yyyy, hh, min] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const iso = new Date(value);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** Valor inicial al abrir picker: existente, ahora, o hoy+1h si es pasado */
export function defaultPickerDate(stored: string | undefined | null): Date {
  const parsed = parseDateTimeValue(stored);
  const now = new Date();
  const min = startOfToday();

  if (parsed && parsed.getTime() >= min.getTime()) return parsed;
  if (now.getTime() >= min.getTime()) return now;

  const fallback = new Date(min);
  fallback.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return fallback;
}

export function mergeDatePart(base: Date, from: Date): Date {
  const d = new Date(base);
  d.setFullYear(from.getFullYear(), from.getMonth(), from.getDate());
  return d;
}

export function mergeTimePart(base: Date, from: Date): Date {
  const d = new Date(base);
  d.setHours(from.getHours(), from.getMinutes(), 0, 0);
  return d;
}

export function isBeforeToday(date: Date): boolean {
  return date.getTime() < startOfToday().getTime();
}
