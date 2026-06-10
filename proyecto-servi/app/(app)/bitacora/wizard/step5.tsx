import { useRouter } from 'expo-router';

import { WizardShell } from '../../../../components/WizardShell';
import { useAppToast } from '../../../../hooks/useAppToast';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacoraSuggestions } from '../../../../hooks/useBitacoraSuggestions';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

import { OperadorFields } from './_operadorFields';

export default function WizardStep5() {
  const router = useRouter();
  const toast = useAppToast();
  const { session } = useAuth();
  const { filter } = useBitacoraSuggestions(session?.user?.id);
  const { formulario, updateFormulario } = useBitacoraStore();

  const next = () => {
    if (!formulario.operador1.nombre.trim()) {
      toast.warning('Operador requerido', 'Indica el nombre del operador 1.');
      return;
    }
    router.push('/(app)/bitacora/wizard/step6');
  };

  return (
    <WizardShell title="Operador 1" subtitle="Datos del operador — firma al terminar custodia" step={5} onNext={next}>
      <OperadorFields
        operador={formulario.operador1}
        suggest={filter}
        onChange={(operador1) => updateFormulario({ operador1: { ...operador1, firma: '' } })}
      />
    </WizardShell>
  );
}
