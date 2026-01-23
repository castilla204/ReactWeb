# 📍 Dónde Configurar JDK 21 en Android Studio

## 🎯 Ubicación Exacta

### Opción 1: Settings (Configuración Principal) - RECOMENDADO

1. **Abre Settings:**
   - `File` > `Settings` (Windows/Linux)
   - O `Android Studio` > `Preferences` (Mac)
   - O atajo: `Ctrl+Alt+S` (Windows/Linux) / `Cmd+,` (Mac)

2. **Navega a Gradle:**
   - En el panel izquierdo, expande: `Build, Execution, Deployment`
   - Haz clic en: `Build Tools`
   - Haz clic en: `Gradle`

3. **Configura Gradle JDK:**
   - Busca la sección **"Gradle JDK"** (arriba del panel)
   - Haz clic en el dropdown
   - Selecciona: **`jbr-21`** o **`21`** o **`Embedded JDK`**
   - Si no aparece, haz clic en **"Download JDK..."** y descarga JDK 21

4. **Aplica los cambios:**
   - Haz clic en **"Apply"**
   - Haz clic en **"OK"**

---

### Opción 2: Project Structure (Estructura del Proyecto)

1. **Abre Project Structure:**
   - `File` > `Project Structure`
   - O atajo: `Ctrl+Alt+Shift+S` (Windows/Linux) / `Cmd+;` (Mac)

2. **Ve a SDK Location:**
   - En el panel izquierdo, haz clic en: **`SDK Location`**

3. **Verifica JDK:**
   - Verifica que **"JDK location"** esté configurado
   - Debería apuntar a: `C:\Users\Diego\AppData\Local\Android\Sdk\jbr` (JDK incluido)
   - O a tu instalación de JDK 21

4. **Aplica:**
   - Haz clic en **"Apply"**
   - Haz clic en **"OK"**

---

## 📸 Ruta Visual Completa

```
Android Studio
└── File
    └── Settings (Ctrl+Alt+S)
        └── Build, Execution, Deployment
            └── Build Tools
                └── Gradle
                    └── Gradle JDK: [Selecciona jbr-21]
```

---

## 🔍 Qué Buscar Exactamente

En la ventana de **Settings > Build Tools > Gradle**, deberías ver:

```
┌─────────────────────────────────────┐
│ Gradle JDK:                         │
│ [Dropdown con opciones]            │
│   - jbr-21                          │ ← SELECCIONA ESTE
│   - 21                              │
│   - Embedded JDK                    │
│   - Download JDK...                  │
└─────────────────────────────────────┘
```

---

## ⚡ Atajo Rápido

**Teclado:**
1. Presiona: `Ctrl+Alt+S` (Windows) o `Cmd+,` (Mac)
2. Escribe en el buscador: **"Gradle JDK"**
3. Selecciona la primera opción
4. Cambia el dropdown a **`jbr-21`**

---

## ✅ Verificación

Después de configurar:

1. **Cierra Settings** (Apply > OK)

2. **Sincroniza Gradle:**
   - `File` > `Sync Project with Gradle Files`
   - O haz clic en el elefante de Gradle en la barra superior

3. **Verifica que no haya errores:**
   - El panel "Build" debería mostrar éxito
   - Sin errores de "invalid source release: 21"

---

## 🆘 Si No Aparece jbr-21

Si no ves `jbr-21` en el dropdown:

1. **Haz clic en "Download JDK..."**
2. Selecciona **JDK 21** (o la versión más reciente)
3. Android Studio lo descargará e instalará automáticamente
4. Luego selecciónalo en el dropdown

---

## 📝 Resumen Visual

**Menú:** `File` > `Settings` > `Build Tools` > `Gradle` > **Gradle JDK: `jbr-21`**

¡Esa es la ubicación exacta! 🎯
