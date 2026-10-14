const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.post("/", async (req, res) => {
  try {
    const { userId, rating, feedback, contact } = req.body;
    console.log(`[FEEDBACK] Nhận góp ý từ user ${userId || "guest"}:`, { rating, feedback, contact });
    
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: userId || "guest",
      rating: rating || 5,
      feedback: feedback || "",
      contact: contact || ""
    }) + "\n";
    fs.appendFileSync(path.join(logDir, "feedback.jsonl"), logLine, "utf8");

    res.json({
      success: true,
      message: "Cảm ơn bạn đã gửi góp ý quý báu!",
      unlockedSlot3: true
    });
  } catch (err) {
    console.error("Lỗi lưu feedback:", err);
    res.json({ success: true, unlockedSlot3: true });
  }
});

module.exports = router;
