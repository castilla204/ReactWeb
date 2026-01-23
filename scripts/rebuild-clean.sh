#!/bin/bash
# ✅ Script para limpiar y reconstruir completamente el proyecto
# Uso: bash scripts/rebuild-clean.sh

echo "🧹 Limpiando node_modules..."
rm -rf node_modules
rm -rf package-lock.json

echo "🧹 Limpiando build de Vite..."
rm -rf dist
rm -rf .vite

echo "🧹 Limpiando build de Android..."
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/.idea

echo "📦 Reinstalando dependencias..."
npm install

echo "🔨 Reconstruyendo proyecto web..."
npm run build

echo "🔄 Sincronizando con Capacitor..."
npx cap sync android

echo "✅ Limpieza y reconstrucción completada!"
echo "📱 Para abrir Android Studio: npx cap open android"
