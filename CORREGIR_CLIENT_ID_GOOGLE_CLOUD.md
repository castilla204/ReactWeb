# 🔧 Corregir Client ID en Google Cloud Console

## ❌ Problema Detectado en la Foto

En Google Cloud Console tienes un Client ID de Android con:
- **Client ID:** `61603823707-biokh3tesnuifvl2r3k0flgka0onu4sh.apps.googleusercontent.com`
- **Package name:** `com.example.second_hand_store` ❌ **INCORRECTO**
- **SHA-1:** `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10` ✅ **CORRECTO**

**Tu app usa:** `com.inspecciono.app` (verificado en `android/app/build.gradle`)

**⚠️ Google NO permite editar el package name de un Client ID existente.** Hay que borrarlo y crear uno nuevo.

---

## ✅ Solución: Borrar y Crear Nuevo Client ID

### Paso 1: Borrar el Client ID Incorrecto

1. **En la página que estás viendo** (Google Cloud Console):
   - Haz clic en el botón **"Borrar"** (arriba a la derecha, al lado de "← ID de cliente para Android")
   - Confirma que quieres borrarlo

### Paso 2: Crear Nuevo Client ID Correcto

1. **Ve a la lista de credenciales:**
   - Haz clic en **"Clientes"** en el menú lateral izquierdo
   - O ve directamente a: https://console.cloud.google.com/apis/credentials?project=grup-441318

2. **Crear nuevo Client ID:**
   - Haz clic en **"+ CREAR CREDENCIALES"** (botón azul arriba)
   - Selecciona **"ID de cliente OAuth"**

3. **Configurar el Client ID:**
   - **Tipo de aplicación:** Selecciona **"Android"**
   - **Nombre:** `Inspecciono Android Client` (o el que prefieras)
   - **Nombre del paquete:** `com.inspecciono.app` ⚠️ **DEBE SER EXACTAMENTE ESTE**
   - **Huella digital del certificado SHA-1:** Pega este valor:
     ```
     A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
     ```

4. **Crear:**
   - Haz clic en **"CREAR"**
   - Se generará un nuevo Client ID (formato: `61603823707-xxxxx.apps.googleusercontent.com`)

### Paso 3: Verificar el Client ID que Usa el Código

Tu código usa este Client ID:
```
61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com
```

**IMPORTANTE:** Verifica que este Client ID también tenga:
- ✅ Package name: `com.inspecciono.app`
- ✅ SHA-1: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`

Si este Client ID también tiene el package name incorrecto, **bórralo y créalo de nuevo** con los valores correctos.

---

## 🔍 Verificación

Después de crear el nuevo Client ID:

1. **Verifica que el package name sea correcto:**
   - Debe decir: `com.inspecciono.app`
   - NO debe decir: `com.example.second_hand_store`

2. **Verifica que el SHA-1 sea correcto:**
   - Debe ser: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`

3. **Si el Client ID que usa tu código es diferente:**
   - Verifica que ese Client ID también tenga el package name correcto
   - Si no, bórralo y créalo de nuevo

---

## ⚠️ Nota Importante

**Google Cloud Console NO permite editar el package name.** Si un Client ID tiene el package name incorrecto, **DEBE BORRARSE y CREARSE DE NUEVO**.

El SHA-1 que tienes (`A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`) es correcto, así que solo necesitas cambiar el package name a `com.inspecciono.app`.

---

## 📝 Resumen Rápido

1. **BORRAR** el Client ID con package name `com.example.second_hand_store`
2. **CREAR** nuevo Client ID de Android con:
   - Package name: `com.inspecciono.app`
   - SHA-1: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
3. **VERIFICAR** que el Client ID que usa tu código también tenga el package name correcto
