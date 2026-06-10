import { useCallback, useEffect, useState } from 'react';

import { useBitacora } from './useBitacora';
import {
  cloneUbicacion,
  ubicacionDisplayLabel,
  ubicacionFingerprint,
  hasUbicacionMinima,
} from '../lib/ubicacionHelpers';
import type { BitacoraFormulario, Ubicacion } from '../types/models';

export type SuggestionField =
  | 'nombre'
  | 'empresaContratante'
  | 'folioCliente'
  | 'origenEstado'
  | 'origenMunicipio'
  | 'destinoEstado'
  | 'destinoMunicipio'
  | 'origenCalle'
  | 'destinoCalle'
  | 'origenColonia'
  | 'destinoColonia'
  | 'placasCustodia'
  | 'operadorNombre'
  | 'operadorCelular'
  | 'responsableOrigen'
  | 'responsableDestino';

export type UbicacionSugerida = {
  id: string;
  label: string;
  ubicacion: Ubicacion;
  kind: 'reciente' | 'favorito';
};

type Index = Record<SuggestionField, string[]>;
type RecentIndex = { origen: UbicacionSugerida[]; destino: UbicacionSugerida[] };

const EMPTY_INDEX: Index = {
  nombre: [],
  empresaContratante: [],
  folioCliente: [],
  origenEstado: [],
  origenMunicipio: [],
  destinoEstado: [],
  destinoMunicipio: [],
  origenCalle: [],
  destinoCalle: [],
  origenColonia: [],
  destinoColonia: [],
  placasCustodia: [],
  operadorNombre: [],
  operadorCelular: [],
  responsableOrigen: [],
  responsableDestino: [],
};

let cachedIndex: Index | null = null;
let cachedRecent: RecentIndex | null = null;
let cacheUserId: string | null = null;

function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

function pushUbicacion(
  list: UbicacionSugerida[],
  seen: Set<string>,
  ubicacion: Ubicacion,
  kind: UbicacionSugerida['kind'],
  limit: number,
) {
  if (!hasUbicacionMinima(ubicacion)) return;
  const fp = ubicacionFingerprint(ubicacion);
  if (seen.has(fp)) return;
  seen.add(fp);
  list.push({
    id: `${kind}-${fp}`,
    label: ubicacionDisplayLabel(ubicacion),
    ubicacion: cloneUbicacion(ubicacion),
    kind,
  });
  if (list.length > limit) list.pop();
}

function buildRecentUbicaciones(formularios: BitacoraFormulario[]): RecentIndex {
  const origen: UbicacionSugerida[] = [];
  const destino: UbicacionSugerida[] = [];
  const seenOrigen = new Set<string>();
  const seenDestino = new Set<string>();

  for (const f of formularios) {
    pushUbicacion(origen, seenOrigen, f.origen, 'reciente', 8);
    pushUbicacion(destino, seenDestino, f.destino, 'reciente', 8);
  }

  return { origen, destino };
}

function buildIndex(formularios: BitacoraFormulario[]): Index {
  return {
    nombre: uniq(formularios.map((f) => f.nombre)),
    empresaContratante: uniq(formularios.map((f) => f.empresaContratante)),
    folioCliente: uniq(formularios.map((f) => f.folioCliente)),
    origenEstado: uniq(formularios.map((f) => f.origen.estado)),
    origenMunicipio: uniq(formularios.map((f) => f.origen.municipio)),
    destinoEstado: uniq(formularios.map((f) => f.destino.estado)),
    destinoMunicipio: uniq(formularios.map((f) => f.destino.municipio)),
    origenCalle: uniq(formularios.map((f) => f.origen.calle ?? '')),
    destinoCalle: uniq(formularios.map((f) => f.destino.calle ?? '')),
    origenColonia: uniq(formularios.map((f) => f.origen.colonia ?? '')),
    destinoColonia: uniq(formularios.map((f) => f.destino.colonia ?? '')),
    placasCustodia: uniq(formularios.map((f) => f.vehiculoCustodia.placas)),
    operadorNombre: uniq(formularios.map((f) => f.operador1.nombre)),
    operadorCelular: uniq(formularios.map((f) => f.operador1.celular)),
    responsableOrigen: uniq(formularios.map((f) => f.responsableOrigen.nombre)),
    responsableDestino: uniq(formularios.map((f) => f.responsableDestino.nombre)),
  };
}

/**
 * Sugerencias tipo Google: indice local desde las ultimas bitacoras del custodio.
 * Una sola consulta al montar el wizard; filtrado en memoria (sin peticiones por tecla).
 */
export function useBitacoraSuggestions(userId: string | undefined) {
  const { getRecentFormularios } = useBitacora();
  const [index, setIndex] = useState<Index>(cachedIndex ?? EMPTY_INDEX);
  const [recent, setRecent] = useState<RecentIndex>(
    cachedRecent ?? { origen: [], destino: [] },
  );
  const [ready, setReady] = useState(Boolean(cachedIndex && cacheUserId === userId));

  useEffect(() => {
    if (!userId) return;
    if (cachedIndex && cachedRecent && cacheUserId === userId) {
      setIndex(cachedIndex);
      setRecent(cachedRecent);
      setReady(true);
      return;
    }

    let cancelled = false;
    void getRecentFormularios().then((forms) => {
      if (cancelled) return;
      const built = buildIndex(forms);
      const builtRecent = buildRecentUbicaciones(forms);
      cachedIndex = built;
      cachedRecent = builtRecent;
      cacheUserId = userId;
      setIndex(built);
      setRecent(builtRecent);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, getRecentFormularios]);

  const filter = useCallback(
    (field: SuggestionField, query: string, limit = 5): string[] => {
      const q = query.trim().toLowerCase();
      if (q.length < 1) return [];
      return index[field]
        .filter((item) => item.toLowerCase().includes(q))
        .slice(0, limit);
    },
    [index],
  );

  const invalidateCache = useCallback(() => {
    cachedIndex = null;
    cachedRecent = null;
    cacheUserId = null;
  }, []);

  return { filter, recent, ready, invalidateCache };
}

export function clearBitacoraSuggestionsCache() {
  cachedIndex = null;
  cachedRecent = null;
  cacheUserId = null;
}
