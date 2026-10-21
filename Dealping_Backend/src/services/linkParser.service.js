const axios = require("axios");
const ApiError = require("../utils/ApiError");

const SHORT_LINK_HOSTS = [
  "shp.ee",
  "vn.shp.ee",
  "s.shopee.vn",
  "vt.tiktok.com",
  "vm.tiktok.com",
  "s.lazada.vn",
  "shorten.asia"
];

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function isShortLink(url) {
  try {
    const { hostname } = new URL(url);
    return SHORT_LINK_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Phân giải link rút gọn (vt.tiktok.com, vm.tiktok.com, s.shopee.vn, s.lazada.vn)
 * Dừng ngay khi đã nhảy sang domain đích có chứa ID sản phẩm để không bị tường lửa chặn ở bước thứ 2.
 */
async function resolveShortLink(shortUrl, maxHops = 5) {
  let currentUrl = shortUrl;

  for (let hop = 0; hop < maxHops; hop++) {
    // Nếu URL hiện tại không còn là link rút gọn nữa -> dừng ngay và trả về luôn!
    if (hop > 0 && !isShortLink(currentUrl)) {
      return currentUrl;
    }

    try {
      const response = await axios.get(currentUrl, {
        maxRedirects: 0,
        timeout: 8000,
        validateStatus: (status) => status >= 200 && status < 400,
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
        }
      });

      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        currentUrl = response.headers.location.startsWith("http")
          ? response.headers.location
          : new URL(response.headers.location, currentUrl).toString();
        continue;
      }

      return currentUrl;
    } catch (err) {
      // Nếu lỗi xảy ra ở bước sau khi đã lấy được URL mới thì vẫn trả về currentUrl
      if (currentUrl !== shortUrl) return currentUrl;
      throw new ApiError(400, "Không thể phân giải link rút gọn này");
    }
  }

  return currentUrl;
}

/**
 * Trích xuất itemId + shopId từ link Shopee hoặc TikTok Shop
 */
function extractIdsFromLongUrl(longUrl) {
  if (!longUrl) return null;

  // 1. Shopee patterns
  const patternI = /-i\.(\d+)\.(\d+)(?:[/?#]|$)/;
  const patternProduct = /\/product\/(\d+)\/(\d+)/;
  const patternOpa = /\/opaanlp\/(\d+)\/(\d+)/;

  const shopeeMatch =
    longUrl.match(patternI) ||
    longUrl.match(patternProduct) ||
    longUrl.match(patternOpa);

  if (shopeeMatch) {
    const [, shopId, itemId] = shopeeMatch;
    return { shopId, itemId };
  }

  // 2. TikTok Shop patterns (15-25 chữ số)
  if (longUrl.includes("tiktok.com")) {
    const tiktokMatch =
      longUrl.match(/(?:pdp|product)\/(?:[^/?#]+\/)?(\d{15,25})/) ||
      longUrl.match(/\/view\/product\/(\d{15,25})/) ||
      longUrl.match(/product_id=(\d{15,25})/) ||
      longUrl.match(/\/(\d{15,25})(?:[/?#]|$)/);
    if (tiktokMatch) {
      return { shopId: null, itemId: tiktokMatch[1] };
    }
  }

  return null;
}

function extractProductNameFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const hostname = parsed.hostname;

    // 0. Nếu link TikTok có sẵn og_info={"title":"..."} trong URL query string
    const ogInfoRaw = parsed.searchParams.get("og_info");
    if (ogInfoRaw) {
      try {
        const ogObj = JSON.parse(ogInfoRaw);
        if (ogObj.title) {
          return ogObj.title.replace(/\+/g, " ").trim();
        }
      } catch {}
    }

    // 1. Shopee: /Ten-san-pham-i.shopId.itemId
    const shopeeMatch = pathname.match(/^\/(.+)-i\.\d+\.\d+/);
    if (shopeeMatch) {
      return decodeURIComponent(shopeeMatch[1])
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();
    }

    // 2. Lazada
    if (hostname.includes("lazada")) {
      const matchSlug =
        url.match(/\/products\/([^/?#]+?)-i\d+/) ||
        url.match(/\/products\/([^/?#]+?)(?:-s\d+)?(?:\.html|\?|$|#)/) ||
        url.match(/\/products\/([^/?#]+)/);
      if (matchSlug) {
        return decodeURIComponent(matchSlug[1])
          .replace(/-/g, " ")
          .trim()
          .replace(/\b([a-zA-Z])/g, (l) => l.toUpperCase());
      }
      return "Sản phẩm Lazada";
    }

    // 3. TikTok slug: /vn/pdp/ps5-new-12-thang-may-choi-game/1731787119644477587
    if (hostname.includes("tiktok")) {
      const slugMatch = pathname.match(/\/pdp\/([^/?#]+)\/\d{15,25}/);
      if (slugMatch && !/^\d+$/.test(slugMatch[1])) {
        return decodeURIComponent(slugMatch[1])
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
          .trim();
      }
      return "Sản phẩm TikTok Shop";
    }

    if (hostname.includes("shopee") || /shp\.ee/.test(hostname)) {
      return "Sản phẩm Shopee";
    }

    return null;
  } catch {
    return null;
  }
}

function identifyPlatform(hostname) {
  if (/shopee|shp\.ee/.test(hostname)) return "SHOPEE";
  if (/tiktok|shorten\.asia/.test(hostname)) return "TIKTOK";
  if (/lazada|s\.lazada\.vn/.test(hostname)) return "LAZADA";
  return null;
}

async function parseProductLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new ApiError(400, "URL không hợp lệ");
  }

  const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
  if (urlMatch) rawUrl = urlMatch[0];

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new ApiError(400, "URL không đúng định dạng");
  }

  const platform = identifyPlatform(url.hostname);

  if (!platform && !SHORT_LINK_HOSTS.includes(url.hostname)) {
    throw new ApiError(400, "Link không thuộc hệ thống Shopee, TikTok Shop hoặc Lazada");
  }

  const longUrl = isShortLink(rawUrl) ? await resolveShortLink(rawUrl) : rawUrl;
  const ids = extractIdsFromLongUrl(longUrl);
  const finalPlatform = identifyPlatform(new URL(longUrl).hostname) || platform;

  if (!ids && finalPlatform === "SHOPEE") {
    throw new ApiError(400, "Không trích xuất được itemId/shopId từ link Shopee này");
  }

  return {
    platform: finalPlatform,
    itemId: ids ? ids.itemId : null,
    shopId: ids ? ids.shopId : null,
    resolvedUrl: longUrl
  };
}

module.exports = {
  isShortLink,
  resolveShortLink,
  extractIdsFromLongUrl,
  extractProductNameFromUrl,
  parseProductLink,
  identifyPlatform
};
