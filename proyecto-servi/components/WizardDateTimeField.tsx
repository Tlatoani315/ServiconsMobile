import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import {
  defaultPickerDate,
  formatDateTimeDisplay,
  formatDateTimeStorage,
  mergeDatePart,
  mergeTimePart,
  startOfToday,
} from '../lib/dateTimeHelpers';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
};

type PickerStep = 'idle' | 'date' | 'time' | 'ios';

function isConfirmedAndroidEvent(event: DateTimePickerEvent): boolean {
  // Android API 33+ distingue set/dismissed; versiones anteriores solo envian set implicito
  return event.type !== 'dismissed';
}

export function WizardDateTimeField({
  label,
  value,
  onChange,
  required,
  placeholder = 'Elegir fecha y hora',
}: Props) {
  const [step, setStep] = useState<PickerStep>('idle');
  const [draft, setDraft] = useState(() => defaultPickerDate(value));
  const draftRef = useRef(draft);
  /** Ignora dismissed al desmontar el picker de fecha al pasar al de hora */
  const skipNextDateDismissRef = useRef(false);
  const minDate = startOfToday();
  const hasValue = Boolean(value?.trim());

  const syncDraft = (next: Date) => {
    draftRef.current = next;
    setDraft(next);
  };

  const open = () => {
    const next = defaultPickerDate(value);
    syncDraft(next);
    skipNextDateDismissRef.current = false;
    setStep(Platform.OS === 'ios' ? 'ios' : 'date');
  };

  const close = () => {
    skipNextDateDismissRef.current = false;
    setStep('idle');
  };

  const commit = (date: Date) => {
    onChange(formatDateTimeStorage(date));
    close();
  };

  const onAndroidDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      if (skipNextDateDismissRef.current) {
        skipNextDateDismissRef.current = false;
        return;
      }
      close();
      return;
    }

    if (!isConfirmedAndroidEvent(event) || !selected) return;

    const merged = mergeDatePart(draftRef.current, selected);
    syncDraft(merged);
    skipNextDateDismissRef.current = true;
    setStep('time');
  };

  const onAndroidTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      close();
      return;
    }

    if (!isConfirmedAndroidEvent(event) || !selected) return;

    commit(mergeTimePart(draftRef.current, selected));
  };

  const onIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) syncDraft(selected);
  };

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-servi-suave">
        {label}
        {required ? ' *' : ''}
      </Text>

      <View className="flex-row items-center gap-2">
        <Pressable
          className="min-h-[48px] flex-1 flex-row items-center rounded-xl border border-servi-borde bg-servi-fondo px-4 py-3 active:opacity-90"
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Ionicons name="calendar-outline" size={20} color="#F97316" />
          <Text
            className={`ml-3 flex-1 text-base ${hasValue ? 'text-servi-texto' : 'text-servi-suave'}`}
            numberOfLines={2}
          >
            {hasValue ? formatDateTimeDisplay(value) : placeholder}
          </Text>
          <Ionicons name="time-outline" size={18} color="#94A3B8" />
        </Pressable>

        {!required && hasValue ? (
          <Pressable
            className="rounded-xl border border-servi-borde bg-servi-fondo p-3 active:opacity-90"
            onPress={() => onChange('')}
            accessibilityLabel="Limpiar fecha"
          >
            <Ionicons name="close-circle-outline" size={22} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'android' && step === 'date' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="calendar"
          minimumDate={minDate}
          onChange={onAndroidDateChange}
        />
      ) : null}

      {Platform.OS === 'android' && step === 'time' ? (
        <DateTimePicker
          value={draft}
          mode="time"
          display="clock"
          is24Hour
          onChange={onAndroidTimeChange}
        />
      ) : null}

      {Platform.OS === 'ios' && step === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={close}>
          <Pressable className="flex-1 justify-end bg-black/55" onPress={close}>
            <Pressable className="rounded-t-3xl bg-servi-superficie px-4 pb-10 pt-4" onPress={() => {}}>
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable onPress={close} className="py-2">
                  <Text className="text-base text-servi-suave">Cancelar</Text>
                </Pressable>
                <Text className="max-w-[50%] text-center text-base font-semibold text-servi-texto">
                  {label}
                </Text>
                <Pressable onPress={() => commit(draftRef.current)} className="py-2">
                  <Text className="text-base font-semibold text-servi-acento">Listo</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="datetime"
                display="spinner"
                minimumDate={minDate}
                locale="es-MX"
                onChange={onIosChange}
                themeVariant="dark"
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
