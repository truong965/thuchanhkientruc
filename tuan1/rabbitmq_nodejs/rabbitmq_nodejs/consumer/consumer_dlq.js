const amqp = require("amqplib");

// Sử dụng biến môi trường cho linh hoạt
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq:5672";
const QUEUE = "order_queue";
const DEAD_LETTER_QUEUE = "order_queue.dlq";

async function connectWithRetry() {
  try {
    console.log("⏳ Consumer connecting to RabbitMQ...");
    const conn = await amqp.connect(RABBITMQ_URL);
    const channel = await conn.createChannel();

    // 1. Đảm bảo DLQ tồn tại trước
    await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });

    // 2. Đảm bảo Queue chính tồn tại và link tới DLQ
    await channel.assertQueue(QUEUE, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: DEAD_LETTER_QUEUE,
    });

    // 3. QUAN TRỌNG: Prefetch 1 - Chỉ nhận 1 tin nhắn để xử lý xong mới nhận tin tiếp theo
    // Giúp tránh crash consumer nếu quá tải và chia đều việc nếu chạy nhiều consumer.
    channel.prefetch(1);

    console.log("✅ Waiting for messages in %s...", QUEUE);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const content = msg.content.toString();

      try {
        // --- BƯỚC 1: Parse Data ---
        let data;
        try {
          data = JSON.parse(content);
        } catch (e) {
          console.error("❌ Malformed JSON. Rejecting...");
          // requeue: false -> Đẩy thẳng vào DLQ vì có retry cũng không parse được
          channel.nack(msg, false, false);
          return;
        }

        console.log(`\n📥 Received OrderID: ${data.orderId}`);

        // --- BƯỚC 2: MÔ PHỎNG CÁC TRƯỜNG HỢP TEST (SIMULATION) ---

        // CASE A: Giả lập lỗi dữ liệu (Validation Error)
        // Test bằng cách gửi JSON: { "message": "buy", "orderId": "invalid_123", "amount": -100 }
        if (data.amount < 0) {
          throw new Error("Validation Error: Amount cannot be negative");
        }

        // CASE B: Giả lập lỗi hệ thống ngẫu nhiên (Random Crash)
        // Test bằng cách gửi JSON: { "message": "crash_me", "orderId": "crash_123" }
        if (data.message === "crash_me") {
          throw new Error("Simulated Database Connection Failed");
        }

        // CASE C: Giả lập xử lý chậm (Heavy Processing)
        console.log("⚙️ Processing...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2s


        // --- BƯỚC 3: Xử lý thành công ---
        console.log("✅ Process success:", data.orderId);
        channel.ack(msg); // Xác nhận đã xong

      } catch (err) {
        console.error(`🔴 Error processing message: ${err.message}`);

        // --- BƯỚC 4: Xử lý lỗi (Dead Letter Strategy) ---
        // requeue: false -> Không đưa lại hàng đợi chính (tránh lặp vô tận), mà đẩy sang DLQ
        channel.nack(msg, false, false);
        console.log("➡️ Sent to DLQ");
      }
    }, {
      noAck: false // Tắt auto-ack để kiểm soát thủ công
    });

  } catch (err) {
    console.error("❌ Connection failed, retrying in 5s...", err.message);
    setTimeout(connectWithRetry, 5000);
  }
}

connectWithRetry();