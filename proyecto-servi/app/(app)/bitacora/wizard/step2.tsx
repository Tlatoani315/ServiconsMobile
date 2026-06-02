import { useRouter } from 'expo-router';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep2() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();

  return (
    <WizardShell title="Vehículo y tiempos iniciales" step={2} onNext={() => router.push('/(app)/bitacora/wizard/step3')}>
      <WizardField
        label="Placas vehículo custodia"
        value={formulario.vehiculoCustodia.placas}
        onChangeText={(v) =>
          updateFormulario({
            vehiculoCustodia: { ...formulario.vehiculoCustodia, placas: v },
          })
        }
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
      />
      <WizardField
        label="Fecha/hora presentacion"
        value={formulario.tiempos.fechaHoraPresentacion ?? ''}
        onChangeText={(v) =>
          updateFormulario({ tiempos: { ...formulario.tiempos, fechaHoraPresentacion: v } })
        }
      />
      <WizardField
        label="Fecha/hora cita"
        value={formulario.tiempos.fechaHoraCita}
        onChangeText={(v) =>
          updateFormulario({ tiempos: { ...formulario.tiempos, fechaHoraCita: v } })
        }
      />
      <WizardField
        label="Odómetro inicial"
        value={formulario.tiempos.odometroInicial}
        onChangeText={(v) =>
          updateFormulario({ tiempos: { ...formulario.tiempos, odometroInicial: v } })
        }
      />
      <WizardField
        label="Intervalo reportes (minutos)"
        value={String(formulario.reportIntervalMinutes ?? 15)}
        onChangeText={(v) =>
          updateFormulario({ reportIntervalMinutes: parseInt(v, 10) || 15 })
        }
      />
    </WizardShell>
  );
}
