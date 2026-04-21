FROM node:20-alpine
WORKDIR /app

# Copy root workspace manifest
COPY package.json package-lock.json tsconfig.json ./

# Copy package.json của service này (workspace member)
COPY product-service/package.json ./product-service/

# Cài tất cả dependencies (bao gồm devDeps để có ts-node-dev)
RUN npm install --workspaces=false

# Copy source
COPY product-service/src ./product-service/src

WORKDIR /app/product-service

CMD ["../node_modules/.bin/ts-node-dev", "--transpile-only", "src/index.ts"]
