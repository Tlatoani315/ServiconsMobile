import { useLocalSearchParams, useRouter } from 'expo-router';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';



import { ConfirmFinishModal } from '../../../components/ConfirmFinishModal';

import { CircularTimer } from '../../../components/CircularTimer';

import { InAppCameraModal } from '../../../components/InAppCameraModal';

import { LocationDisplay } from '../../../components/LocationDisplay';

import { ReportStatusBar } from '../../../components/ReportStatusBar';

import { SOSButton } from '../../../components/SOSButton';

import { useAppToast } from '../../../hooks/useAppToast';

import { useAutoRefresh } from '../../../hooks/useAutoRefresh';

import { useAuth } from '../../../hooks/useAuth';

import { useBitacora, type BitacoraDetalle } from '../../../hooks/useBitacora';

import { useLiveLocationTracker } from '../../../hooks/useLiveLocationTracker';

import { useLocation } from '../../../hooks/useLocation';

import { usePermissions } from '../../../hooks/usePermissions';

import { useReportQueue } from '../../../hooks/useReportQueue';

import { useRouteReports } from '../../../hooks/useRouteReports';

import { notifyReportDue, initReportNotifications } from '../../../lib/reportNotifications';

import { persistCameraPhoto } from '../../../lib/persistCameraPhoto';

import { useRequireRouteId } from '../../../lib/useRequireRouteId';

import { triggerSOS, type N8nChannel } from '../../../services/n8nService';

import { supabase } from '../../../lib/supabaseClient';



export default function CustodyActiveScreen() {

  const { id: rawId } = useLocalSearchParams<{ id: string }>();

  const id = useRequireRouteId(rawId);

  const router = useRouter();

  const { session, profile } = useAuth();

  const toast = useAppToast();

  const userId = session?.user?.id;

  const { getBitacoraDetalle, iniciarCustodia } = useBitacora();

  const { getCurrentLocation } = useLocation();

  const { ensureFieldPermissions } = usePermissions();

  const { localReportCount, syncReportCountFromDb } = useRouteReports();

  const {

    syncStatus,

    pendingCount,

    failedCount,

    processing,

    enqueue,

    flush,

    retryFailed,

  } = useReportQueue(id ?? undefined, userId);

  const insets = useSafeAreaInsets();

  const [bitacora, setBitacora] = useState<BitacoraDetalle | null>(null);

  const [reporting, setReporting] = useState(false);

  const [timerKey, setTimerKey] = useState(0);

  const [locationKey, setLocationKey] = useState(0);

  const [finishModal, setFinishModal] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);

  const notifiedExpireRef = useRef(false);
  const failedToastRef = useRef(false);

  useEffect(() => {
    void initReportNotifications();
  }, []);

  useEffect(() => {
    notifiedExpireRef.current = false;
  }, [timerKey]);



  const { lastUploadAt, uploadError, appForeground, isTransmittingLive } = useLiveLocationTracker({

    custodioId: userId,

    bitacoraId: id ?? undefined,

    enabled: Boolean(id && userId && bitacora?.estado === 'activo'),

  });



  const reload = useCallback(async () => {

    if (!id) return;

    try {

      const detail = await getBitacoraDetalle(id);

      setBitacora(detail);

      await syncReportCountFromDb(id);

      await flush();

    } catch (e) {

      console.warn('[custody/active] reload failed', e);

    }

  }, [id, getBitacoraDetalle, syncReportCountFromDb, flush]);



  useAutoRefresh(reload, 15_000);



  useEffect(() => {

    if (id) void syncReportCountFromDb(id);

  }, [id, syncReportCountFromDb]);



  useEffect(() => {

    if (bitacora?.estado === 'activo') return;

    if (!id || !userId) return;

    void iniciarCustodia(id, userId).then(() => reload());

  }, [bitacora?.estado, id, userId, iniciarCustodia, reload]);



  useEffect(() => {
    if (failedCount > 0 && !failedToastRef.current) {
      failedToastRef.current = true;
      toast.warning(
        'Envio fallido',
        'No se pudo enviar un reporte tras 3 intentos. Toca Reintentar en el estatus.',
      );
    }
    if (failedCount === 0) {
      failedToastRef.current = false;
    }
  }, [failedCount, toast]);



  const abrirCamaraReporte = useCallback(async () => {

    if (!id || !userId || reporting) return;



    const permitted = await ensureFieldPermissions();

    if (!permitted) return;



    notifiedExpireRef.current = false;

    setCameraOpen(true);

  }, [id, userId, reporting, ensureFieldPermissions]);



  const onTimerExpire = useCallback(() => {

    if (notifiedExpireRef.current) return;

    notifiedExpireRef.current = true;

    void notifyReportDue(bitacora?.nombre ?? undefined);

    toast.warning('Hora de reportar', 'Toca el temporizador o el boton verde para tomar la foto.');

  }, [bitacora?.nombre, toast]);



  const onReportPhotoCapture = useCallback(

    async (uri: string) => {

      if (!id || !userId) return;



      setCameraOpen(false);

      setReporting(true);



      try {

        const persistedPhotoUri = await persistCameraPhoto(uri);

        const loc = await getCurrentLocation();

        const nextReportNumber = localReportCount + pendingCount + 1;



        await enqueue({

          bitacoraId: id,

          photoUri: persistedPhotoUri,

          latitud: loc.latitude,

          longitud: loc.longitude,

          precision_m: loc.accuracy ?? null,

          reportIndex: nextReportNumber,

          fallbackUbicacion: bitacora?.formulario?.origen,

        });



        setTimerKey((k) => k + 1);

        setLocationKey((k) => k + 1);

        notifiedExpireRef.current = false;



        toast.success('Reporte guardado', 'Se enviara automaticamente cuando haya conexion.');

      } catch (e) {

        toast.error('Error al reportar', e instanceof Error ? e.message : 'Intenta de nuevo.');

      } finally {

        setReporting(false);

      }

    },

    [id, userId, getCurrentLocation, enqueue, bitacora, localReportCount, pendingCount, toast],

  );



  const activarSOS = async () => {

    if (!id || !userId) return;



    const permitted = await ensureFieldPermissions();

    if (!permitted) return;



    try {

      const { latitude, longitude, accuracy } = await getCurrentLocation();



      const { error } = await supabase.from('sos_alerts').insert({

        custodio_id: userId,

        bitacora_id: id,

        latitud: latitude,

        longitud: longitude,

        estado: 'activa',

      });



      if (error) throw error;



      await supabase.from('custodio_ubicaciones_live').upsert(

        {

          custodio_id: userId,

          bitacora_id: id,

          latitud: latitude,

          longitud: longitude,

          precision_m: accuracy ?? null,

          updated_at: new Date().toISOString(),

        },

        { onConflict: 'custodio_id' },

      );



      const contactos: N8nChannel[] = (bitacora?.contactos ?? []).map((c) => ({

        remoteJid: c.remoteJid,

        pushName: c.pushName,

      }));



      const sosResult = await triggerSOS({

        custodio_id: userId,

        custodio_nombre: profile?.nombre ?? 'Custodio',

        bitacora_id: id,

        latitud: latitude,

        longitud: longitude,

        timestamp: new Date().toISOString(),

        contactos_emergencia: contactos,

      });



      if (!sosResult.success) {

        toast.warning(

          'SOS registrado',

          `Alerta guardada. Notificacion externa fallo: ${sosResult.error ?? 'error desconocido'}`,

        );

        return;

      }



      toast.warning(

        'SOS enviado',

        'Alerta registrada y notificaciones enviadas a administradores.',

      );

    } catch (e) {

      toast.error('Error SOS', e instanceof Error ? e.message : 'No se pudo enviar SOS');

    }

  };



  const handleRetry = useCallback(async () => {

    const result = await retryFailed();

    if (result && result.failed === 0 && result.remaining === 0) {

      toast.success('Envio completado', 'Reportes sincronizados con n8n.');

    } else if (result && result.failed > 0) {

      toast.error('Sigue fallando', 'Verifica internet e intenta de nuevo.');

    }

  }, [retryFailed, toast]);



  if (!id) return null;



  const interval = bitacora?.report_interval_minutes ?? 15;

  const startLabel = bitacora?.start_time

    ? new Date(bitacora.start_time).toLocaleString()

    : '—';



  return (

    <SafeAreaView className="flex-1 bg-servi-fondo">

      <View className="bg-emerald-800 px-4 py-3">

        <Text className="text-[10px] uppercase text-emerald-200">Custodio · Monitoreo</Text>

        <Text className="text-lg font-bold text-white">{bitacora?.nombre}</Text>

      </View>



      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>

        <ReportStatusBar

          status={processing ? 'pending' : syncStatus}

          pendingCount={pendingCount}

          onRetry={syncStatus === 'error' ? handleRetry : undefined}

        />



        <CircularTimer

          intervalMinutes={interval}

          onExpire={onTimerExpire}

          onPress={abrirCamaraReporte}

          resetKey={timerKey}

        />



        <Text className="mb-2 text-center text-sm text-servi-suave">

          Custodia: {bitacora?.unidad ?? bitacora?.nombre}

        </Text>



        <LocationDisplay refreshKey={locationKey} label="Mapa GPS en tiempo real" />



        <View

          className={`mb-4 rounded-2xl border px-4 py-3 ${

            isTransmittingLive

              ? 'border-emerald-500/40 bg-emerald-500/10'

              : 'border-amber-500/40 bg-amber-500/10'

          }`}

        >

          <View className="mb-1 flex-row items-center gap-2">

            <View

              className={`h-2 w-2 rounded-full ${

                isTransmittingLive ? 'bg-emerald-400' : 'bg-amber-400'

              }`}

            />

            <Text

              className={`text-xs font-semibold uppercase ${

                isTransmittingLive ? 'text-emerald-300' : 'text-amber-300'

              }`}

            >

              {isTransmittingLive

                ? 'GPS transmitiendo — app abierta'

                : appForeground

                  ? 'Conectando GPS...'

                  : 'GPS pausado — abre la app en custodia'}

            </Text>

          </View>

          <Text className="text-sm text-servi-suave">

            {isTransmittingLive && lastUploadAt

              ? `Ultima subida: ${new Date(lastUploadAt).toLocaleTimeString()} · cada ~30 s`

              : 'Los administradores solo ven "en vivo" mientras esta pantalla esta activa.'}

          </Text>

          {uploadError ? (

            <Text className="mt-1 text-xs text-servi-peligro">Error GPS: {uploadError}</Text>

          ) : null}

        </View>



        <View className="mb-4 flex-row gap-3">

          <StatBox label="Reportes" value={String(localReportCount)} accent />

          <StatBox label="Inicio" value={startLabel.split(',')[1]?.trim() ?? '—'} />

        </View>



        <Pressable

          className="mb-4 items-center rounded-2xl bg-emerald-600 py-4 active:opacity-90"

          onPress={abrirCamaraReporte}

          disabled={reporting}

        >

          {reporting ? (

            <ActivityIndicator color="#FFF" />

          ) : (

            <Text className="text-lg font-bold text-white">Reportar ahora (camara)</Text>

          )}

        </Pressable>

      </ScrollView>



      <View

        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-servi-borde bg-servi-fondo/95 px-4 pt-3"

        style={{ paddingBottom: Math.max(insets.bottom, 12) }}

      >

        <SOSButton onConfirm={activarSOS} disabled={reporting} />

        <Pressable

          className="rounded-2xl bg-slate-700 px-6 py-4 active:opacity-90"

          onPress={() => setFinishModal(true)}

        >

          <Text className="font-bold text-white">Terminar</Text>

        </Pressable>

      </View>



      <ConfirmFinishModal

        visible={finishModal}

        serviceName={bitacora?.nombre}

        onCancel={() => setFinishModal(false)}

        onConfirm={() => {

          setFinishModal(false);

          router.push({ pathname: '/(app)/custody/finish', params: { id } });

        }}

      />



      <InAppCameraModal

        visible={cameraOpen}

        title="Evidencia del reporte"

        onCapture={onReportPhotoCapture}

        onClose={() => setCameraOpen(false)}

      />

    </SafeAreaView>

  );

}



function StatBox({

  label,

  value,

  accent,

}: {

  label: string;

  value: string;

  accent?: boolean;

}) {

  return (

    <View className="flex-1 rounded-2xl border border-servi-borde bg-servi-superficie px-3 py-3">

      <Text className="text-[10px] uppercase text-servi-suave">{label}</Text>

      <Text className={`text-lg font-bold ${accent ? 'text-servi-acento' : 'text-servi-texto'}`}>

        {value}

      </Text>

    </View>

  );

}


