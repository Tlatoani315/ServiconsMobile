import { supabase } from './supabaseClient';

function parseParamsFromUrl(url: string): URLSearchParams {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramString =
    hashIndex >= 0
      ? url.slice(hashIndex + 1)
      : queryIndex >= 0
        ? url.slice(queryIndex + 1)
        : '';
  return new URLSearchParams(paramString);
}

/** Establece sesion de recovery/login desde deep link de Supabase (email reset). */
export async function createSessionFromUrl(url: string): Promise<{ error: string | null }> {
  const params = parseParamsFromUrl(url);
  const errorDescription = params.get('error_description') ?? params.get('error');
  if (errorDescription) {
    return { error: decodeURIComponent(errorDescription.replace(/\+/g, ' ')) };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    return { error: null };
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) return { error: error.message };
  return { error: null };
}
