# 🔧 Solución Rápida: Error 403 en Google OAuth en Producción

## ❌ Problema Actual

```
Failed to load resource: the server responded with a status of 403
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
google-auth:1 Failed to load resource: the server responded with a status of 500
```

## 🔍 Causa

El origen de **Cloudflare Pages** no está autorizado en Google Cloud Console.

## ✅ Solución Inmediata

### Paso 1: Obtener tu URL de Cloudflare Pages

1. Ve a tu proyecto en Cloudflare Pages
2. Copia la URL de producción (formato: `https://[nombre-proyecto].pages.dev`)
3. Ejemplo: `https://reactweb-bq9.pages.dev`

### Paso 2: Agregar URL en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Navega a **APIs & Services** > **Credentials**
4. Encuentra tu **OAuth 2.0 Client ID** (`61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`)
5. Haz clic para editarlo
6. En **"Authorized JavaScript origins"**, agrega:
   ```
   https://reactweb-bq9.pages.dev
   ```
   *(Reemplaza con tu URL real de Cloudflare Pages)*

7. En **"Authorized redirect URIs"**, agrega:
   ```
   https://reactweb-bq9.pages.dev
   ```
   *(Reemplaza con tu URL real de Cloudflare Pages)*

8. Haz clic en **"Save"**

### Paso 3: Esperar Propagación

- Los cambios pueden tardar **1-5 minutos** en aplicarse
- Recarga la aplicación después de esperar

## 🐛 Error 500 en Backend

Si también ves un error 500 en `google-auth`, verifica:

1. **Backend está funcionando:**
   - Verifica que `https://newapi-yn9v.onrender.com/health` responda

2. **Client ID coincide:**
   - El backend debe tener el mismo Client ID: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`
   - Verifica en los logs del backend si hay errores relacionados

3. **CORS configurado:**
   - El backend debe permitir requests desde `https://reactweb-bq9.pages.dev`

## 📋 Checklist Completo

- [ ] URL de Cloudflare Pages agregada en "Authorized JavaScript origins"
- [ ] URL de Cloudflare Pages agregada en "Authorized redirect URIs"
- [ ] Cambios guardados en Google Cloud Console
- [ ] Esperado 1-5 minutos para propagación
- [ ] Aplicación recargada
- [ ] Backend respondiendo correctamente
- [ ] CORS configurado en backend

## ✅ Verificación

Después de configurar, deberías ver:
- ✅ No aparece el error 403
- ✅ No aparece "The given origin is not allowed"
- ✅ El botón de Google se carga correctamente
- ✅ La autenticación funciona sin errores 500






