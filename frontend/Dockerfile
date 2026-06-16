FROM node:22-alpine AS build

WORKDIR /app/frontend

ARG VITE_API_BASE_URL=
ARG VITE_ENABLE_CHANGE_MONITORING=false
ARG VITE_GOOGLE_CLIENT_ID=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ENABLE_CHANGE_MONITORING=$VITE_ENABLE_CHANGE_MONITORING \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
