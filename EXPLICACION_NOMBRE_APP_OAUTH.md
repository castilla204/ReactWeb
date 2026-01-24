# 📝 Explicación: Nombre de la App en OAuth

## 🔍 Cómo Funciona el Nombre de la App

### ❌ Lo que NO es

El nombre de la app **NO se envía desde tu código** cuando haces login con Google. Tu código solo envía el **Client ID**.

### ✅ Lo que SÍ es

El nombre de la app viene de la **configuración del OAuth Consent Screen** en Google Cloud Console. Google usa ese nombre para mostrar a los usuarios cuando solicitas acceso a sus datos.

---

## 🎯 Dónde Está el Nombre

### 1. En Google Cloud Console (OAuth Consent Screen)

Este es el nombre que Google usa y que debe coincidir con tu sitio web:

**Ubicación:**
- Ve a: https://console.cloud.google.com/auth/branding?project=grup-441318
- Busca el campo **"Nombre de la app"** o **"App name"**

**Este nombre debe coincidir con:**
- El nombre que aparece en tu sitio web (título, logo, etc.)
- El nombre que los usuarios ven cuando usan tu app

---

## 🔍 Qué Nombre Tiene Tu Sitio Web

Según tu código:

### En `index.html`:
```html
<title>inspecciono.com - Plataforma de Contratación de Servicios de Verificación Profesional</title>
```
**Nombre principal:** `inspecciono.com` o `Inspecciono`

### En `capacitor.config.ts`:
```typescript
appName: 'Inspecciono',
```
**Nombre de la app:** `Inspecciono`

### En Android (`strings.xml`):
```xml
<string name="app_name">Inspecciono</string>
```
**Nombre de la app:** `Inspecciono`

---

## ✅ Solución: Qué Nombre Usar en Google Cloud Console

Basándome en tu código, el nombre debería ser:

**`Inspecciono`** (con mayúscula)

O si prefieres usar el dominio:

**`inspecciono.com`**

---

## 📋 Pasos para Corregir

### Paso 1: Ve a Google Cloud Console
- https://console.cloud.google.com/auth/branding?project=grup-441318

### Paso 2: Busca el campo "Nombre de la app"
- Debería estar en la sección "Información de marca"
- Puede estar arriba, antes de "Correo electrónico de asistencia al usuario"

### Paso 3: Cambia el nombre
- **Nombre actual:** Probablemente dice `inspecciono` (todo minúsculas)
- **Cámbialo a:** `Inspecciono` (con mayúscula) o `inspecciono.com`
- **IMPORTANTE:** Debe coincidir con lo que aparece en tu sitio web

### Paso 4: Guarda los cambios
- Haz clic en "Guardar" o "Save"

---

## 🔍 Cómo Verificar el Nombre en Tu Sitio Web

1. **Abre tu sitio:** https://inspecciono.com
2. **Mira la pestaña del navegador:** Verás "inspecciono.com - Plataforma..."
3. **El nombre principal es:** `inspecciono.com` o `Inspecciono`

---

## 💡 Recomendación

Usa **`Inspecciono`** (con mayúscula) porque:
- Es el nombre que usas en tu app móvil (`appName: 'Inspecciono'`)
- Es más profesional que solo el dominio
- Coincide con el nombre de la app en Android

---

## ⚠️ Nota Importante

El nombre en Google Cloud Console **NO se envía desde tu código**. Tu código solo envía el Client ID. Google usa el nombre configurado en el OAuth Consent Screen y lo compara con lo que encuentra en tu sitio web.

Si el nombre no coincide, Google muestra el error que estás viendo.
