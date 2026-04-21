-- =============================================================
-- init-db.sql  —  PostgreSQL initialization for all services
-- Chạy tự động khi postgres container khởi động lần đầu
-- (mount vào /docker-entrypoint-initdb.d/)
-- =============================================================

-- 1. food_service_db  (Java/Spring JPA tự tạo schema)
CREATE DATABASE food_service_db;

-- 2. order_service_db  (Java/Spring JPA tự tạo schema)
CREATE DATABASE order_service_db;

-- 3. food_user_db đã được tạo sẵn bởi POSTGRES_DB env var
--    chỉ cần đảm bảo đang connect đúng db
\connect food_user_db

-- Prisma migration sẽ tạo bảng users tự động.
-- Script này chỉ cần tạo sẵn extension uuid-ossp (nếu dùng uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- SEED DATA (chạy sau khi service đã migrate schema)
-- Trong Docker, user-service tự chạy: npx prisma migrate deploy && node prisma/seed.js
-- DataSeeder.java của food-service tự seed food khi count() == 0
-- Nếu muốn seed thủ công qua SQL, dùng script bên dưới SAU KHI schema đã tồn tại:
-- =============================================================

-- \connect food_user_db
-- INSERT INTO "User" (id, username, "passwordHash", role, "createdAt")
-- VALUES
--   (gen_random_uuid(), 'admin', '$2a$10$...<bcrypt_hash>...', 'ADMIN', NOW()),
--   (gen_random_uuid(), 'user1', '$2a$10$...<bcrypt_hash>...', 'USER', NOW())
-- ON CONFLICT (username) DO NOTHING;
