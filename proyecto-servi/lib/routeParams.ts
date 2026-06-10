/** Normaliza params de Expo Router (string | string[] | undefined) a string | null */
export function normalizeRouteParam(
  value: string | string[] | undefined | null,
): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0]?.trim() || null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
