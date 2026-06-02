## Endpoint de n8n: [Nombre del proceso]
- **URL de Producción:** https://tu-instancia.n8n.cloud/webhook/tu-endpoint
- **Método:** POST
- **Headers:** `Content-Type: application/json`
- **Body (Ejemplo):**
  {
    "usuario_id": 123,
    "accion": "actualizar"
  }
# Endpoint de n8n: [Obtener contactos y grupos]

- **URL de Producción:** [https://n8n.pymemind.com/webhook/get-channels](https://n8n.pymemind.com/webhook/get-channels)
    
- **Método:** GET
    
- **Headers:** `X-Webhook-Token: servicons-token-2025`
    

## 📥 Parámetros de Consulta (Query Parameters)

Este endpoint no requiere parámetros obligatorios.

## 📤 Respuesta Exitosa (200 OK)

El endpoint retorna un arreglo de contactos y grupos disponibles para mensajería. Cada elemento contiene únicamente la información necesaria para identificar el destino de un mensaje en WhatsApp mediante Evolution API.

## Estructura de la Respuesta

```json
[
  {
    "remoteJid": "198745685786641@lid",
    "pushName": "Luisito"
  },
  {
    "remoteJid": "120363408381390278@g.us",
    "pushName": "prueba_grupos"
  }
]
```

## 📋 Campos de la Respuesta

| Campo       | Tipo   | Descripción                                                                                                  |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `remoteJid` | string | Identificador único del chat en WhatsApp. Este valor se utiliza para enviar mensajes mediante Evolution API. |
| `pushName`  | string | Nombre visible del contacto o grupo.                                                                         |

## 📝 Notas

- El endpoint devuelve un único arreglo que puede contener contactos individuales y grupos.
    
- El campo `remoteJid` es el identificador principal requerido para enviar mensajes.
    
- El campo `pushName` se proporciona únicamente para mostrar nombres amigables en interfaces de usuario.
    
- El tipo de conversación puede inferirse mediante el valor de `remoteJid`:
    

|Sufijo|Tipo|
|---|---|
|`@s.whatsapp.net`|Contacto individual|
|`@g.us`|Grupo de WhatsApp|
|`@lid`|Identificador LID de WhatsApp|

### Ejemplo de uso con Evolution API

```json
{
  "number": "198745685786641@lid",
  "text": "Hola, este es un mensaje de prueba."
}
```

o

```json
{
  "number": "120363408381390278@g.us",
  "text": "Hola grupo."
}
```

- El endpoint excluye automáticamente los chats especiales del sistema de WhatsApp, como `0@s.whatsapp.net`.
    
- La respuesta está optimizada para listados de contactos, selección de destinatarios y envío de mensajes.
# Endpoint de n8n: [Nombre del proceso]
- **URL de Producción:** https://tu-instancia.n8n.cloud/webhook/tu-endpoint
- **Método:** POST
- **Headers:** `Content-Type: application/json`
- **Body (Ejemplo):**
  {
    "usuario_id": 123,
    "accion": "actualizar"
  }
Información util
- Agrega un nodo **Webhook**.
    
- Cambia el **HTTP Method** a `POST`.
    
- En **Respond**, selecciona `Using 'Respond to Webhook' Node`. Esto es crucial para poder procesar la imagen antes de devolverla.
    
- Define un **Path**, por ejemplo: `recibir-reporte-custodio`.
    
- Asegúrate de que el sistema desde donde envías los datos use el formato `multipart/form-data`.
    
- El archivo de la foto debe enviarse en un campo llamado `data` (n8n por defecto lee los binarios ahí) y los demás campos como texto: `latitud`, `longitud`, `fecha`, `hora`, `custodio`, `estatus` y el array de contactos (`contactos`).