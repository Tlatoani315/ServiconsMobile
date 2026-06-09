import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  title?: string;
  onCapture: (uri: string) => void;
  onClose: () => void;
};

/** Camara dentro de la app — evita salir a la app del sistema (recarga en Android/Expo Go). */
export function InAppCameraModal({ visible, title, onCapture, onClose }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  const snap = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (photo?.uri) onCapture(photo.uri);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {!permission ? (
          <SafeAreaView className="flex-1 items-center justify-center">
            <ActivityIndicator color="#22C55E" size="large" />
          </SafeAreaView>
        ) : !permission.granted ? (
          <SafeAreaView className="flex-1 items-center justify-center px-6">
            <Text className="mb-2 text-center text-lg font-semibold text-white">Camara requerida</Text>
            <Text className="mb-6 text-center text-sm text-white/70">
              La evidencia se captura dentro de Servicons, sin abrir otra app.
            </Text>
            <Pressable
              className="rounded-2xl bg-emerald-600 px-8 py-4 active:opacity-90"
              onPress={requestPermission}
            >
              <Text className="font-bold text-white">Permitir camara</Text>
            </Pressable>
            <Pressable className="mt-5 py-2" onPress={onClose}>
              <Text className="text-white/60">Cancelar</Text>
            </Pressable>
          </SafeAreaView>
        ) : (
          <>
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
            <SafeAreaView className="absolute bottom-0 left-0 right-0 bg-black/50 pb-2 pt-3">
              {title ? (
                <Text className="mb-4 text-center text-sm font-medium text-white">{title}</Text>
              ) : null}
              <View className="flex-row items-center justify-around px-8">
                <Pressable
                  className="rounded-xl bg-white/15 px-5 py-3 active:opacity-80"
                  onPress={onClose}
                  disabled={capturing}
                >
                  <Text className="font-semibold text-white">Cancelar</Text>
                </Pressable>
                <Pressable
                  className="h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white active:opacity-90"
                  onPress={snap}
                  disabled={capturing}
                >
                  {capturing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View className="h-14 w-14 rounded-full bg-emerald-500" />
                  )}
                </Pressable>
                <View className="w-[88px]" />
              </View>
            </SafeAreaView>
          </>
        )}
      </View>
    </Modal>
  );
}
