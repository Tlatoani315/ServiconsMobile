import { useRouter } from 'expo-router';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep6() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();
  const op2 = formulario.operador2 ?? {
    nombre: '',
    firma: '',
    celular: '',
    vehiculo: formulario.operador1.vehiculo,
  };

  const skip = () => router.push('/(app)/bitacora/wizard/step7');

  return (
    <WizardShell
      title="Operador 2 (opcional)"
      step={6}
      onNext={() => router.push('/(app)/bitacora/wizard/step7')}
      onSkip={skip}
    >
      <WizardField
        label="Nombre operador 2"
        value={op2.nombre}
        onChangeText={(v) => updateFormulario({ operador2: { ...op2, nombre: v } })}
      />
      <WizardField
        label="Celular"
        value={op2.celular}
        onChangeText={(v) => updateFormulario({ operador2: { ...op2, celular: v } })}
      />
    </WizardShell>
  );
}
