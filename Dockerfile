FROM node:24@sha256:20988bcdc6dc76690023eb2505dd273bdeefddcd0bde4ebf8707f747 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Usar serve en lugar de nginx para servir archivos estáticos
FROM node:24@sha256:20988bcdc6dc76690023eb2505dd273bdeefddcd0bde4ebf8707f747
WORKDIR /app

# Instalar serve globalmente
RUN npm install -g serve

# Copiar archivos build desde la etapa anterior
COPY --from=build /app/dist ./dist

# Best Practice 2025: Run as non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 80

# Usar serve para servir los archivos estáticos
# -s: single-page application mode (para React Router)
# -l: puerto a escuchar
CMD ["serve", "-s", "dist", "-l", "3000"]
