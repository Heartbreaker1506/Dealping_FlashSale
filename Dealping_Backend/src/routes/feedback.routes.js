const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { sendFeedbackEmail, TARGET_EMAIL } = require("../services/mailService");

router.post("/", async (req, res) => {
  try {
    const { userId, rating, feedback, contact } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
    
    console.log(`[FEEDBACK] Nhận góp ý từ user ${userId || "guest"}:`, { rating, feedback, contact });
    
    // 1. Lưu bản ghi vào log file
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: userId || "guest",
      rating: rating || 5,
      feedback: feedback || "",
      contact: contact || "",
      clientIp
    }) + "\n";
    fs.appendFileSync(path.join(logDir, "feedback.jsonl"), logLine, "utf8");

    // 2. Gửi email thông báo về mail dealpingflashsale@gmail.com
    sendFeedbackEmail({
      userId: userId || "guest",
      rating: rating || 5,
      feedback: feedback || "",
      contact: contact || "",
      clientIp,
    }).catch((err) => {
      console.error("[FEEDBACK] Lỗi ngầm khi gửi email:", err.message);
    });

    res.json({
      success: true,
      message: "Cảm ơn bạn đã gửi góp ý quý báu!",
      unlockedSlot3: true,
      targetEmail: TARGET_EMAIL
    });
  } catch (err) {
    console.error("Lỗi lưu feedback:", err);
    res.json({ success: true, unlockedSlot3: true, targetEmail: TARGET_EMAIL });
  }
});

module.exports = router;
