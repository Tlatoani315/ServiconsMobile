import { Modal, Pressable, Text, View } from 'react-native';

import type { BitacoraDetalle } from '../hooks/useBitacora';

type Props = {
  visible: boolean;
  bitacora: BitacoraDetalle | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

/** Pantalla 4 — Modal de confirmacion de custodia */
export function CustodyConfirmModal({ visible, bitacora, onCancel, onConfirm, loading }: Props) {
  const operador = bitacora?.formulario?.operador1?.nombre ?? '—';
  const contacto = bitacora?.formulario?.operador1?.celular ?? '—';
  const cliente = bitacora?.empresa_contratante ?? '—';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/75 px-5">
        <View className="w-full max-w-md overflow-hidden rounded-3xl border border-servi-borde bg-servi-superficie">
          <View className="bg-emerald-700 px-5 py-4">
            <Text className="text-lg font-bold text-white">Confirmar custodia</Text>
            <Text className="text-sm text-emerald-100">Revisa los datos antes de iniciar</Text>
          </View>

          <View className="gap-3 p-5">
            <Row label="Operador" value={operador} />
            <Row label="Ruta" value={bitacora?.ruta ?? '—'} />
            <Row label="Contacto" value={contacto} />
            <Row label="Cliente" value={cliente} />
            <Row label="Unidad" value={bitacora?.unidad ?? '—'} />
          </View>

          <View className="flex-row gap-3 border-t border-servi-borde p-4">
            <Pressable
              className="flex-1 items-center rounded-xl border border-servi-borde py-3 active:opacity-80"
              onPress={onCancel}
              disabled={loading}
            >
              <Text className="font-semibold text-servi-texto">Cancelar</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl bg-emerald-600 py-3 active:opacity-80"
              onPress={onConfirm}
              disabled={loading}
            >
              <Text className="font-bold text-white">{loading ? 'Iniciando...' : 'Iniciar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[10px] uppercase text-servi-suave">{label}</Text>
      <Text className="text-base font-medium text-servi-texto">{value}</Text>
    </View>
  );
}
