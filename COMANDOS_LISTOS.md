# 🚀 COMANDOS LISTOS PARA COPIAR Y PEGAR

## 📱 1. OBTENER SHA-1 (Ejecutar DESPUÉS de compilar en Android Studio)

### Opción 1: Script automático (RECOMENDADO)
```bash
obtener-sha1.bat
```

### Opción 2: Comando manual
```bash
keytool -list -v -keystore "C:\Users\Diego\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**Busca esta línea en la salida:**
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copia solo el valor SHA1 (sin espacios)**

---

## 🌐 2. GOOGLE CLOUD CONSOLE

### URL para acceder:
```
https://console.cloud.google.com/apis/credentials
```

### 2.1 Crear OAuth Client ID para Android

**Valores a ingresar:**
```
Application type: Android
Name: Inspecciono Android
Package name: com.inspecciono.app
SHA-1 certificate fingerprint: [PEGA_AQUI_EL_SHA1]
```

### 2.2 Crear OAuth Client ID para iOS

**Valores a ingresar:**
```
Application type: iOS
Name: Inspecciono iOS
Bundle ID: com.inspecciono.app
```

### 2.3 Verificar OAuth Client ID para Web

**Client ID actual:**
```
61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
```

**Authorized JavaScript origins (agregar estos):**
```
http://localhost:5173
https://inspecciono.com
https://www.inspecciono.com
```

**Authorized redirect URIs (agregar estos):**
```
http://localhost:5173
https://inspecciono.com
https://www.inspecciono.com
```

---

## 🍎 3. APPLE DEVELOPER

### URL para acceder:
```
https://developer.apple.com/account/resources/identifiers/list
```

### Configurar App ID

**Valores:**
```
Type: App IDs
Identifier: com.inspecciono.app
Capability: Sign In with Apple ✅
```

---

## 🔧 4. COMANDOS NPM (Ejecutar en orden)

### Construir y sincronizar
```bash
npm run build
npm run cap:sync
```

### Abrir Android Studio
```bash
npm run cap:open:android
```

### Abrir Xcode
```bash
npm run cap:open:ios
```

### Ejecutar en Android
```bash
npm run cap:run:android
```

### Ejecutar en iOS
```bash
npm run cap:run:ios
```

---

## 📝 5. VALORES ACTUALES DEL PROYECTO (Para referencia)

### App ID / Bundle ID / Package Name
```
com.inspecciono.app
```

### App Name
```
Inspecciono
```

### Google Client ID (actualmente en uso)
```
61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
```

### URL Scheme iOS (Google OAuth)
```
com.googleusercontent.apps.61603823707-4vsp43naifci8t893hdc276kkhbvn49a
```

### URL Scheme iOS (App)
```
com.inspecciono.app
```

---

## ✅ 6. CHECKLIST RÁPIDO

### Google Cloud Console
- [ ] Obtener SHA-1 (después de compilar en Android Studio)
- [ ] Crear OAuth Client ID para Android
- [ ] Crear OAuth Client ID para iOS
- [ ] Verificar OAuth Client ID para Web

### Apple Developer
- [ ] Habilitar Sign In with Apple en App ID

### Xcode
- [ ] Abrir: `npm run cap:open:ios`
- [ ] Habilitar "Sign In with Apple" capability

### Backend
- [ ] Crear endpoint `/api/User/apple-auth`

---

## 🎯 ORDEN DE EJECUCIÓN

1. **Compila en Android Studio** → Genera el keystore
2. **Ejecuta:** `obtener-sha1.bat` → Obtiene SHA-1
3. **Google Cloud Console** → Crea OAuth Client IDs
4. **Apple Developer** → Habilita Sign In with Apple
5. **Xcode** → Habilita capability
6. **Backend** → Crea endpoint Apple Auth
7. **Prueba** → `npm run cap:run:android` o `npm run cap:run:ios`

---

## 📄 ARCHIVOS CREADOS

- ✅ `COMANDOS_OAUTH_COPIAR_PEGAR.md` - Guía completa detallada
- ✅ `obtener-sha1.bat` - Script para obtener SHA-1 fácilmente
- ✅ `COMANDOS_LISTOS.md` - Este archivo (resumen rápido)

---

¡Todo listo para copiar y pegar! 🎉
