/**
 * UrlParserService (OOP)
 * Encapsulates URL pattern extraction, cleaning, and platform identification (Shopee, TikTok, Lazada).
 */
export type ECommercePlatform = "shopee" | "tiktok" | "lazada" | "other"

export class UrlParserService {
  /**
   * Extracts the first HTTP/HTTPS URL from a raw text (e.g., from clipboard)
   */
  public extractUrl(text: string): string {
    if (!text) return ""
    const match = text.match(/https?:\/\/[^\s]+/i)
    return match ? match[0] : text.trim()
  }

  /**
   * Identifies ecommerce platform from URL
   */
  public detectPlatform(url: string): ECommercePlatform {
    if (!url) return "other"
    const lower = url.toLowerCase()
    if (lower.includes("shopee") || lower.includes("shp.ee")) return "shopee"
    if (lower.includes("tiktok")) return "tiktok"
    if (lower.includes("lazada") || lower.includes("laz.")) return "lazada"
    return "other"
  }

  /**
   * Extracts Shopee Item ID from various Shopee URL formats
   */
  public extractShopeeItemId(url: string): string | null {
    if (!url) return null
    const patternI = /-i\.(\d+)\.(\d+)/
    const matchI = url.match(patternI)
    if (matchI) return matchI[2]

    const patternProduct = /\/product\/(\d+)\/(\d+)/
    const matchProduct = url.match(patternProduct)
    if (matchProduct) return matchProduct[2]

    try {
      const urlObj = new URL(url)
      const params = urlObj.searchParams
      const itemId =
        params.get("fromItem") ||
        params.get("from_item") ||
        params.get("item_id") ||
        params.get("itemid") ||
        params.get("itemId") ||
        params.get("id")
      if (itemId && /^\d+$/.test(itemId)) return itemId

      for (const [, val] of params.entries()) {
        if (
          typeof val === "string" &&
          (val.includes("-i.") ||
            val.includes("/product/") ||
            val.includes("fromItem="))
        ) {
          const decoded = decodeURIComponent(val)
          const subId = this.extractShopeeItemId(decoded)
          if (subId) return subId
        }
      }
    } catch (e) {}

    return null
  }

  /**
   * Extracts a clean, human-readable product title directly from the URL slug
   */
  public extractCleanProductName(url: string): string {
    if (!url) return "Sản phẩm săn deal 24/7"
    try {
      const parsed = new URL(url)
      const pathname = parsed.pathname
      const hostname = parsed.hostname.toLowerCase()

      if (hostname.includes("shopee") || /shp\.ee/.test(hostname)) {
        const shopeeMatch = pathname.match(/^\/(.+)-i\.\d+\.\d+/)
        if (shopeeMatch) {
          return decodeURIComponent(shopeeMatch[1])
            .replace(/[-_+]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (l) => l.toUpperCase())
        }
        if (pathname.includes("flash_sale")) {
          const itemId = this.extractShopeeItemId(url)
          return itemId
            ? `Sản phẩm Flash Sale Shopee #${itemId.slice(-4)}`
            : "Sản phẩm Flash Sale Shopee"
        }
        const slug = pathname.replace(/^\/+|\/+$/g, "").split("/").pop()
        if (
          slug &&
          slug.length > 3 &&
          slug !== "product" &&
          !slug.includes("flash_sale")
        ) {
          return decodeURIComponent(slug)
            .replace(/[-_+]/g, " ")
            .trim()
            .replace(/\b\w/g, (l) => l.toUpperCase())
        }
        return "Sản phẩm Flash Sale Shopee"
      }

      if (hostname.includes("lazada")) {
        const matchSlug =
          url.match(/\/products\/([^/?#]+?)-i\d+/) ||
          url.match(/\/products\/([^/?#]+?)(?:-s\d+)?(?:\.html|\?|$|#)/) ||
          url.match(/\/products\/([^/?#]+)/)
        if (matchSlug) {
          return decodeURIComponent(matchSlug[1])
            .replace(/[-_+]/g, " ")
            .trim()
            .replace(/\b\w/g, (l) => l.toUpperCase())
        }
        return "Sản phẩm Lazada"
      }

      if (hostname.includes("tiktok")) {
        return "Sản phẩm TikTok Shop"
      }
    } catch (e) {}

    return "Sản phẩm săn deal 24/7"
  }
}

export const urlParserService = new UrlParserService()
