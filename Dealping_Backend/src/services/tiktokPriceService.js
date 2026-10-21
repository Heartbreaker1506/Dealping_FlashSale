const axios = require("axios");
const cheerio = require("cheerio");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const FB_BOT_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

function parseVndNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val >= 1000 ? Math.round(val) : 0;
  const str = val.toString().trim();
  const dotMatch = str.match(/(\d{1,3}(?:\.\d{3})+)/);
  if (dotMatch) {
    const n = parseInt(dotMatch[1].replace(/\./g, ""), 10);
    if (n >= 1000) return n;
  }
  const clean = str.replace(/[^\d]/g, "");
  if (!clean) return 0;
  const num = parseInt(clean, 10);
  return num >= 1000 && num <= 500000000 ? num : 0;
}

/**
 * Bóc nhanh Tên sản phẩm, Ảnh và Product ID nằm ngay trong query string khi người dùng bấm "Sao chép liên kết" từ App TikTok (iOS/Android)
 * Ví dụ: ?og_info={"title":"PS5 .New 12 Tháng Máy Chơi Game","image":"https://..."}&ec_search_share_params={"product_id":"1731787119644477587"}
 */
function extractMetadataFromUrlParams(rawUrl = "") {
  const meta = { productId: null, title: null, imageUrl: null };
  if (!rawUrl) return meta;

  try {
    const parsed = new URL(rawUrl);

    // 1. Lấy title + image từ og_info (App TikTok luôn đính kèm khi copy link)
    const ogInfoRaw = parsed.searchParams.get("og_info");
    if (ogInfoRaw) {
      try {
        const ogObj = JSON.parse(ogInfoRaw);
        if (ogObj.title) {
          meta.title = ogObj.title.replace(/\+/g, " ").trim();
        }
        if (ogObj.image) {
          meta.imageUrl = ogObj.image.replace(/\\\//g, "/");
        }
      } catch (e) {}
    }

    // 2. Lấy product_id từ ec_search_share_params nếu có
    const shareParamsRaw = parsed.searchParams.get("ec_search_share_params");
    if (shareParamsRaw) {
      try {
        const shareObj = JSON.parse(shareParamsRaw);
        if (shareObj.product_id) {
          meta.productId = shareObj.product_id.toString();
        }
      } catch (e) {}
    }
  } catch (e) {}

  return meta;
}

/**
 * Trích xuất ID sản phẩm TikTok (15-25 chữ số) từ mọi định dạng URL
 */
function extractProductId(url = "", itemId = null) {
  if (itemId) return itemId.toString();
  if (!url) return null;

  const fromParams = extractMetadataFromUrlParams(url);
  if (fromParams.productId) return fromParams.productId;

  const match =
    url.match(/(?:pdp|product)\/(?:[^/?#]+\/)?(\d{15,25})/) ||
    url.match(/\/view\/product\/(\d{15,25})/) ||
    url.match(/product_id=(\d{15,25})/) ||
    url.match(/\/(\d{15,25})(?:[/?#]|$)/);

  return match ? match[1] : null;
}

/**
 * Giải mã dữ liệu từ cục JSON #__MODERN_ROUTER_DATA__ của TikTok Shop
 * Lấy đủ: Giá thực tế (real_price), Giá gốc (original_price), Tên, Ảnh HD 800x800, và Danh sách phân loại (SKUs)
 */
function extractFromModernRouterData(routerData) {
  const result = {
    productName: null,
    imageUrl: null,
    price: 0,
    originalPrice: 0,
    variants: []
  };

  if (!routerData || typeof routerData !== "object") return result;

  const walk = (obj) => {
    if (!obj || typeof obj !== "object") return;

    // Nhánh chuẩn nhất trên TikTok Shop PDP: component_data.product_info
    if (obj.product_info && obj.product_info.product_id) {
      const pInfo = obj.product_info;

      if (pInfo.title && !result.productName) {
        result.productName = pInfo.title.trim();
      }

      if (
        pInfo.images &&
        Array.isArray(pInfo.images) &&
        pInfo.images[0] &&
        pInfo.images[0].url_list &&
        pInfo.images[0].url_list[0] &&
        !result.imageUrl
      ) {
        result.imageUrl = pInfo.images[0].url_list[0];
      }

      if (pInfo.price) {
        const realP =
          parseVndNumber(pInfo.price.real_price) ||
          parseVndNumber(pInfo.price.min_sku_price);
        if (realP > 0 && !result.price) result.price = realP;

        const origP =
          parseVndNumber(pInfo.price.original_price) ||
          parseVndNumber(pInfo.price.max_sku_price);
        if (origP > 0 && !result.originalPrice) result.originalPrice = origP;
      }

      if (Array.isArray(pInfo.skus) && pInfo.skus.length > 0 && result.variants.length === 0) {
        result.variants = pInfo.skus
          .map((sku) => {
            const propNames = Array.isArray(sku.sku_sale_props)
              ? sku.sku_sale_props.map((p) => p.prop_value).filter(Boolean).join(" - ")
              : "Mặc định";
            const skuPrice =
              parseVndNumber(sku.price?.sale_price_decimal) ||
              parseVndNumber(sku.price?.sale_price_format) ||
              result.price;
            return {
              modelId: sku.sku_id,
              name: propNames || "Mặc định",
              price: skuPrice,
              stock: sku.stock ?? 10
            };
          })
          .filter((v) => v.price > 0);
      }
    }

    // Fallback đệ quy nếu TikTok đổi tên nhánh
    if (!result.price) {
      if (obj.real_price) {
        const p = parseVndNumber(obj.real_price);
        if (p > 0) result.price = p;
      } else if (obj.sale_price_decimal) {
        const p = parseVndNumber(obj.sale_price_decimal);
        if (p > 0) result.price = p;
      } else if (obj.sale_price_format) {
        const p = parseVndNumber(obj.sale_price_format);
        if (p > 0) result.price = p;
      }
    }

    for (const k in obj) {
      if (typeof obj[k] === "object") walk(obj[k]);
    }
  };

  walk(routerData);

  if (result.price > 0 && !result.originalPrice) {
    result.originalPrice = result.price;
  }

  return result;
}

/**
 * Cào trực tiếp trang sản phẩm TikTok Shop (Hỗ trợ cả link rút gọn vt.tiktok.com và link đầy đủ shop.tiktok.com)
 */
async function fetchFromHtml(url = "", productId = null, rawUrl = null) {
  let urlMeta = extractMetadataFromUrlParams(url);
  if ((!urlMeta.title || !urlMeta.imageUrl) && rawUrl) {
    const rawMeta = extractMetadataFromUrlParams(rawUrl);
    if (!urlMeta.title && rawMeta.title) urlMeta.title = rawMeta.title;
    if (!urlMeta.imageUrl && rawMeta.imageUrl) urlMeta.imageUrl = rawMeta.imageUrl;
    if (!urlMeta.productId && rawMeta.productId) urlMeta.productId = rawMeta.productId;
  }
  let resolvedPid = productId || urlMeta.productId || extractProductId(url) || (rawUrl ? extractProductId(rawUrl) : null);
  let finalUrl = url;

  try {
    // Bước 1: Nếu chưa có productId (ví dụ link rút gọn vt.tiktok.com/ZS...), đi theo Redirect để lấy URL đích
    if (!resolvedPid && url) {
      try {
        const redirectRes = await axios.get(url, {
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
          },
          timeout: 10000,
          maxRedirects: 5
        });
        finalUrl =
          (redirectRes.request &&
            redirectRes.request.res &&
            redirectRes.request.res.responseUrl) ||
          url;
        resolvedPid = extractProductId(finalUrl);
        const redirectedMeta = extractMetadataFromUrlParams(finalUrl);
        if (!urlMeta.title && redirectedMeta.title) urlMeta.title = redirectedMeta.title;
        if (!urlMeta.imageUrl && redirectedMeta.imageUrl) urlMeta.imageUrl = redirectedMeta.imageUrl;
      } catch (e) {}
    }

    // Bước 2: Gọi thẳng vào trang chuẩn https://shop.tiktok.com/vn/pdp/{productId} với BROWSER_UA
    // (TikTok Shop trả sẵn toàn bộ JSON __MODERN_ROUTER_DATA__ chứa giá, ảnh 800x800 và SKUs ở URL chuẩn này)
    const targetPdpUrl = resolvedPid
      ? `https://shop.tiktok.com/vn/pdp/${resolvedPid}`
      : finalUrl;

    let html = "";
    try {
      const pdpRes = await axios.get(targetPdpUrl, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
        },
        timeout: 12000,
        maxRedirects: 5
      });
      html = pdpRes.data;
    } catch (e) {
      // Dự phòng gọi bằng FB_BOT_UA nếu BROWSER_UA bị chặn
      const fbRes = await axios.get(url || targetPdpUrl, {
        headers: { "User-Agent": FB_BOT_UA },
        timeout: 10000,
        maxRedirects: 5
      });
      html = fbRes.data;
    }

    if (typeof html !== "string" || !html) return null;

    const $ = cheerio.load(html);
    let productName = urlMeta.title || "";
    let imageUrl = urlMeta.imageUrl || "";
    let price = 0;
    let originalPrice = 0;
    let variants = [];

    // 1. Bóc từ #__MODERN_ROUTER_DATA__ (Chính xác 100% với cấu trúc TikTok Shop 2026)
    const routerDataStr = $("#__MODERN_ROUTER_DATA__").text();
    if (routerDataStr) {
      try {
        const routerData = JSON.parse(routerDataStr);
        const extracted = extractFromModernRouterData(routerData);
        if (extracted.price > 0) price = extracted.price;
        if (extracted.originalPrice > 0) originalPrice = extracted.originalPrice;
        if (extracted.productName) productName = extracted.productName;
        if (extracted.imageUrl) imageUrl = extracted.imageUrl;
        if (extracted.variants.length > 0) variants = extracted.variants;
      } catch (e) {}
    }

    // 2. Dự phòng bóc trực tiếp từ thẻ HTML nếu JSON bị ẩn
    if (!price) {
      const domPriceMatch = html.match(
        /font-size:36px[^>]*>(\d{1,3}(?:\.\d{3})+)</
      );
      if (domPriceMatch && domPriceMatch[1]) {
        price = parseVndNumber(domPriceMatch[1]);
      }
    }

    if (!productName) {
      const h1Text = $("h1").first().text().trim();
      const ogTitle =
        $('meta[property="og:title"]').attr("content") || $("title").text();
      productName = (h1Text || ogTitle || "")
        .replace(/\s*-\s*TikTok Shop Vietnam.*$/i, "")
        .replace(/\s*\|\s*TikTok Shop.*$/i, "")
        .trim();
    }

    if (!imageUrl) {
      imageUrl =
        $('meta[property="og:image"]').attr("content") ||
        $("img[data-fmp='true']").attr("src") ||
        "";
    }

    // Nếu lấy được giá > 0 HOẶC có thông tin từ og_info URL
    if (price > 0 || productName) {
      return {
        price: price || 0,
        currentPrice: price || 0,
        originalPrice: originalPrice || price || 0,
        productName: productName || "Sản phẩm TikTok Shop",
        imageUrl: imageUrl || null,
        variants: variants,
        flashSalePrice: null,
        cashbackCommission: 0,
        discountCodes: [],
        isXtra: false,
        sellerComFinal: 0
      };
    }
  } catch (err) {
    console.error("[TikTok Scrape Error]:", err.message);
  }

  // Nếu bị tường lửa chặn hoàn toàn trên Cloud, vẫn trả về được Tên + Ảnh đã bóc từ og_info trên URL!
  if (urlMeta.title || urlMeta.imageUrl) {
    return {
      price: 0,
      currentPrice: 0,
      originalPrice: 0,
      productName: urlMeta.title || "Sản phẩm TikTok Shop",
      imageUrl: urlMeta.imageUrl || null,
      variants: [],
      flashSalePrice: null,
      cashbackCommission: 0,
      discountCodes: [],
      isXtra: false,
      sellerComFinal: 0
    };
  }

  return null;
}

async function fetchCurrentPrice(url = "", itemId = null, rawUrl = null) {
  const targetUrl = url || rawUrl || "";
  const productId = extractProductId(targetUrl, itemId) || (rawUrl ? extractProductId(rawUrl, itemId) : null);

  if (!targetUrl && !productId) {
    return defaultFallback();
  }

  // 1. Cào trực tiếp từ trang PDP TikTok Shop + Giải mã og_info URL
  const scrapeResult = await fetchFromHtml(targetUrl, productId, rawUrl);
  if (scrapeResult && (scrapeResult.price > 0 || scrapeResult.productName)) {
    return scrapeResult;
  }

  // 2. Fallback từ Database nếu có item đang theo dõi
  return fallbackFromDbOrMock(targetUrl, productId);
}

async function fallbackFromDbOrMock(url = "", itemId = null) {
  try {
    if (itemId || url) {
      const existing = await prisma.trackingItem.findFirst({
        where: {
          platform: "TIKTOK",
          OR: [
            ...(itemId ? [{ itemId: BigInt(itemId) }] : []),
            ...(url ? [{ productUrl: { contains: url.split("?")[0] } }] : [])
          ]
        },
        orderBy: { createdAt: "desc" }
      });

      if (existing && existing.originalPrice) {
        const cachedPrice = Number(existing.originalPrice);
        return {
          price: cachedPrice,
          currentPrice: cachedPrice,
          originalPrice: cachedPrice,
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
    }
  } catch (e) {}

  return defaultFallback();
}

function defaultFallback() {
  return {
    price: 0,
    currentPrice: 0,
    originalPrice: 0,
    productName: "Sản phẩm TikTok Shop",
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
  extractProductId
};
