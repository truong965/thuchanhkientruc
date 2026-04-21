FROM node:20-alpine

# Prisma engine cần openssl để chạy trên alpine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 8003

# Không có seed data cho booking vì chúng ta sẽ tạo nó qua API
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]
