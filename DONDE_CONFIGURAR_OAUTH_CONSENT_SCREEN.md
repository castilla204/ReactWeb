# 📍 Dónde Configurar el OAuth Consent Screen

## 🎯 Ubicación Exacta

Estás en la página de **"Descripción general"** de Google Auth Platform. Para llegar al **OAuth Consent Screen**, tienes **2 opciones**:

---

## ✅ Opción 1: Desde el Menú Lateral (Más Fácil)

En el menú lateral izquierdo que ves en la pantalla, busca y haz clic en:

**"Público"** (Public)

O si no lo encuentras ahí, busca:

**"Configuración"** (Configuration)

Dentro de cualquiera de estas secciones deberías encontrar la configuración del OAuth Consent Screen.

---

## ✅ Opción 2: URL Directa (Más Rápido)

**Copia y pega esta URL en tu navegador:**

```
https://console.cloud.google.com/apis/credentials/consent?project=grup-441318
```

Esta URL te llevará directamente a la página de configuración del OAuth Consent Screen.

---

## 🔍 Qué Buscar en la Página del OAuth Consent Screen

Una vez que llegues a la página, deberías ver:

1. **"OAuth consent screen"** como título principal
2. Una sección que dice **"User Type"** (Tipo de usuario)
3. Campos como:
   - **App name** (Nombre de la aplicación)
   - **User support email** (Email de soporte)
   - **Developer contact information** (Información de contacto del desarrollador)

---

## ⚠️ Si NO Está Configurado

Si ves un botón que dice:

**"CONFIGURE CONSENT SCREEN"** o **"CONFIGURAR PANTALLA DE CONSENTIMIENTO"**

Haz clic en él y completa todos los campos obligatorios:

1. **User Type:** Selecciona "External" (si quieres que cualquier usuario pueda usar tu app) o "Internal" (solo para usuarios de tu organización)
2. **App name:** Escribe "Inspecciono" (o el nombre que prefieras)
3. **User support email:** Tu email de soporte
4. **Developer contact information:** Tu email
5. Haz clic en **"SAVE AND CONTINUE"** o **"GUARDAR Y CONTINUAR"**

---

## 📸 Ubicación Visual

```
Google Cloud Console
├── Google Auth Platform (donde estás ahora)
│   ├── Descripción general ← ESTÁS AQUÍ
│   ├── Información de la marca
│   ├── Público ← Puede estar aquí
│   ├── Clientes
│   ├── Acceso a los datos
│   ├── Centro de verificación
│   └── Configuración ← O aquí
│
└── OAuth Consent Screen ← LO QUE NECESITAS CONFIGURAR
```

---

## 🚀 Pasos Rápidos

1. **Haz clic en "Público" en el menú lateral** O
2. **Copia esta URL:** `https://console.cloud.google.com/apis/credentials/consent?project=grup-441318`
3. **Pégala en la barra de direcciones** y presiona Enter
4. **Verifica o configura** el OAuth Consent Screen
5. **Guarda los cambios**
6. **Espera 5-10 minutos** para que se propaguen los cambios

---

## ✅ Después de Configurar

Una vez configurado el OAuth Consent Screen, también necesitas verificar:

1. **Client ID de Android** - Ve a: https://console.cloud.google.com/apis/credentials?project=grup-441318
2. **Verifica que el SHA-1 esté agregado:** `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
3. **Verifica que el package name sea:** `com.inspecciono.app`

---

## 🆘 Si No Encuentras la Opción

Si no encuentras "Público" o "Configuración" en el menú lateral, usa la **URL directa**:

```
https://console.cloud.google.com/apis/credentials/consent?project=grup-441318
```

Esta URL siempre te llevará directamente a la página correcta.
