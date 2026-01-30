# Script para obtener SHA-1 del certificado de debug de Android
Write-Host "Obteniendo SHA-1 del certificado de debug..." -ForegroundColor Cyan

$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

if (-not (Test-Path $debugKeystore)) {
    Write-Host "No se encontro el keystore de debug" -ForegroundColor Red
    Write-Host "El keystore se creara automaticamente la primera vez que compiles" -ForegroundColor Yellow
    exit 1
}

Write-Host "Keystore encontrado" -ForegroundColor Green
Write-Host ""

$sha1Output = keytool -list -v -alias androiddebugkey -keystore $debugKeystore -storepass android -keypass android 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al ejecutar keytool" -ForegroundColor Red
    exit 1
}

$sha1Line = $sha1Output | Select-String -Pattern "SHA1:"

if ($sha1Line) {
    Write-Host "SHA-1 encontrado:" -ForegroundColor Green
    Write-Host ""
    Write-Host $sha1Line.Line -ForegroundColor Yellow
    Write-Host ""
    
    $sha1Value = ($sha1Line.Line -split "SHA1: ")[1].Trim()
    
    Write-Host "SHA-1 para copiar:" -ForegroundColor Cyan
    Write-Host $sha1Value -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "Copia este SHA-1 y registralo en Google Cloud Console" -ForegroundColor Green
    Write-Host "https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
} else {
    Write-Host "No se pudo encontrar el SHA-1" -ForegroundColor Red
    Write-Host $sha1Output
}
