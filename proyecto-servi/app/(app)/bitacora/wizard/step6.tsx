import { useRouter } from 'expo-router';

import { WizardShell } from '../../../../components/WizardShell';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacoraSuggestions } from '../../../../hooks/useBitacoraSuggestions';
import { useBitacoraStore, createEmptyFormulario } from '../../../../store/useBitacoraStore';
import type { OperadorCustodiado } from '../../../../types/models';

import { OperadorFields } from './_operadorFields';

const emptyOperador2 = (): OperadorCustodiado => ({
  ...createEmptyFormulario().operador1,
  firma: '',
});

export default function WizardStep6() {
  const router = useRouter();
  const { session } = useAuth();
  const { filter } = useBitacoraSuggestions(session?.user?.id);
  const { formulario, updateFormulario } = useBitacoraStore();
  const op2 = formulario.operador2 ?? emptyOperador2();

  const goStep7 = () => router.push('/(app)/bitacora/wizard/step7');

  const skip = () => {
    updateFormulario({ operador2: undefined });
    goStep7();
  };

  return (
    <WizardShell title="Operador 2 (opcional)" step={6} onNext={goStep7} onSkip={skip}>
      <OperadorFields
        operador={op2}
        suggest={filter}
        onChange={(operador2) => updateFormulario({ operador2: { ...operador2, firma: '' } })}
      />
    </WizardShell>
  );
}
