# 🔧 SOLUCIÓN - Configuración WhatsApp Business API

## Estado Actual
✅ Token válido y funcionando
✅ Número verificado: +56 9 4487 8554
✅ Nombre verificado: "Asistente IA ChileHome"
✅ Registro completado (`success: true`)
❌ Error al enviar mensajes: "Invalid parameter"

## Pasos para Solucionar

### 1. Verificar Configuración del Número
En Meta for Developers:
1. Ve a tu app **Casas Prefabricadas**
2. WhatsApp > Configuración
3. Verifica que el número aparezca como "Activo"

### 2. Agregar Número de Prueba (IMPORTANTE)
El error puede deberse a que necesitas agregar números de destino primero:

1. En **WhatsApp > Configuración de la API**
2. Busca la sección **"To" o "Para"**
3. Haz clic en **"Manage phone number list"** o **"Administrar lista de números"**
4. Agrega el número **+56 9 4487 8554** (tu mismo número)
5. Verifica con código SMS

### 3. Configurar Plantilla de Mensaje
WhatsApp Business requiere plantillas aprobadas para mensajes proactivos:

1. Ve a **WhatsApp > Manage Templates** o **Plantillas de mensajes**
2. Crea una nueva plantilla:
   - Nombre: `contrato_notificacion`
   - Categoría: **UTILITY** (se aprueba más rápido)
   - Idioma: Español
   - Contenido:
   ```
   Hola {{1}}, tu contrato {{2}} de ChileHome está listo.
   Valor: {{3}}
   Fecha entrega: {{4}}
   ```
3. Espera aprobación (15 minutos a 24 horas)

### 4. Mientras Esperas la Aprobación

#### Opción A: Usar Mensaje de Sesión
Los mensajes de sesión no requieren plantilla. Para iniciar una sesión:
1. El cliente debe escribirte primero por WhatsApp
2. Tienes 24 horas para responder sin plantilla

#### Opción B: Usar la Consola de Pruebas
1. En la página de configuración de WhatsApp
2. Usa la sección "Enviar mensaje de prueba"
3. Esto confirmará que todo funciona

### 5. Código de Prueba Correcto

Una vez configurado, usa este formato:

```javascript
// Para mensaje con plantilla (cuando esté aprobada)
const message = {
  "messaging_product": "whatsapp",
  "to": "56944878554",
  "type": "template",
  "template": {
    "name": "contrato_notificacion",
    "language": {
      "code": "es"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {"type": "text", "text": "Juan Pérez"},
          {"type": "text", "text": "CH-2025-0001"},
          {"type": "text", "text": "$1.500.000"},
          {"type": "text", "text": "20/09/2025"}
        ]
      }
    ]
  }
}
```

### 6. Verificar Webhook (Opcional pero Recomendado)
Para recibir confirmaciones de entrega:

1. En **WhatsApp > Configuration > Webhook**
2. URL: `https://tu-dominio.com/api/notificaciones/whatsapp`
3. Verify Token: `chilehome_verify_2025`
4. Suscribir a: `messages`, `message_status`

## 🎯 Solución Rápida

El problema más común es que **no has agregado números de destino** en la lista de teléfonos permitidos.

**Acción inmediata:**
1. Agrega +56 9 4487 8554 a la lista de números permitidos
2. Verifica con SMS
3. Intenta enviar de nuevo

## 📝 Notas Importantes

- **Primeras 24 horas**: Solo puedes enviar a números verificados
- **Después de 24 horas**: Puedes enviar a cualquier número con plantillas aprobadas
- **Límite diario inicial**: 250 conversaciones únicas
- **Sin plantilla**: El usuario debe escribirte primero

## 🧪 Comando de Prueba Final

```bash
curl -X POST https://graph.facebook.com/v18.0/686129144587443/messages \
-H "Authorization: Bearer TU_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "messaging_product": "whatsapp",
  "to": "56944878554",
  "type": "text",
  "text": {
    "body": "Test ChileHome"
  }
}'
```

## ✅ Cuando Funcione

Recibirás una respuesta como:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "56944878554",
    "wa_id": "56944878554"
  }],
  "messages": [{
    "id": "wamid.xxxxx"
  }]
}
```

## 🆘 Si Sigue sin Funcionar

1. Revisa el **Business Verification Status**
2. Verifica que no tengas restricciones en la cuenta
3. Contacta soporte de Meta: https://business.facebook.com/business/help