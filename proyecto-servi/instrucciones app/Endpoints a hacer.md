# Endpoints activos — Servicons Mobile

Documentacion alineada al codigo en `proyecto-servi/`. Los webhooks legacy (`start-route`, `report-evidence`, `finish-route`, `export-pdf`) fueron **retirados**; el flujo unificado usa `report-route`.

## n8n webhooks

| Metodo | Ruta | Uso en app |
|--------|------|------------|
| GET | `/webhook/get-channels` | Selector WhatsApp en wizard de bitacora (`ChannelPicker`) |
| POST | `/webhook/report-route` | Inicio (`estatus=inicio`), reportes periodicos (`reporte`) y cierre (`termino`) con foto multipart |
| POST | `/webhook/sos` | Alerta SOS tras insert en `sos_alerts` (`custody/active.tsx`) |

### POST /report-route

- **Content-Type:** `multipart/form-data`
- **Headers:** `X-Webhook-Token`
- **Campos:** `data` (foto JPG), `idBitacora`, `latitud`, `longitud`, `direccion`, `fecha`, `hora`, `estatus`
- **Workflow:** `n8n/report-route-workflow.json` — sube Storage, guarda evidencia, activa bitacora si `inicio`, WhatsApp por contactos en `bitacoras.contactos`

### POST /sos

- **Content-Type:** `application/json`
- **Body:** `custodio_id`, `custodio_nombre`, `bitacora_id`, `latitud`, `longitud`, `timestamp`, `contactos_emergencia[]`

### GET /get-channels

- Retorna array `[{ remoteJid, pushName }]` (o envuelto en `{ channels: [...] }`)

## Supabase Edge Functions

| Funcion | Uso |
|---------|-----|
| `POST /functions/v1/create-user` | Admin crea usuarios (actualiza `profiles.role`) |
| `POST /functions/v1/update-user` | Admin edita email/password/rol |

## PDF

Generacion **local** en dispositivo via `services/reportPdfService.ts` (`useBitacoraPdfExport`). No usa n8n.

## Variables de entorno

Ver `.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
EXPO_PUBLIC_N8N_BASE_URL=https://n8n.pymemind.com
EXPO_PUBLIC_N8N_WEBHOOK_TOKEN=
```

## Supabase Auth (reset password)

Redirect URL en dashboard: `servicons-mobile://auth/reset-password`
