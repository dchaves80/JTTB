# JTTB - Terminal Toolbox
# Multi-stage build

# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY jttb-front/package*.json ./
RUN npm install
COPY jttb-front/ ./
RUN npm run build:prod

# Stage 2: Build backend dependencies
FROM node:20-alpine AS backend-build
WORKDIR /build
COPY jttb-back/package*.json ./
RUN npm install --production

# Stage 3: Final image
FROM alpine:3.19

# Instalar dependencias del sistema
RUN apk add --no-cache \
    nodejs \
    npm \
    nginx \
    supervisor \
    # Herramientas de red
    curl \
    wget \
    bind-tools \
    netcat-openbsd \
    iputils \
    jq \
    openssl \
    nmap \
    # Shell y utilidades
    bash \
    # Cliente PostgreSQL
    postgresql16-client \
    # Cliente MongoDB tools
    mongodb-tools \
    # Cliente SQL Server
    freetds \
    # Cliente Redis
    redis \
    # Cliente MySQL
    mysql-client

# Crear estructura de directorios
RUN mkdir -p /app/jttb-back /app/jttb-front /var/log/supervisor

# Copiar backend
COPY --from=backend-build /build/node_modules /app/jttb-back/node_modules
COPY jttb-back/server.js /app/jttb-back/
COPY jttb-back/package.json /app/jttb-back/

# Copiar frontend compilado
COPY --from=frontend-build /build/dist/jttb-frontend/browser /app/jttb-front/

# Copiar configuraciones
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf
COPY help.txt /help.txt

# Exponer puerto
EXPOSE 80

# Variables de entorno requeridas (deben setearse en el deployment)
# JTTB_JWT_SECRET
# JTTB_USER
# JTTB_PASSWORD

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
