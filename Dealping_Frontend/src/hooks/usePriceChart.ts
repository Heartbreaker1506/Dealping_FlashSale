import { useState, useEffect, useCallback } from "react"
import { ChartItem, View, SlotItemState } from "../types"
import { trackingApiService, chartService, pricingService } from "../services"

interface UsePriceChartProps {
  view: View
  slot1: SlotItemState
  slot2: SlotItemState
  slot3: SlotItemState
}

export function usePriceChart({
  view,
  slot1,
  slot2,
  slot3,
}: UsePriceChartProps) {
  const [analyzedCharts, setAnalyzedCharts] = useState<ChartItem[]>([])
  const [isChartLoading, setIsChartLoading] = useState(false)

  const fetchTrackedCharts = useCallback(async () => {
    setIsChartLoading(true)
    try {
      let items: any[] = []

      // 1. Lấy từ backend API danh sách đang theo dõi
      try {
        const apiItems = await trackingApiService.fetchTrackingItems()
        if (Array.isArray(apiItems)) {
          items = [...apiItems]
        }
      } catch (e) {
        console.warn("fetch tracking-items error:", e)
      }

      // 2. Lấy trực tiếp từ các ô Slot đang active trên giao diện Radar
      if (slot3.active && slot3.input) {
        items.unshift({
          shopeeUrl: slot3.input,
          url: slot3.input,
          productName:
            slot3.productName || slot3.previewName || "Sản phẩm Món #3",
          itemId: slot3.itemId,
          productPrice: slot3.previewPrice || slot3.productPrice,
          basePrice: slot3.basePrice,
          targetPrice: slot3.targetPrice,
          imageUrl: slot3.imageUrl,
        })
      }
      if (slot2.active && slot2.input) {
        items.unshift({
          shopeeUrl: slot2.input,
          url: slot2.input,
          productName:
            slot2.productName || slot2.previewName || "Sản phẩm Món #2",
          itemId: slot2.itemId,
          productPrice: slot2.previewPrice || slot2.productPrice,
          basePrice: slot2.basePrice,
          targetPrice: slot2.targetPrice,
          imageUrl: slot2.imageUrl,
        })
      }
      if (slot1.active && slot1.input) {
        items.unshift({
          shopeeUrl: slot1.input,
          url: slot1.input,
          productName:
            slot1.productName || slot1.previewName || "Sản phẩm Món #1",
          itemId: slot1.itemId,
          productPrice: slot1.previewPrice || slot1.productPrice,
          basePrice: slot1.basePrice,
          targetPrice: slot1.targetPrice,
          imageUrl: slot1.imageUrl,
        })
      }

      // Lọc trùng lặp theo URL
      const uniqueItems = items.filter(
        (v, i, a) =>
          a.findIndex(
            (t) =>
              (t.shopeeUrl || t.productUrl || t.url) ===
              (v.shopeeUrl || v.productUrl || v.url)
          ) === i
      )

      if (uniqueItems.length > 0) {
        const newCharts: ChartItem[] = []

        for (const item of uniqueItems) {
          const url = item.shopeeUrl || item.productUrl || item.url
          if (!url) continue

          let itemId = item.itemId
          let productName = item.productName || "Sản phẩm đang theo dõi"
          let currentPrice =
            pricingService.parseVND(item.productPrice) ||
            item.basePrice ||
            pricingService.parseVND(item.targetPrice) ||
            0

          // Nếu thiếu ID hoặc thiếu ảnh, cào preview bổ sung
          if (
            !itemId ||
            !currentPrice ||
            productName === "Pdp" ||
            (!item.imageUrl && !item.productImage)
          ) {
            try {
              const previewData = await trackingApiService.fetchPreview(url)
              if (previewData) {
                if (!itemId) itemId = previewData.itemId
                if (previewData.productName)
                  productName = previewData.productName
                if (previewData.price)
                  currentPrice =
                    pricingService.parseVND(previewData.price) || currentPrice
                if (previewData.imageUrl)
                  item.imageUrl = previewData.imageUrl
              }
            } catch (e) {}
          }

          let chartAdded = false
          if (itemId) {
            try {
              const history = await trackingApiService.fetchPriceHistory(itemId)
              if (history && history.labels && history.labels.length > 0) {
                const dataPoints = history.labels.map(
                  (lbl: string, i: number) => ({
                    date: lbl,
                    price: history.price[i],
                  })
                )
                const minPrice = Math.min(...history.price)
                const lastPrice = history.price[history.price.length - 1]

                newCharts.push({
                  id: String(itemId),
                  name: productName,
                  url,
                  imageUrl: item.imageUrl || item.productImage,
                  isBottom: lastPrice <= minPrice,
                  data: dataPoints,
                })
                chartAdded = true
              }
            } catch (e) {}
          }

          if (!chartAdded) {
            const base = currentPrice || 100000
            newCharts.push({
              id: itemId ? String(itemId) : Math.random().toString(),
              name: productName,
              url,
              imageUrl: item.imageUrl || item.productImage,
              isBottom: false,
              data: chartService.generateMockDayData(base),
            })
          }
        }

        setAnalyzedCharts(newCharts)
      } else {
        setAnalyzedCharts([])
      }
    } catch (e) {
      console.error("Lỗi lấy biểu đồ theo dõi:", e)
    } finally {
      setIsChartLoading(false)
    }
  }, [
    slot1.active,
    slot1.input,
    slot1.itemId,
    slot1.productName,
    slot1.previewName,
    slot1.previewPrice,
    slot1.productPrice,
    slot1.basePrice,
    slot1.imageUrl,
    slot2.active,
    slot2.input,
    slot2.itemId,
    slot2.productName,
    slot2.previewName,
    slot2.previewPrice,
    slot2.productPrice,
    slot2.basePrice,
    slot2.imageUrl,
    slot3.active,
    slot3.input,
    slot3.itemId,
    slot3.productName,
    slot3.previewName,
    slot3.previewPrice,
    slot3.productPrice,
    slot3.basePrice,
    slot3.imageUrl,
  ])

  useEffect(() => {
    if (view === "price_chart") {
      fetchTrackedCharts()
      const iv = setInterval(fetchTrackedCharts, 30 * 60 * 1000)
      return () => clearInterval(iv)
    }
  }, [view, fetchTrackedCharts])

  return {
    analyzedCharts,
    isChartLoading,
    fetchTrackedCharts,
  }
}
