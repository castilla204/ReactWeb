@echo off
echo ========================================
echo OBTENER SHA-1 ACTUAL PARA GOOGLE CLOUD
echo ========================================
echo.
echo Este script obtiene el SHA-1 del keystore de debug actual.
echo.
echo IMPORTANTE: Si usas un emulador o dispositivo fisico,
echo el SHA-1 puede ser diferente. Usa este script para obtenerlo.
echo.
echo ========================================
echo.

set KEYSTORE_PATH=%USERPROFILE%\.android\debug.keystore

if exist "%KEYSTORE_PATH%" (
    echo [1/2] Keystore encontrado en: %KEYSTORE_PATH%
    echo.
    echo [2/2] Obteniendo SHA-1...
    echo.
    echo ========================================
    echo SHA-1 FINGERPRINT:
    echo ========================================
    echo.
    keytool -list -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -storepass android -keypass android | findstr /C:"SHA1:"
    echo.
    echo ========================================
    echo INSTRUCCIONES:
    echo ========================================
    echo.
    echo 1. Copia el valor SHA1 de arriba (formato: XX:XX:XX:...)
    echo 2. Ve a: https://console.cloud.google.com/apis/credentials
    echo 3. Edita tu Client ID de Android
    echo 4. Agrega el SHA-1 en "SHA-1 certificate fingerprint"
    echo 5. Guarda los cambios
    echo 6. Espera 5-10 minutos para que se propaguen los cambios
    echo.
    echo ========================================
    echo.
    echo Si el SHA-1 es diferente al que tienes configurado,
    echo agrega AMBOS SHA-1 al mismo Client ID en Google Cloud Console.
    echo.
) else (
    echo.
    echo ERROR: Keystore no encontrado en: %KEYSTORE_PATH%
    echo.
    echo El keystore se crea automaticamente cuando compilas
    echo la app por primera vez en Android Studio.
    echo.
    echo Pasos:
    echo 1. Abre Android Studio: npm run cap:open:android
    echo 2. Compila la app por primera vez
    echo 3. Ejecuta este script nuevamente
    echo.
    echo ========================================
    echo OBTENER SHA-1 DEL EMULADOR/DISPOSITIVO
    echo ========================================
    echo.
    echo Si estas usando un emulador o dispositivo fisico,
    echo el SHA-1 puede ser diferente. Para obtenerlo:
    echo.
    echo 1. Abre Android Studio
    echo 2. Ve a: Build ^> Generate Signed Bundle / APK
    echo 3. O ejecuta en la terminal de Android Studio:
    echo    cd android
    echo    ./gradlew signingReport
    echo.
    echo Busca el SHA-1 en la salida para la variante "debug"
    echo.
)

echo.
pause
