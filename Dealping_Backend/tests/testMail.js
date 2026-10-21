require("dotenv").config();
const { sendFeedbackEmail, TARGET_EMAIL } = require("../src/services/mailService");

async function main() {
  console.log(`\n📧 ĐANG KIỂM TRA KẾT NỐI VÀ GỬI EMAIL THỬ NGHIỆM...`);
  console.log(`- Người nhận: ${TARGET_EMAIL}`);
  console.log(`- Tài khoản gửi (SMTP_USER): ${process.env.SMTP_USER || "Chưa điền"}`);
  console.log(`- Mật khẩu ứng dụng (SMTP_PASS): ${process.env.SMTP_PASS ? "Đã điền (" + process.env.SMTP_PASS.length + " ký tự)" : "CHƯA ĐIỀN (Đang để trống)"}\n`);

  if (!process.env.SMTP_PASS) {
    console.log("❌ CHƯA THỂ GỬI: Biến SMTP_PASS trong file .env đang để trống.");
    console.log("👉 Vui lòng điền Mật khẩu ứng dụng 16 ký tự của Google vào file .env rồi chạy lại lệnh này!");
    process.exit(1);
  }

  const result = await sendFeedbackEmail({
    userId: "test-system-check",
    rating: 5,
    feedback: "Thử nghiệm gửi email góp ý tự động từ DealPing!",
    contact: "dealpingflashsale@gmail.com",
    clientIp: "127.0.0.1",
  });

  if (result.sent) {
    console.log("\n🎉 CHÚC MỪNG: Email đã được gửi thành công vào hộp thư Gmail của bạn!");
    console.log(`Message ID: ${result.messageId}`);
  } else {
    console.log("\n❌ GỬI THẤT BẠI:");
    console.log(`Lý do: ${result.error || result.reason}`);
    if (result.error && result.error.includes("Invalid login")) {
      console.log("👉 Google báo lỗi: 'Invalid login'. Mật khẩu ứng dụng 16 ký tự chưa đúng hoặc chưa bật Xác minh 2 bước trên Gmail!");
    }
  }
}

main().catch(console.error);
