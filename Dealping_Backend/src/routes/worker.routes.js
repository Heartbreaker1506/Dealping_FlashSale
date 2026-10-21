const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

// Hàng đợi các link Shopee đang chờ máy trạm Kiệt/Quân đọc DOM
// Lưu trong RAM để phản hồi siêu tốc độ (0.01 giây), không cần query DB nặng
const pendingQueue = [];
const processedVoucherCache = new Map(); // itemId -> { voucherPrice, capturedAt }

/**
 * 1. API cho Extension trên máy Kiệt/Quân hỏi việc (mỗi 3 giây)
 * GET /api/worker/pending-tasks
 */
router.get("/pending-tasks", (req, res) => {
  if (pendingQueue.length === 0) {
    return res.status(200).json({ task: null });
  }
  const task = pendingQueue.shift(); // Lấy task cũ nhất ra xử lý
  return res.status(200).json({ task });
});

/**
 * 2. API cho Extension trả về Giá Sau Voucher (244.072₫ / 29.000₫)
 * POST /api/worker/submit-price
 */
router.post("/submit-price", async (req, res) => {
  try {
    const { itemId, detectedPrice, productName, originalStrikePrice } = req.body;
    if (!itemId || !detectedPrice) {
      return res.status(400).json({ status: "error", message: "Thiếu itemId hoặc detectedPrice" });
    }

    const priceNum = Number(detectedPrice);

    // Lưu vào RAM Cache để Web App lấy ngay lập tức
    processedVoucherCache.set(itemId.toString(), {
      voucherPrice: priceNum,
      capturedAt: Date.now()
    });

    // Cập nhật hoặc lưu vào bảng ShopeeProductCache trong PostgreSQL của Quân
    try {
      await prisma.shopeeProductCache.upsert({
        where: { itemId: BigInt(itemId) },
        update: {
          price: priceNum,
          productName: productName || undefined,
          updatedAt: new Date()
        },
        create: {
          itemId: BigInt(itemId),
          price: priceNum,
          productName: productName || "Sản phẩm Shopee"
        }
      });
    } catch (dbErr) {
      console.warn("[Worker Submit] Cập nhật DB Cache cảnh báo:", dbErr.message);
    }

    console.log(`[Worker] ✅ Đã nhận Giá Sau Voucher từ máy trạm cho Item ${itemId}: ${priceNum.toLocaleString("vi-VN")}₫`);
    return res.status(200).json({ status: "success", received: true });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * Hàm helper dùng nội bộ trong trackingItems.service.js:
 * Khi khách dán link, kiểm tra xem đã có Giá Voucher chưa, nếu chưa có thì thêm vào Queue cho máy trạm
 */
function enqueueShopeeTask(itemId, url) {
  if (!itemId || !url) return;
  const idStr = itemId.toString();
  // Nếu đã có trong hàng đợi thì không thêm trùng
  const exists = pendingQueue.some(t => t.itemId === idStr);
  if (!exists) {
    pendingQueue.push({ itemId: idStr, url: url });
    // Giới hạn tối đa 50 link để tránh phình RAM
    if (pendingQueue.length > 50) pendingQueue.shift();
  }
}

function getCachedVoucherPrice(itemId) {
  if (!itemId) return null;
  const item = processedVoucherCache.get(itemId.toString());
  return item ? item.voucherPrice : null;
}

module.exports = {
  router,
  enqueueShopeeTask,
  getCachedVoucherPrice
};
