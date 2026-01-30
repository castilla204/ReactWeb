# 📋 Guía: Logs para Verificar SHA-1 y Configuración

## 🔍 Logs Añadidos

Se han añadido logs detallados en dos lugares:

1. **MainActivity.java** - Logs en el lado nativo de Android
2. **nativeAuthService.ts** - Logs en JavaScript/TypeScript

---

## 📱 LOGS EN LOGCAT (Android Nativo)

### Al iniciar la app, busca estos logs:

```
🔐 [Certificate] SHA-1 del certificado de la app: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
🔐 [Certificate] SHA-1 esperado en Google Cloud: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
🔐 [Certificate] Package name: com.inspecciono.app
🔐 [Certificate] ¿SHA-1 coincide?: true
```

**✅ Si coincide:** El SHA-1 está correcto
**❌ Si NO coincide:** El SHA-1 en Google Cloud Console está mal configurado

### Durante el proceso de login, busca estos logs:

```
📥 [GoogleSignIn] onActivityResult - requestCode: XXXX, resultCode: X
📥 [GoogleSignIn] Request code range: XXXX - XXXX
✅ [GoogleSignIn] Request code está en el rango correcto para Google Sign-In
```

**Si resultCode es RESULT_CANCELED:**
```
⚠️ [GoogleSignIn] Result code es RESULT_CANCELED - Usuario canceló o error de configuración
⚠️ [GoogleSignIn] Intent data es null - Posible error de SHA-1 o configuración
```

**Si resultCode es RESULT_OK:**
```
✅ [GoogleSignIn] Result code es RESULT_OK - Autenticación exitosa
```

---

## 🌐 LOGS EN CONSOLE (JavaScript/TypeScript)

### Al iniciar Google Sign-In, verás:

```
🚀 [NativeAuth] ========== INICIO GOOGLE SIGN-IN ==========
📱 [NativeAuth] Plataforma: android
📱 [NativeAuth] Es nativo: true
🔑 [NativeAuth] Web Client ID configurado: 61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
🔑 [NativeAuth] Web Client ID longitud: 72
🔑 [NativeAuth] Web Client ID esperado: 61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
🔑 [NativeAuth] ¿Web Client ID coincide?: true
🔐 [NativeAuth] SHA-1 esperado en Google Cloud Console: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
🔐 [NativeAuth] Package name esperado: com.inspecciono.app
🔐 [NativeAuth] IMPORTANTE: Verifica en Logcat que el SHA-1 del certificado coincida con el de Google Cloud Console
```

### Antes de hacer login:

```
🔐 [NativeAuth] ANTES DE LOGIN - Verificaciones:
🔐 [NativeAuth] - Web Client ID configurado: ✅ 61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
🔐 [NativeAuth] - SHA-1 debe estar en Google Cloud Console: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
🔐 [NativeAuth] - Package name debe ser: com.inspecciono.app
🔐 [NativeAuth] - Revisa Logcat para ver el SHA-1 real del certificado
```

### Si hay error de cancelación:

```
🔐 [NativeAuth] ========== DIAGNÓSTICO ERROR DE CANCELACIÓN ==========
🔐 [NativeAuth] Este error generalmente indica:
🔐 [NativeAuth] 1. SHA-1 no coincide con el configurado en Google Cloud Console
🔐 [NativeAuth] 2. Web Client ID incorrecto o no vinculado al Android Client ID
🔐 [NativeAuth] 3. Package name incorrecto en Google Cloud Console
🔐 [NativeAuth] 4. OAuth Consent Screen no configurado correctamente
🔐 [NativeAuth] VERIFICA EN LOGCAT:
🔐 [NativeAuth] - Busca el log "[Certificate] SHA-1 del certificado de la app"
🔐 [NativeAuth] - Compara con el SHA-1 en Google Cloud Console
🔐 [NativeAuth] - Deben ser EXACTAMENTE iguales (mayúsculas/minúsculas no importan)
🔐 [NativeAuth] SHA-1 esperado: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
🔐 [NativeAuth] ========================================================
```

---

## 🔍 CÓMO FILTRAR LOS LOGS

### En Android Studio Logcat:

**Filtro para ver solo logs de certificado y Google Sign-In:**
```
package:com.inspecciono.app tag:MainActivity|Certificate|GoogleSignIn|NativeAuth
```

**O más específico:**
```
package:com.inspecciono.app message:Certificate|GoogleSignIn|SHA-1
```

### En la consola del navegador (si usas Chrome DevTools):

Busca los logs que empiezan con:
- `🔐 [NativeAuth]`
- `🔑 [NativeAuth]`
- `📱 [NativeAuth]`

---

## ✅ CHECKLIST DE VERIFICACIÓN

Cuando ejecutes la app, verifica:

1. **En Logcat (Android):**
   - [ ] Aparece el log `[Certificate] SHA-1 del certificado de la app`
   - [ ] El SHA-1 mostrado es: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
   - [ ] El log dice `¿SHA-1 coincide?: true`
   - [ ] El Package name es: `com.inspecciono.app`

2. **En Console (JavaScript):**
   - [ ] El Web Client ID coincide con el esperado
   - [ ] Aparecen los logs de verificación antes del login
   - [ ] Si hay error, aparece el diagnóstico de cancelación

3. **En Google Cloud Console:**
   - [ ] El SHA-1 en el Android Client ID es EXACTAMENTE: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
   - [ ] El Package name es: `com.inspecciono.app`
   - [ ] El Web Client ID es: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`

---

## 🚨 SI LOS LOGS MUESTRAN SHA-1 DIFERENTE

Si en Logcat ves un SHA-1 diferente al esperado:

1. **Copia el SHA-1 que aparece en Logcat**
2. **Ve a Google Cloud Console**
3. **Edita tu Android Client ID**
4. **Elimina el SHA-1 incorrecto**
5. **Agrega el SHA-1 que aparece en Logcat**
6. **Guarda y espera 10-15 minutos**

---

## 📝 EJEMPLO DE LOGS CORRECTOS

### Logcat (Android):
```
I/MainActivity: 🔐 [Certificate] SHA-1 del certificado de la app: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
I/MainActivity: 🔐 [Certificate] SHA-1 esperado en Google Cloud: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
I/MainActivity: 🔐 [Certificate] Package name: com.inspecciono.app
I/MainActivity: 🔐 [Certificate] ¿SHA-1 coincide?: true
I/MainActivity: 📥 [GoogleSignIn] onActivityResult - requestCode: 12345, resultCode: -1
I/MainActivity: ✅ [GoogleSignIn] Result code es RESULT_OK - Autenticación exitosa
```

### Console (JavaScript):
```
🚀 [NativeAuth] ========== INICIO GOOGLE SIGN-IN ==========
🔑 [NativeAuth] Web Client ID configurado: 61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
🔑 [NativeAuth] ¿Web Client ID coincide?: true
✅ [NativeAuth] Plugin inicializado exitosamente (18ms)
✅ [NativeAuth] Login completado (2069ms)
✅ [NativeAuth] Autenticación completada exitosamente
```

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecuta la app** en Android
2. **Abre Logcat** y filtra por `package:com.inspecciono.app`
3. **Intenta hacer login** con Google
4. **Revisa los logs** y compara:
   - SHA-1 en Logcat vs SHA-1 en Google Cloud Console
   - Web Client ID en logs vs Web Client ID en Google Cloud Console
5. **Si no coinciden**, corrige en Google Cloud Console y espera 10-15 minutos
