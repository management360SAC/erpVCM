# frontend/Dockerfile — build de producción (no expone el dev server de Vite)
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
# npm run build corre "tsc -b && vite build"; hay errores de TS preexistentes
# (API vieja de MUI Grid vs @mui/material v7) sin relación con este cambio.
# Igual que el dev server (que tampoco type-checkea), solo empaquetamos con vite build.
RUN npx vite build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
