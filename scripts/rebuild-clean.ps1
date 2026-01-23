# Script PowerShell para limpiar y reconstruir completamente el proyecto
# Uso: .\scripts\rebuild-clean.ps1

Write-Host "Limpiando node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Limpiando build de Vite..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue

Write-Host "Limpiando build de Android..." -ForegroundColor Yellow
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\.idea -ErrorAction SilentlyContinue

Write-Host "Reinstalando dependencias..." -ForegroundColor Cyan
npm install

Write-Host "Reconstruyendo proyecto web..." -ForegroundColor Cyan
npm run build

Write-Host "Sincronizando con Capacitor..." -ForegroundColor Cyan
npx cap sync android

Write-Host "Limpieza y reconstruccion completada!" -ForegroundColor Green
Write-Host "Para abrir Android Studio: npx cap open android" -ForegroundColor Cyan
