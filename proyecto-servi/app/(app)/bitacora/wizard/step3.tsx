import { useRouter } from 'expo-router';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep3() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();

  return (
    <WizardShell title="Tiempos de viaje" step={3} onNext={() => router.push('/(app)/bitacora/wizard/step4')}>
      <WizardField
        label="Fecha/hora salida"
        value={formulario.tiempos.fechaHoraSalida ?? ''}
        onChangeText={(v) =>
          updateFormulario({ tiempos: { ...formulario.tiempos, fechaHoraSalida: v } })
        }
      />
      <WizardField
        label="Fecha/hora llegada"
        value={formulario.tiempos.fechaHoraLlegada ?? ''}
        onChangeText={(v) =>
          updateFormulario({ tiempos: { ...formulario.tiempos, fechaHoraLlegada: v } })
        }
      />
      <WizardField
        label="Km totales"
        value={formulario.tiempos.kmTotales ?? ''}
        onChangeText={(v) =>
          updateFormulario({ tiempos: { ...formulario.tiempos, kmTotales: v } })
        }
      />
    </WizardShell>
  );
}
