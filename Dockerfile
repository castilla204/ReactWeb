# Etapa de construcción
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf  # Añade esta línea para usar la config personalizada
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]