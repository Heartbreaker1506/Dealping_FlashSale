import { API_URL, VAPID_PUBLIC_KEY } from "../constants"
import { urlParserService } from "./UrlParserService"

/**
 * TrackingApiService (OOP)
 * Encapsulates all backend HTTP communications, data synchronization, and fallback persistence.
 */
export class TrackingApiService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = API_URL.replace(/\/$/, "")
  }

  /**
   * Retrieves or initializes persistent UUID for user
   */
  public getUserId(): string {
    let userId = localStorage.getItem("dealping_user_id")
    if (!userId) {
      userId =
        crypto.randomUUID
          ? crypto.randomUUID()
          : "user-" + Math.random().toString(36).substring(2, 15)
      localStorage.setItem("dealping_user_id", userId)
    }
    return userId
  }

  /**
   * Saves a tracking item to the server with fallback to localhost and localStorage
   */
  public async sendToBackend(
    shopeeUrl: string,
    targetPrice: number,
    variantName: string,
    productName?: string,
    imageUrl?: string
  ): Promise<any> {
    const payload = {
      userId: this.getUserId(),
      shopeeUrl,
      targetPrice,
      variantName,
      productName,
      imageUrl,
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tracking-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.warn("Primary API URL failed to save, trying fallback / local:", err)
    }

    // Fallback 1: Local backend if dev is active
    if (!this.baseUrl.includes("localhost")) {
      try {
        const localRes = await fetch("http://localhost:3000/api/tracking-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (localRes.ok) {
          return await localRes.json()
        }
      } catch (e) {}
    }

    // Fallback 2: LocalStorage guarantee
    const fallbackId = "item-" + Date.now()
    try {
      const localItems = JSON.parse(
        localStorage.getItem("dealping_tracked_items") || "[]"
      )
      localItems.push({
        id: fallbackId,
        shopeeUrl,
        targetPrice,
        variantName,
        productName:
          productName || urlParserService.extractCleanProductName(shopeeUrl),
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem("dealping_tracked_items", JSON.stringify(localItems))
    } catch (e) {}

    return {
      status: "success",
      data: {
        id: fallbackId,
        productName:
          productName || urlParserService.extractCleanProductName(shopeeUrl),
        targetPrice,
        variantName,
      },
    }
  }

  /**
   * Deletes a tracking item by id
   */
  public async deleteFromBackend(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/tracking-items/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.getUserId() }),
      })
    } catch (error) {
      console.error("Lỗi khi xóa item trên server:", error)
    }
  }

  /**
   * Fetches product preview data (title, prices, images, variants)
   */
  public async fetchPreview(url: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tracking-items/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopeeUrl: url, url }),
      })
      if (response.ok) {
        const result = await response.json()
        if (
          result &&
          result.data &&
          result.data.productName &&
          !result.data.productName.includes("Không thể lấy") &&
          !result.data.productName.includes("Could not get")
        ) {
          return result.data
        }
      }
    } catch (e) {
      console.warn("Backend preview endpoint unavailable, using direct client fallback:", e)
    }

    const fallbackName = urlParserService.extractCleanProductName(url)
    return {
      productName: fallbackName,
      price: 0,
      currentPrice: 0,
      voucherPrice: null,
      imageUrl: null,
      affiliateUrl: url,
      variants: [],
    }
  }

  /**
   * Fetches all tracking items for the current user
   */
  public async fetchTrackingItems(): Promise<any[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/tracking-items?userId=${this.getUserId()}`
      )
      if (res.ok) {
        const data = await res.json()
        if (data && (data.status === "success" || data.success === true)) {
          return data.data || []
        }
        if (Array.isArray(data)) return data
        if (data && data.data && Array.isArray(data.data)) return data.data
      }
    } catch (err) {
      console.error("Lỗi tải tracking items:", err)
    }
    return []
  }

  /**
   * Fetches top sales deals for pitch/demo
   */
  public async fetchTopSalesDeals(): Promise<any[]> {
    try {
      const liveRes = await fetch(`${this.baseUrl}/api/deals/top-sales`)
      if (liveRes.ok) {
        const liveJson = await liveRes.json()
        if (
          liveJson &&
          Array.isArray(liveJson.data) &&
          liveJson.data.length > 0
        ) {
          return liveJson.data
        }
      }
    } catch (e) {}
    return []
  }

  /**
   * Fetches price history data for a specific item
   */
  public async fetchDealHistory(itemId: string): Promise<any> {
    try {
      const historyRes = await fetch(`${this.baseUrl}/api/deals/history/${itemId}`)
      if (historyRes.ok) {
        const historyJson = await historyRes.json()
        if (historyJson?.data?.labels?.length > 0) {
          return historyJson.data
        }
      }
    } catch (e) {}
    return null
  }

  /**
   * Sends user feedback & review
   */
  public async sendFeedback(
    rating: number,
    feedback: string,
    contact: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.getUserId(),
          rating,
          feedback: feedback.trim(),
          contact: contact.trim(),
        }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  /**
   * Updates target price for a tracked item
   */
  public async updateTargetPrice(id: string, newTargetPrice: number): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tracking-items/${id}/target-price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.getUserId(),
          targetPrice: newTargetPrice,
        }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  /**
   * Simulates a price drop for a tracked item on the backend
   */
  public async simulateDrop(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tracking-items/${id}/simulate-drop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.getUserId() }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  /**
   * Registers device push token
   */
  public async registerDeviceToken(pushToken: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/notifications/device-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.getUserId(),
          deviceToken: pushToken,
        }),
      })
    } catch (e) {
      console.warn("Chưa đăng ký được device token:", e)
    }
  }

  /**
   * Fetches historical price points for an item
   */
  public async fetchPriceHistory(itemId: string | number): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/api/deals/history/${itemId}`)
      if (res.ok) {
        const json = await res.json()
        return json?.data || null
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Helper to convert VAPID base64 to Uint8Array
   */
  public urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

export const trackingApiService = new TrackingApiService()
