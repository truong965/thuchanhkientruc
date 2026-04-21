FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY order-service/package.json ./order-service/
RUN npm install --workspaces=false
COPY order-service/src ./order-service/src
WORKDIR /app/order-service
CMD ["../node_modules/.bin/ts-node-dev", "--transpile-only", "src/index.ts"]
