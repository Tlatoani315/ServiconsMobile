-- =============================================================================
-- MIGRACION: columna contactos en bitacoras
-- Ejecutar en Supabase SQL Editor si aun no existe la columna.
-- Formato JSONB: [{ "remoteJid": "120363...@g.us", "pushName": "Grupo Cliente" }]
-- =============================================================================

ALTER TABLE public.bitacoras
  ADD COLUMN IF NOT EXISTS contactos JSONB;

CREATE INDEX IF NOT EXISTS idx_bitacoras_contactos
  ON public.bitacoras USING GIN (contactos);

-- Migrar whatsappGrupo legacy dentro de formulario -> contactos
UPDATE public.bitacoras
SET contactos = jsonb_build_array(formulario->'whatsappGrupo')
WHERE contactos IS NULL
  AND formulario ? 'whatsappGrupo'
  AND formulario->'whatsappGrupo' IS NOT NULL
  AND formulario->'whatsappGrupo' != 'null'::jsonb;

COMMENT ON COLUMN public.bitacoras.contactos IS
  'Destinos WhatsApp (n8n): arreglo de { remoteJid, pushName } para reportes, SOS y cierre.';
