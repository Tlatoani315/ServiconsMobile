import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../components/AppButton';
import { AutofillTextInput, LoginAutofillForm } from '../../components/AutofillTextInput';
import { FadeInView } from '../../components/FadeInView';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa correo y contrasena.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email.trim(), password);

    setLoading(false);

    if (signInError) {
      setError('Credenciales incorrectas. Revisa tu correo y contrasena.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Escribe tu correo para enviar el enlace de recuperacion.');
      return;
    }

    setLoading(true);
    setError(null);
    const { error: resetError } = await resetPassword(email.trim());
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    Alert.alert(
      'Correo enviado',
      'Revisa tu bandeja de entrada para restablecer tu contrasena.',
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-servi-fondo" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <FadeInView className="mb-8 items-center">
            <Logo size={72} />
            <Text className="mt-6 text-3xl font-bold text-servi-texto">Iniciar sesion</Text>
            <Text className="mt-2 text-center text-servi-suave">Accede a Servicons Mobile</Text>
          </FadeInView>

          <LoginAutofillForm>
            <View className="mb-4">
              <Text className="mb-1.5 text-sm text-servi-suave">Correo electronico</Text>
              <AutofillTextInput
                className="rounded-xl border border-servi-borde bg-servi-superficie px-4 py-3.5 text-base text-servi-texto"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="#A7C4B5"
                returnKeyType="next"
                autoFocus={false}
                autofillRole="loginIdentifier"
                nativeID="login-email"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-sm text-servi-suave">Contrasena</Text>
              <View className="flex-row items-center rounded-xl border border-servi-borde bg-servi-superficie">
                <AutofillTextInput
                  ref={passwordRef}
                  className="flex-1 px-4 py-3.5 text-base text-servi-texto"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="********"
                  placeholderTextColor="#A7C4B5"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  autofillRole="password"
                  nativeID="login-password"
                />
                <Pressable
                  className="px-4 py-3"
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Text className="text-sm text-servi-acento">{showPassword ? 'Ocultar' : 'Ver'}</Text>
                </Pressable>
              </View>
            </View>
          </LoginAutofillForm>

          {error ? (
            <Text className="mb-4 text-center text-sm text-servi-peligro">{error}</Text>
          ) : null}

          <AppButton label="Iniciar sesion" variant="accent" onPress={handleLogin} loading={loading} />

          <Pressable className="mt-3 items-center py-2" onPress={handleForgotPassword}>
            <Text className="text-sm text-servi-acento">Olvidaste tu contrasena?</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
