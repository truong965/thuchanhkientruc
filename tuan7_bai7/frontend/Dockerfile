# Bước 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Nhận biến môi trường LAN IP khi build
ARG VITE_PRODUCT_SERVICE_URL
ARG VITE_CART_SERVICE_URL
ARG VITE_ORDER_SERVICE_URL
ARG VITE_INVENTORY_SERVICE_URL

ENV VITE_PRODUCT_SERVICE_URL=$VITE_PRODUCT_SERVICE_URL
ENV VITE_CART_SERVICE_URL=$VITE_CART_SERVICE_URL
ENV VITE_ORDER_SERVICE_URL=$VITE_ORDER_SERVICE_URL
ENV VITE_INVENTORY_SERVICE_URL=$VITE_INVENTORY_SERVICE_URL

RUN npm run build

# Bước 2: Serve bằng Nginx (nhẹ, nhanh)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
