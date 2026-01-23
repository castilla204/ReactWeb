# 📱 Cómo Abrir el Proyecto en Android Studio

## 🎯 IMPORTANTE: Qué Abrir

**NO abras la carpeta raíz del proyecto React** (`ReactWeb`)

**SÍ abre la carpeta `android`** que está dentro del proyecto

---

## 🚀 Método 1: Comando Automático (RECOMENDADO)

Ejecuta este comando desde la raíz del proyecto:

```bash
npm run cap:open:android
```

Esto abrirá automáticamente Android Studio con el proyecto correcto.

---

## 🚀 Método 2: Manual desde Android Studio

### Paso 1: Abrir Android Studio

1. Abre **Android Studio**
2. Si ya tienes un proyecto abierto:
   - `File` > `Close Project`

### Paso 2: Abrir el Proyecto Correcto

1. En la pantalla de bienvenida de Android Studio:
   - Haz clic en **"Open"** o **"Open an Existing Project"**

2. **Navega a esta carpeta:**
   ```
   C:\Users\Diego\Downloads\App\App\ReactWeb\android
   ```
   
   **⚠️ IMPORTANTE:** Debe ser la carpeta `android`, NO la carpeta `ReactWeb`

3. Selecciona la carpeta `android` y haz clic en **"OK"**

---

## 📂 Estructura de Carpetas

```
ReactWeb/                    ← NO abrir esta
├── src/
├── package.json
└── android/                 ← SÍ abrir ESTA carpeta
    ├── app/
    ├── build.gradle
    ├── settings.gradle
    └── ...
```

---

## ✅ Verificación

Cuando abres correctamente, deberías ver en Android Studio:

- **Estructura del proyecto** en el panel izquierdo:
  ```
  app
  ├── java
  ├── res
  └── ...
  ```

- **Archivo `build.gradle`** visible en la estructura

- **Nombre del proyecto** en la parte superior: `android` o `App`

---

## 🔧 Si Android Studio Pide Sincronizar

1. Android Studio puede mostrar: **"Gradle files have changed since last project sync"**
2. Haz clic en **"Sync Now"** o **"Sync Project with Gradle Files"**
3. Espera a que termine (puede tardar 2-5 minutos la primera vez)

---

## 🎯 Después de Abrir

Una vez que Android Studio termine de indexar:

1. **Generar APK:**
   - Menú: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`

2. **O ejecutar en dispositivo:**
   - Conecta tu dispositivo Android
   - Haz clic en el botón verde **"Run"** (▶️) o presiona `Shift+F10`

---

## 📝 Ruta Completa para Copiar

```
C:\Users\Diego\Downloads\App\App\ReactWeb\android
```

---

## ⚡ Comando Rápido

Desde la raíz del proyecto (`ReactWeb`):

```bash
npm run cap:open:android
```

¡Esto lo hace automáticamente! 🚀
