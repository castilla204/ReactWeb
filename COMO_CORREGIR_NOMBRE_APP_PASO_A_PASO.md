# 📝 Cómo Corregir el Nombre de la App - Paso a Paso

## 🎯 Objetivo

Asegurarte de que el nombre de la app en Google Cloud Console coincida exactamente con el nombre que aparece en tu sitio web.

---

## Paso 1: Verificar el Nombre en Tu Sitio Web

### Opción A: Ver el Título de la Pestaña

1. **Abre tu sitio web:**
   - Ve a: https://inspecciono.com
   - O si estás en desarrollo: http://localhost:5173

2. **Mira el título de la pestaña del navegador:**
   - En la parte superior de la pestaña, verás el título
   - Por ejemplo: "inspecciono.com - Plataforma de Contratación..."
   - O simplemente: "inspecciono.com"

3. **Anota el nombre exacto** que ves (puede ser "inspecciono", "Inspecciono", "inspecciono.com", etc.)

### Opción B: Ver el Código Fuente

1. **Abre tu sitio web:**
   - Ve a: https://inspecciono.com

2. **Abre el código fuente:**
   - Presiona `Ctrl + U` (Windows/Linux) o `Cmd + Option + U` (Mac)
   - O haz clic derecho > "Ver código fuente de la página"

3. **Busca la etiqueta `<title>`:**
   - Presiona `Ctrl + F` y busca: `<title>`
   - Verás algo como: `<title>inspecciono.com - Plataforma...</title>`
   - O: `<title>Inspecciono - ...</title>`

4. **Anota el nombre exacto** que aparece en el `<title>`

### Opción C: Ver el Nombre en la Página

1. **Abre tu sitio web:**
   - Ve a: https://inspecciono.com

2. **Busca el nombre de la app en la página:**
   - Puede estar en el header, logo, o en algún texto visible
   - Anota el nombre exacto que ves

---

## Paso 2: Actualizar el Nombre en Google Cloud Console

1. **Ve a Google Cloud Console:**
   - https://console.cloud.google.com/auth/branding?project=grup-441318
   - O desde donde estás ahora, busca el campo "Nombre de la app" o "App name"

2. **Busca el campo "Nombre de la app" o "App name":**
   - Debería estar en la sección "Información de marca"
   - Puede estar en la parte superior de la página

3. **Compara el nombre:**
   - **Nombre actual en Google Cloud:** "inspecciono" (o el que tengas)
   - **Nombre en tu sitio web:** (el que anotaste en el Paso 1)

4. **Si NO coinciden:**
   - Edita el campo "Nombre de la app" en Google Cloud Console
   - Cambia el nombre para que coincida **exactamente** con el de tu sitio web
   - Por ejemplo:
     - Si tu sitio dice "Inspecciono" (con mayúscula) → Usa "Inspecciono"
     - Si tu sitio dice "inspecciono.com" → Usa "inspecciono.com"
     - Si tu sitio dice "Inspecciono - Plataforma..." → Usa "Inspecciono"

5. **Guarda los cambios:**
   - Haz clic en "Guardar" o "Save"
   - Espera a que se guarden los cambios

---

## 📋 Ejemplo Práctico

### Si tu sitio web tiene:
```
<title>inspecciono.com - Plataforma de Contratación...</title>
```

### Entonces en Google Cloud Console usa:
```
inspecciono.com
```

O si prefieres solo el nombre sin el dominio:
```
Inspecciono
```

**IMPORTANTE:** El nombre debe ser reconocible y coincidir con lo que los usuarios ven en tu sitio.

---

## 🔍 Si No Encuentras el Campo "Nombre de la app"

1. **En la página de "Información de marca":**
   - Busca un campo que diga "App name", "Nombre de la app", o "Application name"
   - Puede estar en la parte superior, antes de "Correo electrónico de asistencia"

2. **Si no lo encuentras:**
   - Puede que necesites hacer clic en "Editar" o un botón similar
   - O puede estar en otra sección de la configuración

---

## ✅ Después de Actualizar

1. **Guarda los cambios** en Google Cloud Console

2. **Vuelve al modal de problemas:**
   - Haz clic en "Corregí los problemas"
   - Haz clic en "Continuar"

3. **Espera la verificación:**
   - Google revisará los cambios
   - Puede tardar desde unas horas hasta varios días

---

## 🆘 Si Aún No Entiendes

**Dime:**
1. ¿Qué nombre ves en la pestaña del navegador cuando abres https://inspecciono.com?
2. ¿Qué nombre tienes actualmente en Google Cloud Console?

Y te ayudo a hacer que coincidan exactamente.
