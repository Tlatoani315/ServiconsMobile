import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  filterWhatsAppGroups,
  getChannels,
  type N8nChannel,
} from '../services/n8nService';

type Props = {
  value: N8nChannel | null;
  onChange: (channel: N8nChannel | null) => void;
  label?: string;
};

export function ChannelPicker({ value, onChange, label = 'Grupo WhatsApp del cliente' }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<N8nChannel[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const result = await getChannels();
      if (!mounted) return;

      if (!result.success || !result.data) {
        setError(result.error ?? 'No se pudieron cargar los grupos');
        setGroups([]);
      } else {
        const onlyGroups = filterWhatsAppGroups(result.data);
        setGroups(onlyGroups);
        setError(onlyGroups.length === 0 ? 'No hay grupos WhatsApp disponibles en n8n' : null);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-servi-texto">{label}</Text>
      <Text className="mb-3 text-xs text-servi-suave">
        Selecciona el grupo donde n8n enviara las alertas del servicio
      </Text>

      {loading ? (
        <View className="items-center rounded-2xl border border-servi-borde bg-servi-superficie py-8">
          <ActivityIndicator color="#F97316" />
          <Text className="mt-2 text-sm text-servi-suave">Cargando grupos desde n8n...</Text>
        </View>
      ) : error ? (
        <View className="rounded-2xl border border-servi-peligro/40 bg-servi-peligro/10 p-4">
          <Text className="text-sm text-servi-peligro">{error}</Text>
          <Text className="mt-1 text-xs text-servi-suave">
            Revisa la consola de Expo para ver el log [n8n/get-channels]
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {groups.map((group) => {
            const selected = value?.remoteJid === group.remoteJid;
            return (
              <Pressable
                key={group.remoteJid}
                className={`flex-row items-center rounded-2xl border p-4 active:opacity-90 ${
                  selected
                    ? 'border-servi-acento bg-servi-acento/15'
                    : 'border-servi-borde bg-servi-superficie'
                }`}
                onPress={() => onChange(selected ? null : group)}
              >
                <View
                  className={`mr-3 h-11 w-11 items-center justify-center rounded-xl ${
                    selected ? 'bg-servi-acento' : 'bg-emerald-100'
                  }`}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={22}
                    color={selected ? '#FFF' : '#16A34A'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-servi-texto">{group.pushName}</Text>
                  <Text className="text-xs text-servi-suave" numberOfLines={1}>
                    {group.remoteJid}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color="#F97316" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
