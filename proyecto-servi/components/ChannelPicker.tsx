import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { BitacoraContactos } from '../types/models';
import {
  getChannelKindLabel,
  getChannels,
  type N8nChannel,
} from '../services/n8nService';

type Props = {
  value: BitacoraContactos;
  onChange: (contactos: BitacoraContactos) => void;
  label?: string;
};

/** Selector al crear bitacora: lista desde GET /webhook/get-channels (n8n) */
export function ChannelPicker({
  value,
  onChange,
  label = 'Contactos WhatsApp del servicio',
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<N8nChannel[]>([]);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getChannels();

    if (!result.success || !result.data) {
      setError(result.error ?? 'No se pudieron cargar contactos desde n8n');
      setChannels([]);
    } else {
      setChannels(result.data);
      setError(result.data.length === 0 ? 'No hay contactos ni grupos disponibles' : null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const toggle = (channel: N8nChannel) => {
    const selected = value.some((c) => c.remoteJid === channel.remoteJid);
    if (selected) {
      onChange(value.filter((c) => c.remoteJid !== channel.remoteJid));
      return;
    }
    onChange([...value, channel]);
  };

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-servi-texto">{label}</Text>
          <Text className="mt-1 text-xs text-servi-suave">
            Lista obtenida de n8n (get-channels). Puedes elegir contactos y/o grupos; se
            guardan al crear la bitacora.
          </Text>
        </View>
        {!loading ? (
          <Pressable
            className="rounded-lg border border-servi-borde px-2 py-1 active:opacity-70"
            onPress={loadChannels}
          >
            <Text className="text-xs text-servi-acento">Actualizar</Text>
          </Pressable>
        ) : null}
      </View>

      {value.length > 0 ? (
        <View className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <Text className="text-xs font-semibold text-emerald-300">
            Seleccionados ({value.length})
          </Text>
          <Text className="mt-0.5 text-sm text-servi-texto">
            {value.map((c) => c.pushName).join(' · ')}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View className="items-center rounded-2xl border border-servi-borde bg-servi-superficie py-8">
          <ActivityIndicator color="#F97316" />
          <Text className="mt-2 text-sm text-servi-suave">Cargando contactos desde n8n...</Text>
        </View>
      ) : error ? (
        <View className="rounded-2xl border border-servi-peligro/40 bg-servi-peligro/10 p-4">
          <Text className="text-sm text-servi-peligro">{error}</Text>
          <Text className="mt-1 text-xs text-servi-suave">
            Endpoint: GET /webhook/get-channels · Revisa [n8n/get-channels] en la consola de Expo
          </Text>
          <Pressable className="mt-3 self-start active:opacity-70" onPress={loadChannels}>
            <Text className="text-sm font-semibold text-servi-acento">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-2">
          {channels.map((channel) => {
            const selected = value.some((c) => c.remoteJid === channel.remoteJid);
            const kind = getChannelKindLabel(channel.remoteJid);
            const isGroup = channel.remoteJid.endsWith('@g.us');

            return (
              <Pressable
                key={channel.remoteJid}
                className={`flex-row items-center rounded-2xl border p-4 active:opacity-90 ${
                  selected
                    ? 'border-servi-acento bg-servi-acento/15'
                    : 'border-servi-borde bg-servi-superficie'
                }`}
                onPress={() => toggle(channel)}
              >
                <View
                  className={`mr-3 h-11 w-11 items-center justify-center rounded-xl ${
                    selected ? 'bg-servi-acento' : 'bg-emerald-100'
                  }`}
                >
                  <Ionicons
                    name={isGroup ? 'people' : 'person'}
                    size={22}
                    color={selected ? '#FFF' : '#16A34A'}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-semibold text-servi-texto">{channel.pushName}</Text>
                    <View className="rounded-full bg-servi-fondo px-2 py-0.5">
                      <Text className="text-[10px] text-servi-suave">{kind}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-servi-suave" numberOfLines={1}>
                    {channel.remoteJid}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color="#F97316" />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color="#64748B" />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
