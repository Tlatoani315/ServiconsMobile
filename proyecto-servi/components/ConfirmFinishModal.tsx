import { Modal, Pressable, Text, View } from 'react-native';

/** Pantalla 8 — confirmacion antes de cerrar servicio */
export function ConfirmFinishModal({
  visible,
  serviceName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  serviceName?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/75 px-6">
        <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-servi-borde bg-servi-superficie">
          <View className="bg-slate-800 px-5 py-6">
            <Text className="text-xl font-bold text-white">Terminar servicio?</Text>
            <Text className="mt-2 text-sm text-slate-300">
              {serviceName ?? 'Este servicio'} pasara a cierre con foto y reporte final.
            </Text>
          </View>
          <View className="flex-row gap-3 p-4">
            <Pressable
              className="flex-1 items-center rounded-xl border border-servi-borde py-3"
              onPress={onCancel}
            >
              <Text className="font-semibold text-servi-texto">Cancelar</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl bg-slate-700 py-3"
              onPress={onConfirm}
            >
              <Text className="font-bold text-white">Terminar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
