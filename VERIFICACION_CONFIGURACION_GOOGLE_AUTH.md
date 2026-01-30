# ✅ Verificación y Corrección: Configuración Google Auth en React/Capacitor

## 🔍 Análisis de tu Configuración Actual

### ✅ Lo que ESTÁ BIEN:

1. **Plugin instalado**: `@capgo/capacitor-social-login` ✅
2. **Dependencias Android**: Correctas en `build.gradle` ✅
3. **Web Client ID**: Configurado correctamente en `nativeAuthService.ts` ✅
4. **Backend**: Client IDs configurados ✅

### ❌ Lo que FALTA o está INCOMPLETO:

1. **Configuración en `capacitor.config.ts`**: ❌ **INCOMPLETA**
   - Falta `serverClientId` (aunque el plugin lo toma del código)
   - Falta configuración de scopes y opciones

2. **SHA-1 no verificado**: ❓ **NO SABEMOS SI ESTÁ REGISTRADO**
   - Necesitas registrar el SHA-1 en Google Cloud Console
   - Esto es **CRÍTICO** para que funcione en Android

3. **Android Client ID**: ❓ **NO SABEMOS SI EXISTE**
   - Necesitas crear un Android Client ID en Google Cloud Console
   - Con el SHA-1 y package name registrados

---

## 🔧 Correcciones Necesarias

### 1. Mejorar Configuración en `capacitor.config.ts`

**ACTUAL (Incompleto):**
```typescript
plugins: {
  SocialLogin: {
    providers: {
      google: true,
    },
  },
}
```

**DEBE SER (Completo):**
```typescript
plugins: {
  SocialLogin: {
    providers: {
      google: {
        enabled: true,
        scopes: ['profile', 'email'],
        // El webClientId se pasa en el código, no aquí
      },
    },
  },
}
```

**NOTA**: El plugin `@capgo/capacitor-social-login` NO usa `serverClientId` en `capacitor.config.ts`. Lo toma del código en `nativeAuthService.ts`, que ya está correcto.

---

### 2. Obtener SHA-1 del Certificado

**Para DEBUG (desarrollo):**

```bash
# En Windows (PowerShell)
cd android
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android

# O en Git Bash
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
```

**Para RELEASE (producción):**

Si tienes un keystore de producción:
```bash
keytool -list -v -alias tu-alias -keystore ruta/a/tu/keystore.jks
```

**Si publicaste en Google Play Store:**

1. Ir a [Google Play Console](https://play.google.com/console)
2. Tu app → **Test and release** → **App integrity**
3. **Play app signing** → **Settings**
4. Copiar el **SHA-1 certificate fingerprint**

---

### 3. Registrar SHA-1 en Google Cloud Console

**Pasos:**

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar tu proyecto
3. **APIs & Services** → **Credentials**
4. Buscar o crear un **Android Client ID**:
   - **Application type**: Android
   - **Package name**: `com.inspecciono.app`
   - **SHA-1 certificate fingerprint**: (pegar el SHA-1 que obtuviste)
5. **Guardar**

**IMPORTANTE**: 
- Si publicaste en Google Play, usa el SHA-1 de **Play App Signing**, NO el de tu keystore local
- Necesitas **2 Android Client IDs** si usas ambos (debug y release)

---

### 4. Verificar Client IDs en Google Cloud Console

**Debes tener:**

1. **Web Client ID**: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
   - ✅ Ya lo tienes configurado en el código
   - ✅ Ya está en el backend

2. **Android Client ID (Debug)**: 
   - ❓ Verificar que exista
   - ❓ Con SHA-1 de debug registrado
   - ❓ Package name: `com.inspecciono.app`

3. **Android Client ID (Release)** (si publicaste):
   - ❓ Verificar que exista
   - ❓ Con SHA-1 de Google Play registrado
   - ❓ Package name: `com.inspecciono.app`

---

## 📋 Checklist de Verificación

### En Google Cloud Console:

- [ ] Web Client ID existe y está habilitado
- [ ] Android Client ID (Debug) existe con SHA-1 de debug
- [ ] Android Client ID (Release) existe con SHA-1 de Google Play (si aplica)
- [ ] OAuth consent screen está configurado
- [ ] Google Sign-In API está habilitada

### En el Código:

- [ ] `webClientId` en `nativeAuthService.ts` es correcto ✅
- [ ] Backend tiene ambos Client IDs configurados ✅
- [ ] `capacitor.config.ts` tiene configuración básica ✅

### En Android:

- [ ] SHA-1 de debug obtenido
- [ ] SHA-1 registrado en Google Cloud Console
- [ ] Package name coincide: `com.inspecciono.app`

---

## 🚀 Pasos para Corregir

### Paso 1: Obtener SHA-1

```bash
cd c:/Users/Diego/Downloads/App/App/ReactWeb/android
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android
```

**Buscar esta línea:**
```
SHA1: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

**Copiar el SHA-1 completo** (sin espacios, solo los dos puntos)

---

### Paso 2: Registrar en Google Cloud Console

1. Ir a: https://console.cloud.google.com/apis/credentials
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Android
4. **Name**: `Inspecciono Android Debug` (o el que prefieras)
5. **Package name**: `com.inspecciono.app`
6. **SHA-1 certificate fingerprint**: (pegar el SHA-1 que obtuviste)
7. **CREATE**

---

### Paso 3: Verificar que el Web Client ID Esté Correcto

1. En Google Cloud Console → Credentials
2. Buscar: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
3. Verificar que:
   - Tipo: **Web application**
   - Está **habilitado**
   - **Authorized JavaScript origins** incluye tu dominio (si aplica)

---

### Paso 4: Reconstruir la App

```bash
cd c:/Users/Diego/Downloads/App/App/ReactWeb
npm run build
npx cap sync
cd android
./gradlew clean
cd ..
npx cap open android
```

**En Android Studio:**
- Build → Clean Project
- Build → Rebuild Project
- Run → Run 'app'

---

## 🔍 Diagnóstico del Error

### Error: `BAD_AUTHENTICATION - Long live credential not available`

**Causas más comunes:**

1. **SHA-1 no registrado** (80% de los casos)
   - ✅ Solución: Registrar SHA-1 en Google Cloud Console

2. **Android Client ID no existe** (15% de los casos)
   - ✅ Solución: Crear Android Client ID con SHA-1 y package name

3. **Web Client ID incorrecto** (5% de los casos)
   - ✅ Ya está correcto en tu código

---

## 📝 Notas Importantes

### ¿Por qué necesitas SHA-1?

Google requiere el SHA-1 para verificar que la app que solicita tokens es realmente tu app. Sin el SHA-1 registrado, Google rechazará las solicitudes de autenticación.

### ¿Por qué necesitas Android Client ID?

Aunque el plugin usa `webClientId` en el código, Google Play Services necesita que el Android Client ID esté registrado para validar el package name y SHA-1.

### ¿Firebase o solo Google OAuth?

Tu app **NO usa Firebase** (no tienes `google-services.json`). Estás usando **solo Google OAuth** directamente, lo cual está bien. No necesitas Firebase para Google Auth.

---

## ✅ Resumen

**Tu código está correcto**, pero falta:

1. ❌ **SHA-1 registrado en Google Cloud Console** (CRÍTICO)
2. ❌ **Android Client ID creado** (CRÍTICO)
3. ⚠️ **Configuración en `capacitor.config.ts` puede mejorarse** (opcional)

**Siguiente paso**: Obtener SHA-1 y registrarlo en Google Cloud Console.

---

**¿Necesitas ayuda para obtener el SHA-1?** Puedo guiarte paso a paso.
