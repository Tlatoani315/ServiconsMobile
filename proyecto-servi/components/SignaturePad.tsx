import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  hasValidStroke,
  SIGNATURE_CANVAS,
  strokesToSvgDataUrl,
  type StrokePoint,
} from '../lib/signatures';

type Props = {
  label: string;
  value: string;
  onCapture: (base64DataUrl: string) => void;
};

export function SignaturePad({ label, value, onCapture }: Props) {
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const currentStrokeRef = useRef<StrokePoint[]>([]);
  const [, forceRender] = useState(0);

  const allStrokes = useMemo(() => {
    const current = currentStrokeRef.current;
    return current.length > 1 ? [...strokes, current] : strokes;
  }, [strokes, forceRender]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          currentStrokeRef.current = [{ x: locationX, y: locationY }];
          forceRender((n) => n + 1);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          currentStrokeRef.current = [
            ...currentStrokeRef.current,
            { x: locationX, y: locationY },
          ];
          forceRender((n) => n + 1);
        },
        onPanResponderRelease: () => {
          if (currentStrokeRef.current.length > 1) {
            setStrokes((prev) => [...prev, currentStrokeRef.current]);
          }
          currentStrokeRef.current = [];
          forceRender((n) => n + 1);
        },
      }),
    [],
  );

  const clearPad = () => {
    currentStrokeRef.current = [];
    setStrokes([]);
    onCapture('');
    forceRender((n) => n + 1);
  };

  const saveSignature = () => {
    if (!hasValidStroke(allStrokes)) return;
    onCapture(strokesToSvgDataUrl(allStrokes));
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-servi-suave">{label}</Text>

      <View
        className="overflow-hidden rounded-xl border border-dashed border-servi-borde bg-white"
        style={{ height: SIGNATURE_CANVAS.height }}
        {...panResponder.panHandlers}
      >
        <Svg width={SIGNATURE_CANVAS.width} height={SIGNATURE_CANVAS.height}>
          {allStrokes.map((stroke, index) => {
            if (stroke.length < 2) return null;
            const path = stroke.reduce(
              (acc, point, pointIndex) =>
                pointIndex === 0
                  ? `M ${point.x} ${point.y}`
                  : `${acc} L ${point.x} ${point.y}`,
              '',
            );
            return (
              <Path
                key={`stroke-${index}`}
                d={path}
                stroke="#0B1F17"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </Svg>

        {!value && allStrokes.length === 0 ? (
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-sm text-servi-suave">Firma aqui con el dedo</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-2 flex-row gap-2">
        <Pressable
          className="flex-1 items-center rounded-lg border border-servi-borde py-2 active:opacity-80"
          onPress={clearPad}
        >
          <Text className="text-sm text-servi-suave">Limpiar</Text>
        </Pressable>
        <Pressable
          className="flex-1 items-center rounded-lg bg-servi-acento py-2 active:opacity-90"
          onPress={saveSignature}
        >
          <Text className="text-sm font-semibold text-servi-fondo">
            {value ? 'Firma guardada' : 'Guardar firma'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
