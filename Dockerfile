FROM node:24 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Usar serve en lugar de nginx para servir archivos estáticos
FROM node:24
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
# -s: single-page application mode (para React Router) - redirige todas las rutas a index.html
# -l: puerto a escuchar
# -n: no compression (mejor para debugging y evitar problemas de MIME type)
# IMPORTANTE: serve debe servir desde el directorio 'dist', no desde '/app'
CMD ["sh", "-c", "cd /app && serve -s dist -l 80 -n"]
