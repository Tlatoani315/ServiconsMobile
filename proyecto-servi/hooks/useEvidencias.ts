import { useCallback } from 'react';

import { supabase } from '../lib/supabaseClient';

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

export function useEvidencias() {
  const getSignedUrl = useCallback(async (bucket: string, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  const uploadFoto = useCallback(
    async (uri: string, custodioId: string, bitacoraId: string): Promise<string | null> => {
      const arrayBuffer = await uriToArrayBuffer(uri);
      const path = `${custodioId}/${bitacoraId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage.from('evidencias').upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (error) return null;
      return getSignedUrl('evidencias', path);
    },
    [getSignedUrl],
  );

  const uploadFirma = useCallback(
    async (
      dataUrl: string,
      custodioId: string,
      bitacoraId: string,
      tipo: 'operador' | 'custodio',
    ): Promise<string | null> => {
      const path = `${custodioId}/${bitacoraId}/firma_${tipo}_${Date.now()}.svg`;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const arrayBuffer = await uriToArrayBuffer(`data:image/svg+xml;base64,${base64}`);

      const { error } = await supabase.storage.from('firmas').upload(path, arrayBuffer, {
        contentType: 'image/svg+xml',
        upsert: false,
      });

      if (error) return null;
      return getSignedUrl('firmas', path);
    },
    [getSignedUrl],
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

  const getEvidencias = useCallback(async (bitacoraId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) return [];

    const { data, error } = await supabase
      .from('evidencias')
      .select('id, bitacora_id, url_imagen, latitud, longitud, observaciones, timestamp')
      .eq('bitacora_id', bitacoraId)
      .eq('custodio_id', session.user.id)
      .order('timestamp', { ascending: false });

    if (error) return [];
    return data ?? [];
  }, []);

  return { uploadFoto, uploadFirma, saveEvidencia, getEvidencias, getSignedUrl };
};
