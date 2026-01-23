@echo off
echo ========================================
echo OBTENER SHA-1 FINGERPRINT PARA ANDROID
echo ========================================
echo.

set KEYSTORE_PATH=%USERPROFILE%\.android\debug.keystore

if exist "%KEYSTORE_PATH%" (
    echo Keystore encontrado en: %KEYSTORE_PATH%
    echo.
    echo Ejecutando keytool...
    echo.
    keytool -list -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -storepass android -keypass android
    echo.
    echo ========================================
    echo Busca la linea que dice "SHA1:"
    echo Copia ese valor y pegalo en Google Cloud Console
    echo ========================================
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
)

pause
