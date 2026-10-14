const axios = require("axios");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Trích xuất ID sản phẩm TikTok từ URL hoặc itemId
 * Hỗ trợ các định dạng:
 * - https://shop.tiktok.com/vn/pdp/1737777179961755051
 * - https://shop.tiktok.com/view/product/1737777179961755051
 * - https://vt.tiktok.com/...
 * @param {string} url 
 * @param {string|number} itemId 
 * @returns {string|null}
 */
function extractProductId(url = "", itemId = null) {
  if (itemId) return itemId.toString();
  if (!url) return null;

  const match = url.match(/\/pdp\/(\d+)/) ||
                url.match(/\/product\/(\d+)/) ||
                url.match(/product_id=(\d+)/) ||
                url.match(/\/(\d{15,25})/);

  return match ? match[1] : null;
}

/**
 * Tạo chữ ký HMAC-SHA256 theo chuẩn TikTok Shop Open API (v202309+)
 * Quy tắc:
 * 1. Lọc bỏ 'sign' và 'access_token'
 * 2. Sắp xếp query params theo thứ tự alphabet
 * 3. Ghép key + value: key1value1key2value2...
 * 4. Ghép path + params + body (nếu có)
 * 5. Bọc appSecret ở đầu và cuối: appSecret + baseString + appSecret
 * 6. Tính HMAC-SHA256 với secret và xuất ra dạng hex
 * 
 * @param {string} path 
 * @param {Object} params 
 * @param {string|Object|null} body 
 * @param {string} appSecret 
 * @returns {string}
 */
function generateSignature(path, params, body, appSecret) {
  const filteredKeys = Object.keys(params)
    .filter(k => k !== "sign" && k !== "access_token")
    .sort();

  let queryStr = "";
  for (const k of filteredKeys) {
    queryStr += `${k}${params[k]}`;
  }

  let baseStr = `${path}${queryStr}`;
  if (body) {
    baseStr += typeof body === "string" ? body : JSON.stringify(body);
  }

  const signPayload = `${appSecret}${baseStr}${appSecret}`;
  return crypto.createHmac("sha256", appSecret).update(signPayload).digest("hex");
}

/**
 * Tạo URL ủy quyền TikTok Shop Partner cho Shop / Merchant
 * @param {string} redirectUri 
 * @returns {string}
 */
function getAuthorizationUrl(redirectUri = "") {
  const serviceId = process.env.TIKTOK_SERVICE_ID || "7696457359628142357";
  return `https://services.tiktokshop.com/open/authorize?service_id=${serviceId}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`;
}

/**
 * Đổi mã ủy quyền (authCode) lấy access_token chính thức
 * @param {string} authCode 
 * @returns {Promise<Object>}
 */
async function exchangeAuthCodeForToken(authCode) {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error("TIKTOK_APP_KEY hoặc TIKTOK_APP_SECRET chưa được cấu hình");
  }

  const tokenUrl = `https://auth.tiktok-shops.com/api/v2/token/get?app_key=${appKey}&app_secret=${appSecret}&auth_code=${authCode}&grant_type=authorized`;
  const response = await axios.get(tokenUrl, { timeout: 15000 });
  return response.data;
}

/**
 * Lấy giá và thông tin sản phẩm trực tiếp qua TikTok Shop Open API chính thức
 * @param {string} url - URL sản phẩm TikTok Shop
 * @param {string|number} itemId - Mã item (nếu có)
 * @returns {Promise<Object>}
 */
async function fetchCurrentPrice(url = "", itemId = null) {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN || "";

  if (!appKey || !appSecret) {
    console.error("[TikTok API Error] TIKTOK_APP_KEY hoặc TIKTOK_APP_SECRET chưa được cấu hình trong .env");
    return fallbackFromDbOrMock(url, itemId);
  }

  const productId = extractProductId(url, itemId);
  if (!productId) {
    console.warn("[TikTok API Warning] Không tìm thấy productId từ URL:", url);
    return fallbackFromDbOrMock(url, itemId);
  }

  try {
    const path = `/product/202309/products/${productId}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const queryParams = {
      app_key: appKey,
      timestamp: timestamp,
      locale: "vi-VN"
    };

    const sign = generateSignature(path, queryParams, null, appSecret);

    const queryString = Object.keys(queryParams)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join("&");

    const apiUrl = `https://open-api.tiktokglobalshop.com${path}?${queryString}&sign=${sign}`;

    const headers = {
      "Content-Type": "application/json"
    };
    if (accessToken) {
      headers["x-tts-access-token"] = accessToken;
    }

    const response = await axios.get(apiUrl, {
      headers,
      timeout: 15000
    });

    const resData = response.data;
    if (resData && (resData.code === 0 || resData.data)) {
      const product = resData.data || resData;

      const productName = product.title || product.product_name || "Sản phẩm TikTok Shop";
      
      let imageUrl = null;
      if (product.main_images && product.main_images.length > 0) {
        imageUrl = product.main_images[0].url_list?.[0] || product.main_images[0];
      } else if (product.images && product.images.length > 0) {
        imageUrl = product.images[0].url_list?.[0] || product.images[0];
      }

      // Xử lý các SKUs / Phân loại & Giá
      const rawSkus = product.skus || [];
      let lowestPrice = 0;
      let originalPrice = 0;
      let flashSalePrice = null;
      const variants = [];

      for (const sku of rawSkus) {
        const rawAmount = sku.price?.amount || sku.price?.sale_price || sku.price?.original_price || sku.price || 0;
        const pAmount = parseFloat(rawAmount);

        const rawOrig = sku.price?.original_price || sku.price?.list_price || pAmount;
        const origAmount = parseFloat(rawOrig);

        const rawSale = sku.sale_price || sku.price?.sale_price || pAmount;
        const saleAmount = parseFloat(rawSale);

        if (pAmount > 0 && (!lowestPrice || pAmount < lowestPrice)) {
          lowestPrice = pAmount;
          originalPrice = origAmount;
        }

        if (saleAmount > 0 && origAmount > saleAmount) {
          flashSalePrice = saleAmount;
        }

        variants.push({
          modelId: sku.id || sku.seller_sku,
          name: sku.seller_sku || sku.id || "Mẫu",
          price: pAmount,
          stock: sku.inventory?.[0]?.quantity || 0
        });
      }

      const finalPrice = flashSalePrice || lowestPrice || parseFloat(product.price) || 0;

      return {
        price: finalPrice,
        currentPrice: finalPrice,
        originalPrice: originalPrice || finalPrice,
        productName: productName,
        imageUrl: imageUrl || null,
        variants: variants,
        flashSalePrice: flashSalePrice || null,
        cashbackCommission: 0,
        discountCodes: [],
        isXtra: false,
        sellerComFinal: 0
      };
    } else {
      console.warn(`[TikTok API Responded with Code ${resData?.code}]:`, resData?.message);
    }
  } catch (err) {
    console.error(`[TikTok Open API Error] Lỗi khi gọi Open API cho productId ${productId}:`, err.response?.data || err.message);
  }

  // Fallback từ Database nếu có item đang theo dõi
  return fallbackFromDbOrMock(url, itemId);
}

/**
 * Cơ chế Fallback khi API chưa có token shop ủy quyền hoặc lỗi kết nối
 */
async function fallbackFromDbOrMock(url = "", itemId = null) {
  try {
    const existing = await prisma.trackingItem.findFirst({
      where: {
        platform: "TIKTOK",
        ...(url ? { productUrl: url } : {}),
        ...(itemId ? { itemId: BigInt(itemId) } : {})
      },
      orderBy: { createdAt: "desc" }
    });

    if (existing && existing.originalPrice) {
      const price = Number(existing.originalPrice) || 0;
      return {
        price: price,
        currentPrice: price,
        originalPrice: price,
        productName: existing.productName || "Sản phẩm TikTok Shop",
        imageUrl: existing.imageUrl || null,
        variants: [],
        flashSalePrice: null,
        cashbackCommission: 0,
        discountCodes: [],
        isXtra: false,
        sellerComFinal: 0
      };
    }
  } catch (dbErr) {
    console.error("[DB Fallback Error]:", dbErr.message);
  }

  return defaultFallback();
}

function defaultFallback() {
  return {
    price: 0,
    currentPrice: 0,
    originalPrice: 0,
    productName: "Không thể lấy tên sản phẩm",
    variants: [],
    flashSalePrice: null,
    cashbackCommission: 0,
    discountCodes: [],
    imageUrl: null,
    isXtra: false,
    sellerComFinal: 0
  };
}

module.exports = {
  fetchCurrentPrice,
  extractProductId,
  generateSignature,
  getAuthorizationUrl,
  exchangeAuthCodeForToken,
  defaultFallback
};
