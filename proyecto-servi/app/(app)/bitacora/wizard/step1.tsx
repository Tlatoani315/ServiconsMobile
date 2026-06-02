import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { WizardField } from '../../../../components/WizardField';
import { WizardShell } from '../../../../components/WizardShell';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

export default function WizardStep1() {
  const router = useRouter();
  const { formulario, updateFormulario } = useBitacoraStore();

  const next = () => {
    if (!formulario.nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre del servicio es obligatorio.');
      return;
    }
    router.push('/(app)/bitacora/wizard/step2');
  };

  return (
    <WizardShell title="Datos generales" step={1} onNext={next}>
      <WizardField
        label="Nombre del servicio"
        value={formulario.nombre}
        onChangeText={(v) => updateFormulario({ nombre: v })}
        required
      />
      <WizardField
        label="Empresa contratante"
        value={formulario.empresaContratante}
        onChangeText={(v) => updateFormulario({ empresaContratante: v })}
      />
      <WizardField
        label="Folio cliente"
        value={formulario.folioCliente}
        onChangeText={(v) => updateFormulario({ folioCliente: v })}
      />
      <WizardField
        label="Origen — Estado"
        value={formulario.origen.estado}
        onChangeText={(v) =>
          updateFormulario({ origen: { ...formulario.origen, estado: v } })
        }
      />
      <WizardField
        label="Origen — Municipio"
        value={formulario.origen.municipio}
        onChangeText={(v) =>
          updateFormulario({ origen: { ...formulario.origen, municipio: v } })
        }
      />
      <WizardField
        label="Destino — Estado"
        value={formulario.destino.estado}
        onChangeText={(v) =>
          updateFormulario({ destino: { ...formulario.destino, estado: v } })
        }
      />
      <WizardField
        label="Destino — Municipio"
        value={formulario.destino.municipio}
        onChangeText={(v) =>
          updateFormulario({ destino: { ...formulario.destino, municipio: v } })
        }
      />
    </WizardShell>
  );
}
