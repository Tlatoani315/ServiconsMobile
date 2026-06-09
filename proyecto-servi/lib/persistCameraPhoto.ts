import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';

export async function persistCameraPhoto(sourceUri: string): Promise<string> {
  if (!cacheDirectory) {
    throw new Error('No hay almacenamiento local disponible.');
  }

  const dest = `${cacheDirectory}custody-${Date.now()}.jpg`;

  try {
    await copyAsync({ from: sourceUri, to: dest });
  } catch {
    throw new Error('No se pudo guardar la foto. Intenta de nuevo.');
  }

  const info = await getInfoAsync(dest);
  if (!info.exists) {
    await deleteAsync(dest, { idempotent: true });
    throw new Error('No se pudo guardar la foto. Intenta de nuevo.');
  }

  return dest;
}

export function isPersistedCameraPhoto(uri: string): boolean {
  return Boolean(cacheDirectory && uri.startsWith(cacheDirectory) && uri.includes('custody-'));
}

export async function ensurePersistedCameraPhoto(sourceUri: string): Promise<string> {
  if (isPersistedCameraPhoto(sourceUri)) return sourceUri;
  return persistCameraPhoto(sourceUri);
}

export async function deletePersistedPhoto(uri: string | null | undefined): Promise<void> {
  if (!uri || !cacheDirectory || !uri.startsWith(cacheDirectory)) return;
  try {
    await deleteAsync(uri, { idempotent: true });
  } catch {
    /* ignorar */
  }
}
