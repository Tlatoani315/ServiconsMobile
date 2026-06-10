import { create } from 'zustand';

import { generateUUID } from '../lib/uuid';
import type { BitacoraFormulario } from '../types/models';

const emptyVehiculoOperador = () => ({
  modelo: '',
  color: '',
  placas: '',
  marca: '',
  placaRemolque1: '',
  numEco: '',
  sellos: '',
  ecoTracto: '',
  pedimento: '',
  placaRemolque2: '',
  empresaTransporte: '',
});

const emptyOperador = () => ({
  nombre: '',
  firma: '',
  celular: '',
  vehiculo: emptyVehiculoOperador(),
});

export function createEmptyFormulario(): BitacoraFormulario {
  const now = new Date().toISOString();
  const id = generateUUID();
  return {
    id,
    nombre: '',
    empresaContratante: '',
    folioCliente: '',
    origen: { estado: '', municipio: '', personalAsignado: '' },
    destino: { estado: '', municipio: '', personalAsignado: '' },
    vehiculoCustodia: { placas: '', color: '', celular: '' },
    tiempos: { fechaHoraCita: '', odometroInicial: '' },
    responsableOrigen: { nombre: '', firma: '' },
    responsableDestino: { nombre: '', firma: '' },
    operador1: emptyOperador(),
    observaciones: '',
    reportIntervalMinutes: 15,
    contactos: [],
    whatsappGrupo: null,
    firmaCustodio: '',
    createdAt: now,
    updatedAt: now,
  };
}

type BitacoraStore = {
  formulario: BitacoraFormulario;
  setField: <K extends keyof BitacoraFormulario>(key: K, value: BitacoraFormulario[K]) => void;
  updateFormulario: (partial: Partial<BitacoraFormulario>) => void;
  resetFormulario: () => void;
};

export const useBitacoraStore = create<BitacoraStore>((set) => ({
  formulario: createEmptyFormulario(),
  setField: (key, value) =>
    set((state) => ({
      formulario: { ...state.formulario, [key]: value, updatedAt: new Date().toISOString() },
    })),
  updateFormulario: (partial) =>
    set((state) => ({
      formulario: { ...state.formulario, ...partial, updatedAt: new Date().toISOString() },
    })),
  resetFormulario: () => set({ formulario: createEmptyFormulario() }),
}));
