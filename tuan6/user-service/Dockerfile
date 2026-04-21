FROM node:20-alpine

# Prisma engine cần openssl để chạy trên alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 8081

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
