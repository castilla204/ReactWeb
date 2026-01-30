# 🔧 Solución: Google Sign In Failed en Android APK

## ❌ Error
```
Google sign in failed: activity is cancelled by the user
Si el problema persiste verifica la configuracion en google cloud console
```

## ✅ Solución

### Paso 1: Verificar SHA-1 Actual

Tu SHA-1 de debug es:
```
A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

### Paso 2: Verificar Client ID de Android

Tu Client ID de Android configurado en el código es:
```
61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com
```

**Ubicación en código:** `src/services/nativeAuthService.ts` (línea 34)

### Paso 3: Verificar en Google Cloud Console

1. **Ve a Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials?project=grup-441318

2. **Busca el Client ID de Android:**
   - Busca el Client ID: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
   - O busca por package name: `com.inspecciono.app`

3. **Verifica que tenga el SHA-1 agregado:**
   - Haz clic en el Client ID para editarlo
   - En "SHA-1 certificate fingerprints" debe estar:
     ```
     A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
     ```

4. **Si NO está agregado:**
   - Haz clic en "ADD SHA-1 CERTIFICATE FINGERPRINT"
   - Pega el SHA-1: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
   - Haz clic en "SAVE"

5. **Si el Client ID NO existe:**
   - Haz clic en "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Tipo: **Android**
   - Name: `Inspecciono Android`
   - Package name: `com.inspecciono.app`
   - SHA-1: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
   - Haz clic en "CREATE"
   - **Copia el nuevo Client ID** y actualiza `src/services/nativeAuthService.ts`

### Paso 4: Si usas un APK firmado (Release)

Si estás usando un APK firmado con un keystore de producción, necesitas el SHA-1 de ese keystore:

1. **Obtener SHA-1 del keystore de release:**
   ```bash
   keytool -list -v -keystore ruta/a/tu/keystore.jks -alias tu-alias
   ```

2. **Agregar ese SHA-1 también al mismo Client ID en Google Cloud Console**

### Paso 5: Esperar propagación

Después de agregar el SHA-1:
- ⏱️ Espera **5-10 minutos** para que los cambios se propaguen
- 🔄 Reinicia la app en el dispositivo
- 🧪 Prueba nuevamente el Google Sign In

### Paso 6: Verificar Package Name

Asegúrate de que el package name en Google Cloud Console sea exactamente:
```
com.inspecciono.app
```

**Verificado en:** `android/app/build.gradle` (línea 7)

---

## 🔍 Verificación Rápida

### ✅ Checklist

- [ ] SHA-1 agregado en Google Cloud Console: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
- [ ] Client ID de Android existe: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
- [ ] Package name correcto: `com.inspecciono.app`
- [ ] Esperado 5-10 minutos después de agregar SHA-1
- [ ] App reiniciada después de los cambios

---

## 🚨 Si el problema persiste

1. **Verifica los logs en Android Studio:**
   - Abre Logcat
   - Filtra por "Google" o "OAuth"
   - Busca errores específicos

2. **Verifica que el Client ID sea correcto:**
   - El Client ID debe ser de tipo **Android**, no Web
   - El formato debe ser: `xxxxx.apps.googleusercontent.com`

3. **Verifica que Google Play Services esté actualizado:**
   - En el dispositivo, ve a Play Store
   - Busca "Google Play Services"
   - Actualiza si hay actualizaciones disponibles

4. **Prueba en un dispositivo diferente:**
   - A veces el problema es específico del dispositivo
   - Prueba en un emulador o dispositivo físico diferente

---

## 📝 Notas

- El SHA-1 de debug es diferente al SHA-1 de release
- Si usas ambos (debug y release), agrega AMBOS SHA-1 al mismo Client ID
- El Client ID de Android es diferente al Client ID de Web
- Los cambios en Google Cloud Console pueden tardar hasta 10 minutos en propagarse
