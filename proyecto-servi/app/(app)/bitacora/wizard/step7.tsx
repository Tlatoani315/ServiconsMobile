import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { SignaturePad } from '../../../../components/SignaturePad';
import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useAuth } from '../../../../hooks/useAuth';
import { clearBitacoraSuggestionsCache } from '../../../../hooks/useBitacoraSuggestions';
import { useBitacora } from '../../../../hooks/useBitacora';
import { formatContactosLabel } from '../../../../lib/bitacoraContactos';
import { validateTiemposChain } from '../../../../lib/validateBitacoraTiempos';
import { generateUUID } from '../../../../lib/uuid';
import { useAppToast } from '../../../../hooks/useAppToast';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep7() {
  const router = useRouter();
  const toast = useAppToast();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const { formulario, updateFormulario, resetFormulario } = useBitacoraStore();
  const { createBitacora, loading, error } = useBitacora();
  const [saving, setSaving] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const crear = async () => {
    if (!userId) {
      Alert.alert('Error', 'No hay sesion activa.');
      return;
    }

    const tiemposErr = validateTiemposChain(formulario.tiempos);
    if (tiemposErr) {
      Alert.alert('Horarios inconsistentes', tiemposErr);
      return;
    }

    if (!formulario.firmaCustodio?.trim()) {
      toast.warning('Firma requerida', 'El custodio debe firmar antes de crear la bitacora.');
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

    clearBitacoraSuggestionsCache();
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
      scrollEnabled={scrollEnabled}
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
        <Text className="text-sm text-servi-suave">
          WhatsApp: {formatContactosLabel(formulario.contactos ?? [])}
          {(formulario.contactos?.length ?? 0) > 0
            ? ` (${formulario.contactos!.length} destino${formulario.contactos!.length === 1 ? '' : 's'})`
            : ''}
        </Text>
      </View>

      <WizardField
        label="Observaciones"
        value={formulario.observaciones}
        onChangeText={(v) => updateFormulario({ observaciones: v })}
        multiline
      />

      <SignaturePad
        label={`Firma del custodio${profile?.nombre ? ` (${profile.nombre})` : ''}`}
        value={formulario.firmaCustodio ?? ''}
        onDrawingChange={(drawing) => setScrollEnabled(!drawing)}
        onCapture={(firmaCustodio) => updateFormulario({ firmaCustodio })}
      />
      <Text className="-mt-2 mb-4 text-xs text-servi-suave">
        La firma del operador se captura al terminar el servicio de custodia.
      </Text>
    </WizardShell>
  );
}
