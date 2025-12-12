FROM node:24@sha256:20988bcdc6dc76690023eb2505dd273bdeefddcd0bde4bfd1efe4ebf8707f747 AS build
WORKDIR /app
COPY package*.json ./
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build

FROM nginx:alpine@sha256:289decab414250121a93c3f1b8316b9c69906de3a4993757c424cb964169ad42
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EXPOSE 443 
CMD ["nginx", "-g", "daemon off;"]
