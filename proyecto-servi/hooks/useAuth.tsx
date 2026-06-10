import * as Linking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { createSessionFromUrl } from '../lib/authDeepLink';
import { clearCustodyStartPending } from '../lib/custodyStartPending';
import { isValidRole } from '../lib/roles';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, UserRole } from '../types/models';

type SignUpParams = {
  email: string;
  password: string;
  nombre: string;
  role: UserRole;
  requestedRole?: UserRole | null;
  empresa?: string;
};

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; role?: UserRole }>;
  signUp: (params: SignUpParams) => Promise<{
    error: string | null;
    role?: UserRole;
    pendingConfirmation?: boolean;
  }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (data: {
    nombre?: string;
    celular?: string | null;
    empresa?: string | null;
  }) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data as UserProfile;
}

function isProfileAllowed(profile: UserProfile | null): profile is UserProfile {
  if (!profile) return false;
  if (profile.activo === false) return false;
  return isValidRole(profile.role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const invalidateSession = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const applyProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const data = await fetchProfile(userId);
    if (!isProfileAllowed(data)) {
      setProfile(null);
      return null;
    }
    setProfile(data);
    return data;
  }, []);

  const ensureValidSessionProfile = useCallback(
    async (userId: string) => {
      const data = await fetchProfile(userId);
      if (!isProfileAllowed(data)) {
        await invalidateSession();
        return null;
      }
      setProfile(data);
      return data;
    },
    [invalidateSession],
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          await ensureValidSessionProfile(currentSession.user.id);
        }
      } catch (e) {
        console.error('[auth] bootstrap failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(() => {
          void ensureValidSessionProfile(nextSession.user!.id);
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const handleDeepLink = (url: string) => {
      void createSessionFromUrl(url).then(({ error }) => {
        if (error) console.warn('[auth] deep link session error:', error);
      });
    };

    void Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, [ensureValidSessionProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          return { error: 'Correo o contrasena incorrectos.' };
        }
        if (msg.includes('email not confirmed')) {
          return {
            error:
              'Debes confirmar tu correo primero. Revisa tu bandeja o desactiva Confirm email en Supabase.',
          };
        }
        return { error: error.message };
      }

      if (!data.user) return { error: 'No se pudo iniciar sesion.' };

      const userProfile = await applyProfile(data.user.id);

      if (!userProfile) {
        const raw = await fetchProfile(data.user.id);
        await invalidateSession();
        if (raw?.activo === false) {
          return { error: 'Tu cuenta esta desactivada. Contacta al administrador.' };
        }
        if (raw && !isValidRole(raw.role)) {
          return { error: 'Tu cuenta tiene un rol invalido. Contacta al administrador.' };
        }
        return {
          error:
            'Tu cuenta existe pero no tiene perfil. Contacta al administrador o registrate de nuevo.',
        };
      }

      if (data.session) setSession(data.session);
      return { error: null, role: userProfile.role };
    },
    [applyProfile, invalidateSession],
  );

  const signUp = useCallback(
    async ({ email, password, nombre, role, requestedRole, empresa }: SignUpParams) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            role,
            requested_role: requestedRole ?? null,
            empresa: empresa?.trim() ?? '',
          },
        },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'No se pudo crear la cuenta.' };

      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          nombre: nombre.trim(),
          email: email.trim(),
          role,
          empresa:
            role === 'cliente' || role === 'custodio' ? empresa?.trim() ?? null : null,
        });

        if (profileError) {
          await invalidateSession();
          return { error: `Cuenta creada pero fallo el perfil: ${profileError.message}` };
        }

        setSession(data.session);
        await applyProfile(data.user.id);
        return { error: null, role };
      }

      return {
        error: null,
        role,
        pendingConfirmation: true,
      };
    },
    [applyProfile, invalidateSession],
  );

  const signOut = useCallback(async () => {
    try {
      await clearCustodyStartPending();
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return { error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo cerrar sesion.';
      console.error('[auth] signOut failed', e);
      return { error: message };
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { nombre?: string; celular?: string | null; empresa?: string | null }) => {
      if (!session?.user) return { error: 'Sesion no activa' };

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', session.user.id);

      if (error) return { error: error.message };
      await applyProfile(session.user.id);
      return { error: null };
    },
    [session?.user, applyProfile],
  );

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = Linking.createURL('/auth/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (newPassword.length < 8) {
      return { error: 'La contrasena debe tener al menos 8 caracteres.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      resetPassword,
      updatePassword,
    }),
    [
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      resetPassword,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
