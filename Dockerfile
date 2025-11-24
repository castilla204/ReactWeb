FROM node:20@sha256:ba36e9b2705008e63e354214f0e3011c528af9df2ca13ac2bd2c0114650302e6 AS build
WORKDIR /app
COPY package*.json ./
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build

FROM nginx:alpine@sha256:b3c656d55d7ad751196f21b7fd2e8d4da9cb430e32f646adcf92441b72f82b14
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EXPOSE 443 
CMD ["nginx", "-g", "daemon off;"]
