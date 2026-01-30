@echo off
echo ========================================
echo Obtener SHA-1 del Keystore Debug
echo ========================================
echo.

set KEYSTORE_PATH=%USERPROFILE%\.android\debug.keystore

if not exist "%KEYSTORE_PATH%" (
    echo ERROR: No se encontro el keystore debug en:
    echo %KEYSTORE_PATH%
    echo.
    echo El keystore se crea automaticamente la primera vez que compilas.
    echo Intenta compilar el proyecto primero.
    pause
    exit /b 1
)

echo Obteniendo SHA-1 del keystore debug...
echo.

keytool -list -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -storepass android -keypass android

echo.
echo ========================================
echo INSTRUCCIONES:
echo ========================================
echo 1. Busca la linea que dice "SHA1:"
echo 2. Copia el valor (formato: XX:XX:XX:XX:...)
echo 3. Ve a Google Cloud Console ^> APIs ^& Services ^> Credentials
echo 4. Edita tu Android Client ID
echo 5. Agrega el SHA-1 en "SHA-1 certificate fingerprints"
echo 6. Guarda los cambios
echo.
pause
