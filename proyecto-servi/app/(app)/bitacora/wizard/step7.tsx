import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacora } from '../../../../hooks/useBitacora';
import { generateUUID } from '../../../../lib/uuid';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep7() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { formulario, updateFormulario, resetFormulario } = useBitacoraStore();
  const { createBitacora, loading, error } = useBitacora();
  const [saving, setSaving] = useState(false);

  const crear = async () => {
    if (!userId) {
      Alert.alert('Error', 'No hay sesion activa.');
      return;
    }

    const bitacoraId = generateUUID();
    const payload = {
      ...formulario,
      id: bitacoraId,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    const ok = await createBitacora(payload, userId);
    setSaving(false);

    if (!ok) {
      Alert.alert('Error al guardar', error ?? 'No se pudo crear la bitacora.');
      return;
    }

    resetFormulario();
    Alert.alert('Bitacora creada', 'El servicio quedo registrado como pendiente.', [
      { text: 'OK', onPress: () => router.replace('/(app)/home') },
    ]);
  };

  return (
    <WizardShell
      title="Observaciones y confirmacion"
      step={7}
      onNext={crear}
      nextLabel={saving || loading ? 'Guardando...' : 'Crear bitacora'}
    >
      {saving || loading ? <ActivityIndicator color="#F97316" className="mb-4" /> : null}

      <View className="mb-4 rounded-xl border border-servi-borde bg-servi-superficie p-3">
        <Text className="text-sm text-servi-suave">Resumen</Text>
        <Text className="mt-1 font-semibold text-servi-texto">{formulario.nombre || 'Sin nombre'}</Text>
        <Text className="text-sm text-servi-suave">
          {formulario.origen.municipio} → {formulario.destino.municipio}
        </Text>
        <Text className="text-sm text-servi-suave">
          Reportes cada {formulario.reportIntervalMinutes ?? 15} min
        </Text>
      </View>

      <WizardField
        label="Observaciones"
        value={formulario.observaciones}
        onChangeText={(v) => updateFormulario({ observaciones: v })}
        multiline
      />
    </WizardShell>
  );
}
