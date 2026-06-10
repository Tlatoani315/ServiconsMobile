# Webhooks n8n — Servicons

Documentacion de referencia. **Endpoints activos:** `get-channels`, `report-route`, `sos`.  
Los legacy `start-route`, `report-evidence`, `finish-route` y `export-pdf` ya no se usan en la app.

---

# GET /webhook/get-channels

- **URL:** https://n8n.pymemind.com/webhook/get-channels
- **Metodo:** GET
- **Headers:** `X-Webhook-Token`

Retorna contactos/grupos WhatsApp para el wizard de bitacora.

## Respuesta (200)

```json
[
  { "remoteJid": "120363408381390278@g.us", "pushName": "Grupo cliente" },
  { "remoteJid": "198745685786641@lid", "pushName": "Contacto" }
]
```

Tambien acepta `{ "channels": [ ... ] }`.

| Sufijo remoteJid | Tipo |
|------------------|------|
| `@g.us` | Grupo |
| `@s.whatsapp.net` | Contacto |
| `@lid` | LID WhatsApp |

---

# POST /webhook/report-route

- **Metodo:** POST
- **Content-Type:** `multipart/form-data`
- **Headers:** `X-Webhook-Token`

## Campos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `data` | file | Foto JPG |
| `idBitacora` | string | UUID bitacora |
| `latitud` | string/number | GPS |
| `longitud` | string/number | GPS |
| `direccion` | string | Direccion legible |
| `fecha` | string | YYYY-MM-DD |
| `hora` | string | HH:mm |
| `estatus` | string | `inicio`, `reporte`, `termino` |

Workflow: `n8n/report-route-workflow.json`

---

# POST /webhook/sos

- **Metodo:** POST
- **Content-Type:** `application/json`
- **Headers:** `X-Webhook-Token`

```json
{
  "custodio_id": "uuid",
  "custodio_nombre": "Nombre",
  "bitacora_id": "uuid",
  "latitud": 19.43,
  "longitud": -99.13,
  "timestamp": "2026-06-09T12:00:00.000Z",
  "contactos_emergencia": [{ "remoteJid": "...", "pushName": "..." }]
}
```

La app inserta primero en `sos_alerts` y luego llama este webhook.
