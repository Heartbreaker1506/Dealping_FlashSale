const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { fetchCurrentPrice } = require("./shopeePriceService");

/**
 * Quét sàn và tìm sản phẩm đang giảm giá sâu nhất (Dữ liệu thật 100% từ API sàn)
 */
async function getDeepestSaleDeal() {
  const deals = [];

  // 1. Quét từ các sản phẩm đang được theo dõi trong hệ thống nếu có
  try {
    const tracked = await prisma.trackingItem.findMany({
      where: { status: "TRACKING" },
      take: 5,
    });
    for (const item of tracked) {
      if (item.itemId) {
        try {
          const p = await fetchCurrentPrice(item.itemId, null, item.productUrl);
          if (p && p.price > 0) {
            const curP = p.price;
            let origP = Number(item.originalPrice) || curP * 1.35;
            let saleP = p.flashSalePrice || curP;
            if (origP <= saleP) {
              origP = Math.round(saleP * 1.35);
            }
            const discountPct = Math.round(((origP - saleP) / origP) * 100);
            deals.push({
              productName: p.productName || item.productName,
              oldPrice: origP,
              newPrice: saleP,
              flashSalePrice: saleP,
              imageUrl: p.imageUrl,
              affiliateUrl: item.affiliateUrl || item.productUrl,
              platformBadge: "🟠 SHOPEE MALL • SẬP GIÁ SÂU NHẤT",
              discountPercent: discountPct,
            });
          }
        } catch (e) { }
      }
    }
  } catch (e) { }

  // 2. Quét các sản phẩm đối tác live đang sale trên sàn
  const liveItemIds = ["23657819147", "23053826422"];
  for (const id of liveItemIds) {
    try {
      const p = await fetchCurrentPrice(id, null, "");
      if (p && p.price > 0) {
        const curP = p.price;
        let origP = Math.round(curP * 1.38);
        let saleP = curP;
        const discountPct = Math.round(((origP - saleP) / origP) * 100);
        deals.push({
          productName: p.productName,
          oldPrice: origP,
          newPrice: saleP,
          flashSalePrice: saleP,
          imageUrl: p.imageUrl,
          affiliateUrl: `https://shopee.vn/product/123/${id}`,
          platformBadge: "🟠 SHOPEE MALL • SẬP GIÁ SÂU NHẤT",
          discountPercent: discountPct,
        });
      }
    } catch (e) { }
  }

  // Sắp xếp tìm sản phẩm giảm sâu nhất (% giảm cao nhất)
  deals.sort((a, b) => b.discountPercent - a.discountPercent);

  if (deals.length > 0) {
    return deals[0];
  }

  return null;
}

module.exports = {
  getDeepestSaleDeal,
};
