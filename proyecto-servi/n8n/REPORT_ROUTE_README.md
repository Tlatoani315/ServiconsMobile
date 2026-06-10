# Workflow n8n: report-route

Importar: `n8n/report-route-workflow.json`

## Storage y activación (sin Code con fetch/https)

n8n **no permite** `fetch`, `https` ni `$env` en plan gratis. Storage y activación de bitácora usan **HTTP Request** + credencial **Supabase Service Role**.

### Credencial Header Auth: Supabase Service Role

- **Name:** `Authorization`
- **Value:** `Bearer TU_SERVICE_ROLE_KEY`

Asignar en:

- **Subir Supabase Storage**
- **URL imagen firmada**
- **Activar bitacora** (PATCH a `bitacoras`)

### Otras credenciales

| Nodo | Credencial |
|------|------------|
| Webhook | Header Auth (`X-Webhook-Token: servicons-token-2025`) |
| Get a row, Guardar evidencia | Supabase account |
| Enviar WhatsApp | Evolution account |

## Flujo completo

```
Webhook → Get a row + Logo → Merge → Preparar Datos → Procesar Imagen
→ Subir Storage → URL firmada → Resolver URL → Preparar campos WhatsApp
→ Guardar evidencia
→ IF estatus = inicio → Activar bitacora (HTTP PATCH) → Normalizar activacion
→ Respond to Webhook + Switch → WhatsApp por contacto
```

## Activación en base de datos (estatus `inicio`)

Cuando llega un reporte con `estatus=inicio` **y la bitácora aún no está `activo`**, el workflow:

1. Guarda la evidencia en `evidencias` + Storage.
2. **PATCH** a `bitacoras?id=eq.{uuid}` con `estado=activo` y `start_time=now()` (nodo **Activar bitacora**).
3. Responde al webhook con `bitacora_estado: activo`.
4. Envía WhatsApp con leyenda **“MONITOREO ACTIVO en base de datos”**.

La app **no** activa la bitácora en Supabase; lo hace n8n.

### Idempotencia de inicio

El nodo **IF Inicio** exige `estatus=inicio` **y** `bitacoras.estado != activo`. Si la app reenvía inicio tras un crash, no se repite el PATCH de activación.

### Manejo de errores (recomendado en n8n UI)

En el editor de n8n, activa **Error Workflow** o añade rama desde nodos críticos hacia **Respond to Webhook** con:

```json
{ "success": false, "message": "descripcion del error" }
```

Sin respuesta, la app espera hasta timeout (45 s).

### Error PGRST100 (`id..uuid`)

Si usabas el nodo Supabase en operación **Update**, PostgREST fallaba sin operador `eq`. **Activar bitacora** ahora es HTTP PATCH con URL explícita `id=eq.UUID`, igual que la documentación de PostgREST.

## Ver imagen en bucket

- Bucket **privado**: abrir con **Preview** en Dashboard o **signed URL** completa (con `?token=`).
- Si la imagen no se ve: borra archivos viejos corruptos y prueba un reporte nuevo.

## Probar inicio (activa bitácora + WhatsApp)

```powershell
curl.exe -X POST "https://n8n.pymemind.com/webhook/report-route" `
  -H "X-Webhook-Token: servicons-token-2025" `
  -F "latitud=19.6366" `
  -F "longitud=-99.0928" `
  -F "fecha=2026-06-01" `
  -F "hora=17:18" `
  -F "estatus=inicio" `
  -F "direccion=Av. Juarez 1, CDMX" `
  -F "idBitacora=TU-UUID" `
  -F "data=@foto.jpg"
```

Respuesta esperada (inicio):

```json
{
  "success": true,
  "message": "Reporte procesado. Monitoreo activo en base de datos.",
  "bitacora_estado": "activo"
}
```

Verifica en Supabase que `bitacoras.estado` pasó a `activo`.
