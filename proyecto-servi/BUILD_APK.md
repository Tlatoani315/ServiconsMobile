# Build Rapido de APK (Expo + EAS)

## 1) Requisitos (una sola vez)

- Node 18+
- Cuenta Expo iniciada:
  - `npx expo login`
- Vincular proyecto (si te lo pide):
  - `npx eas init`

## 2) Instalar dependencias

- `npm install`

## 3) Generar APK de prueba

- `npm run apk:preview`

Cuando termine, Expo te devuelve el link para descargar el `.apk`.

## 4) Ver builds recientes

- `npm run apk:list`

## 5) Build de produccion (Play Store)

- `npm run apk:production`

Ese perfil genera `.aab` (requerido para Play Store).

## Notas

- Si solo quieres instalar en celular para pruebas, usa `apk:preview`.
- Si cambias icono, nombre, permisos o `android.package`, vuelve a correr build.
- Si EAS pide credenciales Android, acepta que las administre automaticamente.
