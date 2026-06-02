import { useCallback } from 'react';

import { supabase } from '../lib/supabaseClient';

export function useEvidencias() {
  const uploadFoto = useCallback(
    async (uri: string, custodioId: string, bitacoraId: string): Promise<string | null> => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const path = `${custodioId}/${bitacoraId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage.from('evidencias').upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (error) return null;

      const { data } = supabase.storage.from('evidencias').getPublicUrl(path);
      return data.publicUrl;
    },
    [],
  );

  const saveEvidencia = useCallback(
    async (params: {
      bitacora_id: string;
      custodio_id: string;
      url_imagen: string;
      latitud: number;
      longitud: number;
      observaciones?: string;
    }) => {
      const { error } = await supabase.from('evidencias').insert({
        ...params,
        timestamp: new Date().toISOString(),
      });

      return !error;
    },
    [],
  );

  return { uploadFoto, saveEvidencia };
}
