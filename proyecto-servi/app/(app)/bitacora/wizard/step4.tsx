import { useRouter } from 'expo-router';

import { SignaturePad } from '../../../../components/SignaturePad';
import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep4() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();

  return (
    <WizardShell title="Responsables" step={4} onNext={() => router.push('/(app)/bitacora/wizard/step5')}>
      <WizardField
        label="Responsable origen"
        value={formulario.responsableOrigen.nombre}
        onChangeText={(v) =>
          updateFormulario({
            responsableOrigen: { ...formulario.responsableOrigen, nombre: v },
          })
        }
      />
      <SignaturePad
        label="Firma responsable origen"
        value={formulario.responsableOrigen.firma}
        onCapture={(firma) =>
          updateFormulario({
            responsableOrigen: { ...formulario.responsableOrigen, firma },
          })
        }
      />
      <WizardField
        label="Responsable destino"
        value={formulario.responsableDestino.nombre}
        onChangeText={(v) =>
          updateFormulario({
            responsableDestino: { ...formulario.responsableDestino, nombre: v },
          })
        }
      />
      <SignaturePad
        label="Firma responsable destino"
        value={formulario.responsableDestino.firma}
        onCapture={(firma) =>
          updateFormulario({
            responsableDestino: { ...formulario.responsableDestino, firma },
          })
        }
      />
    </WizardShell>
  );
}
