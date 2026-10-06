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
 * Xử lý khi có giá mới
 */
async function processPriceUpdate(item, currentPrice) {
  if (!currentPrice || currentPrice <= 0) return;

  // Lưu vào lịch sử giá
  await prisma.priceHistory.create({
    data: {
      trackingItemId: item.id,
      price: currentPrice,
    },
  });

  // So sánh giá với targetPrice
  if (currentPrice <= item.targetPrice.toNumber()) {
    await prisma.trackingItem.update({
      where: { id: item.id },
      data: { status: "TARGET_HIT" },
    });
    console.log(
      `[CRON] TING TING SẬP GIÁ: Sản phẩm ${
        item.productName || item.id
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
      `[CRON] Sản phẩm ${item.productName || item.id} giá hiện tại: ${currentPrice}, chưa đạt mục tiêu (${item.targetPrice.toNumber()}).`
    );
  }
}

/**
 * Bắt đầu các cron jobs để lấy giá tự động.
 */
function startCronJobs() {
  // Chạy mỗi 30 phút quét giá tự động các sản phẩm đang theo dõi
  cron.schedule("*/30 * * * *", async () => {
    console.log("[CRON] Bắt đầu quét giá các sản phẩm đang TRACKING...");
    try {
      const trackingItems = await prisma.trackingItem.findMany({
        where: { status: "TRACKING" },
        include: { user: true },
      });

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
            if (batchResults[itemIdStr]) {
               const itemData = batchResults[itemIdStr];
               let currentPrice = itemData.price;
               
               if (item.selectedModelId && itemData.variants && itemData.variants.length > 0) {
                 const selectedVariant = itemData.variants.find(
                   v => v.modelId && v.modelId.toString() === item.selectedModelId.toString()
                 );
                 if (selectedVariant && selectedVariant.price > 0) {
                   currentPrice = selectedVariant.price;
                 }
               }
               
               await processPriceUpdate(item, currentPrice);
            }
          }
        } catch (e) {
          console.error("[CRON] Lỗi khi gọi Shopee Batch API:", e.message);
        }
      }

      // 2. Xử lý TikTok và Lazada (như cũ)
      for (const item of otherItems) {
        try {
          let currentPrice = null;
          const url = item.productUrl; 

          if (item.platform === "SHOPEE") {
             // Trường hợp không có itemId thì dùng hàm cũ (thực tế rất hiếm)
             const shopeeInfo = await shopeePriceService.fetchCurrentPrice(null, null, url);
             currentPrice = shopeeInfo.price;
          } else if (item.platform === "TIKTOK") {
            const tiktokInfo = await tiktokPriceService.fetchCurrentPrice(url);
            currentPrice = tiktokInfo.price;
          } else if (item.platform === "LAZADA") {
            const lazadaInfo = await lazadaPriceService.fetchCurrentPrice(url);
            currentPrice = lazadaInfo.price;
          }

          await processPriceUpdate(item, currentPrice);
        } catch (error) {
          console.error(`[CRON] Lỗi khi quét giá cho sản phẩm ${item.id}:`, error.message);
        }
      }
      
      console.log("[CRON] Hoàn thành quét giá.");
    } catch (err) {
      console.error("[CRON] Lỗi chung khi chạy cron job quét giá:", err);
    }
  });

  console.log("[CRON] Đã thiết lập cron job quét giá mỗi 30 phút.");
}

module.exports = { startCronJobs };
