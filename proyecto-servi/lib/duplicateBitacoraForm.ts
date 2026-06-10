import type { BitacoraFormulario, OperadorCustodiado, Tiempos } from '../types/models';
import { generateUUID } from './uuid';
import { createEmptyFormulario } from '../store/useBitacoraStore';

const EMPTY_TIEMPOS: Tiempos = {
  fechaHoraCita: '',
  odometroInicial: '',
};

function stripOperadorFirma(op: OperadorCustodiado): OperadorCustodiado {
  return { ...op, firma: '' };
}

/** Clona formulario para reutilizar: sin fechas ni firmas, nuevo id */
export function cloneFormularioForReuse(source: BitacoraFormulario): BitacoraFormulario {
  const now = new Date().toISOString();
  const base = createEmptyFormulario();

  return {
    ...base,
    id: generateUUID(),
    nombre: source.nombre ? `${source.nombre} (copia)` : '',
    empresaContratante: source.empresaContratante ?? '',
    folioCliente: source.folioCliente ?? '',
    origen: { ...source.origen },
    destino: { ...source.destino },
    vehiculoCustodia: { ...source.vehiculoCustodia },
    tiempos: {
      ...EMPTY_TIEMPOS,
      odometroInicial: source.tiempos?.odometroInicial ?? '',
    },
    responsableOrigen: { nombre: source.responsableOrigen?.nombre ?? '', firma: '' },
    responsableDestino: { nombre: source.responsableDestino?.nombre ?? '', firma: '' },
    operador1: stripOperadorFirma(source.operador1 ?? base.operador1),
    operador2: source.operador2 ? stripOperadorFirma(source.operador2) : undefined,
    observaciones: '',
    reportIntervalMinutes: source.reportIntervalMinutes ?? 15,
    contactos: source.contactos ? [...source.contactos] : [],
    whatsappGrupo: source.whatsappGrupo ?? null,
    firmaCustodio: '',
    createdAt: now,
    updatedAt: now,
  };
}
