import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Image,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  hasValidStroke,
  strokesToSvgDataUrl,
  type StrokePoint,
} from '../lib/signatures';

type Props = {
  label: string;
  value: string;
  onCapture: (base64DataUrl: string) => void;
  onDrawingChange?: (drawing: boolean) => void;
};

type CanvasProps = {
  strokes: StrokePoint[][];
  setStrokes: Dispatch<SetStateAction<StrokePoint[][]>>;
  canvasSize: { width: number; height: number };
  onDrawingChange?: (drawing: boolean) => void;
};

function SignatureCanvas({ strokes, setStrokes, canvasSize, onDrawingChange }: CanvasProps) {
  const strokesRef = useRef(strokes);
  const currentStrokeRef = useRef<StrokePoint[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const allStrokes = useMemo(() => {
    const current = currentStrokeRef.current;
    return current.length > 1 ? [...strokes, current] : strokes;
  }, [strokes, tick]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          onDrawingChange?.(true);
          const { locationX, locationY } = event.nativeEvent;
          currentStrokeRef.current = [{ x: locationX, y: locationY }];
          setTick((n) => n + 1);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          currentStrokeRef.current = [...currentStrokeRef.current, { x: locationX, y: locationY }];
          setTick((n) => n + 1);
        },
        onPanResponderRelease: () => {
          onDrawingChange?.(false);
          if (currentStrokeRef.current.length > 1) {
            const next = [...strokesRef.current, [...currentStrokeRef.current]];
            strokesRef.current = next;
            setStrokes(next);
          }
          currentStrokeRef.current = [];
          setTick((n) => n + 1);
        },
        onPanResponderTerminate: () => {
          onDrawingChange?.(false);
        },
      }),
    [onDrawingChange, setStrokes],
  );

  return (
    <View className="flex-1 bg-white" {...panResponder.panHandlers}>
      <Svg
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        {allStrokes.map((stroke, index) => {
          if (stroke.length < 2) return null;
          const path = stroke.reduce(
            (acc, point, pointIndex) =>
              pointIndex === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`,
            '',
          );
          return (
            <Path
              key={`stroke-${index}`}
              d={path}
              stroke="#111827"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </Svg>

      {allStrokes.length === 0 ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <Ionicons name="create-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-base text-gray-400">Dibuja tu firma con el dedo</Text>
        </View>
      ) : null}
    </View>
  );
}

type FullScreenProps = {
  visible: boolean;
  label: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  onDrawingChange?: (drawing: boolean) => void;
};

function FullScreenSignatureModal({
  visible,
  label,
  onClose,
  onSave,
  onDrawingChange,
}: FullScreenProps) {
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const strokesRef = useRef<StrokePoint[][]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 320, height: 400 });

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    if (visible) {
      setStrokes([]);
      strokesRef.current = [];
    }
  }, [visible]);

  useEffect(() => {
    if (visible) onDrawingChange?.(false);
    else onDrawingChange?.(false);
  }, [visible, onDrawingChange]);

  const clearCanvas = useCallback(() => {
    strokesRef.current = [];
    setStrokes([]);
  }, []);

  const saveSignature = useCallback(() => {
    const current = strokesRef.current;
    if (!hasValidStroke(current)) return;
    const dataUrl = strokesToSvgDataUrl(current, canvasSize.width, canvasSize.height);
    onSave(dataUrl);
  }, [canvasSize.height, canvasSize.width, onSave]);

  const canSave = hasValidStroke(strokes);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-servi-fondo" edges={['top', 'bottom', 'left', 'right']}>
        <View className="flex-row items-center justify-between border-b border-servi-borde bg-servi-superficie px-2 py-2">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full active:bg-servi-fondo"
              onPress={onClose}
              accessibilityLabel="Volver"
            >
              <Ionicons name="arrow-back" size={24} color="#F97316" />
            </Pressable>

            <Text className="flex-1 px-2 text-center text-base font-bold text-servi-texto" numberOfLines={2}>
              {label}
            </Text>

            <View className="flex-row items-center">
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full active:bg-servi-fondo"
                onPress={clearCanvas}
                accessibilityLabel="Borrar firma"
              >
                <Ionicons name="trash-outline" size={22} color="#F87171" />
              </Pressable>
              <Pressable
                className={`ml-1 h-11 w-11 items-center justify-center rounded-full ${
                  canSave ? 'bg-emerald-600' : 'bg-servi-borde'
                }`}
                onPress={saveSignature}
                disabled={!canSave}
                accessibilityLabel="Guardar firma"
              >
                <Ionicons name="checkmark" size={26} color={canSave ? '#FFFFFF' : '#64748B'} />
              </Pressable>
            </View>
          </View>

          <View
            className="mx-3 mt-3 flex-1 overflow-hidden rounded-2xl border-2 border-gray-200"
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              if (w > 0 && h > 0) setCanvasSize({ width: w, height: h });
            }}
          >
            <SignatureCanvas
              strokes={strokes}
              setStrokes={setStrokes}
              canvasSize={canvasSize}
              onDrawingChange={onDrawingChange}
            />
          </View>

          <Text className="px-4 py-2 text-center text-xs text-servi-suave">
            Usa la palomita para guardar · basura para borrar · flecha para cancelar
          </Text>
        </SafeAreaView>
      </Modal>
  );
}

export function SignaturePad({ label, value, onCapture, onDrawingChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const saved = Boolean(value?.trim());

  const openModal = () => setModalOpen(true);

  const closeModal = () => {
    setModalOpen(false);
    onDrawingChange?.(false);
  };

  const handleSave = (dataUrl: string) => {
    onCapture(dataUrl);
    setModalOpen(false);
    onDrawingChange?.(false);
  };

  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold text-servi-texto">{label}</Text>

      {saved ? (
        <View className="overflow-hidden rounded-xl border-2 border-emerald-500 bg-servi-superficie">
          <View className="flex-row items-center gap-2 border-b border-emerald-500/30 bg-emerald-500/15 px-3 py-2.5">
            <Ionicons name="checkmark-circle" size={18} color="#34D399" />
            <Text className="flex-1 text-sm font-bold text-emerald-400">Firma guardada</Text>
            <Pressable
              className="flex-row items-center gap-1 rounded-lg bg-servi-fondo px-3 py-1.5 active:opacity-90"
              onPress={openModal}
            >
              <Ionicons name="create-outline" size={16} color="#F97316" />
              <Text className="text-xs font-semibold text-servi-acento">Editar</Text>
            </Pressable>
          </View>
          <View className="h-28 items-center justify-center bg-white">
            {value.startsWith('data:image') ? (
              <Image source={{ uri: value }} className="h-full w-full" resizeMode="contain" />
            ) : (
              <Text className="text-xs text-gray-400">Vista previa no disponible</Text>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-servi-borde bg-servi-superficie py-6 active:opacity-90"
          onPress={openModal}
        >
          <Ionicons name="expand-outline" size={22} color="#F97316" />
          <Text className="text-base font-semibold text-servi-acento">Firmar en pantalla completa</Text>
        </Pressable>
      )}

      <FullScreenSignatureModal
        visible={modalOpen}
        label={label}
        onClose={closeModal}
        onSave={handleSave}
        onDrawingChange={onDrawingChange}
      />
    </View>
  );
}
