FROM node:20-alpine
# Prisma 5.x cần openssl3 trên Alpine (không phải openssl1.1)
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY data-pump/package.json ./data-pump/

RUN npm install --workspaces=false

# Copy Prisma schema và generate client
COPY data-pump/prisma ./data-pump/prisma
RUN cd data-pump && ../node_modules/.bin/prisma generate --schema prisma/schema.prisma

# Copy source
COPY data-pump/src ./data-pump/src

WORKDIR /app/data-pump

CMD ["../node_modules/.bin/ts-node-dev", "--transpile-only", "src/index.ts"]
