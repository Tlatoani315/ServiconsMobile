import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleMapsActions } from '../../../components/GoogleMapsActions';
import { InAppCameraModal } from '../../../components/InAppCameraModal';
import { ReportMapView } from '../../../components/ReportMapView';
import { SignaturePad } from '../../../components/SignaturePad';
import { StepProgressBar } from '../../../components/StepProgressBar';
import { useAppToast } from '../../../hooks/useAppToast';
import { useAuth } from '../../../hooks/useAuth';
import { useBitacora, type BitacoraDetalle } from '../../../hooks/useBitacora';
import { useEvidencias } from '../../../hooks/useEvidencias';
import { useLocation } from '../../../hooks/useLocation';
import { useReportQueue } from '../../../hooks/useReportQueue';
import { buildFirmaObject } from '../../../lib/signatures';
import { ensurePersistedCameraPhoto, persistCameraPhoto } from '../../../lib/persistCameraPhoto';
import { getFailedReports, getPendingReports } from '../../../lib/reportQueueStorage';
import { clearLiveLocation } from '../../../services/locationService';
import { useRequireRouteId } from '../../../lib/useRequireRouteId';

type CloseType = 'acompanamiento' | 'ruta';
type Phase = 'tipo' | 'foto' | 'firmas' | 'observaciones';

export default function CustodyFinishScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = useRequireRouteId(rawId);
  const router = useRouter();
  const { session, profile } = useAuth();
  const toast = useAppToast();
  const { getBitacoraDetalle, cerrarCustodia } = useBitacora();
  const { getCurrentLocation } = useLocation();
  const { enqueue, flush } = useReportQueue(id ?? undefined, session?.user?.id);
  const { uploadFirma } = useEvidencias();

  const [bitacora, setBitacora] = useState<BitacoraDetalle | null>(null);
  const [phase, setPhase] = useState<Phase>('tipo');
  const [closeType, setCloseType] = useState<CloseType | null>(null);
  const [firmaOperador, setFirmaOperador] = useState('');
  const [fotoFinalUri, setFotoFinalUri] = useState<string | null>(null);
  const [closeCoords, setCloseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const firmaCustodioRegistrada = useMemo(
    () => bitacora?.formulario?.firmaCustodio?.trim() ?? '',
    [bitacora?.formulario?.firmaCustodio],
  );

  useEffect(() => {
    if (!id) return;
    getBitacoraDetalle(id)
      .then(setBitacora)
      .catch(() => setBitacora(null));
  }, [id, getBitacoraDetalle]);

  const steps = useMemo(() => {
    if (closeType === 'acompanamiento') {
      return ['Tipo de cierre', 'Foto final', 'Observaciones'];
    }
    return ['Tipo de cierre', 'Foto final', 'Firmas', 'Observaciones'];
  }, [closeType]);

  const stepIndex = useMemo(() => {
    if (phase === 'tipo') return 1;
    if (phase === 'foto') return 2;
    if (phase === 'firmas') return 3;
    return closeType === 'acompanamiento' ? 3 : 4;
  }, [phase, closeType]);

  const tomarFotoFinal = () => {
    setCameraOpen(true);
  };

  const onFinalPhotoCapture = async (uri: string) => {
    setCameraOpen(false);
    try {
      const localUri = await persistCameraPhoto(uri);
      setFotoFinalUri(localUri);
      try {
        const { latitude, longitude } = await getCurrentLocation();
        setCloseCoords({ lat: latitude, lng: longitude });
      } catch {
        setCloseCoords(null);
      }
    } catch (e) {
      toast.error('Foto', e instanceof Error ? e.message : 'No se pudo guardar la foto.');
    }
  };

  const avanzarDesdeFoto = () => {
    if (!fotoFinalUri) {
      toast.warning('Foto requerida', 'Toma la foto final con GPS.');
      return;
    }
    setPhase(closeType === 'ruta' ? 'firmas' : 'observaciones');
  };

  const avanzarDesdeFirmas = () => {
    if (!firmaOperador) {
      toast.warning('Firma requerida', 'El operador debe firmar antes de continuar.');
      return;
    }
    if (!firmaCustodioRegistrada) {
      toast.warning(
        'Firma del custodio',
        'Esta bitacora no tiene firma del custodio. Debe firmarse al crear la bitacora.',
      );
      return;
    }
    setPhase('observaciones');
  };

  const enviarCierre = async () => {
    if (!id || !session?.user?.id || !closeType) return;

    if (!fotoFinalUri) {
      toast.warning('Foto requerida', 'Toma la foto final antes de cerrar el servicio.');
      return;
    }

    if (closeType === 'ruta' && (!firmaOperador || !firmaCustodioRegistrada)) {
      toast.warning(
        'Firmas requeridas',
        'El cierre de ruta requiere la firma del operador y la del custodio registrada en la bitacora.',
      );
      return;
    }

    setLoading(true);

    try {
      const { latitude, longitude, accuracy } = closeCoords
        ? { latitude: closeCoords.lat, longitude: closeCoords.lng, accuracy: null as number | null }
        : await getCurrentLocation();

      const persistedPhoto = await ensurePersistedCameraPhoto(fotoFinalUri);

      await enqueue({
        bitacoraId: id,
        photoUri: persistedPhoto,
        latitud: latitude,
        longitud: longitude,
        precision_m: accuracy,
        estatus: 'termino',
        reportIndex: 9999,
        fallbackUbicacion: bitacora?.formulario?.destino ?? bitacora?.formulario?.origen,
      });

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await flush({ force: true });
        const pending = await getPendingReports(id);
        const failed = await getFailedReports(id);
        if (pending.length === 0 && failed.length === 0) break;
        if (failed.some((f) => f.estatus === 'termino')) {
          throw new Error('No se pudo enviar la foto final a n8n tras varios intentos.');
        }
        await new Promise((resolve) => setTimeout(resolve, 2_500));
      }

      const stillPending = await getPendingReports(id);
      if (stillPending.some((p) => p.estatus === 'termino')) {
        throw new Error('La foto final sigue pendiente de envio. Revisa tu conexion.');
      }

      let firmaOperadorJson = '';
      let firmaCustodioJson = '';

      if (closeType === 'ruta') {
        const operadorNombre = bitacora?.formulario?.operador1?.nombre ?? 'Operador';
        const custodioNombre = profile?.nombre ?? 'Custodio';
        const firmaOperadorObj = buildFirmaObject({
          dataUrl: firmaOperador,
          signerRole: 'operador',
          signerName: operadorNombre,
        });
        const firmaCustodioObj = buildFirmaObject({
          dataUrl: firmaCustodioRegistrada,
          signerRole: 'custodio',
          signerName: custodioNombre,
        });
        firmaOperadorJson = JSON.stringify(firmaOperadorObj);
        firmaCustodioJson = JSON.stringify(firmaCustodioObj);
        await uploadFirma(firmaOperador, session.user.id, id, 'operador');
        await uploadFirma(firmaCustodioRegistrada, session.user.id, id, 'custodio');
      } else {
        firmaOperadorJson = JSON.stringify({ tipo: 'acompanamiento', sin_firma: true });
        firmaCustodioJson = JSON.stringify({ tipo: 'acompanamiento', custodio: profile?.nombre });
      }

      const ok = await cerrarCustodia(id, session.user.id, firmaOperadorJson, firmaCustodioJson);
      if (!ok) throw new Error('No se pudo cerrar el servicio.');

      await clearLiveLocation(session.user.id);

      toast.success('Servicio completado', 'Monitoreo cerrado y guardado.');
      router.replace({ pathname: '/(app)/home', params: { filtro: 'completado' } });
    } catch (e) {
      toast.error('Error al cerrar', e instanceof Error ? e.message : 'No se pudo cerrar.');
    } finally {
      setLoading(false);
    }
  };

  if (!id) return null;

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <View className="bg-emerald-800 px-4 py-3">
        <Text className="text-[10px] uppercase text-emerald-200">Cierre de monitoreo</Text>
        <Text className="text-lg font-bold text-white">{bitacora?.nombre ?? 'Servicio'}</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable className="py-3" onPress={() => router.back()}>
          <Text className="text-emerald-400">← Volver al servicio</Text>
        </Pressable>

        {phase !== 'tipo' ? (
          <StepProgressBar step={stepIndex} total={steps.length} labels={steps} />
        ) : null}

        {phase === 'tipo' ? (
          <View>
            <Text className="mb-4 text-base text-servi-suave">
              Pantalla 9 — elige como se cierra este monitoreo
            </Text>
            <CloseTypeCard
              title="Acompanamiento"
              desc="Reporte final con foto. Sin firma del operador."
              icon="walk-outline"
              selected={closeType === 'acompanamiento'}
              onPress={() => {
                setCloseType('acompanamiento');
                setPhase('foto');
              }}
            />
            <CloseTypeCard
              title="Custodia hasta destino"
              desc="Foto final + firma del operador (el custodio ya firmo al crear la bitacora)."
              icon="flag-outline"
              selected={closeType === 'ruta'}
              onPress={() => {
                setCloseType('ruta');
                setPhase('foto');
              }}
            />
          </View>
        ) : null}

        {phase === 'foto' ? (
          <View>
            <Text className="mb-3 font-semibold text-servi-texto">Foto de termino con GPS</Text>
            <Pressable
              className="mb-4 overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500/50 bg-servi-superficie active:opacity-90"
              onPress={tomarFotoFinal}
            >
              {fotoFinalUri ? (
                <Image source={{ uri: fotoFinalUri }} className="h-52 w-full" resizeMode="cover" />
              ) : (
                <View className="h-52 items-center justify-center">
                  <Ionicons name="camera" size={48} color="#22C55E" />
                  <Text className="mt-2 text-emerald-400">Tocar para capturar</Text>
                </View>
              )}
            </Pressable>
            {closeCoords ? (
              <>
                <ReportMapView
                  points={[{ lat: closeCoords.lat, lng: closeCoords.lng, label: 'Cierre' }]}
                  height={160}
                  title="Ubicacion de cierre"
                  showOpenMaps={false}
                />
                <View className="mt-3">
                  <GoogleMapsActions
                    lat={closeCoords.lat}
                    lng={closeCoords.lng}
                    label="Punto de cierre"
                    coordsLabel="GPS de cierre"
                    variant="compact"
                  />
                </View>
              </>
            ) : null}
            <Pressable
              className="mt-4 items-center rounded-2xl bg-emerald-600 py-4"
              onPress={avanzarDesdeFoto}
            >
              <Text className="font-bold text-white">Continuar</Text>
            </Pressable>
          </View>
        ) : null}

        {phase === 'firmas' ? (
          <View>
            <View className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3">
              <Text className="text-xs text-emerald-200">
                Firma del custodio ({profile?.nombre ?? '—'}) registrada al crear la bitacora.
              </Text>
            </View>
            <SignaturePad
              label={`Firma operador (${bitacora?.formulario?.operador1?.nombre ?? '—'})`}
              value={firmaOperador}
              onDrawingChange={(drawing) => setScrollEnabled(!drawing)}
              onCapture={setFirmaOperador}
            />
            <Pressable
              className="mt-2 items-center rounded-2xl bg-emerald-600 py-4"
              onPress={avanzarDesdeFirmas}
            >
              <Text className="font-bold text-white">Continuar</Text>
            </Pressable>
          </View>
        ) : null}

        {phase === 'observaciones' ? (
          <View>
            <Text className="mb-2 font-semibold text-servi-texto">Observaciones finales</Text>
            <Text className="mb-3 text-xs text-servi-suave">Opcional — incidentes, retrasos, condiciones</Text>
            <TextInput
              className="mb-4 min-h-[120px] rounded-2xl border border-servi-borde bg-servi-superficie p-4 text-servi-texto"
              multiline
              placeholder="Escribe aqui..."
              placeholderTextColor="#64748B"
              value={observaciones}
              onChangeText={setObservaciones}
              textAlignVertical="top"
            />
            <Pressable
              className="items-center rounded-2xl bg-emerald-600 py-4"
              onPress={enviarCierre}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="font-bold text-white">Enviar y cerrar monitoreo</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <InAppCameraModal
        visible={cameraOpen}
        title="Foto final de cierre"
        onCapture={onFinalPhotoCapture}
        onClose={() => setCameraOpen(false)}
      />
    </SafeAreaView>
  );
}

function CloseTypeCard({
  title,
  desc,
  icon,
  selected,
  onPress,
}: {
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`mb-3 flex-row items-center rounded-2xl border p-4 active:opacity-90 ${
        selected ? 'border-emerald-500 bg-emerald-500/15' : 'border-servi-borde bg-servi-superficie'
      }`}
      onPress={onPress}
    >
      <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20">
        <Ionicons name={icon} size={28} color="#22C55E" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-servi-texto">{title}</Text>
        <Text className="text-sm text-servi-suave">{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </Pressable>
  );
}
