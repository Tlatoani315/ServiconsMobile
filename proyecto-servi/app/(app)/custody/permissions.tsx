import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InAppCameraModal } from '../../../components/InAppCameraModal';
import { PermissionsPanel } from '../../../components/PermissionsPanel';
import { useAuth } from '../../../hooks/useAuth';
import { useBitacora, type BitacoraDetalle } from '../../../hooks/useBitacora';
import { useLocation } from '../../../hooks/useLocation';
import { usePermissions } from '../../../hooks/usePermissions';
import { useRouteReports } from '../../../hooks/useRouteReports';
import { beginCustodyService } from '../../../lib/beginCustodyService';
import {
  clearCustodyStartPending,
  loadCustodyStartPending,
  saveCustodyStartPending,
} from '../../../lib/custodyStartPending';
import { deletePersistedPhoto, ensurePersistedCameraPhoto } from '../../../lib/persistCameraPhoto';

type PrefetchedLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

/** Pantalla 5 — Permisos + foto inicial + reporte inicio a n8n */
export default function CustodyPermissionsScreen() {
  const { id, auto } = useLocalSearchParams<{ id: string; auto?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { getBitacoraDetalle } = useBitacora();
  const { allGranted, ensureFieldPermissions } = usePermissions();
  const { getCurrentLocation } = useLocation();
  const { sendRouteReport } = useRouteReports();
  const [bitacora, setBitacora] = useState<BitacoraDetalle | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const processingRef = useRef(false);
  const autoOpenedRef = useRef(false);
  const resumeCheckedRef = useRef(false);
  const locationPrefetchRef = useRef<PrefetchedLocation | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoadingDetail(true);
    getBitacoraDetalle(id)
      .then(setBitacora)
      .finally(() => setLoadingDetail(false));
  }, [id, getBitacoraDetalle]);

  useEffect(() => {
    if (!allGranted) return;
    getCurrentLocation()
      .then((loc) => {
        locationPrefetchRef.current = loc;
      })
      .catch(() => {
        locationPrefetchRef.current = null;
      });
  }, [allGranted, getCurrentLocation]);

  const finalizeStart = useCallback(
    async (photoUri: string) => {
      if (!id || !session?.user?.id || processingRef.current) return;

      processingRef.current = true;
      setLoading(true);

      let persistedPhotoUri: string | null = photoUri;

      try {
        persistedPhotoUri = await ensurePersistedCameraPhoto(photoUri);

        await saveCustodyStartPending({
          bitacoraId: id,
          custodioId: session.user.id,
          photoUri: persistedPhotoUri,
          createdAt: Date.now(),
        });

        let detail = bitacora;
        if (!detail?.formulario || !detail.contactos) {
          detail = await getBitacoraDetalle(id);
          setBitacora(detail);
        }
        if (!detail) throw new Error('No se pudo cargar la bitacora.');

        const result = await beginCustodyService({
          bitacoraId: id,
          bitacora: detail,
          photoUri: persistedPhotoUri,
          getCurrentLocation,
          sendRouteReport,
          prefetchedLocation: locationPrefetchRef.current,
        });

        if (!result.ok) throw new Error(result.error);

        router.replace({ pathname: '/(app)/custody/active', params: { id } });

        void clearCustodyStartPending();
        void deletePersistedPhoto(persistedPhotoUri);
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar el servicio');
      } finally {
        setLoading(false);
        processingRef.current = false;
      }
    },
    [
      id,
      session?.user?.id,
      bitacora,
      getBitacoraDetalle,
      getCurrentLocation,
      sendRouteReport,
      router,
    ],
  );

  useEffect(() => {
    if (!id || !session?.user?.id || resumeCheckedRef.current || loadingDetail) return;
    resumeCheckedRef.current = true;

    void (async () => {
      const pending = await loadCustodyStartPending();
      if (!pending || pending.bitacoraId !== id || pending.custodioId !== session.user.id) return;
      await finalizeStart(pending.photoUri);
    })();
  }, [id, session?.user?.id, loadingDetail, finalizeStart]);

  useEffect(() => {
    if (auto !== '1' || autoOpenedRef.current || !allGranted || loadingDetail || loading) return;
    autoOpenedRef.current = true;
    setCameraOpen(true);
  }, [auto, allGranted, loadingDetail, loading]);

  const abrirCamara = async () => {
    if (!id || !session?.user?.id || processingRef.current || loading) return;

    const permitted = await ensureFieldPermissions();
    if (!permitted) return;

    setCameraOpen(true);
  };

  const onPhotoCapture = async (uri: string) => {
    setCameraOpen(false);
    await finalizeStart(uri);
  };

  const busy = loading;

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Pressable className="py-4" onPress={() => router.back()} disabled={busy}>
          <Text className="text-servi-acento">← Volver</Text>
        </Pressable>

        <View className="mb-6 rounded-3xl bg-emerald-700 px-5 py-6">
          <Text className="text-xs uppercase text-emerald-100">Preparacion</Text>
          <Text className="text-2xl font-bold text-white">Iniciar servicio</Text>
          <Text className="mt-2 text-sm text-emerald-100">
            Foto inicial en la app, envio a n8n y pantalla de monitoreo.
          </Text>
        </View>

        <PermissionsPanel />

        {loadingDetail ? (
          <ActivityIndicator color="#F97316" className="my-4" />
        ) : (
          <View className="rounded-2xl border border-servi-borde bg-servi-superficie p-4">
            <Text className="mb-1 text-sm font-semibold text-servi-texto">{bitacora?.nombre}</Text>
            <Text className="text-sm text-servi-suave">{bitacora?.ruta}</Text>
            <Text className="mt-2 text-xs text-servi-suave">
              Contactos WhatsApp: {bitacora?.contactos?.length ?? 0}
            </Text>
          </View>
        )}

        <Pressable
          className={`mt-6 items-center rounded-2xl py-5 active:opacity-90 ${
            allGranted && !loadingDetail && !busy ? 'bg-emerald-600' : 'bg-servi-borde'
          }`}
          onPress={abrirCamara}
          disabled={busy || !allGranted || loadingDetail}
        >
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text className="text-lg font-bold text-white">Comenzar monitoreo</Text>
              <Text className="text-xs text-emerald-100">
                {allGranted ? 'Toma la foto inicial aqui mismo' : 'Activa permisos arriba'}
              </Text>
            </>
          )}
        </Pressable>

        {busy ? (
          <Text className="mt-3 text-center text-xs text-servi-suave">
            Enviando foto a n8n… al recibir confirmacion abriremos el monitoreo.
          </Text>
        ) : null}
      </ScrollView>

      <InAppCameraModal
        visible={cameraOpen}
        title="Foto inicial del servicio"
        onCapture={onPhotoCapture}
        onClose={() => setCameraOpen(false)}
      />
    </SafeAreaView>
  );
}
