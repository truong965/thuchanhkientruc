# ===== Stage 1: Build ứng dụng =====
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod và go.sum trước để tận dụng cache
COPY go.mod go.sum ./

# Cài dependencies (nếu có)
RUN go mod download

# Copy toàn bộ source code
COPY . .

# Build binary
RUN go build -o app .

# ===== Stage 2: Chạy app =====
FROM alpine:latest

WORKDIR /root/

# Copy binary từ stage build
COPY --from=builder /app/app .

EXPOSE 8080

CMD ["./app"]