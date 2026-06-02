# Estructura de la Bitácora — Servicons

**Documento de referencia**  
**Proyecto:** Servicons Mobile + Supabase  
**Fecha:** Junio 2026 (actualizado — modelo solo app móvil)  
**Origen:** análisis de `servicons_mobile` y reglas de negocio acordadas

---

## 1. Resumen ejecutivo

**No hay monitoristas ni dashboard operativo.** Todo el ciclo de la bitácora ocurre **únicamente en la aplicación móvil**. El **custodio** es el único actor que:

- Inicia sesión en la app.
- **Crea** sus bitácoras (unidad a custodiar, ruta, formulario completo).
- Ejecuta la custodia (fotos, reportes, SOS).
- Cierra el servicio con firmas.

Supabase sigue siendo el backend (Auth, PostgreSQL, Storage, Realtime), pero **solo la app móvil** lee y escribe los datos de negocio. No existe intervención externa para asignar servicios.

### Unificación de conceptos

En versiones anteriores del proyecto se distinguían “bitácora-ticket” (BD) y “bitácora-documento” (wizard local). En el **modelo objetivo**, es **una sola bitácora**:

| Aspecto | Descripción |
|---------|-------------|
| Qué es | Registro completo del servicio de custodia (datos legales + estado operativo + evidencias + firmas) |
| Quién la crea | Siempre el **custodio** autenticado (`custodio_id` = usuario de la sesión) |
| Dónde se captura | App: wizard de 7 pasos + flujo de custodia (fotos, cierre) |
| Dónde se guarda | Supabase (`bitacoras` + detalle JSON o tabla hija + Storage) |

Hoy en código aún hay **dos implementaciones parciales** (lista en Home desde BD vs wizard solo en memoria). La meta es que **crear bitácora en el wizard persista en Supabase** con el mismo `id` que usa el flujo de custodia.

---

## 2. Arquitectura (solo aplicación móvil)

```
┌──────────────────────────────────────────┐
│  App móvil (servicons_mobile)            │
│  Usuario único: custodio                 │
│                                          │
│  · Login (Supabase Auth)                 │
│  · Crear bitácora (wizard 7 pasos)       │
│  · Listar / editar mis bitácoras         │
│  · Iniciar custodia → fotos → SOS        │
│  · Cerrar servicio + firmas              │
└──────────────────┬───────────────────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │  Supabase             │
       │  · Auth               │
       │  · PostgreSQL         │
       │  · Storage            │
       │  · Realtime (SOS)     │
       └───────────────────────┘
```

**Fuera de alcance operativo:** dashboard web, roles de monitorista, asignación de rutas desde panel externo, alta de custodios por terceros (salvo que exista un proceso administrativo fuera de la app, no documentado aquí).

---

## 3. Base de datos (Supabase / PostgreSQL)

### 3.1 Tabla `bitacoras` — registro principal

Cada fila es **una bitácora creada por un custodio**. No hay “asignación” desde fuera: al insertar, `custodio_id` debe ser el `auth.uid()` del custodio que la crea.

| Columna (BD) | Tipo esperado | Uso |
|--------------|---------------|-----|
| `id` | UUID | PK, generado al crear en app |
| `custodio_id` | UUID (FK → auth.users) | **Obligatorio.** Dueño de la bitácora |
| `ruta` | text | Ruta / descripción del servicio (desde paso 1 o resumen origen→destino) |
| `unidad` | text | Unidad custodiada (placas, eco, etc.) |
| `estado` | text | Ciclo de vida del servicio |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Última modificación |
| `formulario` | jsonb | *(propuesto)* Cuerpo completo del wizard (`models.ts`) |
| `report_interval_minutes` | int | *(propuesto)* Intervalo de fotos; lo define el custodio en app o valor por defecto |
| `firma_custodio` | text | Data URL Base64 o JSON de firma |
| `firma_operador` | text | Idem — operador de la unidad custodiada |
| `firma_*_storage_path` | text | Rutas en Storage si no se guarda Base64 en fila |
| `completed_at` | timestamptz | Cierre del servicio |

**Estados (`estado`):**

| Valor BD | En app | Significado |
|----------|--------|-------------|
| `pendiente` / `pending` | `pending` | Bitácora creada, custodia **no iniciada** |
| `activo` / `active` | `active` | Custodia en curso (fotos, timer, SOS) |
| `completado` / `completed` | `completed` | Servicio cerrado con evidencia y firmas |

**Consulta típica (solo mis bitácoras):**

```sql
SELECT id, ruta, unidad, estado, created_at, custodio_id, formulario
FROM bitacoras
WHERE custodio_id = auth.uid()
ORDER BY created_at DESC;
```

**Inserción al crear (custodio en app):**

```sql
INSERT INTO bitacoras (id, custodio_id, ruta, unidad, estado, formulario)
VALUES (
  :id,
  auth.uid(),
  :ruta,
  :unidad,
  'pendiente',
  :formulario_json
);
```

### 3.2 Row Level Security (RLS) recomendada

Sin monitoristas, las políticas se basan **solo en el custodio dueño**:

| Operación | Regla |
|-----------|--------|
| SELECT | `custodio_id = auth.uid()` |
| INSERT | `custodio_id = auth.uid()` |
| UPDATE | `custodio_id = auth.uid()` |
| DELETE | `custodio_id = auth.uid()` (opcional; solo borrador `pending`) |

Storage (`firmas/`, `evidencias/`): paths con prefijo `{custodio_id}/{bitacora_id}/` y política que solo permita al dueño leer/escribir.

### 3.3 Tablas relacionadas

| Tabla | Uso en modelo solo app |
|-------|-------------------------|
| `perfiles` / `custodios` | Validar que el usuario puede usar la app como custodio |
| `sos_alerts` | Alertas disparadas desde la app (`user_id` = custodio) |
| `evidencias` *(por crear)* | Fotos por `bitacora_id` + GPS + timestamp |

### 3.4 Tabla hija opcional `bitacora_detalle`

Alternativa a `formulario jsonb`: misma información del wizard normalizada. Solo tiene sentido si se necesitan reportes SQL por campo; para MVP, **jsonb en `bitacoras` es suficiente**.

---

## 4. Modelo de datos del formulario (wizard)

Definido en `src/types/models.ts`. Es el contenido que el custodio llena al **crear** la bitácora.

### 4.1 Estructura raíz `Bitacora`

```typescript
interface Bitacora {
  id: string;
  nombre: string;
  empresaContratante: string;
  folioCliente: string;
  origen: Ubicacion;
  destino: Ubicacion;
  vehiculoCustodia: VehiculoCustodia;
  tiempos: Tiempos;
  responsableOrigen: Responsable;
  responsableDestino: Responsable;
  operador1: OperadorCustodiado;
  operador2?: OperadorCustodiado;
  observaciones: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Campos por paso del wizard

| Paso | Título | Campos |
|------|--------|--------|
| 1 | General | `nombre`*, `empresaContratante`, `folioCliente`, `origen`, `destino` |
| 2 | Vehículo custodia | `vehiculoCustodia`, tiempos iniciales (cita, presentación, odómetro inicial) |
| 3 | Tiempos de viaje | Salida, verificación, llegada, fin, odómetro fin, km, estadía |
| 4 | Responsables | `responsableOrigen`, `responsableDestino` (nombre + firma) |
| 5 | Operador 1 | `operador1` (datos + vehículo + firma) |
| 6 | Operador 2 (opcional) | `operador2` |
| 7 | Observaciones | `observaciones` → **guardar en Supabase** |

\* `nombre` obligatorio en UI.

**Derivación sugerida para columnas resumen en `bitacoras`:**

| Columna BD | Origen en formulario |
|------------|----------------------|
| `ruta` | `nombre` o `"{origen.municipio} → {destino.municipio}"` |
| `unidad` | `vehiculoCustodia.placas` o `operador1.vehiculo.placas` |

### 4.3 `OperadorCustodiado`

```typescript
interface OperadorCustodiado {
  nombre: string;
  firma: string;
  celular: string;
  vehiculo: {
    modelo: string;
    color: string;
    placas: string;
    marca: string;
    placaRemolque1: string;
    numEco: string;
    sellos: string;
    ecoTracto: string;
    pedimento: string;
    placaRemolque2: string;
    empresaTransporte: string;
  };
}
```

### 4.4 Ejemplo JSON (`formulario` en BD)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Servicio Centro-Norte",
  "empresaContratante": "Cliente SA",
  "folioCliente": "FOL-2026-001",
  "origen": { "estado": "CDMX", "municipio": "Azcapotzalco", "personalAsignado": "Juan P." },
  "destino": { "estado": "NL", "municipio": "Monterrey", "personalAsignado": "María L." },
  "vehiculoCustodia": { "placas": "ABC-12-34", "color": "Blanco", "celular": "5512345678" },
  "tiempos": { "fechaHoraCita": "01/06/2026 08:00", "odometroInicial": "120500", "kmTotales": "480" },
  "operador1": { "nombre": "Carlos Operador", "firma": "...", "celular": "5587654321", "vehiculo": { "placas": "XYZ-99-88" } },
  "observaciones": "Sin incidencias.",
  "createdAt": "2026-06-01T12:00:00.000Z",
  "updatedAt": "2026-06-01T20:00:00.000Z"
}
```

---

## 5. Flujo solo en la aplicación móvil

### 5.1 Pantallas y responsabilidades

| Pantalla | Ruta | Acción del custodio |
|----------|------|---------------------|
| Login | `auth/login` | Autenticarse |
| Mis bitácoras / tickets | `(app)/home` | Ver bitácoras propias (`pending` / `active` / `completed`) |
| Lista y CRUD local | `(app)/bitacora/index` | Crear, editar, duplicar, eliminar *(debe unificarse con Supabase)* |
| Wizard | `(app)/bitacora/wizard/step1…7` | **Crear o completar** datos de la bitácora |
| Detalle custodia | `(app)/custody/details` | Revisar datos e **iniciar** servicio (`estado` → `active`) |
| Permisos / cámara / preview / active | `custody/*` | Reportes periódicos, SOS |
| Cierre | `(app)/custody/finish` | Última foto + **firma operador** (+ firma custodio) → `completed` |

### 5.2 Flujo de negocio (custodio único)

```
Login
  ↓
Home (mis bitácoras desde Supabase)
  ↓
[+ Nueva bitácora] → Wizard 1…7 → INSERT bitacoras (pending, custodio_id = yo)
  ↓
Seleccionar bitácora → Detalles → Iniciar (active + GPS + primera foto)
  ↓
Monitoreo activo (fotos cada N minutos; N desde app o campo en bitácora)
  ↓
[SOS opcional] → sos_alerts
  ↓
Terminar → última foto + firmas → UPDATE completed + Storage
  ↓
Home (pestaña Historial)
```

**No existe paso “monitorista asigna ticket”.** Si Home muestra bitácoras que el custodio no creó, es legado de datos viejos; el diseño nuevo es **solo las creadas por ese `custodio_id`**.

### 5.3 Creación de bitácoras — reglas

| Regla | Detalle |
|-------|---------|
| Quién crea | Solo custodio autenticado |
| Cuándo | Antes de iniciar la custodia (wizard completo o guardado parcial en `pending`) |
| `custodio_id` | Siempre el ID de sesión; la app no debe permitir otro valor |
| Edición | Solo el dueño; preferible solo en `pending` |
| Duplicar | Copia local/BD con nuevo `id` y mismo `custodio_id` |
| Eliminar | Solo `pending` sin evidencias subidas |

### 5.4 Intervalo de reportes fotográficos

Sin monitorista, el intervalo se resuelve **dentro de la app**, por ejemplo:

- Campo en paso 2 o 3 del wizard: `reportIntervalMinutes`, guardado en `bitacoras.report_interval_minutes`, o
- Constante en configuración de la app (`/configuraciones` cuando exista), o
- Valor por defecto global (ej. 15 min).

---

## 6. Firmas: custodio y operador de la unidad custodiada

### 6.1 Quién firma qué

| Firma | Actor | Momento |
|-------|-------|---------|
| **Operador** | Chofer / operador de la unidad custodiada | Cierre del servicio (`custody/finish`) y/o paso 5–6 del wizard |
| **Custodio** | Quien realiza la custodia | Cierre del servicio (conformidad) |
| Responsable origen/destino | Personal en terminales | Paso 4 del wizard (distinto del operador del tracto) |

Al terminar la custodia punto a punto, el **operador de la unidad custodiada debe firmar**. Se recomienda también la firma del **custodio**.

### 6.2 Formato Base64

```
data:image/png;base64,<PAYLOAD_BASE64>
```

| Regla | Valor |
|-------|--------|
| Prefijo | `data:image/png;base64,` (o `image/jpeg`) |
| Payload | Base64 sin espacios ni saltos de línea |
| Tamaño recomendado | Payload ≤ ~500 KB |

**Objeto JSON al guardar en `formulario` o columnas dedicadas:**

```json
{
  "format": "data-url",
  "mime": "image/png",
  "encoding": "base64",
  "capturedAt": "2026-06-01T20:15:00.000Z",
  "signerRole": "operador",
  "signerName": "Carlos Operador",
  "data": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Cola offline (app):**

```typescript
pendingSignatures: {
  bitacoraId: string;
  signatureBase64: string;
  signerRole: 'custodio' | 'operador';
}[];
```

### 6.3 Formato CSV (exportación desde la app)

La exportación CSV, si se implementa, sería **función de la app** (compartir archivo), no de un dashboard.

**Cabecera `bitacoras_export.csv`:**

```csv
bitacora_id,custodio_id,ruta,unidad,estado,completed_at,operador_nombre,firma_operador_type,firma_operador_ref,firma_custodio_type,firma_custodio_ref,observaciones
```

**Archivo aparte `firmas.csv` (payload sin prefijo data-URL):**

```csv
bitacora_id,signer_role,signer_name,captured_at,mime,base64_payload
550e8400-e29b-41d4-a716-446655440000,operador,Carlos Operador,2026-06-01T20:15:00Z,image/png,iVBORw0KGgo...
550e8400-e29b-41d4-a716-446655440000,custodio,Pedro Custodio,2026-06-01T20:16:00Z,image/png,iVBORw0KGgo...
```

---

## 7. Estado actual del código vs modelo objetivo

| Capacidad | Hoy | Objetivo (solo app, custodio crea) |
|-----------|-----|-------------------------------------|
| Listar bitácoras en Home | SELECT por `custodio_id` | Igual |
| Crear bitácora | Wizard → solo Zustand local | INSERT Supabase al finalizar paso 7 |
| `custodio_id` en INSERT | No implementado en wizard | `auth.uid()` obligatorio |
| Iniciar / fotos / SOS / cierre | UI parcial | Ligado al `id` de bitácora creada por el custodio |
| Monitorista / dashboard | Referencias en docs viejas | **Eliminado del flujo** |
| RLS | Por documentar en Supabase | Solo dueño custodio |

---

## 8. Referencias en el repositorio móvil

| Archivo | Contenido |
|---------|-----------|
| `src/types/models.ts` | Modelo completo del formulario |
| `src/types/bitacora.ts` | Resumen para listado (ruta, unidad, estado) |
| `src/features/emergency/services/bitacora-service.ts` | Lectura Supabase (falta `create`/`update`) |
| `src/store/useBitacoraStore.ts` | Wizard local — unificar con persistencia |
| `src/app/(app)/bitacora/index.tsx` | FAB / lista — punto de creación |
| `src/app/(app)/home.tsx` | Lista de servicios del custodio |
| `src/app/(app)/custody/finish.tsx` | Firma de cierre |

---

## 9. Checklist de implementación (solo app)

- [ ] `BitacoraService.createBitacora()` / `updateBitacora()` con `custodio_id = session.user.id`.
- [ ] Al finalizar wizard paso 7: persistir `formulario` + `ruta` + `unidad` + `estado: pending`.
- [ ] Unificar `bitacora/index` (local) con Home (Supabase): una sola fuente de verdad.
- [ ] Pasar `bitacora_id` a `custody/details` y todo el flujo de custodia.
- [ ] RLS en `bitacoras`: solo `custodio_id = auth.uid()`.
- [ ] Firmas Base64 + Storage; cola offline en app.
- [ ] Quitar dependencia conceptual de monitorista e intervalo definido fuera de la app.
- [ ] Actualizar textos de login (“Dashboard”) si confunden al usuario.

---

*Modelo actualizado: operación 100 % en app móvil; custodios como únicos creadores de bitácoras; sin monitoristas.*
