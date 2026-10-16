const axios = require("axios");
const cheerio = require("cheerio");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FB_BOT_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function hasPriceData(html) {
  return typeof html === 'string' && (html.includes('__MODERN_ROUTER_DATA__') || html.includes('SIGI_STATE'));
}

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
 * Lấy giá và thông tin sản phẩm TikTok theo thứ tự ưu tiên:
 * 1. TikTok Shop Open API chính thức (nếu đã cấu hình TIKTOK_APP_KEY / TIKTOK_APP_SECRET)
 * 2. Gọi trực tiếp HTML với User-Agent của Facebook Crawler (TikTok whitelist bot FB để tạo preview link
 *    => trả HTML tĩnh kèm JSON giá, không CAPTCHA). Nếu HTML rỗng, fallback gọi link PDP chuẩn với UA trình duyệt.
 * 3. Dữ liệu đã lưu trong DB (trackingItem)
 * @param {string} url - URL sản phẩm TikTok Shop
 * @param {string|number} itemId - Mã item (nếu có)
 * @returns {Promise<Object>}
 */
async function fetchCurrentPrice(url = "", itemId = null) {
  const productId = extractProductId(url, itemId);

  if (!url && !productId) {
    return defaultFallback();
  }

  // 1. Official Open API
  if (productId) {
    const apiResult = await fetchFromOpenApi(productId);
    if (apiResult) return apiResult;
  }

  // 2. Scrape HTML (Facebook Bot UA -> PDP Browser UA)
  const scrapeResult = await fetchFromHtml(url, productId);
  if (scrapeResult) return scrapeResult;

  // 3. Fallback từ Database nếu có item đang theo dõi
  return fallbackFromDbOrMock(url, itemId);
}

/**
 * Lấy giá trực tiếp qua TikTok Shop Open API chính thức
 * @param {string} productId 
 * @returns {Promise<Object|null>} null nếu không lấy được
 */
async function fetchFromOpenApi(productId) {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN || "";

  if (!appKey || !appSecret) {
    return null;
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

  return null;
}

/**
 * Lấy giá bằng cách tải HTML trực tiếp với User-Agent của Facebook Crawler (bỏ hoàn toàn Scrape.do).
 * Nếu bot FB chỉ nhận HTML rỗng -> gọi link PDP chuẩn shop.tiktok.com/vn/pdp/{id} với UA trình duyệt.
 * @param {string} url 
 * @param {string|null} productId 
 * @returns {Promise<Object|null>} null nếu không lấy được
 */
async function fetchFromHtml(url = "", productId = null) {
  try {
    let html = "";
    let finalUrl = url;

    if (url) {
      const fbRes = await axios.get(url, {
        headers: {
          'User-Agent': FB_BOT_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000,
        maxRedirects: 5 // Tự động nhảy qua link rút gọn vt.tiktok.com
      });
      html = fbRes.data;
      finalUrl = (fbRes.request && fbRes.request.res && fbRes.request.res.responseUrl) || url;
    }

    // Fallback (0đ): bot FB chỉ nhận HTML rỗng -> gọi link PDP chuẩn với UA trình duyệt
    if (!hasPriceData(html)) {
      const idMatch = `${finalUrl} ${url}`.match(/(?:pdp|product)\/(\d{10,})/);
      const pid = (idMatch && idMatch[1]) || productId;
      const pdpUrl = pid ? `https://shop.tiktok.com/vn/pdp/${pid}` : finalUrl;
      if (pdpUrl) {
        try {
          const { data } = await axios.get(pdpUrl, {
            headers: {
              'User-Agent': BROWSER_UA,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
            },
            timeout: 10000,
            maxRedirects: 5
          });
          if (hasPriceData(data)) html = data;
        } catch (fallbackErr) {
          console.error("[TikTok] Fallback PDP thất bại:", fallbackErr.message);
        }
      }
    }

    if (typeof html !== 'string' || !html) return null;

    const $ = cheerio.load(html);
    let productName = "";
    let price = 0;
    let imageUrl = "";

    // 1. Get Title and Image from Meta tags
    productName = $('meta[property="og:title"]').attr('content') || $('title').text();
    if (productName && productName.includes(" - TikTok Shop Vietnam")) {
      productName = productName.replace(" - TikTok Shop Vietnam", "");
    }
    imageUrl = $('meta[property="og:image"]').attr('content') || "";

    // 2. Extract Price from __MODERN_ROUTER_DATA__
    const routerDataStr = $('#__MODERN_ROUTER_DATA__').text();
    if (routerDataStr) {
      try {
        const routerData = JSON.parse(routerDataStr);
        let foundPrice = null;
        const findPriceInRouter = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          if (obj.real_price) { // "90.191₫"
            const clean = obj.real_price.toString().replace(/[^\d]/g, '');
            if (clean) {
              foundPrice = parseInt(clean, 10);
              return;
            }
          }
          if (obj.sale_price_format) {
            const clean = obj.sale_price_format.toString().replace(/[^\d]/g, '');
            if (clean) {
              foundPrice = parseInt(clean, 10);
              return;
            }
          }
          if (obj.price && obj.price.min_sku_price) {
            const clean = obj.price.min_sku_price.toString().replace(/[^\d]/g, '');
            if (clean) {
              foundPrice = parseInt(clean, 10);
              return;
            }
          }
          if (obj.sale_price_decimal) {
            foundPrice = parseFloat(obj.sale_price_decimal);
            return;
          }
          for (const k in obj) {
            if (foundPrice) return;
            if (typeof obj[k] === 'object') findPriceInRouter(obj[k]);
          }
        };
        findPriceInRouter(routerData);
        if (foundPrice) price = foundPrice;
      } catch (e) { }
    }

    // 3. Extract from SIGI_STATE (layout cũ)
    const sigiMatch = html.match(/id="SIGI_STATE"\>(.*?)\<\/script\>/);
    if (sigiMatch && sigiMatch[1]) {
      try {
        const state = JSON.parse(sigiMatch[1]);
        if (state.ProductModule) {
          const p = state.ProductModule;
          if (p.title) productName = p.title;
          if (p.price && p.price.realPrice) price = parseFloat(p.price.realPrice);
          if (p.images && p.images[0]) imageUrl = p.images[0];
        }
      } catch (e) { }
    }

    if (productName) {
      productName = productName.replace(/\| TikTok Shop$/, '').trim();
    }

    if (price > 0) {
      return {
        price: price,
        currentPrice: price,
        originalPrice: price,
        productName: productName || "Sản phẩm TikTok Shop",
        imageUrl: imageUrl || null,
        variants: [],
        flashSalePrice: null,
        cashbackCommission: 0,
        discountCodes: [],
        isXtra: false,
        sellerComFinal: 0
      };
    }
  } catch (err) {
    console.error("[TikTok Scrape Error] Lỗi khi lấy giá TikTok (Facebook Bot UA):", err.message);
  }

  return null;
}

/**
 * Cơ chế Fallback khi API chưa có token shop ủy quyền / scrape thất bại / lỗi kết nối
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
