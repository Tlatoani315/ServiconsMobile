import { useCallback, useState } from 'react';

import { supabase } from '../lib/supabaseClient';
import type { BitacoraFormulario, BitacoraResumen } from '../types/models';

export function useBitacora() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBitacoras = useCallback(async (): Promise<BitacoraResumen[]> => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('bitacoras')
      .select(
        'id, nombre, ruta, unidad, empresa_contratante, estado, created_at, completed_at, custodio_id, report_interval_minutes',
      )
      .order('created_at', { ascending: false });

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return [];
    }

    return (data ?? []) as BitacoraResumen[];
  }, []);

  const getBitacoraById = useCallback(async (id: string): Promise<BitacoraResumen | null> => {
    const { data, error: fetchError } = await supabase
      .from('bitacoras')
      .select(
        'id, nombre, ruta, unidad, empresa_contratante, estado, created_at, completed_at, custodio_id, report_interval_minutes',
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      return null;
    }

    return data as BitacoraResumen;
  }, []);

  const createBitacora = useCallback(
    async (formulario: BitacoraFormulario, custodioId: string) => {
      setLoading(true);
      setError(null);

      const ruta = `${formulario.origen.municipio} → ${formulario.destino.municipio}`;
      const unidad =
        formulario.vehiculoCustodia?.placas || formulario.operador1?.vehiculo?.placas || '';

      const { error: insertError } = await supabase.from('bitacoras').insert({
        id: formulario.id,
        custodio_id: custodioId,
        nombre: formulario.nombre,
        ruta,
        unidad,
        empresa_contratante: formulario.empresaContratante,
        estado: 'pendiente',
        formulario,
        report_interval_minutes: formulario.reportIntervalMinutes ?? 15,
      });

      setLoading(false);

      if (insertError) {
        setError(insertError.message);
        return false;
      }

      return true;
    },
    [],
  );

  const iniciarCustodia = useCallback(async (bitacoraId: string, custodioId: string) => {
    const { error: updateError } = await supabase
      .from('bitacoras')
      .update({ estado: 'activo', start_time: new Date().toISOString() })
      .eq('id', bitacoraId)
      .eq('custodio_id', custodioId);

    return !updateError;
  }, []);

  const cerrarCustodia = useCallback(
    async (
      bitacoraId: string,
      custodioId: string,
      firmaOperador: string,
      firmaCustodio: string,
    ) => {
      const { error: updateError } = await supabase
        .from('bitacoras')
        .update({
          estado: 'completado',
          completed_at: new Date().toISOString(),
          firma_operador: firmaOperador,
          firma_custodio: firmaCustodio,
        })
        .eq('id', bitacoraId)
        .eq('custodio_id', custodioId);

      return !updateError;
    },
    [],
  );

  return {
    loading,
    error,
    getBitacoras,
    getBitacoraById,
    createBitacora,
    iniciarCustodia,
    cerrarCustodia,
  };
}
