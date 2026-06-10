import { Ionicons } from '@expo/vector-icons';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';



import { useLocation } from '../hooks/useLocation';

import type { UbicacionSugerida } from '../hooks/useBitacoraSuggestions';

import {

  applyCpLookupToUbicacion,

  lookupCodigoPostal,

  type CpLookupResult,

} from '../lib/cpLookup';

import {

  buildGoogleMapsUbicacionUrl,

  formatUbicacionAddress,

  hasUbicacionAddress,

  hasUbicacionCoords,

} from '../lib/ubicacionAddress';

import { cloneUbicacion, hasUbicacionMinima, ubicacionDisplayLabel } from '../lib/ubicacionHelpers';

import type { SuggestionField } from '../hooks/useBitacoraSuggestions';

import type { Ubicacion } from '../types/models';

import { FavoriteAliasModal } from './FavoriteAliasModal';

import { SuggestWizardField } from './SuggestWizardField';

import { UbicacionQuickPicker } from './UbicacionQuickPicker';

import { WizardField } from './WizardField';



type Props = {

  ubicacion: Ubicacion;

  onChange: (next: Ubicacion) => void;

  tone: 'green' | 'red';

  title: string;

  showGpsCapture?: boolean;

  suggestPrefix?: 'origen' | 'destino';

  suggestFilter?: (field: SuggestionField, query: string) => string[];

  recentUbicaciones?: UbicacionSugerida[];

  favoriteUbicaciones?: UbicacionSugerida[];

  onSaveFavorite?: (ubicacion: Ubicacion, alias: string) => Promise<void>;

};



export function LocationFormSection({

  ubicacion,

  onChange,

  tone,

  title,

  showGpsCapture = false,

  suggestPrefix,

  suggestFilter,

  recentUbicaciones = [],

  favoriteUbicaciones = [],

  onSaveFavorite,

}: Props) {

  const { getCurrentLocation } = useLocation();

  const [gpsLoading, setGpsLoading] = useState(false);

  const [cpLoading, setCpLoading] = useState(false);

  const [cpLookup, setCpLookup] = useState<CpLookupResult | null>(null);

  const [favoriteModal, setFavoriteModal] = useState(false);

  const cpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastLookupCp = useRef('');
  const ubicacionRef = useRef(ubicacion);
  ubicacionRef.current = ubicacion;

  const patch = (partial: Partial<Ubicacion>) => onChange({ ...ubicacion, ...partial });

  const addressPreview = formatUbicacionAddress(ubicacion);

  const canPreview = hasUbicacionAddress(ubicacion) || hasUbicacionCoords(ubicacion);



  const suggest = (field: SuggestionField, query: string) =>

    suggestPrefix && suggestFilter ? suggestFilter(field, query) : [];



  const field = (suffix: 'Calle' | 'Colonia' | 'Municipio' | 'Estado'): SuggestionField =>

    `${suggestPrefix}${suffix}` as SuggestionField;



  const applyUbicacion = useCallback(

    (next: Ubicacion) => {

      onChange({

        ...cloneUbicacion(next),

        personalAsignado: next.personalAsignado?.trim()

          ? next.personalAsignado

          : ubicacion.personalAsignado,

      });

    },

    [onChange, ubicacion.personalAsignado],

  );



  const runCpLookup = useCallback(

    async (cpRaw: string) => {

      const cp = cpRaw.replace(/\D/g, '').slice(0, 5);

      if (cp.length !== 5) {

        setCpLookup(null);

        return;

      }

      if (lastLookupCp.current === cp) return;

      setCpLoading(true);
      const result = await lookupCodigoPostal(cp);
      setCpLoading(false);

      if (!result) {
        setCpLookup(null);
        lastLookupCp.current = '';
        return;
      }

      lastLookupCp.current = cp;
      setCpLookup(result);
      const current = ubicacionRef.current;
      onChange({
        ...applyCpLookupToUbicacion(current, result),
        personalAsignado: current.personalAsignado,
      });
    },
    [onChange],
  );



  useEffect(() => {

    return () => {

      if (cpTimer.current) clearTimeout(cpTimer.current);

    };

  }, []);



  useEffect(() => {

    const cp = ubicacion.codigoPostal?.replace(/\D/g, '').slice(0, 5) ?? '';

    if (cp.length !== 5) {
      setCpLookup(null);
      lastLookupCp.current = '';
      return;
    }



    if (cpTimer.current) clearTimeout(cpTimer.current);

    cpTimer.current = setTimeout(() => {

      void runCpLookup(cp);

    }, 350);

  }, [ubicacion.codigoPostal, runCpLookup]);



  const openMaps = () => {

    const url = buildGoogleMapsUbicacionUrl(ubicacion, title);

    void Linking.openURL(url);

  };



  const captureGps = async () => {

    setGpsLoading(true);

    try {

      const { latitude, longitude } = await getCurrentLocation();

      patch({

        lat: latitude.toFixed(6),

        lng: longitude.toFixed(6),

      });

    } catch (e) {

      Alert.alert(

        'GPS no disponible',

        e instanceof Error ? e.message : 'Activa ubicacion e intenta de nuevo.',

      );

    } finally {

      setGpsLoading(false);

    }

  };



  const pickColonia = (colonia: string) => {

    if (!cpLookup) {

      patch({ colonia });

      return;

    }

    applyUbicacion(applyCpLookupToUbicacion(ubicacion, cpLookup, colonia));

  };



  const colonias = cpLookup?.colonias ?? [];



  return (

    <View>

      <UbicacionQuickPicker

        recientes={recentUbicaciones}

        favoritos={favoriteUbicaciones}

        onSelect={applyUbicacion}

      />



      {showGpsCapture ? (

        <Pressable

          className={`mb-4 flex-row items-center justify-center gap-2 rounded-2xl border px-4 py-3 active:opacity-90 ${

            tone === 'green'

              ? 'border-emerald-500/40 bg-emerald-500/10'

              : 'border-red-500/40 bg-red-500/10'

          }`}

          onPress={captureGps}

          disabled={gpsLoading}

        >

          {gpsLoading ? (

            <ActivityIndicator color="#F97316" />

          ) : (

            <Ionicons name="locate" size={20} color="#22C55E" />

          )}

          <Text className="font-semibold text-servi-texto">

            {gpsLoading ? 'Obteniendo GPS...' : 'Usar mi ubicacion GPS'}

          </Text>

        </Pressable>

      ) : null}



      <View className="mb-4">

        <WizardField

          label="Codigo postal *"

          value={ubicacion.codigoPostal ?? ''}

          placeholder="64000"

          onChangeText={(v) => {
            lastLookupCp.current = '';
            patch({ codigoPostal: v.replace(/\D/g, '').slice(0, 5) });
          }}

          keyboardType="number-pad"

          required

        />

        {cpLoading ? (

          <View className="-mt-2 mb-2 flex-row items-center gap-2">

            <ActivityIndicator size="small" color="#F97316" />

            <Text className="text-xs text-servi-suave">Buscando colonia, municipio y estado...</Text>

          </View>

        ) : cpLookup ? (

          <Text className="-mt-2 mb-2 text-xs text-emerald-400">

            {cpLookup.municipio}, {cpLookup.estado}

            {colonias.length === 1 ? ` · ${colonias[0]}` : ''}

          </Text>

        ) : ubicacion.codigoPostal?.length === 5 ? (

          <Text className="-mt-2 mb-2 text-xs text-amber-400">

            CP no encontrado. Verifica el numero o llena los campos manualmente.

          </Text>

        ) : (

          <Text className="-mt-2 mb-2 text-xs text-servi-suave">

            Escribe el CP de 5 digitos para autocompletar municipio, estado y colonia.

          </Text>

        )}

      </View>



      {colonias.length > 1 ? (

        <View className="mb-4">

          <Text className="mb-2 text-xs font-bold uppercase text-servi-suave">

            Elige colonia ({colonias.length} opciones)

          </Text>

          <View className="flex-row flex-wrap gap-2">

            {colonias.map((colonia) => {

              const selected = ubicacion.colonia?.trim() === colonia;

              return (

                <Pressable

                  key={colonia}

                  className={`rounded-full border px-3 py-2 active:opacity-90 ${

                    selected

                      ? 'border-servi-acento bg-servi-acento/20'

                      : 'border-servi-borde bg-servi-fondo'

                  }`}

                  onPress={() => pickColonia(colonia)}

                >

                  <Text

                    className={`text-xs ${selected ? 'font-bold text-servi-acento' : 'text-servi-texto'}`}

                  >

                    {colonia}

                  </Text>

                </Pressable>

              );

            })}

          </View>

        </View>

      ) : (

        <SuggestWizardField

          label="Colonia"

          value={ubicacion.colonia ?? ''}

          placeholder="Ej. Centro, Industrial..."

          onChangeText={(v) => patch({ colonia: v })}

          suggestions={suggest(field('Colonia'), ubicacion.colonia ?? '')}

        />

      )}



      <View className="mb-1 flex-row gap-3">

        <View className="flex-1">

          <SuggestWizardField

            label="Municipio / alcaldia *"

            value={ubicacion.municipio}

            placeholder="Monterrey"

            onChangeText={(v) => patch({ municipio: v })}

            required

            suggestions={suggest(field('Municipio'), ubicacion.municipio)}

          />

        </View>

        <View className="flex-1">

          <SuggestWizardField

            label="Estado *"

            value={ubicacion.estado}

            placeholder="Nuevo Leon"

            onChangeText={(v) => patch({ estado: v })}

            required

            suggestions={suggest(field('Estado'), ubicacion.estado)}

          />

        </View>

      </View>



      <SuggestWizardField

        label="Calle y numero *"

        value={ubicacion.calle ?? ''}

        placeholder="Ej. Av. Constitucion 1500"

        onChangeText={(v) => patch({ calle: v })}

        required

        suggestions={suggest(field('Calle'), ubicacion.calle ?? '')}

      />



      <View className="mb-1 flex-row gap-3">

        <View className="flex-1">

          <WizardField

            label="No. exterior"

            value={ubicacion.numeroExterior ?? ''}

            placeholder="1500"

            onChangeText={(v) => patch({ numeroExterior: v })}

            keyboardType="number-pad"

          />

        </View>

        <View className="flex-1">

          <WizardField

            label="Ciudad"

            value={ubicacion.ciudad ?? ''}

            placeholder="Si difiere del municipio"

            onChangeText={(v) => patch({ ciudad: v })}

          />

        </View>

      </View>



      <WizardField

        label="Referencia (opcional)"

        value={ubicacion.referencia ?? ''}

        placeholder="Entre calles, acceso, punto de encuentro..."

        onChangeText={(v) => patch({ referencia: v })}

        multiline

      />

      <WizardField

        label="Personal asignado en sitio"

        value={ubicacion.personalAsignado}

        placeholder="Nombre del contacto en origen/destino"

        onChangeText={(v) => patch({ personalAsignado: v })}

      />



      {onSaveFavorite && hasUbicacionMinima(ubicacion) ? (

        <Pressable

          className="mb-3 flex-row items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 active:opacity-90"

          onPress={() => setFavoriteModal(true)}

        >

          <Ionicons name="star-outline" size={18} color="#FBBF24" />

          <Text className="font-semibold text-amber-200">Guardar ubicacion en favoritos</Text>

        </Pressable>

      ) : null}



      {showGpsCapture && (ubicacion.lat || ubicacion.lng) ? (

        <View

          className={`mb-3 rounded-xl border px-3 py-3 ${

            tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'

          }`}

        >

          <Text className="mb-1 text-xs font-bold uppercase text-servi-suave">Coordenadas capturadas</Text>

          <Text className="font-mono text-sm text-servi-texto">

            {ubicacion.lat ?? '—'}, {ubicacion.lng ?? '—'}

          </Text>

          <Pressable className="mt-2 self-start active:opacity-70" onPress={() => patch({ lat: '', lng: '' })}>

            <Text className="text-xs text-servi-acento">Quitar coordenadas</Text>

          </Pressable>

        </View>

      ) : null}



      {canPreview ? (

        <View className="overflow-hidden rounded-xl border border-[#4285F4]/35 bg-[#4285F4]/8">

          <View className="border-b border-[#4285F4]/20 px-3 py-2">

            <Text className="text-[10px] font-bold uppercase text-servi-suave">

              Vista previa para Google Maps

            </Text>

            <Text className="mt-1 text-sm leading-5 text-servi-texto">{addressPreview}</Text>

          </View>

          <Pressable

            className="flex-row items-center justify-center gap-2 py-3 active:opacity-90"

            onPress={openMaps}

          >

            <Ionicons name="logo-google" size={18} color="#4285F4" />

            <Text className="text-sm font-bold text-[#4285F4]">Probar en Google Maps</Text>

          </Pressable>

        </View>

      ) : (

        <Text className="text-xs text-servi-suave">

          {showGpsCapture

            ? 'Completa CP y calle, o usa GPS en el origen.'

            : 'Completa CP, calle, municipio y estado del destino.'}

        </Text>

      )}



      {onSaveFavorite ? (

        <FavoriteAliasModal

          visible={favoriteModal}

          defaultAlias={ubicacionDisplayLabel(ubicacion)}

          onCancel={() => setFavoriteModal(false)}

          onSave={(alias) => {

            setFavoriteModal(false);

            void onSaveFavorite(ubicacion, alias).then(() => {

              Alert.alert('Guardado', 'Ubicacion agregada a favoritos.');

            });

          }}

        />

      ) : null}

    </View>

  );

}


