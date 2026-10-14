import { useState, useRef, useCallback } from "react"
import { PriceDropData } from "../types"
import { soundService, trackingApiService, pricingService } from "../services"
import { SlotItemState } from "./useTrackingSlots"

export function usePriceAlarm(
  showToast: (title: string, msg: string, icon?: string) => void
) {
  const [alarmLoading, setAlarmLoading] = useState(false)
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [alarmData, setAlarmData] = useState<PriceDropData | null>(null)
  const [pushNotification, setPushNotification] = useState<PriceDropData | null>(null)
  const [isAlarmFlashing, setIsAlarmFlashing] = useState(false)
  const pushNotificationTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const fireSystemNotification = (data: PriceDropData) => {
    if (!("Notification" in window)) return
    const title = "🚨 DEALPING: BÁO ĐỘNG SẬP GIÁ!"
    const savings = Math.max(
      0,
      Math.round((1 - data.newPrice / data.oldPrice) * 100)
    )
    const options: NotificationOptions & { renotify?: boolean } = {
      body: `${data.productName} vừa sập giá còn ${pricingService.formatVND(
        data.newPrice
      )} (-${savings}%)! Mua ngay kẻo hết!`,
      icon: data.imageUrl || "https://fav.farm/🚨",
      tag: `dealping-alarm-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
    }

    if (Notification.permission === "granted") {
      try {
        const n = new Notification(title, options)
        n.onclick = () => {
          window.focus()
          setShowAlarmModal(true)
        }
      } catch (e) {
        console.warn("Notification error:", e)
      }
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          try {
            const n = new Notification(title, options)
            n.onclick = () => {
              window.focus()
              setShowAlarmModal(true)
            }
          } catch (e) {}
        }
      })
    }
  }

  const triggerPriceDropAlarm = useCallback((data: PriceDropData) => {
    setAlarmData(data)
    setPushNotification(data)
    setShowAlarmModal(true)

    if (pushNotificationTimer.current) clearTimeout(pushNotificationTimer.current)
    pushNotificationTimer.current = setTimeout(() => {
      setPushNotification(null)
    }, 9000)

    setIsAlarmFlashing(true)
    soundService.playPriceDropAlarm()

    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400])
      } catch (e) {}
    }

    fireSystemNotification(data)

    setTimeout(() => {
      setIsAlarmFlashing(false)
    }, 4500)
  }, [])

  const handleTestAlarm = useCallback(
    async (slot1: SlotItemState, slot2: SlotItemState, lastActiveSlot: number) => {
      setAlarmLoading(true)

      const useSlot2 =
        (lastActiveSlot === 2 && (slot2.active || !!slot2.input)) ||
        (slot2.active && !slot1.active)
      const chosenSlotNum = useSlot2 ? 2 : 1
      const slot = useSlot2 ? slot2 : slot1

      const hasSpecificProduct = Boolean(
        (slot.active || !!slot.input) &&
          slot.productName &&
          !/could not get|không thể lấy|sản phẩm$/i.test(slot.productName.trim())
      )

      if (!hasSpecificProduct && !slot.input.trim()) {
        const dealsList = await trackingApiService.fetchTopSalesDeals()
        if (dealsList.length === 0) {
          setAlarmLoading(false)
          showToast(
            "⚠️ Không có deal",
            "Chưa có deal nào từ hệ thống. Hãy dán link sản phẩm vào ô theo dõi.",
            "📭"
          )
          return
        }

        const topDeal = dealsList[0]
        const oldP = topDeal.price || topDeal.currentPrice || 500000
        const newP = Math.round(oldP * 0.72)
        triggerPriceDropAlarm({
          productName: topDeal.productName || "Sản phẩm săn deal siêu hời",
          oldPrice: oldP,
          newPrice: newP,
          flashSalePrice: newP,
          imageUrl: topDeal.imageUrl || topDeal.image || null,
          affiliateUrl: topDeal.affiliateUrl || topDeal.url,
          slotNum: 1,
          platformBadge: "SHOPEE MALL • SIÊU SALE SẬP SÀN",
          discountCodes: ["GIAM28K", "FREESHIP"],
          timestamp: new Date().toISOString(),
        })
        setAlarmLoading(false)
        return
      }

      const isTikTok = slot.input.toLowerCase().includes("tiktok")
      const isLazada =
        slot.input.toLowerCase().includes("lazada") || slot.input.toLowerCase().includes("laz")

      const activeBadge = isTikTok
        ? "⚫ TIKTOK SHOP • DEAL CHẠM ĐÁY"
        : isLazada
          ? "🔵 LAZADA • FLASH SALE CHÍNH HÃNG"
          : "🟠 SHOPEE MALL • SIÊU SALE SẬP SÀN"

      const oldPrice =
        slot.basePrice > 0
          ? slot.basePrice
          : pricingService.parseVND(slot.previewPrice) > 0
            ? pricingService.parseVND(slot.previewPrice)
            : pricingService.parseVND(slot.targetPrice) > 0
              ? Math.round(pricingService.parseVND(slot.targetPrice) * 1.25)
              : 0

      const targetP = pricingService.parseVND(slot.targetPrice)
      const previewP = pricingService.parseVND(slot.previewPrice)
      const newPrice =
        targetP > 0 && targetP < oldPrice
          ? targetP
          : previewP > 0 && previewP < oldPrice
            ? previewP
            : oldPrice

      triggerPriceDropAlarm({
        productName: slot.productName || slot.previewName || "Sản phẩm đang săn deal",
        oldPrice,
        newPrice,
        flashSalePrice: newPrice,
        imageUrl: slot.imageUrl,
        affiliateUrl: slot.affiliateUrl || slot.input,
        slotNum: chosenSlotNum,
        cashbackCommission: 0,
        discountCodes: [],
        platformBadge: activeBadge,
        timestamp: new Date().toISOString(),
      })
      setAlarmLoading(false)
    },
    [triggerPriceDropAlarm, showToast]
  )

  const triggerAlarmFromSlot = useCallback(
    (item: SlotItemState, slotNum: number) => {
      const isTikTok = (item.input || "").toLowerCase().includes("tiktok")
      const isLazada =
        (item.input || "").toLowerCase().includes("lazada") ||
        (item.input || "").toLowerCase().includes("laz")
      const badge = isTikTok
        ? "TIKTOK SHOP - SẬP GIÁ"
        : isLazada
          ? "LAZADA - SẬP GIÁ"
          : "SHOPEE MALL - ĐÃ SẬP GIÁ VÀO DB"

      triggerPriceDropAlarm({
        productName: item.productName || item.previewName || "Sản phẩm săn deal",
        oldPrice: item.basePrice || 500000,
        newPrice: Number(item.targetPrice.replace(/\D/g, "")) || 350000,
        flashSalePrice: Number(item.targetPrice.replace(/\D/g, "")) || 350000,
        imageUrl: item.imageUrl,
        affiliateUrl: item.affiliateUrl || item.input,
        slotNum,
        platformBadge: badge,
        discountCodes: [],
      })
    },
    [triggerPriceDropAlarm]
  )

  return {
    alarmLoading,
    showAlarmModal,
    setShowAlarmModal,
    alarmData,
    pushNotification,
    setPushNotification,
    isAlarmFlashing,
    triggerPriceDropAlarm,
    triggerAlarmFromSlot,
    handleTestAlarm,
  }
}
