const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = 'abcdewrgfdgsf';
const REFRESH_TOKEN_SECRET = 'cxlmjclamllks';

// Giả lập Database User
const userDB = {
      id: 1,
      username: 'developer_pro',
      role: 'admin'
};

// 1. Tạo cặp Token
function generateTokens(payload) {
      // Access Token: Sống ngắn (2 giây để demo)
      const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '2s' });

      // Refresh Token: Sống lâu (7 ngày)
      const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

      return { accessToken, refreshToken };
}

// 2. Middleware giả lập xác thực AccessToken
function verifyAccessToken(token) {
      try {
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
            return { valid: true, data: decoded };
      } catch (error) {
            return { valid: false, error: error.message }; // "jwt expired" hoặc "invalid signature"
      }
}

// 3. Cơ chế cấp lại token (Refresh Flow)
function refreshMyToken(refreshTokenInput) {
      try {
            // Kiểm tra xem Refresh Token có hợp lệ không
            const decoded = jwt.verify(refreshTokenInput, REFRESH_TOKEN_SECRET);

            // *Lưu ý: Trong thực tế, bước này cần check trong DB/Redis xem refreshToken này có bị thu hồi (revoke) chưa*

            // Tạo lại payload (loại bỏ iat, exp cũ)
            const newPayload = { id: decoded.id, username: decoded.username, role: decoded.role };

            // Cấp cặp token mới
            return generateTokens(newPayload);
      } catch (error) {
            return null; // Refresh token cũng hết hạn hoặc sai -> Bắt buộc login lại
      }
}

async function runDemo() {
      console.log("--- BƯỚC 1: USER ĐĂNG NHẬP ---");
      // Payload chỉ nên chứa thông tin định danh, KHÔNG chứa mật khẩu
      const payload = { id: userDB.id, username: userDB.username, role: userDB.role };

      let currentTokens = generateTokens(payload);
      console.log(">> Server trả về AccessToken (hết hạn sau 2s):", currentTokens.accessToken.substring(0, 20) + "...");
      console.log(">> Server trả về RefreshToken (hết hạn sau 7d):", currentTokens.refreshToken.substring(0, 20) + "...");

      console.log("\n --- BƯỚC 2: USER GỌI API NGAY LẬP TỨC ---");
      const check1 = verifyAccessToken(currentTokens.accessToken);
      if (check1.valid) {
            console.log(" Request thành công! Chào mừng:", check1.data.username);
      } else {
            console.log(" Request thất bại:", check1.error);
      }

      console.log("\n... Đang chờ 3 giây để AccessToken hết hạn ...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log("\n --- BƯỚC 3: USER GỌI API SAU KHI HẾT HẠN ---");
      const check2 = verifyAccessToken(currentTokens.accessToken);
      if (check2.valid) {
            console.log(" Request thành công!");
      } else {
            console.log("Request thất bại với lỗi:", check2.error.toUpperCase());
            console.log("=> Client phát hiện lỗi 'JWT EXPIRED', tự động kích hoạt cơ chế Refresh Token.");
      }

      console.log("\n --- BƯỚC 4: SỬ DỤNG REFRESH TOKEN ĐỂ LẤY TOKEN MỚI ---");
      const newTokens = refreshMyToken(currentTokens.refreshToken);

      if (newTokens) {
            currentTokens = newTokens; // Cập nhật token mới
            console.log("Refresh thành công!");
            console.log(">> New AccessToken:", currentTokens.accessToken.substring(0, 20) + "...");

            // Thử gọi lại API
            const check3 = verifyAccessToken(currentTokens.accessToken);
            console.log(">> Thử gọi lại API với Token mới: ", check3.valid ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
      } else {
            console.log(" Refresh Token không hợp lệ. Vui lòng đăng nhập lại.");
      }
}

runDemo();