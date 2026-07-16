FROM node:24@sha256:5711a0d445a1af54af9589066c646df387d1831a608226f4cd694fc59e745059 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Usar serve en lugar de nginx para servir archivos estáticos
FROM node:24@sha256:5711a0d445a1af54af9589066c646df387d1831a608226f4cd694fc59e745059
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
# -s: single-page application mode (para React Router)
# -l: puerto a escuchar
# -n: --no-clipboard (NO es "no compression"; eso seria -u). La compresion gzip
#     esta ACTIVA. Los headers de cache se definen en dist/serve.json
#     (copiado desde public/serve.json por el build de Vite).
CMD ["serve", "-s", "dist", "-l", "80", "-n"]
