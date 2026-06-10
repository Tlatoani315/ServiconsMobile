export type EnvConfig = {
  supabaseUrl: string;
  supabaseKey: string;
  n8nBaseUrl: string;
  n8nWebhookToken: string;
};

export function getEnvConfig(): EnvConfig | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();
  const n8nBaseUrl =
    process.env.EXPO_PUBLIC_N8N_BASE_URL?.trim() ?? 'https://n8n.pymemind.com';
  const n8nWebhookToken = process.env.EXPO_PUBLIC_N8N_WEBHOOK_TOKEN?.trim();

  if (!supabaseUrl || !supabaseKey) return null;

  return {
    supabaseUrl,
    supabaseKey,
    n8nBaseUrl,
    n8nWebhookToken: n8nWebhookToken ?? '',
  };
}

export function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim()) {
    missing.push('EXPO_PUBLIC_SUPABASE_KEY');
  }
  return missing;
}
