# ⚠️ PASOS PENDIENTES - WhatsApp Business API

## 🔴 Estado Actual
- ✅ App creada en Meta for Developers
- ✅ Token de acceso generado (válido hasta 14/11/2025)
- ✅ Número configurado: +56 9 4487 8554
- ❌ **Número NO REGISTRADO en WhatsApp Business API**

## 📋 Pasos para Completar el Registro

### 1. Registrar el Número en WhatsApp Business
En la consola de Meta for Developers:

1. Ve a tu app **Casas Prefabricadas** (ID: 586538814446209)
2. En el menú lateral: **WhatsApp > Configuración de la API**
3. En la sección "Para", donde dice **+56 9 4487 8554**
4. Haz clic en el botón **"Agregar número de teléfono"**

### 2. Proceso de Verificación
1. **Verificar propiedad del número**:
   - Recibirás un código por SMS o llamada
   - Ingresa el código en la plataforma

2. **Configurar perfil del negocio**:
   - Nombre: ChileHome Contratos
   - Categoría: Servicios empresariales
   - Descripción: Sistema de gestión de contratos para casas prefabricadas

3. **Aceptar términos y condiciones**

### 3. Activar el Número
Después de la verificación:
1. El número aparecerá con estado "Verificado"
2. Haz clic en **"Registrar"** o **"Register"**
3. Espera confirmación (puede tomar unos minutos)

## 🧪 Verificar que Funciona

### Opción 1: Desde la Consola de Meta
En la misma página, usa la sección "Paso 2: Enviar mensajes con la API"
- Haz clic en **"Enviar mensaje"**
- Debería enviarte un mensaje de prueba

### Opción 2: Desde Nuestra App
```bash
# En la terminal (con el servidor corriendo en puerto 3001):
curl -X GET http://localhost:3001/api/test-whatsapp
```

### Opción 3: Prueba Manual
Abre en el navegador:
```
http://localhost:3001/api/test-whatsapp
```

## 🎯 Resultado Esperado
Deberías recibir un mensaje de WhatsApp en el número +56 9 4487 8554 con:
```
🎉 ¡WhatsApp Business API Configurado!

✅ Sistema ChileHome Contratos
📱 Número: +56 9 4487 8554
🔧 Phone ID: 686129144587443
📅 Token válido hasta: 14/11/2025

Este es un mensaje de prueba enviado [fecha/hora]
```

## ❗ Errores Comunes y Soluciones

### Error: "The account is not registered"
**Causa**: El número no está registrado en WhatsApp Business API
**Solución**: Completar los pasos 1-3 de este documento

### Error: "Phone number not verified"
**Causa**: El número no ha sido verificado
**Solución**: Completar el proceso de verificación con SMS/llamada

### Error: "Invalid token"
**Causa**: Token expirado o mal copiado
**Solución**: Generar nuevo token y actualizar en `.env.local`

## 📞 Soporte
Si tienes problemas:
1. Revisa el [Centro de Ayuda de WhatsApp Business](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
2. Verifica el estado en: WhatsApp > Configuración > Estado del número
3. Revisa los logs en: Panel > Registro de actividad

## ✅ Una vez funcionando, podrás:
- Enviar contratos automáticamente por WhatsApp
- Notificar validaciones a supervisores
- Enviar resúmenes semanales a Guillermo Díaz
- Confirmar entregas con transportistas

## 🔔 Recordatorios Importantes
- **Token expira**: 14 de noviembre de 2025
- **Sistema de alertas**: Te avisará 1 semana antes de expirar
- **Costos**: Primeros 1,000 mensajes/mes gratis