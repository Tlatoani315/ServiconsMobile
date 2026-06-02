- [x] **GET /get-channels (Mapeo de Contactos):** Retorna el catálogo de empresas y sus IDs de grupos de WhatsApp asociados para el formulario de la bitácora. 
- [x] **POST /start-route (Inicio de Ruta):** Activa la bitácora en Supabase, registra el timestamp de salida y notifica por WhatsApp a los grupos del cliente de la empresa elegida. *(App: `n8nService.startRoute` al iniciar custodia)*
- [x] **POST /report-evidence (Procesamiento de Evidencias):** Recibe la foto y coordenadas, la sube al Storage de Supabase (donde el cliente ya la podrá ver reflejada en su app) y manda la alerta con la imagen al grupo de WhatsApp del cliente. *(App: `n8nService.reportEvidence` en custodia activa)*
- [x] **POST /sos (Protocolo de Pánico):** Inserta la alerta en sos_alerts , manda alertas urgentes con mapa a los WhatsApps de jefes/administradores y ejecuta la llamada telefónica automatizada de emergencia. *(App: insert Supabase + `n8nService.sendSOS`)*
- [x] **POST /finish-route (Cierre con Firma)**: Recibe las firmas digitales de los operadores del teléfono y la última imagen para pasar el viaje a completado en Supabase. *(App: `n8nService.finishRoute` en cierre)*
- [x] **POST /export-pdf (Generador de PDF bajo demanda):** Compila los datos y fotos de Supabase en un PDF. Si el viaje empezó, devuelve el PDF limpio; si ya terminó, incrusta las firmas de los operadores y lo despacha de forma automatizada por WhatsApp al cliente corporativo. *(App: botón en admin/reporte/[id])*

## App móvil — variables de entorno n8n

```
EXPO_PUBLIC_N8N_BASE_URL=https://n8n.pymemind.com
EXPO_PUBLIC_N8N_WEBHOOK_TOKEN=servicons-token-2025
```

Documentación detallada de webhooks: `Webhooks-enpoints.md`