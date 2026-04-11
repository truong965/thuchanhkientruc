# Dùng image chính thức của Node.js
FROM node:18

# Tạo thư mục app trong container
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Cài dependencies (nếu có)
RUN npm install

# Copy toàn bộ source code
COPY . .

# Mở port 3000
EXPOSE 3000

# Chạy app
CMD ["node", "index.js"]