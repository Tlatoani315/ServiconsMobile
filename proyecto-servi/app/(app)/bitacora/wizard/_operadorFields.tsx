import { SuggestWizardField } from '../../../../components/SuggestWizardField';
import { WizardField } from '../../../../components/WizardField';
import type { SuggestionField } from '../../../../hooks/useBitacoraSuggestions';
import type { OperadorCustodiado } from '../../../../types/models';

type Props = {
  operador: OperadorCustodiado;
  onChange: (op: OperadorCustodiado) => void;
  suggest?: (field: SuggestionField, query: string) => string[];
};

export function OperadorFields({ operador, onChange, suggest }: Props) {
  const v = operador.vehiculo;
  const sug = suggest ?? (() => [] as string[]);

  return (
    <>
      <SuggestWizardField
        label="Nombre operador"
        value={operador.nombre}
        onChangeText={(val) => onChange({ ...operador, nombre: val, firma: '' })}
        suggestions={sug('operadorNombre', operador.nombre)}
      />
      <SuggestWizardField
        label="Celular"
        value={operador.celular}
        onChangeText={(val) => onChange({ ...operador, celular: val, firma: '' })}
        keyboardType="phone-pad"
        suggestions={sug('operadorCelular', operador.celular)}
      />
      <WizardField
        label="Placas vehiculo"
        value={v.placas}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, placas: val }, firma: '' })}
      />
      <WizardField
        label="Marca"
        value={v.marca}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, marca: val }, firma: '' })}
      />
      <WizardField
        label="Modelo"
        value={v.modelo}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, modelo: val }, firma: '' })}
      />
      <WizardField
        label="Color"
        value={v.color}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, color: val }, firma: '' })}
      />
      <WizardField
        label="Placa remolque 1"
        value={v.placaRemolque1}
        onChangeText={(val) =>
          onChange({ ...operador, vehiculo: { ...v, placaRemolque1: val }, firma: '' })
        }
      />
      <WizardField
        label="No. economico"
        value={v.numEco}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, numEco: val }, firma: '' })}
      />
      <WizardField
        label="Sellos"
        value={v.sellos}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, sellos: val }, firma: '' })}
      />
      <WizardField
        label="Eco tracto"
        value={v.ecoTracto}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, ecoTracto: val }, firma: '' })}
      />
      <WizardField
        label="Pedimento"
        value={v.pedimento}
        onChangeText={(val) => onChange({ ...operador, vehiculo: { ...v, pedimento: val }, firma: '' })}
      />
      <WizardField
        label="Placa remolque 2"
        value={v.placaRemolque2}
        onChangeText={(val) =>
          onChange({ ...operador, vehiculo: { ...v, placaRemolque2: val }, firma: '' })
        }
      />
      <WizardField
        label="Empresa transporte"
        value={v.empresaTransporte}
        onChangeText={(val) =>
          onChange({ ...operador, vehiculo: { ...v, empresaTransporte: val }, firma: '' })
        }
      />
    </>
  );
}
