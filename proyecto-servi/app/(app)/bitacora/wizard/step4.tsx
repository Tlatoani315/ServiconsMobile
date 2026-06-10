import { useRouter } from 'expo-router';

import { SuggestWizardField } from '../../../../components/SuggestWizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useAppToast } from '../../../../hooks/useAppToast';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacoraSuggestions } from '../../../../hooks/useBitacoraSuggestions';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep4() {
  const router = useRouter();
  const toast = useAppToast();
  const { session } = useAuth();
  const { formulario, updateFormulario } = useBitacoraStore();
  const { filter } = useBitacoraSuggestions(session?.user?.id);

  const next = () => {
    if (!formulario.responsableOrigen.nombre.trim()) {
      toast.warning('Nombre requerido', 'Indica el responsable de origen.');
      return;
    }
    if (!formulario.responsableDestino.nombre.trim()) {
      toast.warning('Nombre requerido', 'Indica el responsable de destino.');
      return;
    }
    router.push('/(app)/bitacora/wizard/step5');
  };

  return (
    <WizardShell title="Responsables" subtitle="Solo nombres — firmas al cerrar servicio" step={4} onNext={next}>
      <SuggestWizardField
        label="Responsable origen"
        value={formulario.responsableOrigen.nombre}
        onChangeText={(v) =>
          updateFormulario({
            responsableOrigen: { ...formulario.responsableOrigen, nombre: v, firma: '' },
          })
        }
        suggestions={filter('responsableOrigen', formulario.responsableOrigen.nombre)}
      />
      <SuggestWizardField
        label="Responsable destino"
        value={formulario.responsableDestino.nombre}
        onChangeText={(v) =>
          updateFormulario({
            responsableDestino: { ...formulario.responsableDestino, nombre: v, firma: '' },
          })
        }
        suggestions={filter('responsableDestino', formulario.responsableDestino.nombre)}
      />
    </WizardShell>
  );
}
