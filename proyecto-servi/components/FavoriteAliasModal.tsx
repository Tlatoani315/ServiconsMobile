import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

type Props = {
  visible: boolean;
  defaultAlias: string;
  onCancel: () => void;
  onSave: (alias: string) => void;
};

export function FavoriteAliasModal({ visible, defaultAlias, onCancel, onSave }: Props) {
  const [alias, setAlias] = useState(defaultAlias);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setAlias(defaultAlias);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [visible, defaultAlias]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-6" onPress={onCancel}>
        <Pressable
          className="w-full max-w-md rounded-2xl border border-servi-borde bg-servi-superficie p-5"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Ionicons name="star" size={20} color="#FBBF24" />
            <Text className="text-lg font-bold text-servi-texto">Guardar en favoritos</Text>
          </View>
          <Text className="mb-3 text-sm text-servi-suave">
            Ponle un nombre corto para reutilizar esta ubicacion despues.
          </Text>
          <TextInput
            ref={inputRef}
            className="mb-4 rounded-xl border border-servi-borde bg-servi-fondo px-4 py-3 text-base text-servi-texto"
            value={alias}
            onChangeText={setAlias}
            placeholder="Ej. Planta cliente, Aduana..."
            placeholderTextColor="#64748B"
            onSubmitEditing={() => onSave(alias)}
          />
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 items-center rounded-xl border border-servi-borde py-3 active:opacity-90"
              onPress={onCancel}
            >
              <Text className="font-semibold text-servi-suave">Cancelar</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl bg-servi-acento py-3 active:opacity-90"
              onPress={() => onSave(alias.trim() || defaultAlias)}
            >
              <Text className="font-bold text-white">Guardar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
