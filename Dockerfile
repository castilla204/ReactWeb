FROM node:24@sha256:3a09aa6354567619221ef6c45a5051b671f953f0a1924d1f819ffb236e520e6b AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Usar serve en lugar de nginx para servir archivos estáticos
FROM node:24@sha256:3a09aa6354567619221ef6c45a5051b671f953f0a1924d1f819ffb236e520e6b
WORKDIR /app

# Instalar serve globalmente
RUN npm install -g serve

# Copiar archivos build desde la etapa anterior
COPY --from=build /app/dist ./dist

# Best Practice 2025: Run as non-root user
# La imagen node:24 ya tiene un usuario 'node' con UID 1000, usarlo directamente
RUN chown -R node:node /app

USER node

EXPOSE 80

# Usar serve para servir los archivos estáticos
# serve con -s sirve archivos estáticos primero, solo redirige a index.html si no existe
# El problema puede ser caché del navegador o configuración del HTTPRoute
# -s: single-page application mode (para React Router)
# -l: puerto a escuchar
# -n: no compression
CMD ["serve", "-s", "dist", "-l", "80", "-n"]
