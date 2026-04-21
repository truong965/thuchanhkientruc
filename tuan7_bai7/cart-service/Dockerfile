FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY cart-service/package.json ./cart-service/
RUN npm install --workspaces=false
COPY cart-service/src ./cart-service/src
WORKDIR /app/cart-service
CMD ["../node_modules/.bin/ts-node-dev", "--transpile-only", "src/index.ts"]
