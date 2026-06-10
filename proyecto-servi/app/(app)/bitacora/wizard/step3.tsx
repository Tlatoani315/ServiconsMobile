import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { WizardDateTimeField } from '../../../../components/WizardDateTimeField';
import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useAppToast } from '../../../../hooks/useAppToast';
import type { TiempoFieldKey } from '../../../../lib/validateBitacoraTiempos';
import {
  validateTiemposAfterUpdate,
  validateTiemposChain,
} from '../../../../lib/validateBitacoraTiempos';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';
import type { Tiempos } from '../../../../types/models';

export default function WizardStep3() {
  const router = useRouter();
  const toast = useAppToast();
  const { formulario, updateFormulario } = useBitacoraStore();
  const t = formulario.tiempos;

  const setTiempo = (key: TiempoFieldKey, value: string) => {
    const next: Tiempos = { ...t, [key]: value };
    const err = validateTiemposAfterUpdate(next, key);
    if (err) {
      toast.warning('Horario invalido', err);
      return;
    }
    updateFormulario({ tiempos: next });
  };

  const goNext = () => {
    const err = validateTiemposChain(t);
    if (err) {
      Alert.alert('Horarios inconsistentes', err);
      return;
    }
    router.push('/(app)/bitacora/wizard/step4');
  };

  return (
    <WizardShell
      title="Tiempos de viaje"
      subtitle="Opcional — deben ser despues de la cita y en orden"
      step={3}
      onNext={goNext}
    >
      <WizardDateTimeField
        label="Fecha y hora de salida"
        value={t.fechaHoraSalida ?? ''}
        onChange={(v) => setTiempo('fechaHoraSalida', v)}
        placeholder="Elegir salida"
      />
      <WizardDateTimeField
        label="Fecha y hora de verificacion"
        value={t.fechaHoraVerificacion ?? ''}
        onChange={(v) => setTiempo('fechaHoraVerificacion', v)}
        placeholder="Elegir verificacion"
      />
      <WizardDateTimeField
        label="Fecha y hora de llegada"
        value={t.fechaHoraLlegada ?? ''}
        onChange={(v) => setTiempo('fechaHoraLlegada', v)}
        placeholder="Elegir llegada"
      />
      <WizardDateTimeField
        label="Fecha y hora de fin"
        value={t.fechaHoraFin ?? ''}
        onChange={(v) => setTiempo('fechaHoraFin', v)}
        placeholder="Elegir fin"
      />
      <WizardField
        label="Odometro final"
        value={t.odometroFinal ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, odometroFinal: v } })}
        keyboardType="number-pad"
      />
      <WizardField
        label="Km totales"
        value={t.kmTotales ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, kmTotales: v } })}
        keyboardType="number-pad"
      />
      <WizardField
        label="Estadia"
        value={t.estadia ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, estadia: v } })}
      />
    </WizardShell>
  );
}
