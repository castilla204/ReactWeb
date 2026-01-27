# Cómo Probar en Móvil Real

## Opción 1: Usar ngrok (Recomendado)

### Paso 1: Instalar ngrok
```bash
# Descarga desde https://ngrok.com/download
# O con chocolatey:
choco install ngrok
```

### Paso 2: Crear túnel para el Backend (puerto 7124)
Abre una terminal nueva y ejecuta:
```bash
ngrok http 7124
```
Esto te dará una URL como: `https://xxxx-xxxx.ngrok-free.app`

### Paso 3: Crear túnel para el Frontend (puerto 5173)
Abre OTRA terminal nueva y ejecuta:
```bash
ngrok http 5173
```
Esto te dará otra URL como: `https://yyyy-yyyy.ngrok-free.app`

### Paso 4: Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:
```env
VITE_API_URL=https://xxxx-xxxx.ngrok-free.app
```

### Paso 5: Reiniciar el servidor de desarrollo
```bash
npm run dev
```

### Paso 6: Abrir en móvil
Abre en tu móvil: `https://yyyy-yyyy.ngrok-free.app/chat-pre-contratacion/284`

---

## Opción 2: Usar IP Local (Más rápido, pero requiere configuración del backend)

### Paso 1: Configurar el backend para escuchar en todas las interfaces
En tu backend, asegúrate de que escuche en `0.0.0.0:7124` en lugar de `localhost:7124`

### Paso 2: Usar la IP local en el frontend
Crea un archivo `.env.local`:
```env
VITE_API_URL=http://192.168.240.1:7124
```

### Paso 3: Reiniciar el servidor
```bash
npm run dev
```

### Paso 4: Abrir en móvil
Abre en tu móvil: `http://192.168.240.1:5173/chat-pre-contratacion/284`

---

## Opción 3: Usar el Proxy de Vite (Más simple)

El proxy de Vite ya está configurado. Solo necesitas:

1. Asegúrate de que tu backend esté corriendo en `localhost:7124`
2. El frontend ya redirige `/api` al backend automáticamente
3. Abre en tu móvil: `http://192.168.240.1:5173/chat-pre-contratacion/284`

**Nota:** Esto funciona porque Vite tiene `host: true` configurado, así que acepta conexiones de red local.

---

## Verificar que funciona

1. Abre la consola del navegador en tu móvil
2. Deberías ver los logs de debug del viewport
3. Las peticiones API deberían funcionar a través del proxy
