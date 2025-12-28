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
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -s /bin/sh -m appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 80

# Usar serve para servir los archivos estáticos
# -s: single-page application mode (para React Router)
# -l: puerto a escuchar
CMD ["serve", "-s", "dist", "-l", "80"]
