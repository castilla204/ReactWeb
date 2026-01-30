# Cómo Obtener y Verificar el SHA-1

## 🔑 Obtener SHA-1 del Keystore Debug

### Opción 1: Usar el Script (Windows)
Ejecuta el archivo `obtener-sha1-debug.bat` que está en la raíz del proyecto.

### Opción 2: Comando Manual (Windows)
```bash
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Opción 3: Comando Manual (Linux/Mac)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Opción 4: Desde Android Studio
1. Abre Android Studio
2. Ve a **Gradle** (panel derecho)
3. Expande: `YourApp > Tasks > android > signingReport`
4. Doble clic en `signingReport`
5. Busca en la consola la línea que dice `SHA1:`

## 📋 Qué Buscar

En la salida del comando, busca esta línea:
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copia TODO el valor después de "SHA1:"** (incluyendo los dos puntos)

## ✅ Verificar en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**
4. Busca tu **Android Client ID** (tipo "Android")
5. Haz clic en **Editar** (icono de lápiz)
6. En **SHA-1 certificate fingerprints**, verifica que esté tu SHA-1
7. Si no está, agrégalo y guarda

## ⚠️ Importante

- **Para pruebas locales**: Usa el SHA-1 del keystore **debug**
- **Para producción**: Si ya subiste a Play Store, usa el **SHA-1 de App Signing** desde Play Console
- **Si cambias el keystore**: Debes actualizar el SHA-1 en Google Cloud Console

## 🔍 Si No Encuentras el Keystore

El keystore debug se crea automáticamente la primera vez que compilas el proyecto Android. Si no existe:

1. Abre Android Studio
2. Abre el proyecto Android: `npx cap open android`
3. Build > Make Project
4. El keystore se creará automáticamente en `~/.android/debug.keystore`
