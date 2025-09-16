# Configuración de WhatsApp Business API

## 📱 Requisitos para WhatsApp Business

### 1. Número de Teléfono
- **Necesitas un número de teléfono dedicado** para WhatsApp Business
- Este número NO puede estar registrado en WhatsApp personal
- Recomendación: Usar un número empresarial nuevo
- Ejemplo: +56 9 XXXX XXXX

### 2. Cuenta Meta for Developers
1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear cuenta o usar cuenta de Facebook existente
3. Crear una nueva App
4. Seleccionar "Business" como tipo de app

### 3. Configurar WhatsApp Business API

#### Paso 1: Agregar WhatsApp a tu App
1. En el panel de tu app, ir a "Add Products"
2. Buscar "WhatsApp" y hacer clic en "Set Up"
3. Crear o seleccionar un Business Manager

#### Paso 2: Obtener Credenciales
1. **Phone Number ID**: Lo encuentras en WhatsApp > API Setup
2. **Access Token**: Generar un token permanente en Business Settings
3. **Verify Token**: Crear uno personalizado (ya configurado: `chilehome_verify_2025`)

#### Paso 3: Agregar Número de Teléfono
1. En WhatsApp > Phone Numbers
2. Agregar nuevo número
3. Verificar con código SMS/llamada
4. Configurar nombre del negocio y categoría

## 🔧 Configuración en el Sistema

### 1. Actualizar Variables de Entorno
Editar el archivo `.env.local`:

```env
# WhatsApp Business API
WHATSAPP_BUSINESS_PHONE_ID=tu_phone_id_aqui
WHATSAPP_BUSINESS_TOKEN=tu_token_permanente_aqui
WHATSAPP_BUSINESS_PHONE=+56912345678  # Tu número de WhatsApp Business
WHATSAPP_VERIFY_TOKEN=chilehome_verify_2025
```

### 2. Configurar Webhook (Opcional)
Para recibir mensajes:

1. En WhatsApp > Configuration > Webhooks
2. URL del Webhook: `https://tu-dominio.com/api/notificaciones/whatsapp`
3. Verify Token: `chilehome_verify_2025`
4. Suscribir a eventos: `messages`, `messaging_postbacks`

## 💰 Costos de WhatsApp Business API

### Conversaciones Iniciadas por el Negocio
- **Marketing**: $0.0883 USD por conversación
- **Utilidad**: $0.0441 USD por conversación
- **Autenticación**: $0.0353 USD por conversación

### Conversaciones Iniciadas por el Usuario
- **Servicio**: $0.0088 USD por conversación

### Notas sobre Costos:
- Una conversación dura 24 horas
- Los primeros 1,000 mensajes del mes son GRATIS
- Facturación mensual a través de Meta

## 📋 Plantillas de Mensajes Predefinidas

Para crear plantillas (requerido para mensajes proactivos):

1. Ir a WhatsApp > Message Templates
2. Crear nueva plantilla
3. Seleccionar categoría (Utility recomendado)
4. Esperar aprobación (24-48 horas)

### Plantillas Sugeridas:

#### 1. Contrato Listo
```
Hola {{1}}, su contrato N° {{2}} de ChileHome está listo para revisión.
Valor: {{3}}
Fecha de entrega: {{4}}
```

#### 2. Resumen Semanal
```
📊 Resumen Semanal ChileHome
Total contratos: {{1}}
Valor total: {{2}}
Validados: {{3}}
```

## 🧪 Modo de Prueba

Mientras no tengas las credenciales:

1. El sistema detecta automáticamente si no hay configuración
2. Los mensajes se mostrarán en consola
3. No se cobrarán mensajes
4. Puedes ver qué se enviaría sin costo

## 📞 Números de Contacto Importantes

Para configurar notificaciones automáticas:

- **Guillermo Díaz (Dueño)**: Configurar su número en el sistema
- **Supervisores**: Agregar números para validaciones
- **Transportistas**: Números para coordinación de entregas

## ✅ Verificación de Funcionamiento

Para probar el sistema:

```javascript
// En la consola del navegador o desde el código:
fetch('/api/notificaciones/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'mensaje_personalizado',
    data: {
      to: '+56912345678',  // Número de prueba
      message: 'Test de WhatsApp Business API - ChileHome'
    }
  })
})
```

## 🚀 Activación de Notificaciones Automáticas

Una vez configurado:

1. Ir al Dashboard Admin
2. Configuración > Notificaciones
3. Agregar destinatarios y horarios
4. Activar envío automático

## ⚠️ Consideraciones Importantes

1. **Cumplimiento**: Obtener consentimiento de los clientes
2. **Horarios**: Respetar horarios comerciales (9:00 - 20:00)
3. **Contenido**: No enviar spam o contenido no solicitado
4. **Opt-out**: Incluir opción de cancelar suscripción
5. **GDPR/Privacidad**: Cumplir con regulaciones locales

## 📚 Recursos Adicionales

- [Documentación Oficial WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Guía de Mejores Prácticas](https://www.facebook.com/business/m/whatsapp/best-practices)
- [Calculadora de Precios](https://developers.facebook.com/docs/whatsapp/pricing)

## 🆘 Soporte

Si necesitas ayuda:
1. Revisar logs en consola del servidor
2. Verificar configuración de variables de entorno
3. Contactar soporte de Meta Business