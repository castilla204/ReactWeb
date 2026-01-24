# 🎯 Acceso Directo al OAuth Consent Screen

## ⚡ Solución Más Rápida: URL Directa

**Copia y pega esta URL en la barra de direcciones de tu navegador:**

```
https://console.cloud.google.com/apis/credentials/consent?project=grup-441318
```

Presiona **Enter** y te llevará directamente a la página de configuración del OAuth Consent Screen.

---

## 📋 Qué Verás en la Página del OAuth Consent Screen

Cuando llegues a la página correcta, deberías ver:

### Si NO está configurado:
- Un botón grande que dice: **"CONFIGURE CONSENT SCREEN"** o **"CONFIGURAR PANTALLA DE CONSENTIMIENTO"**
- Haz clic en ese botón para comenzar la configuración

### Si YA está configurado:
- Verás un formulario con los siguientes campos:
  - **User Type** (Tipo de usuario) - Debe estar seleccionado
  - **App name** (Nombre de la aplicación) - Debe tener un valor
  - **User support email** (Email de soporte) - Debe tener un email
  - **Developer contact information** (Información de contacto) - Debe tener un email

---

## 🔧 Pasos para Configurar (Si No Está Configurado)

1. **Haz clic en "CONFIGURE CONSENT SCREEN"**

2. **Paso 1: User Type (Tipo de Usuario)**
   - Selecciona **"External"** (si quieres que cualquier usuario pueda usar tu app)
   - O selecciona **"Internal"** (solo para usuarios de tu organización)
   - Haz clic en **"CREATE"** o **"CREAR"**

3. **Paso 2: App Information (Información de la App)**
   - **App name:** Escribe `Inspecciono` (o el nombre que prefieras)
   - **User support email:** Selecciona tu email de la lista o ingresa uno
   - **App logo:** (Opcional) Puedes subir un logo
   - **App domain:** (Opcional) Puedes dejarlo vacío por ahora
   - **Application home page:** (Opcional
   - **Privacy policy link:** (Opcional) Puedes dejarlo vacío por ahora
   - **Terms of service link:** (Opcional) Puedes dejarlo vacío por ahora
   - **Authorized domains:** (Opcional) Puedes dejarlo vacío por ahora
   - Haz clic en **"SAVE AND CONTINUE"** o **"GUARDAR Y CONTINUAR"**

4. **Paso 3: Scopes (Alcances)**
   - Por ahora puedes hacer clic en **"SAVE AND CONTINUE"** sin agregar scopes adicionales

5. **Paso 4: Test Users (Usuarios de Prueba)**
   - Si seleccionaste "External", puedes agregar usuarios de prueba (opcional)
   - Haz clic en **"SAVE AND CONTINUE"**

6. **Paso 5: Summary (Resumen)**
   - Revisa la información
   - Haz clic en **"BACK TO DASHBOARD"** o **"VOLVER AL PANEL"**

---

## ✅ Verificación

Después de configurar, verifica que:

- ✅ **User Type** esté seleccionado
- ✅ **App name** tenga un valor
- ✅ **User support email** tenga un email
- ✅ **Developer contact information** tenga un email

---

## ⏱️ Tiempo de Propagación

**IMPORTANTE:** Después de guardar los cambios, espera **5-10 minutos** para que Google propague los cambios antes de probar el login nuevamente.

---

## 🔗 Enlaces Útiles

- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent?project=grup-441318
- **Credentials (Client IDs):** https://console.cloud.google.com/apis/credentials?project=grup-441318
