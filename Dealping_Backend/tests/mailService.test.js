const test = require("node:test");
const assert = require("node:assert/strict");
const { sendFeedbackEmail, TARGET_EMAIL } = require("../src/services/mailService");

test("mailService TARGET_EMAIL mặc định là dealpingflashsale@gmail.com", () => {
  assert.equal(TARGET_EMAIL, "dealpingflashsale@gmail.com");
});

test("mailService xử lý an toàn và không gây crash khi chưa có SMTP_PASS", async () => {
  const result = await sendFeedbackEmail({
    userId: "test-user-unit",
    rating: 5,
    feedback: "Trải nghiệm rất tốt!",
    contact: "0988888888",
  });

  assert.equal(typeof result, "object");
  assert.equal(result.target, "dealpingflashsale@gmail.com");
  // Khi chưa có App Password, hệ thống an toàn trả về sent: false
  assert.equal(result.sent, false);
});
