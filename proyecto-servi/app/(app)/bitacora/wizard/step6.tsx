import { useRouter } from 'expo-router';

import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore, createEmptyFormulario } from '../../../../store/useBitacoraStore';
import type { OperadorCustodiado } from '../../../../types/models';

import { OperadorFields } from './operadorFields';

const emptyOperador2 = (): OperadorCustodiado => ({
  ...createEmptyFormulario().operador1,
});

export default function WizardStep6() {
  const router = useRouter();
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
        firmaLabel="Firma operador 2"
        onChange={(operador2) => updateFormulario({ operador2 })}
      />
    </WizardShell>
  );
}
