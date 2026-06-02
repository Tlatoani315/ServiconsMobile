import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacora } from '../../../../hooks/useBitacora';
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
      Alert.alert('Error', 'No hay sesión activa.');
      return;
    }

    setSaving(true);
    const ok = await createBitacora(formulario, userId);
    setSaving(false);

    if (!ok) {
      Alert.alert('Error al guardar', error ?? 'No se pudo crear la bitácora.');
      return;
    }

    resetFormulario();
    Alert.alert('Bitácora creada', 'El servicio quedó registrado como pendiente.', [
      { text: 'OK', onPress: () => router.replace('/(app)/home') },
    ]);
  };

  return (
    <WizardShell
      title="Observaciones y confirmación"
      step={7}
      onNext={crear}
      nextLabel={saving || loading ? 'Guardando...' : 'Crear bitácora'}
    >
      {saving || loading ? <ActivityIndicator color="#F0B429" className="mb-4" /> : null}
      <WizardField
        label="Observaciones"
        value={formulario.observaciones}
        onChangeText={(v) => updateFormulario({ observaciones: v })}
        multiline
      />
    </WizardShell>
  );
}
