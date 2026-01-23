# 📍 Dónde Está "Rebuild Project" en Android Studio Otter 3

## 🎯 Opciones para Reconstruir el Proyecto

### Opción 1: Menú Build (Recomendado)
1. En la barra de menú superior, haz clic en **`Build`**
2. Busca y haz clic en **`Rebuild Project`**
   - Si no lo ves directamente, puede estar más abajo en el menú
   - O puede estar como **`Rebuild 'app'`** o **`Rebuild 'android'`**

### Opción 2: Atajo de Teclado (Más Rápido)
1. Presiona: **`Ctrl+Shift+F9`** (Windows)
   - O **`Cmd+Shift+F9`** (Mac)
2. Esto ejecutará Rebuild Project directamente

### Opción 3: Clean + Build (Alternativa)
Si no encuentras "Rebuild Project", haz esto:
1. **`Build` > `Clean Project`**
2. Espera a que termine
3. **`Build` > `Build Project`** (o `Make Project` con `Ctrl+F9`)

### Opción 4: Desde la Barra de Herramientas
1. Busca el icono del **elefante de Gradle** en la barra superior
2. Haz clic derecho en el icono
3. Selecciona **`Rebuild Project`** o **`Clean Project`**

### Opción 5: Terminal de Gradle
1. Abre la terminal en Android Studio (abajo)
2. Ejecuta:
   ```bash
   ./gradlew clean
   ./gradlew build
   ```

---

## 🔍 Si No Aparece "Rebuild Project"

### Verifica que:
1. ✅ Tienes un proyecto abierto (no solo un archivo)
2. ✅ El proyecto está sincronizado con Gradle
3. ✅ No hay errores de configuración de Gradle

### Solución:
1. **`File` > `Sync Project with Gradle Files`**
2. Espera a que termine la sincronización
3. Luego intenta **`Build` > `Rebuild Project`** de nuevo

---

## 📝 Pasos Recomendados (En Orden)

### 1. Sincronizar Gradle
- **`File` > `Sync Project with Gradle Files`**
- O haz clic en el elefante de Gradle en la barra superior

### 2. Limpiar el Proyecto
- **`Build` > `Clean Project`**
- Espera a que termine

### 3. Reconstruir el Proyecto
- **`Build` > `Rebuild Project`**
- O presiona: **`Ctrl+Shift+F9`**

### 4. Ejecutar la App
- Haz clic en el botón **`Run`** (▶️)
- O presiona: **`Shift+F10`**

---

## 🎯 Atajo Más Rápido

**Presiona directamente:** `Ctrl+Shift+F9`

Esto ejecutará Rebuild Project sin necesidad de abrir menús.

---

## 💡 Nota

En algunas versiones de Android Studio, "Rebuild Project" puede estar en:
- **`Build` > `Rebuild Project`**
- **`Build` > `Rebuild 'app'`**
- **`Build` > `Rebuild 'android'`**

Si no lo encuentras, usa el atajo de teclado: **`Ctrl+Shift+F9`**

---

**¿Puedes probar con `Ctrl+Shift+F9`? Es la forma más rápida.**
