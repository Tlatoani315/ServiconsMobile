import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { WizardDateTimeField } from '../../../../components/WizardDateTimeField';
import { SuggestWizardField } from '../../../../components/SuggestWizardField';
import { WizardField } from '../../../../components/WizardField';
import { WizardSectionCard } from '../../../../components/WizardSectionCard';
import { WizardShell } from '../../../../components/WizardShell';
import { useAppToast } from '../../../../hooks/useAppToast';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacoraSuggestions } from '../../../../hooks/useBitacoraSuggestions';
import type { TiempoFieldKey } from '../../../../lib/validateBitacoraTiempos';
import {
  validateTiemposAfterUpdate,
  validateTiemposChain,
} from '../../../../lib/validateBitacoraTiempos';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';
import type { Tiempos } from '../../../../types/models';

export default function WizardStep2() {
  const router = useRouter();
  const toast = useAppToast();
  const { session } = useAuth();
  const { formulario, updateFormulario } = useBitacoraStore();
  const { filter } = useBitacoraSuggestions(session?.user?.id);
  const tiempos = formulario.tiempos;

  const setTiempo = (key: TiempoFieldKey, value: string) => {
    const next: Tiempos = { ...tiempos, [key]: value };
    const err = validateTiemposAfterUpdate(next, key);
    if (err) {
      toast.warning('Horario invalido', err);
      return;
    }
    updateFormulario({ tiempos: next });
  };

  const goNext = () => {
    const err = validateTiemposChain(tiempos);
    if (err) {
      Alert.alert('Horarios inconsistentes', err);
      return;
    }
    router.push('/(app)/bitacora/wizard/step3');
  };

  return (
    <WizardShell
      title="Vehiculo y tiempos"
      subtitle="Unidad custodiada e intervalo de reportes"
      step={2}
      onNext={goNext}
    >
      <WizardSectionCard
        title="Vehiculo en custodia"
        subtitle="Placas y contacto de la unidad"
        icon="car-outline"
        tone="blue"
      >
        <SuggestWizardField
          label="Placas vehiculo custodia"
          value={formulario.vehiculoCustodia.placas}
          onChangeText={(v) =>
            updateFormulario({
              vehiculoCustodia: { ...formulario.vehiculoCustodia, placas: v },
            })
          }
          placeholder="ABC-123-D"
          suggestions={filter('placasCustodia', formulario.vehiculoCustodia.placas)}
        />
        <WizardField
          label="Color"
          value={formulario.vehiculoCustodia.color}
          onChangeText={(v) =>
            updateFormulario({
              vehiculoCustodia: { ...formulario.vehiculoCustodia, color: v },
            })
          }
        />
        <WizardField
          label="Celular"
          value={formulario.vehiculoCustodia.celular}
          onChangeText={(v) =>
            updateFormulario({
              vehiculoCustodia: { ...formulario.vehiculoCustodia, celular: v },
            })
          }
          keyboardType="phone-pad"
        />
      </WizardSectionCard>

      <WizardSectionCard
        title="Programacion"
        subtitle="Los horarios deben ir en orden cronologico"
        icon="time-outline"
        tone="orange"
      >
        <WizardDateTimeField
          label="Fecha y hora de presentacion"
          value={tiempos.fechaHoraPresentacion ?? ''}
          onChange={(v) => setTiempo('fechaHoraPresentacion', v)}
          placeholder="Elegir presentacion"
        />
        <WizardDateTimeField
          label="Fecha y hora de cita (inicio de ruta)"
          value={tiempos.fechaHoraCita}
          onChange={(v) => setTiempo('fechaHoraCita', v)}
          required
          placeholder="Elegir cita"
        />
        <WizardField
          label="Odometro inicial"
          value={tiempos.odometroInicial}
          onChangeText={(v) =>
            updateFormulario({ tiempos: { ...tiempos, odometroInicial: v } })
          }
          keyboardType="number-pad"
        />
        <WizardField
          label="Intervalo reportes (minutos)"
          value={String(formulario.reportIntervalMinutes ?? 15)}
          onChangeText={(v) => updateFormulario({ reportIntervalMinutes: parseInt(v, 10) || 15 })}
          keyboardType="number-pad"
        />
      </WizardSectionCard>
    </WizardShell>
  );
}
