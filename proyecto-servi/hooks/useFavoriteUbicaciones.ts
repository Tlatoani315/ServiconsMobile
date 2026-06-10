import { useCallback, useEffect, useState } from 'react';

import {
  loadFavoriteUbicaciones,
  removeFavoriteUbicacion,
  saveFavoriteUbicacion,
  type FavoriteUbicacion,
} from '../lib/favoriteUbicaciones';
import type { Ubicacion } from '../types/models';

export function useFavoriteUbicaciones() {
  const [favorites, setFavorites] = useState<FavoriteUbicacion[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await loadFavoriteUbicaciones();
    setFavorites(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addFavorite = useCallback(async (ubicacion: Ubicacion, alias?: string) => {
    const next = await saveFavoriteUbicacion(ubicacion, alias);
    setFavorites(next);
    return next;
  }, []);

  const removeFavorite = useCallback(async (id: string) => {
    const next = await removeFavoriteUbicacion(id);
    setFavorites(next);
    return next;
  }, []);

  return { favorites, loading, reload, addFavorite, removeFavorite };
}
