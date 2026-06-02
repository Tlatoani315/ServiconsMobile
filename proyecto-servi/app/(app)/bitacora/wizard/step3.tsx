import { useRouter } from 'expo-router';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep3() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();
  const t = formulario.tiempos;

  return (
    <WizardShell title="Tiempos de viaje" step={3} onNext={() => router.push('/(app)/bitacora/wizard/step4')}>
      <WizardField
        label="Fecha/hora salida"
        value={t.fechaHoraSalida ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, fechaHoraSalida: v } })}
      />
      <WizardField
        label="Fecha/hora verificacion"
        value={t.fechaHoraVerificacion ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, fechaHoraVerificacion: v } })}
      />
      <WizardField
        label="Fecha/hora llegada"
        value={t.fechaHoraLlegada ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, fechaHoraLlegada: v } })}
      />
      <WizardField
        label="Fecha/hora fin"
        value={t.fechaHoraFin ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, fechaHoraFin: v } })}
      />
      <WizardField
        label="Odometro final"
        value={t.odometroFinal ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, odometroFinal: v } })}
      />
      <WizardField
        label="Km totales"
        value={t.kmTotales ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, kmTotales: v } })}
      />
      <WizardField
        label="Estadia"
        value={t.estadia ?? ''}
        onChangeText={(v) => updateFormulario({ tiempos: { ...t, estadia: v } })}
      />
    </WizardShell>
  );
}
