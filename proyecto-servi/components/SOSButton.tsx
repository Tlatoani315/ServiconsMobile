import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type Props = {
  onConfirm: () => void;
  disabled?: boolean;
  floating?: boolean;
};

export function SOSButton({ onConfirm, disabled, floating = false }: Props) {
  const [visible, setVisible] = useState(false);

  const confirm = () => {
    setVisible(false);
    onConfirm();
  };

  const button = (
    <Pressable
      className={`my-2 items-center justify-center rounded-full bg-rose-500 active:opacity-90 ${
        floating
          ? 'h-16 w-16 shadow-lg shadow-rose-900/40'
          : 'min-w-[100px] rounded-2xl px-4 py-4'
      } ${disabled ? 'opacity-50' : ''}`}
      onPress={() => setVisible(true)}
      disabled={disabled}
    >
      <Ionicons name="warning" size={floating ? 32 : 36} color="#FFF" />
      <Text className={`font-black tracking-widest text-white ${floating ? 'text-sm' : 'text-2xl'}`}>
        SOS
      </Text>
      {!floating ? (
        <Text className="text-xs text-red-100">Emergencia · toca para confirmar</Text>
      ) : null}
    </Pressable>
  );

  return (
    <>
      {button}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/80 px-6">
          <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-red-500/50 bg-servi-superficie">
            <View className="items-center bg-red-600 px-6 py-8">
              <Ionicons name="alert-circle" size={56} color="#FFF" />
              <Text className="mt-3 text-2xl font-black text-white">ALERTA SOS</Text>
            </View>
            <View className="px-6 py-5">
              <Text className="text-center text-base text-servi-texto">
                Esta accion alertara a administradores con tu ubicacion GPS actual.
              </Text>
              <Text className="mt-2 text-center text-sm text-servi-suave">
                Solo usa en emergencia real.
              </Text>
            </View>
            <View className="flex-row gap-3 border-t border-servi-borde px-4 py-4">
              <Pressable
                className="flex-1 items-center rounded-xl bg-servi-borde py-3 active:opacity-80"
                onPress={() => setVisible(false)}
              >
                <Text className="font-semibold text-servi-texto">Cancelar</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-red-600 py-3 active:opacity-80"
                onPress={confirm}
              >
                <Text className="font-bold text-white">CONFIRMAR SOS</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
