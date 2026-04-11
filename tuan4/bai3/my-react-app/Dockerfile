# ===== Stage 1: Build React app =====
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy source code
COPY . .

# Build production
RUN npm run build

# ===== Stage 2: Serve bằng Nginx =====
FROM nginx:alpine

# Copy build từ stage trước sang nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Mở cổng 80
EXPOSE 80

# Chạy nginx
CMD ["nginx", "-g", "daemon off;"]