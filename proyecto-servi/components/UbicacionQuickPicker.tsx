import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { UbicacionSugerida } from '../hooks/useBitacoraSuggestions';

type Props = {
  recientes: UbicacionSugerida[];
  favoritos: UbicacionSugerida[];
  onSelect: (ubicacion: UbicacionSugerida['ubicacion']) => void;
};

export function UbicacionQuickPicker({ recientes, favoritos, onSelect }: Props) {
  if (!recientes.length && !favoritos.length) return null;

  return (
    <View className="mb-4">
      {favoritos.length ? (
        <PickerSection
          title="Favoritas"
          icon="star"
          iconColor="#FBBF24"
          items={favoritos}
          onSelect={onSelect}
        />
      ) : null}
      {recientes.length ? (
        <PickerSection
          title="Recientes"
          icon="time-outline"
          iconColor="#22C55E"
          items={recientes}
          onSelect={onSelect}
        />
      ) : null}
    </View>
  );
}

function PickerSection({
  title,
  icon,
  iconColor,
  items,
  onSelect,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  items: UbicacionSugerida[];
  onSelect: (ubicacion: UbicacionSugerida['ubicacion']) => void;
}) {
  return (
    <View className="mb-3">
      <View className="mb-2 flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color={iconColor} />
        <Text className="text-[10px] font-bold uppercase text-servi-suave">{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            className="mr-2 max-w-[240px] rounded-xl border border-servi-borde bg-servi-fondo px-3 py-2.5 active:opacity-90"
            onPress={() => onSelect(item.ubicacion)}
          >
            <Text className="text-sm font-semibold text-servi-texto" numberOfLines={2}>
              {item.label}
            </Text>
            {item.kind === 'favorito' && item.label !== item.ubicacion.colonia ? (
              <Text className="mt-0.5 text-[10px] text-servi-suave" numberOfLines={1}>
                CP {item.ubicacion.codigoPostal}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
