import { useRouter } from 'expo-router';

import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

import { OperadorFields } from './operadorFields';

export default function WizardStep5() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();

  return (
    <WizardShell title="Operador 1" step={5} onNext={() => router.push('/(app)/bitacora/wizard/step6')}>
      <OperadorFields
        operador={formulario.operador1}
        firmaLabel="Firma operador 1"
        onChange={(operador1) => updateFormulario({ operador1 })}
      />
    </WizardShell>
  );
}
