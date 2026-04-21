FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY inventory-service/package.json ./inventory-service/
RUN npm install --workspaces=false
COPY inventory-service/src ./inventory-service/src
WORKDIR /app/inventory-service
CMD ["../node_modules/.bin/ts-node-dev", "--transpile-only", "src/index.ts"]
