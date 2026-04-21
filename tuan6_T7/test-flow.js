/**
 * KỊCH BẢN TEST TOÀN BỘ HỆ THỐNG MOVIE TICKET (EVENT-DRIVEN)
 * Luồng: 
 * 1. Đăng nhập (Lấy JWT)
 * 2. Lấy danh sách phim (Check Movie Service)
 * 3. Tạo Booking (Check Booking Service -> RabbitMQ -> Payment)
 * 4. Chờ 5 giây xử lý async.
 * 5. Kiểm tra lại trạng thái Booking (Check update thành công/thất bại)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8000/api';

async function runTest() {
    console.log('--- BẮT ĐẦU KIỂM TRA HỆ THỐNG ---');

    try {
        // 1. LOGIN
        console.log('\n[Bước 1] Đăng nhập với tài khoản mặc định (Alice)...');
        const loginRes = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'alice@example.com', password: '123456' })
        });
        
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
        
        const token = loginData.token;
        console.log('=> Đăng nhập thành công. Token đã nhận.');

        // 2. GET MOVIES
        console.log('\n[Bước 2] Lấy danh sách phim...');
        const movieRes = await fetch(`${BASE_URL}/movies`);
        const movies = await movieRes.json();
        console.log(`=> Tìm thấy ${movies.length} phim trong hệ thống.`);
        console.log(`=> Phim thử nghiệm: ${movies[0].title} (ID: ${movies[0].id})`);

        const targetMovie = movies[0];

        // 3. CREATE BOOKING
        console.log('\n[Bước 3] Tạo lệnh đặt vé (Booking)...');
        const bookingRes = await fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                movieId: targetMovie.id,
                quantity: 2,
                totalPrice: targetMovie.price * 2
            })
        });

        const booking = await bookingRes.json();
        console.log(`=> Đã tạo Booking thành công. ID: ${booking.id}, Status: ${booking.status}`);
        console.log('=> Đang chờ Payment Service & Broker xử lý sự kiện (5 giây)...');

        // 4. WAIT FOR EVENT PROCESSING
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 5. POLL FINAL STATUS
        console.log('\n[Bước 4] Kiểm tra trạng thái cuối cùng của Booking...');
        const statusRes = await fetch(`${BASE_URL}/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookingsList = await statusRes.json();
        const finalBooking = bookingsList.find(b => b.id === booking.id);

        if (finalBooking) {
            console.log(`=> KẾT QUẢ CUỐI CÙNG: Booking ID ${finalBooking.id} đã cập nhật thành: ${finalBooking.status}`);
            if (finalBooking.status === 'SUCCESS' || finalBooking.status === 'FAILED') {
                console.log('\n--- TEST THÀNH CÔNG: Luồng Event-Driven đã chạy thông suốt! ---');
            } else {
                console.log('\n--- TEST THẤT BẠI: Trạng thái vẫn là PENDING. Vui lòng kiểm tra RabbitMQ Logs. ---');
            }
        } else {
            console.log('=> Không tìm thấy booking vừa tạo.');
        }

    } catch (error) {
        console.error('\n[LỖI HỆ THỐNG]:', error.message);
        console.log('Đảm bảo bạn đã chạy "docker-compose up" và các service đã Ready.');
    }
}

runTest();
