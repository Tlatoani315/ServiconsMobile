-- =============================================================================
-- SERVICONS MOBILE — SQL COMPLETO (RESET + SETUP)
-- =============================================================================
-- COMO USAR:
--   1. Supabase → Authentication → Providers → Email → desactiva "Confirm email"
--   2. Supabase → SQL Editor → pega TODO y RUN (una sola vez)
--   3. Registra usuarios desde la app (Login → Registrate)
--
-- El trigger crea/actualiza profiles al insertar en auth.users.
-- La app tambien hace upsert en profiles tras signUp.
-- ADVERTENCIA: La PARTE A borra tablas y datos existentes.
-- =============================================================================

-- =============================================================================
-- PARTE A — RESET
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.can_assign_role(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_jefe() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

DROP POLICY IF EXISTS "custodio_firmas_read" ON storage.objects;
DROP POLICY IF EXISTS "custodio_firmas_upload" ON storage.objects;
DROP POLICY IF EXISTS "custodio_evidencias_delete" ON storage.objects;
DROP POLICY IF EXISTS "custodio_evidencias_update" ON storage.objects;
DROP POLICY IF EXISTS "custodio_evidencias_read" ON storage.objects;
DROP POLICY IF EXISTS "custodio_evidencias_upload" ON storage.objects;

DROP POLICY IF EXISTS "admin_jefe_sos_lectura" ON public.sos_alerts;
DROP POLICY IF EXISTS "dueno_sos" ON public.sos_alerts;
DROP POLICY IF EXISTS "dueno_evidencias" ON public.evidencias;
DROP POLICY IF EXISTS "admin_jefe_lectura" ON public.bitacoras;
DROP POLICY IF EXISTS "cliente_ve_empresa" ON public.bitacoras;
DROP POLICY IF EXISTS "dueno_bitacora" ON public.bitacoras;
DROP POLICY IF EXISTS "admin_lee_profiles" ON public.profiles;
DROP POLICY IF EXISTS "usuario_propio" ON public.profiles;

DROP TABLE IF EXISTS public.sos_alerts CASCADE;
DROP TABLE IF EXISTS public.evidencias CASCADE;
DROP TABLE IF EXISTS public.bitacoras CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =============================================================================
-- PARTE B — SETUP
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- Roles: super_usuario | jefe_custodios | custodio | cliente
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL DEFAULT 'Usuario',
  email       TEXT,
  celular     TEXT,
  role        TEXT NOT NULL DEFAULT 'custodio' CHECK (role IN (
                'super_usuario', 'jefe_custodios', 'custodio', 'cliente'
              )),
  empresa     TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_propio" ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin y jefe pueden listar perfiles (gestion de usuarios)
CREATE OR REPLACE FUNCTION public.is_admin_or_jefe()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_usuario', 'jefe_custodios')
  );
$$;

CREATE POLICY "admin_lee_profiles" ON public.profiles
  FOR SELECT
  USING (public.is_admin_or_jefe());

-- Valida jerarquia de creacion de roles (usada por Edge Function)
CREATE OR REPLACE FUNCTION public.can_assign_role(actor_role TEXT, target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF actor_role = 'super_usuario' THEN
    RETURN target_role IN ('custodio', 'jefe_custodios', 'cliente');
  ELSIF actor_role = 'jefe_custodios' THEN
    RETURN target_role IN ('custodio', 'cliente');
  END IF;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, role, empresa)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre'), ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'custodio'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'empresa'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    role = EXCLUDED.role,
    empresa = EXCLUDED.empresa;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, nombre, role, empresa)
SELECT
  u.id,
  u.email,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'nombre'), ''), split_part(u.email, '@', 1), 'Usuario'),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'role'), ''), 'custodio'),
  NULLIF(TRIM(u.raw_user_meta_data->>'empresa'), '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- -----------------------------------------------------------------------------
-- 2. BITACORAS
-- -----------------------------------------------------------------------------
CREATE TABLE public.bitacoras (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre                  TEXT,
  ruta                    TEXT,
  unidad                  TEXT,
  empresa_contratante     TEXT,
  estado                  TEXT DEFAULT 'pendiente' CHECK (estado IN (
                            'pendiente', 'activo', 'completado', 'cancelado'
                          )),
  formulario              JSONB,
  report_interval_minutes INT DEFAULT 15,
  firma_custodio          TEXT,
  firma_operador          TEXT,
  start_time              TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bitacoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dueno_bitacora" ON public.bitacoras
  FOR ALL
  USING (custodio_id = auth.uid())
  WITH CHECK (custodio_id = auth.uid());

CREATE POLICY "cliente_ve_empresa" ON public.bitacoras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'cliente'
        AND p.empresa IS NOT NULL
        AND p.empresa = bitacoras.empresa_contratante
    )
  );

CREATE POLICY "admin_jefe_lectura" ON public.bitacoras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_usuario', 'jefe_custodios')
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bitacoras_updated_at
  BEFORE UPDATE ON public.bitacoras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. EVIDENCIAS
-- -----------------------------------------------------------------------------
CREATE TABLE public.evidencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bitacora_id     UUID NOT NULL REFERENCES public.bitacoras(id) ON DELETE CASCADE,
  custodio_id     UUID NOT NULL REFERENCES auth.users(id),
  url_imagen      TEXT,
  latitud         DOUBLE PRECISION NOT NULL,
  longitud        DOUBLE PRECISION NOT NULL,
  observaciones   TEXT,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dueno_evidencias" ON public.evidencias
  FOR ALL
  USING (custodio_id = auth.uid())
  WITH CHECK (custodio_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. SOS ALERTS
-- -----------------------------------------------------------------------------
CREATE TABLE public.sos_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id     UUID NOT NULL REFERENCES auth.users(id),
  bitacora_id     UUID REFERENCES public.bitacoras(id) ON DELETE SET NULL,
  latitud         DOUBLE PRECISION NOT NULL,
  longitud        DOUBLE PRECISION NOT NULL,
  estado          TEXT DEFAULT 'activa' CHECK (estado IN (
                    'activa', 'atendida', 'falsa_alarma'
                  )),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dueno_sos" ON public.sos_alerts
  FOR ALL
  USING (custodio_id = auth.uid())
  WITH CHECK (custodio_id = auth.uid());

CREATE POLICY "admin_jefe_sos_lectura" ON public.sos_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_usuario', 'jefe_custodios')
    )
  );

-- -----------------------------------------------------------------------------
-- 5. STORAGE
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('firmas', 'firmas', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "custodio_evidencias_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "custodio_evidencias_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "custodio_evidencias_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'evidencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "custodio_evidencias_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'evidencias'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "custodio_firmas_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'firmas'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "custodio_firmas_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'firmas'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- -----------------------------------------------------------------------------
-- 6. INDICES
-- -----------------------------------------------------------------------------
CREATE INDEX idx_bitacoras_custodio_estado
  ON public.bitacoras (custodio_id, estado, created_at DESC);

CREATE INDEX idx_bitacoras_empresa
  ON public.bitacoras (empresa_contratante);

CREATE INDEX idx_profiles_role
  ON public.profiles (role);

CREATE INDEX idx_evidencias_bitacora
  ON public.evidencias (bitacora_id, timestamp DESC);

CREATE INDEX idx_sos_custodio
  ON public.sos_alerts (custodio_id, created_at DESC);

-- =============================================================================
-- FIN — Registro publico desde la app con rol en profiles
-- =============================================================================
