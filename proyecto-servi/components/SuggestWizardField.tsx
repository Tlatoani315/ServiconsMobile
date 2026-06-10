import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { WizardField } from './WizardField';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  suggestions?: string[];
};

/** Campo de texto con sugerencias locales (filtrado en memoria, sin API por tecla) */
export function SuggestWizardField({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  keyboardType,
  suggestions = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const showList = open && suggestions.length > 0 && value.trim().length > 0;

  const onFocus = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
  }, []);

  const onBlur = useCallback(() => {
    blurTimer.current = setTimeout(() => setOpen(false), 180);
  }, []);

  const pick = useCallback(
    (item: string) => {
      onChangeText(item);
      setOpen(false);
    },
    [onChangeText],
  );

  return (
    <View className="mb-4">
      <WizardField
        label={label}
        value={value}
        onChangeText={(t) => {
          onChangeText(t);
          setOpen(true);
        }}
        placeholder={placeholder}
        required={required}
        keyboardType={keyboardType}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      {showList ? (
        <View className="mt-1 overflow-hidden rounded-xl border border-servi-borde bg-servi-superficie">
          <Text className="border-b border-servi-borde px-3 py-2 text-[10px] uppercase text-servi-suave">
            Sugerencias de tus bitacoras anteriores
          </Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 4}
            style={{ maxHeight: 168 }}
            renderItem={({ item }) => (
              <Pressable
                className="border-b border-servi-borde/40 px-3 py-3 active:bg-servi-fondo"
                onPress={() => pick(item)}
              >
                <Text className="text-base text-servi-texto">{item}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}
    </View>
  );
}
