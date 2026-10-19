const nodemailer = require("nodemailer");

/**
 * Service xử lý gửi email thông báo hệ thống DealPing
 */

const TARGET_EMAIL = process.env.FEEDBACK_TO_EMAIL || "dealpingflashsale@gmail.com";

function createTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Nếu cấu hình SMTP tùy biến (như SendGrid, Mailgun, Hostinger...)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: { user, pass },
    });
  }

  // Mặc định kết nối Gmail SMTP
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * Gửi email góp ý từ người dùng tới dealpingflashsale@gmail.com
 * @param {Object} param0 
 * @param {string} param0.userId
 * @param {number} param0.rating
 * @param {string} param0.feedback
 * @param {string} param0.contact
 * @param {string} [param0.clientIp]
 */
async function sendFeedbackEmail({ userId, rating, feedback, contact, clientIp }) {
  const transporter = createTransporter();
  const timeFormatted = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });

  const starIcons = "⭐".repeat(Math.max(1, Math.min(5, Number(rating) || 5)));

  if (!transporter) {
    console.warn(
      `⚠️ [MAIL] Chưa cấu hình SMTP_USER & SMTP_PASS trong file .env!\n` +
      `   Feedback từ user ${userId || "guest"} vẫn được ghi nhận vào hệ thống & log.\n` +
      `   Để gửi trực tiếp tới ${TARGET_EMAIL}, vui lòng thêm SMTP_USER & SMTP_PASS vào .env.`
    );
    return {
      sent: false,
      reason: "SMTP_NOT_CONFIGURED",
      target: TARGET_EMAIL,
    };
  }

  const senderUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(251, 191, 36, 0.3); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { background: linear-gradient(135deg, #f59e0b, #ef4444, #9333ea); padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 24px; }
        .badge { display: inline-block; padding: 6px 14px; background: rgba(251, 191, 36, 0.15); border: 1px solid #fbbf24; border-radius: 9999px; color: #fbbf24; font-weight: 700; font-size: 14px; margin-bottom: 16px; }
        .feedback-box { background: #0f172a; border-left: 4px solid #fbbf24; padding: 16px; border-radius: 10px; margin: 16px 0; font-size: 15px; line-height: 1.6; color: #f8fafc; font-style: italic; white-space: pre-wrap; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        .info-table td { padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .info-table td.label { color: #94a3b8; font-weight: 600; width: 140px; }
        .info-table td.value { color: #f1f5f9; font-weight: 500; }
        .footer { padding: 16px 24px; background: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🚨 DEALPING FLASHSALE</h1>
          <p>Có góp ý / đánh giá mới từ người dùng ứng dụng</p>
        </div>
        <div class="body">
          <div class="badge">${starIcons} Đánh giá: ${rating || 5}/5 sao</div>
          
          <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 600;">Nội dung phản hồi:</p>
          <div class="feedback-box">"${feedback || "(Không có nội dung văn bản)"}"</div>
          
          <table class="info-table">
            <tr>
              <td class="label">📱 Liên hệ / SĐT / Email:</td>
              <td class="value"><strong>${contact || "Không để lại thông tin"}</strong></td>
            </tr>
            <tr>
              <td class="label">👤 User ID:</td>
              <td class="value"><code>${userId || "guest"}</code></td>
            </tr>
            <tr>
              <td class="label">⏰ Thời gian gửi:</td>
              <td class="value">${timeFormatted} (Giờ VN)</td>
            </tr>
            ${clientIp ? `<tr><td class="label">🌐 Địa chỉ IP:</td><td class="value">${clientIp}</td></tr>` : ""}
          </table>
        </div>
        <div class="footer">
          Email này được gửi tự động tới <b>${TARGET_EMAIL}</b> từ hệ thống DealPing FlashSale.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"DealPing FlashSale" <${senderUser}>`,
    to: TARGET_EMAIL,
    subject: `[DealPing Feedback] ${starIcons} Đánh giá mới từ ${contact ? contact : (userId ? userId.substring(0, 8) : "người dùng")}`,
    text: `[DEALPING FEEDBACK]\n\nĐánh giá: ${rating}/5 sao (${starIcons})\nNội dung: ${feedback}\nLiên hệ: ${contact || "Không có"}\nUser ID: ${userId || "guest"}\nThời gian: ${timeFormatted}\n`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [MAIL] Đã gửi email feedback thành công tới ${TARGET_EMAIL}:`, info.messageId);
    return { sent: true, messageId: info.messageId, target: TARGET_EMAIL };
  } catch (error) {
    console.error(`❌ [MAIL] Gặp lỗi khi gửi email feedback tới ${TARGET_EMAIL}:`, error.message);
    return { sent: false, error: error.message, target: TARGET_EMAIL };
  }
}

module.exports = {
  sendFeedbackEmail,
  TARGET_EMAIL,
};
