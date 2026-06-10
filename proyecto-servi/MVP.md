# Servicons Mobile — Documentación MVP

**Versión app:** 1.0.1 · **Package:** `com.servicons.mobile` · **Plataforma objetivo:** Android

App móvil para custodia de unidades en ruta: bitácoras legales, monitoreo GPS con fotos periódicas, alertas SOS, panel administrativo y portal de cliente en solo lectura.

---

## 1. Alcance del MVP

### Incluido

| Área | Funcionalidad |
|------|---------------|
| **Auth** | Login, registro, recuperación de contraseña, 4 roles, guard de rutas |
| **Custodio** | Wizard 7 pasos, custodia activa, cola offline, SOS, cierre con firmas |
| **Admin** | Dashboard, usuarios, servicios activos, bitácoras, SOS, reportes, PDF |
| **Cliente** | Consulta de bitácoras de su empresa (RLS) |
| **Integraciones** | Supabase + n8n (`report-route`, `sos`, `get-channels`) + WhatsApp vía Evolution API |
| **PDF** | Exportación local en dispositivo (admin) |

### Fuera de alcance (MVP)

- Dashboard web independiente
- iOS en producción (solo `expo run:ios` para pruebas)
- Sincronización en background nativa (la cola se procesa al reconectar red)
- GPS en segundo plano continuo (solo foreground + reportes periódicos)
- WhatsApp Business API oficial (usa Evolution API en n8n)
- Cancelación de servicio iniciada por el custodio

---

## 2. Stack

| Capa | Tecnología |
|------|------------|
| App | React Native 0.81, Expo 54, TypeScript, NativeWind |
| Navegación | expo-router |
| Estado local | Zustand (`useBitacoraStore`) |
| Backend | Supabase (Auth, PostgreSQL, Storage, Edge Functions) |
| Automatización | n8n (webhooks) |
| Builds | EAS Build (APK/AAB) o Gradle local |

---

## 3. Roles y permisos

| Rol | Pantalla inicial | Qué puede hacer |
|-----|------------------|-----------------|
| `custodio` | `/(app)/home` | Crear bitácoras, operar custodia, reportes, SOS |
| `jefe_custodios` | `/(app)/admin/home` | Supervisar operación, gestionar custodios/clientes |
| `super_usuario` | `/(app)/admin/home` | Todo lo anterior + papelera, limpieza, aprobar cambios de rol |
| `cliente` | `/(app)/cliente/home` | Ver bitácoras de `profile.empresa` (solo lectura) |

**Reglas clave**

- `custodio_id` en bitácoras siempre es `auth.uid()` del custodio en sesión.
- Registro público crea usuarios como `cliente`. Otros roles los asigna un admin o se solicitan vía `role_change_requests` (aprobación solo `super_usuario`).
- Usuarios con `activo = false` no pueden iniciar sesión.

---

## 4. Flujos principales

### 4.1 Custodio — bitácora y custodia

```
Home → FAB → Wizard (7 pasos) → estado pendiente
  → Confirmar inicio → Permisos (cámara/GPS)
  → Foto inicial → cola estatus=inicio → Custodia activa
  → Reportes cada N min (default 15) → SOS (opcional)
  → Cierre: foto final + firmas → estado completado
```

| Paso wizard | Contenido |
|-------------|-----------|
| 1 | Servicio, folio, contactos WhatsApp, origen/destino |
| 2 | Vehículo custodia, tiempos, intervalo de reportes |
| 3 | Tiempos de viaje y odómetro |
| 4 | Responsables origen/destino |
| 5 | Operador 1 |
| 6 | Operador 2 (opcional) |
| 7 | Observaciones + firma custodio → INSERT Supabase |

### 4.2 Admin

Dashboard con KPIs y mapa → gestión de usuarios (Edge Functions) → monitoreo de activos (GPS en vivo) → detalle de bitácora/reporte → export PDF → gestión SOS → papelera (super usuario).

### 4.3 Cliente

Lista filtrada por empresa → detalle con mapa y evidencias → polling cada 30 s si el servicio está `activo`.

---

## 5. Ciclo de vida de una bitácora

```
pendiente → activo → completado
                ↘ cancelado (solo admin)
```

| Transición | Quién | Cómo |
|------------|-------|------|
| → `pendiente` | Custodio | `createBitacora()` al terminar wizard |
| → `activo` | App + n8n | `iniciarCustodia()` y/o PATCH n8n en primer `estatus=inicio` |
| → `completado` | Custodio | `cerrarCustodia()` tras cierre con foto y firmas |
| → `cancelado` | Admin | Edición desde panel admin |

---

## 6. Arquitectura

```
┌─────────────────┐     Auth/CRUD      ┌──────────────┐
│  App móvil      │◄──────────────────►│   Supabase   │
│  (Expo/RN)      │                    │ PG + Storage │
└────────┬────────┘                    └──────▲───────┘
         │ multipart/JSON                      │
         ▼                                     │ Service Role
┌─────────────────┐     Storage + DB         │
│      n8n        │───────────────────────────┘
│ report-route    │
│ sos             │──────► Evolution API → WhatsApp
│ get-channels    │
└─────────────────┘
```

**Cola offline:** fotos y coordenadas se guardan en AsyncStorage (`reportQueueService`) y se envían a n8n al recuperar conexión (máx. 3 reintentos).

---

## 7. Configuración rápida

### 7.1 App

```bash
cd proyecto-servi
cp .env.example .env   # completar variables
npm install
npm start              # Expo Go / emulador
```

### 7.2 Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_KEY` | Sí | Anon/public key |
| `EXPO_PUBLIC_N8N_BASE_URL` | No* | Base n8n (default: `https://n8n.pymemind.com`) |
| `EXPO_PUBLIC_N8N_WEBHOOK_TOKEN` | Producción | Header `X-Webhook-Token` |

\* Sin Supabase URL/key la app muestra pantalla de error y no arranca.

Para builds EAS, configurar las mismas variables como **EAS Secrets**.

### 7.3 Supabase

1. **Auth:** desactivar "Confirm email" (recomendado para pruebas).
2. **SQL:** ejecutar `sql/SERVICONS_SUPABASE_COMPLETO.sql` en SQL Editor (⚠️ borra datos existentes).
3. **Redirect URL:** `servicons-mobile://auth/reset-password`
4. **Edge Functions:** desplegar `supabase/functions/create-user` y `update-user`.
5. **Migraciones** (si aplica sobre BD existente): archivos en `sql/MIGRACION_*.sql`.

**Tablas principales:** `profiles`, `bitacoras`, `evidencias`, `sos_alerts`, `custodio_ubicaciones_live`, `role_change_requests`.

**Storage:** buckets `evidencias`, `firmas`.

### 7.4 n8n

Importar `n8n/report-route-workflow.json`. Configuración detallada: `n8n/REPORT_ROUTE_README.md`.

| Webhook | Método | Uso |
|---------|--------|-----|
| `/webhook/get-channels` | GET | Lista contactos WhatsApp (wizard) |
| `/webhook/report-route` | POST multipart | `inicio` / `reporte` / `termino` + foto |
| `/webhook/sos` | POST JSON | Alerta de pánico |

Credenciales n8n: Supabase Service Role (Storage + PATCH bitácoras), Evolution API (WhatsApp), Header Auth para webhook.

---

## 8. API e integraciones

### n8n — `report-route` (multipart)

| Campo | Descripción |
|-------|-------------|
| `data` | Foto JPG |
| `idBitacora` | UUID |
| `latitud`, `longitud`, `direccion` | GPS |
| `fecha`, `hora` | Timestamp local |
| `estatus` | `inicio` \| `reporte` \| `termino` |

Header: `X-Webhook-Token`. Timeout app: 45 s.

### n8n — `sos` (JSON)

`custodio_id`, `custodio_nombre`, `bitacora_id`, `latitud`, `longitud`, `timestamp`, `contactos_emergencia[]`

### Supabase Edge Functions

| Función | Llamada desde |
|---------|---------------|
| `POST /functions/v1/create-user` | `adminService.createUserAsAdmin` |
| `POST /functions/v1/update-user` | `adminService.updateUserAsAdmin` |

### PDF

Generado en dispositivo con `expo-print` (`services/reportPdfService.ts`). No usa n8n.

---

## 9. Rutas de la app

### Públicas

| Ruta | Pantalla |
|------|----------|
| `/` | Bienvenida |
| `/auth/login` | Inicio de sesión |
| `/auth/register` | Registro |
| `/auth/reset-password` | Nueva contraseña (deep link) |
| `/legal/privacidad` | Aviso de privacidad |

### Custodio

| Ruta | Pantalla |
|------|----------|
| `/(app)/home` | Mis bitácoras |
| `/(app)/bitacora/wizard/step1`–`step7` | Creación |
| `/(app)/custody/permissions` | Permisos + foto inicial |
| `/(app)/custody/active` | Servicio en curso |
| `/(app)/custody/finish` | Cierre |
| `/(app)/custody/details` | Detalle |

### Admin

| Ruta | Pantalla |
|------|----------|
| `/(app)/admin/home` | Dashboard |
| `/(app)/admin/users`, `users/[id]` | Usuarios |
| `/(app)/admin/activos` | Servicios en vivo |
| `/(app)/admin/bitacoras`, `bitacora/[id]` | Bitácoras |
| `/(app)/admin/reportes`, `reporte/[id]` | Completados |
| `/(app)/admin/sos` | Alertas SOS |
| `/(app)/admin/limpieza`, `papelera` | Soft-delete (super usuario) |

### Cliente

| Ruta | Pantalla |
|------|----------|
| `/(app)/cliente/home` | Bitácoras de mi empresa |
| `/(app)/cliente/details` | Detalle |

---

## 10. Estructura del código

```
proyecto-servi/
├── app/                    # Pantallas (expo-router)
├── components/             # UI reutilizable
├── hooks/                  # Lógica de pantalla (auth, bitácora, cola, GPS)
├── lib/                    # Helpers, cola, env, roles
├── services/               # n8n, admin, PDF, ubicación, papelera
├── store/                  # Zustand wizard
├── types/                  # TypeScript models
├── sql/                    # Esquema y migraciones Supabase
├── supabase/functions/     # Edge Functions
├── n8n/                    # Workflows exportados
└── .env                    # Credenciales (no commitear)
```

**Módulos críticos**

| Archivo | Responsabilidad |
|---------|-----------------|
| `hooks/useAuth.tsx` | Sesión, perfil, login/registro |
| `hooks/useBitacora.ts` | CRUD bitácoras, inicio/cierre custodia |
| `lib/reportQueueService.ts` | Cola offline → n8n |
| `services/n8nService.ts` | Webhooks n8n |
| `lib/beginCustodyService.ts` | Orquestación inicio de custodia |
| `lib/roles.ts` | Permisos y rutas por rol |
| `store/useBitacoraStore.ts` | Estado del wizard |

---

## 11. Build y despliegue

| Comando | Uso |
|---------|-----|
| `npm start` | Desarrollo (Expo Go) |
| `npm run android` | Build nativo local |
| `npm run apk:preview` | APK interno (EAS) |
| `npm run apk:local` | APK perfil local (EAS) |
| `npm run apk:production` | AAB Play Store (EAS) |
| `npm run apk:list` | Últimos builds EAS |

Perfiles EAS (`eas.json`): `local` y `preview` → APK; `production` → AAB.

**Checklist pre-piloto**

- [ ] `.env` o EAS Secrets completos
- [ ] SQL Supabase ejecutado + Edge Functions desplegadas
- [ ] Workflows n8n activos y probados con curl
- [ ] Primer `super_usuario` creado (SQL o Edge Function)
- [ ] APK instalado en dispositivo físico con datos móviles
- [ ] Flujo completo: wizard → custodia 30 min → cierre → PDF admin

---

## 12. Limitaciones conocidas

| Tema | Comportamiento actual |
|------|------------------------|
| GPS en vivo | Solo con app en primer plano; se limpia al background |
| Cola offline | Reintenta al reconectar; no hay task en background del SO |
| Activación bitácora | App y n8n pueden marcar `activo`; n8n es idempotente en `inicio` |
| WhatsApp | Evolution API (no oficial); riesgo de bloqueo de número |
| Token n8n vacío | App arranca pero webhooks fallan en producción |
| Registro | Todos entran como `cliente` hasta aprobación/cambio de rol |

---

## 13. Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| `instrucciones app/Endpoints a hacer.md` | Contratos webhook (referencia técnica) |
| `n8n/REPORT_ROUTE_README.md` | Configuración workflow report-route |
| `sql/SERVICONS_SUPABASE_COMPLETO.sql` | Esquema completo + RLS |
| `instrucciones app/PLANEACION_Y_COSTOS_SERVICONS.md` | Planeación equipo y costos |
| `.env.example` | Plantilla de variables |

---

*Documento alineado al código en `proyecto-servi/` (Jun 2026). Si el código cambia, actualizar este archivo antes que los prompts históricos en `instrucciones app/`.*
