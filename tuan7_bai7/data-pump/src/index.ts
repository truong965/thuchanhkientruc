import { PrismaClient } from '@prisma/client';
import amqp from 'amqplib';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:adminpassword@localhost:5672';

async function startWorker() {
  try {
    console.log('[Data Pump] Attempting to connect to RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    
    connection.on('error', (err) => {
      console.error('[Data Pump] RabbitMQ Connection Error:', err.message);
    });

    connection.on('close', () => {
      console.error('[Data Pump] RabbitMQ Connection Closed. Reconnecting in 5s...');
      setTimeout(startWorker, 5000);
    });

    const channel = await connection.createChannel();
    const queue = 'order_created';
    await channel.assertQueue(queue, { durable: true });

    // Chỉ xử lý 1 message tại một thời điểm để đảm bảo tính nhất quán (tùy chọn)
    channel.prefetch(1);

    console.log(`[*] Data Pump connected and waiting for messages in ${queue}.`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        const orderData = JSON.parse(content);

        console.log(`[Data Pump] Received Order Event: ${orderData.orderId} for User: ${orderData.userId}`);

        try {
          // Xử lý ghi vào Database (PostgreSQL)
          await prisma.$transaction(async (tx) => {
            console.log(`[Data Pump] Transaction Start: Saving Order ${orderData.orderId}`);

            // 1. Kiểm tra Idempotency
            const existingOrder = await tx.order.findUnique({
              where: { id: orderData.orderId },
            });

            if (existingOrder) {
              console.log(`[Data Pump] Idempotency Hit: Order ${orderData.orderId} already exists in DB. Skipping.`);
              return;
            }

            // 2. Tạo Order
            await tx.order.create({
              data: {
                id: orderData.orderId,
                userId: orderData.userId,
                totalAmount: orderData.totalAmount,
                status: 'COMPLETED',
                items: {
                  create: orderData.items.map((item: any) => ({
                    productId: item.productId,
                    price: item.price,
                    quantity: item.quantity,
                  })),
                },
              },
            });
            console.log(`[Data Pump] Order ${orderData.orderId} created in PostgreSQL`);

            // 3. Cập nhật tồn kho "cứng" trong DB
            for (const item of orderData.items) {
              await tx.inventory.update({
                where: { productId: item.productId },
                data: {
                  available: {
                    decrement: item.quantity,
                  },
                },
              });
              console.log(`[Data Pump] Inventory Updated: Product ${item.productId} decremented by ${item.quantity}`);
            }
          });

          console.log(`[Data Pump] Transaction Success: Order ${orderData.orderId} persisted and Inventory synced.`);
          channel.ack(msg);
        } catch (dbError) {
          console.error(`[Data Pump] Transaction Failed for Order ${orderData.orderId}:`, dbError);
          // Trả message về hàng đợi để retry (requeue = true)
          channel.nack(msg, false, true);
        }
      }
    });

  } catch (error) {
    console.error('[Data Pump] RabbitMQ Connection Failed. Retrying in 5s...');
    setTimeout(startWorker, 5000); // Retry connection
  }
}

startWorker();
