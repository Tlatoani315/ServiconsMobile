import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { ProfileModal } from './ProfileModal';
import { UserAvatar } from './UserAvatar';

type Props = {
  title: string;
};

export function DashboardHeader({ title }: Props) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <View
        className="relative bg-servi-fondo px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center">
          <Pressable
            className="active:opacity-70"
            onPress={() => setProfileOpen(true)}
            accessibilityLabel="Ver mi perfil"
          >
            <UserAvatar size={36} />
          </Pressable>

          <Text className="ml-3 flex-1 text-base font-semibold text-servi-texto" numberOfLines={1}>
            {title}
          </Text>

          <Pressable
            className="p-2 active:opacity-60"
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Abrir menu"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#A7C4B5" />
          </Pressable>
        </View>

        <View className="mt-3 h-px bg-servi-borde/40" />

        {menuOpen ? (
          <Pressable className="absolute inset-0 z-10" onPress={closeMenu} />
        ) : null}

        {menuOpen ? (
          <View className="absolute right-3 z-20 mt-12 min-w-[190px] overflow-hidden rounded-xl border border-servi-borde bg-servi-superficie">
            <MenuItem
              icon="person-outline"
              label="Mi informacion"
              onPress={() => {
                closeMenu();
                setProfileOpen(true);
              }}
            />
            <View className="h-px bg-servi-borde/50" />
            <MenuItem
              icon="settings-outline"
              label="Configuracion"
              onPress={() => {
                closeMenu();
                Alert.alert('Configuracion', 'Esta seccion estara disponible pronto.');
              }}
            />
            <View className="h-px bg-servi-borde/50" />
            <MenuItem
              icon="log-out-outline"
              label="Cerrar sesion"
              onPress={() => {
                closeMenu();
                Alert.alert('Cerrar sesion', 'Deseas salir de tu cuenta?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', style: 'destructive', onPress: () => signOut() },
                ]);
              }}
              danger
            />
          </View>
        ) : null}
      </View>

      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      className="flex-row items-center gap-3 px-4 py-3 active:bg-servi-fondo"
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={danger ? '#DC2626' : '#A7C4B5'} />
      <Text className={`text-sm ${danger ? 'text-servi-peligro' : 'text-servi-texto'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MenuCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress?: () => void;
}) {
  const interactive = Boolean(onPress);

  return (
    <Pressable
      className={`mb-3 flex-row items-center rounded-2xl border border-servi-borde bg-servi-superficie p-4 ${
        interactive ? 'active:opacity-90' : 'opacity-70'
      }`}
      onPress={onPress}
      disabled={!onPress}
    >
      {icon ? (
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-servi-fondo">
          <Ionicons name={icon} size={22} color="#F97316" />
        </View>
      ) : null}

      <View className="flex-1">
        <Text className="text-base font-semibold text-servi-texto">{title}</Text>
        <Text className="mt-0.5 text-sm text-servi-suave">{description}</Text>
      </View>

      {interactive ? (
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      ) : (
        <View className="rounded-full bg-servi-fondo px-2 py-0.5">
          <Text className="text-[10px] text-servi-suave">Pronto</Text>
        </View>
      )}
    </Pressable>
  );
}

export function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-1 bg-servi-fondo">
      <DashboardHeader title={title} />
      <View className="flex-1 px-4 pt-3">{children}</View>
    </View>
  );
}
