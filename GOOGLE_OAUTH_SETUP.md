# 🔧 Configuración de Google OAuth - Solución de Error 403

## ❌ Error Actual

```
Failed to load resource: the server responded with a status of 403
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## 🔍 Causa del Problema

El error **403** y el mensaje **"The given origin is not allowed for the given client ID"** ocurren porque el origen `http://localhost:5173` no está autorizado en Google Cloud Console para el Client ID de OAuth.

## ✅ Solución

### Paso 1: Acceder a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Navega a **APIs & Services** > **Credentials**

### Paso 2: Configurar Orígenes Autorizados

1. Encuentra tu **OAuth 2.0 Client ID** (el que termina en `...apps.googleusercontent.com`)
2. Haz clic en el nombre del cliente OAuth para editarlo
3. En la sección **"Authorized JavaScript origins"**, agrega:
   - `http://localhost:5173` (para desarrollo local)
   - `https://inspecciono.com` (para producción)
   - `https://www.inspecciono.com` (si usas www)

4. En la sección **"Authorized redirect URIs"**, agrega:
   - `http://localhost:5173` (para desarrollo local)
   - `https://inspecciono.com` (para producción)
   - `https://www.inspecciono.com` (si usas www)

### Paso 3: Guardar Cambios

1. Haz clic en **"Save"**
2. Espera 1-2 minutos para que los cambios se propaguen
3. Recarga la aplicación

## 📝 Notas Importantes

- Los cambios pueden tardar hasta **5 minutos** en aplicarse
- Asegúrate de que el **Client ID** en el código (`61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`) coincida con el de Google Cloud Console
- Para producción, usa siempre **HTTPS** (no HTTP)

## 🔒 Seguridad

- **NO** agregues orígenes no confiables
- **NO** uses `*` (wildcard) en los orígenes
- Solo agrega los dominios que realmente uses

## ✅ Verificación

Después de configurar, deberías ver:
- ✅ El botón de Google se carga correctamente
- ✅ No aparece el error 403
- ✅ No aparece el mensaje "The given origin is not allowed"
- ✅ La autenticación funciona correctamente

## 🐛 Si el Problema Persiste

1. Verifica que el Client ID sea correcto
2. Asegúrate de que el proyecto en Google Cloud Console sea el correcto
3. Revisa que no haya errores de tipado en las URLs (http vs https)
4. Limpia la caché del navegador
5. Espera 5 minutos y vuelve a intentar

