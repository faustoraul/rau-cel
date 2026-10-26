# ETAPA 1: Compilar React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copiamos el código y compilamos
COPY . .
# Le decimos a Vite dónde estará el backend
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ETAPA 2: Servir con Nginx
FROM nginx:alpine

# Copiamos los archivos compilados de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos nuestra configuración de Nginx (para que funcione React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]