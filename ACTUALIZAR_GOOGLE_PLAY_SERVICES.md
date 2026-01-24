# 🔄 Actualizar Google Play Services en el Emulador

## ❌ Error Actual

```
Google Play services out of date. Requires 230815045 but found 221821047
getCredentialAsync no provider dependencies found
```

**⚠️ ESTE ES EL PROBLEMA PRINCIPAL.** Credential Manager **NO PUEDE** funcionar sin Google Play Services actualizado.

---

## ✅ Solución: Actualizar Google Play Services

### Método 1: Actualizar desde Google Play Store (RECOMENDADO)

1. **Abre el emulador** y espera a que cargue completamente

2. **Abre Google Play Store:**
   - Busca el icono de Google Play Store en el emulador
   - Si no aparece, puede estar en el cajón de aplicaciones

3. **Busca "Google Play Services":**
   - Toca el campo de búsqueda
   - Escribe: `Google Play Services`
   - Selecciona la aplicación oficial de Google

4. **Actualiza:**
   - Si hay un botón "Actualizar", tócalo
   - Si dice "Abrir", significa que ya está actualizado (pero puede que no sea la versión correcta)
   - Espera a que termine la actualización

5. **Verifica la versión:**
   - En el emulador: `Configuración` > `Aplicaciones` > `Google Play Services`
   - Toca en "Google Play Services"
   - Busca "Versión" o "Version"
   - Debe ser **23.08.15 o superior** (código 230815045)

6. **Reinicia el emulador completamente:**
   - Cierra el emulador desde Android Studio
   - O desde el emulador: `Configuración` > `Sistema` > `Reiniciar`

7. **Vuelve a ejecutar la app** y prueba el login

---

### Método 2: Actualizar mediante ADB (Si Play Store no funciona)

Si Google Play Store no permite actualizar, puedes instalar manualmente:

1. **Descarga el APK de Google Play Services:**
   - Ve a: https://www.apkmirror.com/apk/google-inc/google-play-services/
   - Descarga la versión más reciente (23.08.15 o superior)
   - Asegúrate de descargar la versión correcta para tu arquitectura (x86_64 para emulador)

2. **Instala mediante ADB:**
   ```bash
   # Conecta el emulador y verifica que está conectado
   adb devices
   
   # Instala el APK (reemplaza con la ruta de tu archivo descargado)
   adb install -r "ruta/al/archivo/google-play-services.apk"
   ```

3. **Reinicia el emulador** y prueba nuevamente

---

### Método 3: Crear un Emulador Nuevo (MÁS FÁCIL)

Si actualizar no funciona, crea un emulador nuevo con Google Play Services actualizado:

1. **En Android Studio:**
   - `Tools` > `Device Manager`
   - Haz clic en `Create Device` (o el icono ➕)

2. **Selecciona un dispositivo:**
   - Elige un dispositivo (ej: Pixel 5, Pixel 6)
   - Haz clic en `Next`

3. **Selecciona una imagen del sistema:**
   - **IMPORTANTE**: Elige una imagen que diga **"Google Play"** (no "Google APIs")
   - Selecciona **Android 13 (API 33) o superior**
   - Ejemplo: `Tiramisu | API 33 | Google Play`
   - Haz clic en `Download` si no está descargada
   - Haz clic en `Next`

4. **Configura el AVD:**
   - Nombre: `Pixel_5_API_33_Google_Play` (o el que prefieras)
   - Haz clic en `Finish`

5. **Ejecuta la app en el nuevo emulador:**
   - Selecciona el nuevo emulador en Android Studio
   - Haz clic en ▶️ (Run)
   - Espera a que el emulador inicie (puede tardar 1-2 minutos la primera vez)

6. **Verifica Google Play Services:**
   - En el nuevo emulador: `Configuración` > `Aplicaciones` > `Google Play Services`
   - Debe ser versión 23.08.15 o superior

---

### Método 4: Probar en un Dispositivo Físico (MÁS CONFIABLE)

Los dispositivos físicos suelen tener Google Play Services actualizado automáticamente:

1. **Conecta tu dispositivo Android por USB**

2. **Habilita Depuración USB:**
   - En tu dispositivo: `Configuración` > `Opciones de desarrollador` > `Depuración USB`
   - Si no ves "Opciones de desarrollador":
     - Ve a `Configuración` > `Acerca del teléfono`
     - Toca 7 veces en "Número de compilación"

3. **En Android Studio:**
   - Selecciona tu dispositivo de la lista
   - Haz clic en ▶️ (Run)
   - La app se instalará y ejecutará automáticamente

4. **Prueba el login:**
   - Debería funcionar correctamente en un dispositivo físico

---

## 🔍 Verificación

Después de actualizar Google Play Services:

1. **Verifica la versión:**
   ```
   Configuración > Aplicaciones > Google Play Services > Versión
   ```
   - Debe ser **23.08.15 o superior** (código 230815045)

2. **Reinicia el emulador completamente**

3. **Ejecuta la app y prueba el login**

4. **Revisa los logs:**
   - Ya NO debe aparecer: `Google Play services out of date`
   - El login debería funcionar correctamente

---

## ⚠️ Notas Importantes

- **Google Play Services desactualizado es la causa principal del error.** Credential Manager requiere Google Play Services 23.08.15 o superior para funcionar.

- **Sincronizar Gradle es necesario pero no suficiente.** Aunque las dependencias estén correctamente agregadas y sincronizadas, Credential Manager NO funcionará sin Google Play Services actualizado.

- **Los emuladores antiguos pueden tener problemas.** Si no puedes actualizar Google Play Services en el emulador actual, crea un emulador nuevo con Android 13+ y Google Play.

- **Los dispositivos físicos son más confiables.** Si tienes un dispositivo Android físico, prueba ahí primero.

---

## 📝 Resumen Rápido

1. ✅ Gradle sincronizado (YA HECHO)
2. 🔴 **ACTUALIZAR GOOGLE PLAY SERVICES** (HACER AHORA)
   - Opción A: Actualizar desde Google Play Store
   - Opción B: Instalar APK manualmente
   - Opción C: Crear emulador nuevo
   - Opción D: Probar en dispositivo físico
3. ⏳ Reiniciar emulador
4. ⏳ Probar login

**Sin actualizar Google Play Services, el error persistirá aunque todo lo demás esté correcto.**
