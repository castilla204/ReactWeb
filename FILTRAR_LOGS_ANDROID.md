# 📋 Guía para Filtrar Logs de Android

## 🔍 Comandos para Filtrar Logs

### 1. **Ver solo logs de tu aplicación (recomendado)**
```bash
adb logcat | grep "com.inspecciono.app"
```

### 2. **Ver solo logs de Capacitor y tu app**
```bash
adb logcat | grep -E "(Capacitor|com.inspecciono.app)"
```

### 3. **Ver solo logs de autenticación (con nuestros tags)**
```bash
adb logcat | grep -E "\[NativeAuth\]|\[MobileBottomBar\]|GoogleProvider|SocialLogin"
```

### 4. **Ver solo errores y warnings**
```bash
adb logcat *:E *:W | grep "com.inspecciono.app"
```

### 5. **Ver logs con niveles específicos (Error, Warning, Info)**
```bash
adb logcat *:E *:W *:I | grep "com.inspecciono.app"
```

### 6. **Ver solo logs de Google Sign-In**
```bash
adb logcat | grep -E "Google|SocialLogin|Credential|OAuth"
```

### 7. **Filtrar por tag específico (más preciso)**
```bash
# Solo logs de NativeAuth
adb logcat | grep "\[NativeAuth\]"

# Solo logs de MobileBottomBar
adb logcat | grep "\[MobileBottomBar\]"
```

### 8. **Combinar múltiples filtros (más útil)**
```bash
# Errores y warnings de tu app + logs de autenticación
adb logcat *:E *:W | grep -E "com.inspecciono.app|\[NativeAuth\]|GoogleProvider"
```

### 9. **Excluir logs del sistema (solo tu app)**
```bash
adb logcat | grep -v -E "(WindowManager|InsetsSourceConsumer|ViewRootImpl|OpenGLRenderer|InputMethodManager|system_server)" | grep "com.inspecciono.app"
```

### 10. **Ver logs en tiempo real con colores (PowerShell)**
```powershell
adb logcat | Select-String -Pattern "com.inspecciono.app|\[NativeAuth\]|GoogleProvider" | ForEach-Object {
    if ($_.Line -match "ERROR|❌") { Write-Host $_.Line -ForegroundColor Red }
    elseif ($_.Line -match "WARN|⚠️") { Write-Host $_.Line -ForegroundColor Yellow }
    elseif ($_.Line -match "INFO|✅|🚀") { Write-Host $_.Line -ForegroundColor Green }
    else { Write-Host $_.Line }
}
```

## 🎯 Comandos Más Útiles para Debugging

### **Comando recomendado para debugging de autenticación:**
```bash
adb logcat *:E *:W *:I | grep -E "com.inspecciono.app|\[NativeAuth\]|\[MobileBottomBar\]|GoogleProvider|SocialLogin|Capacitor"
```

Este comando muestra:
- ✅ Todos los errores, warnings e info
- ✅ Solo de tu aplicación
- ✅ Incluye logs de autenticación, Capacitor y Google

### **Comando para ver TODO pero sin logs del sistema:**
```bash
adb logcat | grep -v -E "(WindowManager|InsetsSourceConsumer|ViewRootImpl|OpenGLRenderer|InputMethodManager|system_server|FilePhenotypeFlags)" | grep -E "com.inspecciono.app|Capacitor"
```

## 📊 Niveles de Log en Android

- **V** - Verbose (más detallado)
- **D** - Debug
- **I** - Info
- **W** - Warning
- **E** - Error
- **F** - Fatal

## 🔧 Limpiar logs antes de empezar

```bash
adb logcat -c
```

Esto limpia el buffer de logs antes de ejecutar tu app.

## 💡 Ejemplo de Uso Completo

```bash
# 1. Limpiar logs anteriores
adb logcat -c

# 2. Filtrar y ver logs en tiempo real
adb logcat *:E *:W *:I | grep -E "com.inspecciono.app|\[NativeAuth\]|GoogleProvider"
```

## 🎨 Tags que Usamos en el Código

- `[NativeAuth]` - Todos los logs del servicio de autenticación nativa
- `[MobileBottomBar]` - Logs del componente de barra inferior móvil
- `GoogleProvider` - Logs del plugin de Google (automático)
- `Capacitor` - Logs del framework Capacitor (automático)

## 📝 Guardar Logs en un Archivo

```bash
# Guardar logs filtrados en un archivo
adb logcat *:E *:W *:I | grep -E "com.inspecciono.app|\[NativeAuth\]" > logs_auth.txt
```

## 🚀 Script Rápido para PowerShell

Crea un archivo `ver_logs.ps1`:

```powershell
# Limpiar logs
adb logcat -c

# Ver logs filtrados
adb logcat *:E *:W *:I | Select-String -Pattern "com.inspecciono.app|\[NativeAuth\]|GoogleProvider|SocialLogin|Capacitor"
```

Ejecuta con:
```powershell
.\ver_logs.ps1
```
