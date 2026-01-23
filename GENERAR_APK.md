# 📦 Cómo Generar APK para Android

## 🚀 Método 1: Desde Android Studio (RECOMENDADO)

### Paso 1: Abrir el proyecto
```bash
npm run cap:open:android
```

### Paso 2: En Android Studio

1. **Construir el proyecto:**
   - Menú: `Build` > `Make Project` (o `Ctrl+F9`)
   - Espera a que termine la compilación

2. **Generar APK de Debug (para pruebas):**
   - Menú: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
   - Espera a que termine
   - Aparecerá una notificación: "APK(s) generated successfully"
   - Haz clic en "locate" para ver el APK
   - **Ubicación:** `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Generar APK de Release (para producción):**
   - Menú: `Build` > `Generate Signed Bundle / APK`
   - Selecciona "APK"
   - Si no tienes keystore, crea uno nuevo:
     - **Key store path:** Crea uno nuevo o usa existente
     - **Password:** Tu contraseña
     - **Key alias:** Tu alias
     - **Key password:** Tu contraseña
     - **Validity:** 25 años (recomendado)
     - **Certificate:** Completa tus datos
   - Selecciona "release" como build variant
   - Marca "V1 (Jar Signature)" y "V2 (Full APK Signature)"
   - Haz clic en "Finish"
   - **Ubicación:** `android/app/build/outputs/apk/release/app-release.apk`

---

## ⚡ Método 2: Desde Línea de Comandos (RÁPIDO)

### Generar APK de Debug:
```bash
cd android
./gradlew assembleDebug
```

**Ubicación del APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Generar APK de Release (requiere keystore):
```bash
cd android
./gradlew assembleRelease
```

**Ubicación del APK:**
```
android/app/build/outputs/apk/release/app-release.apk
```

**⚠️ IMPORTANTE:** Para Release necesitas configurar el keystore primero.

---

## 🔐 Configurar Keystore para Release

### Opción A: Crear nuevo keystore

```bash
keytool -genkey -v -keystore inspecciono-release.keystore -alias inspecciono -keyalg RSA -keysize 2048 -validity 10000
```

**Te pedirá:**
- Contraseña del keystore
- Información personal (nombre, organización, etc.)
- Confirmar información

### Opción B: Configurar en Android Studio

1. `Build` > `Generate Signed Bundle / APK`
2. Selecciona "Create new..."
3. Completa el formulario
4. Guarda el keystore en un lugar seguro

### Configurar en `android/app/build.gradle`

Agrega esto antes de `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Y dentro de `android {`, antes de `buildTypes {`:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

Y en `buildTypes { release {`:

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

Crea `android/key.properties`:

```properties
storePassword=tu_contraseña
keyPassword=tu_contraseña
keyAlias=inspecciono
storeFile=../inspecciono-release.keystore
```

**⚠️ IMPORTANTE:** Agrega `key.properties` a `.gitignore` para no subirlo al repositorio.

---

## 📱 Instalar APK en Dispositivo

### Opción 1: Desde Android Studio
1. Conecta tu dispositivo Android por USB
2. Habilita "Depuración USB" en el dispositivo
3. En Android Studio: `Run` > `Run 'app'` (o `Shift+F10`)
4. Selecciona tu dispositivo
5. La app se instalará automáticamente

### Opción 2: Instalar APK manualmente
1. Transfiere el APK al dispositivo (USB, email, etc.)
2. En el dispositivo: `Configuración` > `Seguridad` > Activa "Orígenes desconocidos"
3. Abre el archivo APK desde el explorador de archivos
4. Sigue las instrucciones para instalar

---

## 🎯 Comandos Rápidos

### Construir y sincronizar antes de generar APK:
```bash
npm run build
npm run cap:sync
```

### Abrir Android Studio:
```bash
npm run cap:open:android
```

### Generar APK Debug desde terminal:
```bash
cd android && ./gradlew assembleDebug
```

### Ver ubicación del APK generado:
```bash
# Windows PowerShell
Get-ChildItem -Path android\app\build\outputs\apk\debug\*.apk

# Linux/Mac
ls android/app/build/outputs/apk/debug/*.apk
```

---

## ✅ Checklist para Generar APK

### Para Debug (pruebas):
- [ ] `npm run build`
- [ ] `npm run cap:sync`
- [ ] `npm run cap:open:android`
- [ ] En Android Studio: `Build` > `Build APK(s)`
- [ ] APK generado en `android/app/build/outputs/apk/debug/`

### Para Release (producción):
- [ ] Crear keystore
- [ ] Configurar `build.gradle` con signing
- [ ] Crear `key.properties` (y agregar a `.gitignore`)
- [ ] `npm run build`
- [ ] `npm run cap:sync`
- [ ] En Android Studio: `Build` > `Generate Signed Bundle / APK`
- [ ] APK generado en `android/app/build/outputs/apk/release/`

---

## 📝 Notas Importantes

1. **APK Debug:**
   - ✅ Más fácil de generar
   - ✅ No requiere keystore
   - ❌ No se puede publicar en Play Store
   - ✅ Perfecto para pruebas

2. **APK Release:**
   - ✅ Listo para producción
   - ✅ Se puede publicar en Play Store
   - ⚠️ Requiere keystore configurado
   - ⚠️ Guarda el keystore de forma segura (si lo pierdes, no podrás actualizar la app)

3. **Tamaño del APK:**
   - Debug: ~20-30 MB
   - Release: ~15-25 MB (optimizado)

---

## 🚀 ¡Listo para Generar!

Ejecuta estos comandos:

```bash
# 1. Construir y sincronizar
npm run build
npm run cap:sync

# 2. Abrir Android Studio
npm run cap:open:android

# 3. En Android Studio: Build > Build APK(s)
```

¡Tu APK estará listo en unos minutos! 🎉
