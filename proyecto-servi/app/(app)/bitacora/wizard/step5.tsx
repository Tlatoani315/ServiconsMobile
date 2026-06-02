import { useRouter } from 'expo-router';

import { SignaturePad } from '../../../../components/SignaturePad';
import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep5() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();
  const op = formulario.operador1;

  return (
    <WizardShell title="Operador 1" step={5} onNext={() => router.push('/(app)/bitacora/wizard/step6')}>
      <WizardField label="Nombre operador" value={op.nombre} onChangeText={(v) => updateFormulario({ operador1: { ...op, nombre: v } })} />
      <WizardField label="Celular" value={op.celular} onChangeText={(v) => updateFormulario({ operador1: { ...op, celular: v } })} />
      <WizardField label="Placas vehículo" value={op.vehiculo.placas} onChangeText={(v) => updateFormulario({ operador1: { ...op, vehiculo: { ...op.vehiculo, placas: v } } })} />
      <WizardField label="Marca" value={op.vehiculo.marca} onChangeText={(v) => updateFormulario({ operador1: { ...op, vehiculo: { ...op.vehiculo, marca: v } } })} />
      <SignaturePad label="Firma operador 1" value={op.firma} onCapture={(firma) => updateFormulario({ operador1: { ...op, firma } })} />
    </WizardShell>
  );
}
