import AsyncStorage from '@react-native-async-storage/async-storage';

import { cloneUbicacion, ubicacionDisplayLabel, ubicacionFingerprint } from './ubicacionHelpers';
import type { Ubicacion } from '../types/models';
import { generateUUID } from './uuid';

const STORAGE_KEY = 'servi:favorite-ubicaciones-v1';
const MAX_FAVORITES = 40;

export type FavoriteUbicacion = {
  id: string;
  alias: string;
  ubicacion: Ubicacion;
  createdAt: string;
};

export async function loadFavoriteUbicaciones(): Promise<FavoriteUbicacion[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteUbicacion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveFavoriteUbicacion(
  ubicacion: Ubicacion,
  alias?: string,
): Promise<FavoriteUbicacion[]> {
  const fp = ubicacionFingerprint(ubicacion);
  if (!fp || fp === 'empty') return loadFavoriteUbicaciones();

  const current = await loadFavoriteUbicaciones();
  const withoutDup = current.filter((f) => ubicacionFingerprint(f.ubicacion) !== fp);

  const entry: FavoriteUbicacion = {
    id: generateUUID(),
    alias: alias?.trim() || ubicacionDisplayLabel(ubicacion),
    ubicacion: cloneUbicacion(ubicacion),
    createdAt: new Date().toISOString(),
  };

  const next = [entry, ...withoutDup].slice(0, MAX_FAVORITES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function removeFavoriteUbicacion(id: string): Promise<FavoriteUbicacion[]> {
  const current = await loadFavoriteUbicaciones();
  const next = current.filter((f) => f.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
