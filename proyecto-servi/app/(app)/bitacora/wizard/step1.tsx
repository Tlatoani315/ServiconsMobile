import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert } from 'react-native';

import { SuggestWizardField } from '../../../../components/SuggestWizardField';
import { LocationFormSection } from '../../../../components/LocationFormSection';
import { ChannelPicker } from '../../../../components/ChannelPicker';
import { WizardSectionCard } from '../../../../components/WizardSectionCard';
import { WizardShell } from '../../../../components/WizardShell';
import { useAppToast } from '../../../../hooks/useAppToast';
import { useAuth } from '../../../../hooks/useAuth';
import { useBitacoraSuggestions, type UbicacionSugerida } from '../../../../hooks/useBitacoraSuggestions';
import { useFavoriteUbicaciones } from '../../../../hooks/useFavoriteUbicaciones';
import { hasUbicacionAddress } from '../../../../lib/ubicacionAddress';
import type { Ubicacion } from '../../../../types/models';
import { useBitacoraStore } from '../../../../store/useBitacoraStore';

function validateUbicacion(
  u: ReturnType<typeof useBitacoraStore.getState>['formulario']['origen'],
  label: string,
  options?: { allowGps?: boolean },
): string | null {
  const allowGps = options?.allowGps ?? false;

  if (!u.estado.trim()) return `Indica el estado de ${label}.`;
  if (!u.municipio.trim()) return `Indica el municipio de ${label}.`;
  if (!u.codigoPostal?.trim()) return `Indica el codigo postal de ${label}.`;

  if (allowGps) {
    if (!u.calle?.trim() && !u.lat?.trim()) {
      return `${label}: agrega calle y numero o usa el boton GPS.`;
    }
    if (u.lat?.trim() && !u.lng?.trim()) return `${label}: falta la longitud GPS.`;
    if (u.lng?.trim() && !u.lat?.trim()) return `${label}: falta la latitud GPS.`;
    if (!hasUbicacionAddress(u) && !(u.lat?.trim() && u.lng?.trim())) {
      return `${label}: completa la direccion o captura GPS.`;
    }
  } else {
    if (!u.calle?.trim()) return `${label}: indica calle y numero.`;
    if (!hasUbicacionAddress(u)) {
      return `${label}: completa la direccion (calle, CP, municipio, estado).`;
    }
  }

  return null;
}

export default function WizardStep1() {
  const router = useRouter();
  const toast = useAppToast();
  const { session } = useAuth();
  const { formulario, updateFormulario } = useBitacoraStore();
  const { filter, recent } = useBitacoraSuggestions(session?.user?.id);
  const { favorites, addFavorite } = useFavoriteUbicaciones();

  const favoriteItems: UbicacionSugerida[] = useMemo(
    () =>
      favorites.map((f) => ({
        id: f.id,
        label: f.alias,
        ubicacion: f.ubicacion,
        kind: 'favorito' as const,
      })),
    [favorites],
  );

  const saveFavorite = async (ubicacion: Ubicacion, alias: string) => {
    await addFavorite(ubicacion, alias);
  };

  const next = () => {
    if (!formulario.nombre.trim()) {
      toast.warning('Campo requerido', 'El nombre del servicio es obligatorio.');
      return;
    }
    if (!formulario.empresaContratante.trim()) {
      toast.warning('Campo requerido', 'La empresa contratante es obligatoria.');
      return;
    }

    const origenErr = validateUbicacion(formulario.origen, 'Origen', { allowGps: true });
    if (origenErr) {
      toast.warning('Origen incompleto', origenErr);
      return;
    }

    const destinoErr = validateUbicacion(formulario.destino, 'Destino');
    if (destinoErr) {
      toast.warning('Destino incompleto', destinoErr);
      return;
    }

    router.push('/(app)/bitacora/wizard/step2');
  };

  return (
    <WizardShell
      title="Datos del servicio"
      subtitle="Direcciones completas para rutas correctas en Google Maps"
      step={1}
      onNext={next}
    >
      <WizardSectionCard
        title="Informacion general"
        subtitle="Identificacion del monitoreo"
        icon="document-text-outline"
        tone="orange"
      >
        <SuggestWizardField
          label="Nombre del servicio"
          value={formulario.nombre}
          onChangeText={(v) => updateFormulario({ nombre: v })}
          placeholder="Ej. Custodia Monterrey - CDMX"
          required
          suggestions={filter('nombre', formulario.nombre)}
        />
        <SuggestWizardField
          label="Empresa contratante"
          value={formulario.empresaContratante}
          onChangeText={(v) => updateFormulario({ empresaContratante: v })}
          placeholder="Razon social del cliente"
          required
          suggestions={filter('empresaContratante', formulario.empresaContratante)}
        />
        <SuggestWizardField
          label="Folio cliente"
          value={formulario.folioCliente}
          onChangeText={(v) => updateFormulario({ folioCliente: v })}
          placeholder="Referencia interna del cliente"
          suggestions={filter('folioCliente', formulario.folioCliente)}
        />
        <ChannelPicker
          value={formulario.contactos ?? []}
          onChange={(contactos) => updateFormulario({ contactos })}
        />
      </WizardSectionCard>

      <WizardSectionCard
        title="Punto de origen"
        subtitle="Donde inicia la custodia · CP y calle exactos"
        icon="flag-outline"
        tone="green"
      >
        <LocationFormSection
          title="Origen"
          tone="green"
          showGpsCapture
          ubicacion={formulario.origen}
          onChange={(origen) => updateFormulario({ origen })}
          suggestPrefix="origen"
          suggestFilter={filter}
          recentUbicaciones={recent.origen}
          favoriteUbicaciones={favoriteItems}
          onSaveFavorite={saveFavorite}
        />
      </WizardSectionCard>

      <WizardSectionCard
        title="Punto de destino"
        subtitle="Donde termina la ruta · misma precision"
        icon="location-outline"
        tone="red"
      >
        <LocationFormSection
          title="Destino"
          tone="red"
          ubicacion={formulario.destino}
          onChange={(destino) => updateFormulario({ destino })}
          suggestPrefix="destino"
          suggestFilter={filter}
          recentUbicaciones={recent.destino}
          favoriteUbicaciones={favoriteItems}
          onSaveFavorite={saveFavorite}
        />
      </WizardSectionCard>
    </WizardShell>
  );
}
