const cron = require("node-cron");
const prisma = require("../config/prisma");
const shopeePriceService = require("./shopeePriceService");
const tiktokPriceService = require("./tiktokPriceService");
const lazadaPriceService = require("./lazadaPriceService");
const { notifyPriceDrop } = require("./notificationService");

/**
 * Chia mảng thành các chunk nhỏ hơn
 */
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Xử lý khi có giá mới hoặc khi bot rà soát giá xong
 */
async function processPriceUpdate(item, currentPrice) {
  const now = new Date();
  const hasValidPrice = Boolean(currentPrice && currentPrice > 0);
  const isTargetHit = Boolean(hasValidPrice && currentPrice <= item.targetPrice.toNumber());

  try {
    // Luôn cập nhật lastCheckedAt để chứng minh bot vừa quét thật
    await prisma.trackingItem.update({
      where: { id: item.id },
      data: {
        lastCheckedAt: now,
        ...(isTargetHit ? { status: "TARGET_HIT" } : {}),
        ...(hasValidPrice && !item.originalPrice ? { originalPrice: currentPrice } : {}),
      },
    });
  } catch (err) {
    console.error(`[CRON] Lỗi cập nhật lastCheckedAt cho item ${item.id}:`, err.message);
  }

  if (!hasValidPrice) return;

  // Lưu vào lịch sử giá
  try {
    await prisma.priceHistory.create({
      data: {
        trackingItemId: item.id,
        price: currentPrice,
        timestamp: now,
      },
    });
  } catch (err) {
    console.error(`[CRON] Lỗi lưu priceHistory cho item ${item.id}:`, err.message);
  }

  // So sánh giá với targetPrice
  if (isTargetHit) {
    console.log(
      `[CRON] 🎯 TING TING SẬP GIÁ: Sản phẩm ${item.productName || item.id
      } đã đạt giá mục tiêu (${currentPrice} <= ${item.targetPrice.toNumber()})!`
    );

    // Tạo thông báo sập giá in-app & gửi Push Notification
    try {
      await notifyPriceDrop({
        userId: item.userId,
        deviceToken: item.user ? item.user.deviceToken : null,
        trackingItemId: item.id,
        productName: item.productName || "Sản phẩm bạn đang theo dõi",
        productUrl: item.productUrl || "",
        oldPrice: item.originalPrice ? item.originalPrice.toNumber() : Math.round(currentPrice * 1.3),
        newPrice: currentPrice,
        targetPrice: item.targetPrice.toNumber(),
      });
      console.log(`[CRON] Đã ghi nhận thông báo sập giá cho user ${item.userId}`);
    } catch (notifyErr) {
      console.error(`[CRON] Lỗi khi tạo thông báo sập giá:`, notifyErr.message);
    }
  } else {
    console.log(
      `[CRON] 🔍 [Rình giá] Sản phẩm ${item.productName || item.id} giá: ${currentPrice}đ (Mục tiêu: ${item.targetPrice.toNumber()}đ). lastCheckedAt đã cập nhật.`
    );
  }
}

// Khóa chống quét chồng lấn (concurrency guard)
let isScanning = false;

/**
 * Hàm thực hiện 1 chu kỳ quét toàn bộ sản phẩm đang TRACKING
 */
async function runPriceCheckBot() {
  if (isScanning) {
    console.log("[CRON] Tiến trình quét giá trước đó vẫn đang chạy, bỏ qua chu kỳ này...");
    return;
  }
  isScanning = true;
  const startTime = Date.now();
  console.log(`[CRON] [${new Date().toISOString()}] Bắt đầu chu kỳ rà soát giá tự động...`);

  try {
    const trackingItems = await prisma.trackingItem.findMany({
      where: { status: "TRACKING" },
      include: { user: true },
    });

    if (trackingItems.length === 0) {
      console.log("[CRON] Không có sản phẩm nào đang ở trạng thái TRACKING.");
      return;
    }

    console.log(`[CRON] Đang rà soát ${trackingItems.length} sản phẩm theo dõi...`);

    // Phân tách Shopee và các nền tảng khác
    const shopeeItems = trackingItems.filter(item => item.platform === "SHOPEE" && item.itemId != null);
    const otherItems = trackingItems.filter(item => item.platform !== "SHOPEE" || item.itemId == null);

    // 1. Xử lý Shopee qua Batch API
    const shopeeChunks = chunkArray(shopeeItems, 100);
    for (const chunk of shopeeChunks) {
      const itemIds = chunk.map(i => i.itemId.toString());
      try {
        const batchResults = await shopeePriceService.fetchBatchPrices(itemIds);
        for (const item of chunk) {
          const itemIdStr = item.itemId.toString();
          const itemData = batchResults[itemIdStr];
          let currentPrice = itemData ? itemData.price : null;

          if (itemData && item.selectedModelId && itemData.variants && itemData.variants.length > 0) {
            const selectedVariant = itemData.variants.find(
              v => v.modelId && v.modelId.toString() === item.selectedModelId.toString()
            );
            if (selectedVariant && selectedVariant.price > 0) {
              currentPrice = selectedVariant.price;
            }
          }

          await processPriceUpdate(item, currentPrice);
        }
      } catch (e) {
        console.error("[CRON] Lỗi khi gọi Shopee Batch API:", e.message);
        // Vẫn cập nhật lastCheckedAt cho chunk để dữ liệu luôn mới
        for (const item of chunk) {
          await processPriceUpdate(item, null);
        }
      }
    }

    // 2. Xử lý TikTok và Lazada
    for (const item of otherItems) {
      let currentPrice = null;
      try {
        const url = item.productUrl;

        if (item.platform === "SHOPEE") {
          const shopeeInfo = await shopeePriceService.fetchCurrentPrice(null, null, url);
          currentPrice = shopeeInfo ? shopeeInfo.price : null;
        } else if (item.platform === "TIKTOK") {
          const tiktokInfo = await tiktokPriceService.fetchCurrentPrice(url);
          currentPrice = tiktokInfo ? tiktokInfo.price : null;
        } else if (item.platform === "LAZADA") {
          const lazadaInfo = await lazadaPriceService.fetchCurrentPrice(url);
          currentPrice = lazadaInfo ? lazadaInfo.price : null;
        }
      } catch (error) {
        console.error(`[CRON] Lỗi khi quét giá cho sản phẩm ${item.id}:`, error.message);
      }

      await processPriceUpdate(item, currentPrice);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[CRON] Hoàn thành chu kỳ rà soát giá trong ${elapsed}s.`);
  } catch (err) {
    console.error("[CRON] Lỗi chung khi chạy cron job quét giá:", err);
  } finally {
    isScanning = false;
  }
}

/**
 * Bắt đầu các cron jobs để lấy giá tự động.
 */
function startCronJobs() {
  // Chu kỳ quét tự động: Mặc định mỗi 10 phút (hoặc cấu hình qua biến môi trường CRON_SCHEDULE)
  const cronSchedule = process.env.CRON_SCHEDULE || "*/10 * * * *";

  cron.schedule(cronSchedule, runPriceCheckBot);
  console.log(`[CRON] Đã thiết lập cron job quét giá tự động (mỗi 10 phút: ${cronSchedule}).`);

  // Kích hoạt 1 lượt quét ngay khi server khởi động (delay 3s để hoàn tất khởi động)
  setTimeout(() => {
    console.log("[CRON] Chạy lượt quét khởi động ban đầu để làm mới lastCheckedAt...");
    runPriceCheckBot().catch(err => console.error("[CRON] Lỗi quét khởi động:", err));
  }, 3000);
}

module.exports = { startCronJobs, runPriceCheckBot };
