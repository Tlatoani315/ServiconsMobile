import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../components/AppButton';
import { AuthTextField } from '../../components/AuthTextField';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../hooks/useAuth';
import { getPasswordRules, isPasswordValid } from '../../lib/authValidation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRules = getPasswordRules(password);
  const passwordOk = isPasswordValid(password);
  const matchOk = confirm.length > 0 && password === confirm;
  const recoveryReady = Boolean(session);

  useEffect(() => {
    if (!authLoading && !session) {
      setError('Abre el enlace de recuperacion desde tu correo para continuar.');
    }
  }, [authLoading, session]);

  const handleSave = async () => {
    if (!recoveryReady) {
      setError('Abre el enlace de recuperacion desde tu correo para continuar.');
      return;
    }

    if (!passwordOk || !matchOk) {
      setError('Revisa los requisitos de contrasena.');
      return;
    }

    setLoading(true);
    setError(null);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    Alert.alert('Contrasena actualizada', 'Ya puedes iniciar sesion con tu nueva contrasena.', [
      { text: 'Ir a login', onPress: () => router.replace('/auth/login') },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 32 }}>
          <View className="mb-8 items-center">
            <Logo size={64} />
            <Text className="mt-4 text-2xl font-bold text-servi-texto">Nueva contrasena</Text>
            <Text className="mt-2 text-center text-servi-suave">
              {recoveryReady
                ? 'Escribe tu nueva contrasena para recuperar el acceso'
                : 'Esperando enlace de recuperacion desde tu correo…'}
            </Text>
          </View>

          <AuthTextField
            label="Nueva contrasena"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimo 8 caracteres"
            autofillRole="newPassword"
            showToggle
            showPasswordRules
            showValidation
            editable={recoveryReady}
          />

          <AuthTextField
            label="Confirmar contrasena"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite la contrasena"
            autofillRole="confirmPassword"
            showToggle
            showValidation={confirm.length > 0}
            isValid={matchOk}
            validationRules={[
              {
                id: 'match',
                label: 'Las contrasenas coinciden',
                met: matchOk,
              },
            ]}
            validationTitle="Confirmacion"
            editable={recoveryReady}
          />

          {error ? <Text className="mb-4 text-center text-sm text-servi-peligro">{error}</Text> : null}

          <AppButton
            label="Guardar contrasena"
            variant="accent"
            onPress={handleSave}
            loading={loading}
            disabled={!recoveryReady || !passwordOk || !matchOk}
          />

          <Pressable className="mt-6 items-center py-2" onPress={() => router.replace('/auth/login')}>
            <Text className="text-servi-acento">Volver a iniciar sesion</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
