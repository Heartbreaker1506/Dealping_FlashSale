const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { parseProductLink, extractProductNameFromUrl } = require("./linkParser.service");
const shopeePriceService = require("./shopeePriceService");
const tiktokPriceService = require("./tiktokPriceService");
const lazadaPriceService = require("./lazadaPriceService");
const affiliateService = require("./affiliate.service");
const axios = require("axios");

/**
 * unlockedSlot2 = false -> tối đa 1 item
 * unlockedSlot2 = true  -> tối đa 2 item (hard cap theo yêu cầu)
 */
function getMaxSlots(user) {
  return user.unlockedSlot2 ? 2 : 1;
}

async function createTrackingItem({
  userId,
  shopeeUrl, // frontend vẫn gửi shopeeUrl hoặc productUrl
  productUrl,
  targetPrice,
  variantName,
  selectedModelId,
  productName: inputProductName,
  originalPrice: inputOriginalPrice,
}) {
  const finalUrl = shopeeUrl || productUrl;
  if (!userId || !finalUrl || targetPrice === undefined) {
    throw new ApiError(400, "Thiếu userId, productUrl hoặc targetPrice");
  }

  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    // Tự động tạo user tạm thời nếu chưa có để phục vụ việc test/guest
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `guest_${userId.substring(0, 8)}@dealping.com`,
      }
    });
  }

  const currentCount = await prisma.trackingItem.count({ where: { userId } });

  if (currentCount >= 2) {
    const oldestItem = await prisma.trackingItem.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    if (oldestItem) {
      await prisma.trackingItem.delete({ where: { id: oldestItem.id } });
    }
  }

  const { platform, itemId, shopId, resolvedUrl } = await parseProductLink(finalUrl);

  const existingWhere = itemId
    ? { userId, itemId: BigInt(itemId) }
    : { userId, productUrl: resolvedUrl };

  const existing = await prisma.trackingItem.findFirst({
    where: existingWhere,
  });
  
  if (existing) {
    const updated = await prisma.trackingItem.update({
      where: { id: existing.id },
      data: { targetPrice, variantName }
    });
    return serializeItem(updated);
  }

  let currentPrice = inputOriginalPrice || null;
  let productName = inputProductName?.trim() || null;
  let affiliateUrl = resolvedUrl;
  
  if (resolvedUrl.includes("shopee.vn")) {
    affiliateUrl = affiliateService.generateShopeeAffiliate(resolvedUrl);
  } else if (resolvedUrl.includes("tiktok.com")) {
    affiliateUrl = await affiliateService.generateTikTokAffiliate(resolvedUrl);
  } else if (resolvedUrl.includes("lazada.vn")) {
    affiliateUrl = await affiliateService.generateLazadaAffiliate(resolvedUrl);
  }

  let imageUrl = null;
  let voucherPrice = null;
  let variants = [];

  try {
    if (platform === "SHOPEE") {
      const priceInfo = await shopeePriceService.fetchCurrentPrice(itemId, shopId, resolvedUrl);
      if (!currentPrice && priceInfo.price > 0) currentPrice = priceInfo.price;
      if (!productName) productName = priceInfo.productName;
      imageUrl = priceInfo.imageUrl || null;
        variants = priceInfo.variants || [];
      variants = priceInfo.variants || [];
        // Use actual voucher/commission data from API only — no guessing
      if (priceInfo.isXtra && Number(priceInfo.sellerComFinal) > 0) {
        const voucherDiscount = Math.floor(Number(priceInfo.sellerComFinal) / 10000) * 10000;
        voucherPrice = voucherDiscount > 0 ? Number(priceInfo.price) - voucherDiscount : null;
      }
    } else if (platform === "TIKTOK") {
      const priceInfo = await tiktokPriceService.fetchCurrentPrice(resolvedUrl);
      if (!currentPrice && priceInfo.price > 0) currentPrice = priceInfo.price;
      if (!productName) productName = priceInfo.productName;
      if (priceInfo.imageUrl) imageUrl = priceInfo.imageUrl;
    } else if (platform === "LAZADA") {
      const priceInfo = await lazadaPriceService.fetchCurrentPrice(resolvedUrl);
      if (!currentPrice && priceInfo.price > 0) currentPrice = priceInfo.price;
      if (!productName) productName = priceInfo.productName;
      if (priceInfo.imageUrl) imageUrl = priceInfo.imageUrl;
    }
  } catch (err) {
    console.error("Error fetching price in create:", err.message);
  }

  if (!productName || productName === "Không thể lấy tên sản phẩm") {
    productName = extractProductNameFromUrl(resolvedUrl) || "Sản phẩm theo dõi";
  }

  const item = await prisma.trackingItem.create({
    data: {
      userId,
      productName,
      itemId: itemId ? BigInt(itemId) : null,
      shopId: shopId ? BigInt(shopId) : null,
      originalPrice: currentPrice,
      targetPrice,
      productUrl: resolvedUrl,
      platform: platform || "SHOPEE",
      affiliateUrl: affiliateUrl,
      status: "TRACKING",
      variantName,
      selectedModelId: selectedModelId ? BigInt(selectedModelId) : null,
    },
  });

  const serialized = serializeItem(item);
  serialized.imageUrl = imageUrl;
  serialized.voucherPrice = voucherPrice;
  serialized.affiliateUrl = affiliateUrl;
  return serialized;
}

async function listTrackingItems(userId) {
  if (!userId) throw new ApiError(400, "Thiếu userId");
  const items = await prisma.trackingItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return items.map(serializeItem);
}

async function deleteTrackingItem(id, userId) {
  const item = await prisma.trackingItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    throw new ApiError(404, "Không tìm thấy item để xoá");
  }
  await prisma.trackingItem.delete({ where: { id } });
}

function serializeItem(item) {
  return {
    ...item,
    itemId: item.itemId?.toString() ?? null,
    shopId: item.shopId?.toString() ?? null,
    selectedModelId: item.selectedModelId?.toString() ?? null,
  };
}

async function getTrackingItemHistory(id) {
  const item = await prisma.trackingItem.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, "Không tìm thấy item");
  }

  const history = await prisma.priceHistory.findMany({
    where: { trackingItemId: id },
    orderBy: { timestamp: "desc" },
  });

  return history;
}

async function getTrackingItemChartHistory(id) {
  const item = await prisma.trackingItem.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, "Không tìm thấy item");
  }

  if (item.platform === "SHOPEE" && item.itemId) {
    return await shopeePriceService.fetchPriceHistory(item.itemId.toString());
  }

  return { labels: [], price: [] };
}

async function listBatchTrackingItems(userId) {
  if (!userId) throw new ApiError(400, "Thiếu userId");
  
  const items = await prisma.trackingItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  
  if (items.length === 0) return [];
  
  // Lọc ra các item thuộc Shopee và có itemId
  const shopeeItemIds = items
    .filter(item => item.platform === "SHOPEE" && item.itemId)
    .map(item => item.itemId.toString());
    
  let batchPrices = {};
  if (shopeeItemIds.length > 0) {
    batchPrices = await shopeePriceService.fetchBatchPrices(shopeeItemIds);
  }
  
  return items.map(item => {
    const serialized = serializeItem(item);
    
    // Gắn thêm dữ liệu giá mới nhất nếu có
    if (item.platform === "SHOPEE" && item.itemId) {
      const liveData = batchPrices[item.itemId.toString()];
      if (liveData) {
        let livePrice = liveData.price;
        
        // Nếu item có chọn model cụ thể, lấy giá của model đó
        if (item.selectedModelId && liveData.variants && liveData.variants.length > 0) {
          const selectedVariant = liveData.variants.find(
            v => v.modelId && v.modelId.toString() === item.selectedModelId.toString()
          );
          if (selectedVariant && selectedVariant.price > 0) {
            livePrice = selectedVariant.price;
          }
        }
        
        serialized.livePrice = livePrice;
        serialized.liveProductName = liveData.productName;
        serialized.liveImageUrl = liveData.imageUrl;
      }
    }
    
    return serialized;
  });
}

async function previewTrackingItem(urlParams) {
  // urlParams có thể là shopeeUrl do FE gửi lên
  const finalUrl = urlParams;
  if (!finalUrl) throw new ApiError(400, "Thiếu đường dẫn sản phẩm");
  
  const { platform, itemId, shopId, resolvedUrl } = await parseProductLink(finalUrl);
  
  let productName = null;
  let currentPrice = null;
  let imageUrl = null;
  let voucherPrice = null;
  let variants = [];
  let affiliateUrl = resolvedUrl;

  if (resolvedUrl.includes("shopee.vn")) {
    affiliateUrl = affiliateService.generateShopeeAffiliate(resolvedUrl);
  } else if (resolvedUrl.includes("tiktok.com")) {
    affiliateUrl = await affiliateService.generateTikTokAffiliate(resolvedUrl);
  } else if (resolvedUrl.includes("lazada.vn")) {
    affiliateUrl = await affiliateService.generateLazadaAffiliate(resolvedUrl);
  }

  try {
    if (platform === "SHOPEE") {
      const priceInfo = await shopeePriceService.fetchCurrentPrice(itemId, shopId, resolvedUrl);
      currentPrice = priceInfo.price;
      productName = priceInfo.productName;
      imageUrl = priceInfo.imageUrl || null;
      variants = priceInfo.variants || [];
      // Use actual voucher/commission data from API only — no guessing
      if (priceInfo.isXtra && Number(priceInfo.sellerComFinal) > 0) {
        const voucherDiscount = Math.floor(Number(priceInfo.sellerComFinal) / 10000) * 10000;
        voucherPrice = voucherDiscount > 0 ? Number(priceInfo.price) - voucherDiscount : null;
      }
    } else if (platform === "TIKTOK") {
      const priceInfo = await tiktokPriceService.fetchCurrentPrice(resolvedUrl);
      currentPrice = priceInfo.price;
      productName = priceInfo.productName;
      if (priceInfo.imageUrl) imageUrl = priceInfo.imageUrl;
    } else if (platform === "LAZADA") {
      const priceInfo = await lazadaPriceService.fetchCurrentPrice(resolvedUrl);
      currentPrice = priceInfo.price;
      productName = priceInfo.productName;
      if (priceInfo.imageUrl) imageUrl = priceInfo.imageUrl;
    }
  } catch (err) {
    console.error("Preview error:", err.message);
  }

  if (!productName || productName === "Không thể lấy tên sản phẩm") {
    productName = extractProductNameFromUrl(resolvedUrl) || "Sản phẩm theo dõi";
  }

  return {
    productName,
    currentPrice,
    price: currentPrice,
    resolvedUrl,
    platform,
    variants,
    imageUrl,
    voucherPrice,
    affiliateUrl,
    itemId: itemId ? itemId.toString() : null
  };
}

module.exports = {
  getMaxSlots,
  createTrackingItem,
  listTrackingItems,
  deleteTrackingItem,
  getTrackingItemHistory,
  previewTrackingItem,
  getTrackingItemChartHistory,
  listBatchTrackingItems,
};
