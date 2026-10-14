import { useState, useEffect, useCallback } from "react"
import { trackingApiService, pricingService, urlParserService } from "../services"
import { OrderDetailData } from "../types"

export interface SlotItemState {
  itemId: string | null
  input: string
  expanded: boolean
  active: boolean
  variant: string
  variantOptions: any[]
  targetPrice: string
  productName: string
  productPrice: string
  previewName: string
  previewPrice: string
  basePrice: number
  originalPrice: number
  voucherPrice: number | null
  imageUrl: string | null
  affiliateUrl: string | null
  previewLoading: boolean
  sending: boolean
  lastChecked: string
  status: string
  advice: string
}

const createInitialSlotState = (defaultName = ""): SlotItemState => ({
  itemId: null,
  input: "",
  expanded: false,
  active: false,
  variant: "Tất cả phân loại (Mặc định)",
  variantOptions: [],
  targetPrice: "",
  productName: defaultName,
  productPrice: "",
  previewName: "",
  previewPrice: "",
  basePrice: 0,
  originalPrice: 0,
  voucherPrice: null,
  imageUrl: null,
  affiliateUrl: null,
  previewLoading: false,
  sending: false,
  lastChecked: "5 phút trước",
  status: "Đang rình giá",
  advice: "Giá vẫn neo cao, khuyên chưa nên mua vội",
})

export function useTrackingSlots(
  showToast: (title: string, msg: string, icon?: string) => void,
  onTargetHit?: (item: any, slotNum: number) => void
) {
  const [slot1, setSlot1] = useState<SlotItemState>(() => createInitialSlotState("Món 1 đang theo dõi"))
  const [slot2, setSlot2] = useState<SlotItemState>(() => createInitialSlotState("Món 2 đang theo dõi"))
  const [slot3, setSlot3] = useState<SlotItemState>(() => createInitialSlotState("Món 3 đang theo dõi"))

  const [slot2BubbleUnlocked, setSlot2BubbleUnlocked] = useState(false)
  const [slot3Unlocked, setSlot3Unlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dealping_slot3_unlocked") === "true"
    } catch {
      return false
    }
  })

  const [showBumpSheet, setShowBumpSheet] = useState(false)
  const [lastActiveSlot, setLastActiveSlot] = useState<number>(1)
  const [detailModalSlot, setDetailModalSlot] = useState<number | null>(null)

  const [hasEverTracked, setHasEverTracked] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem("dealping_has_tracked") === "true" ||
        (Boolean(localStorage.getItem("dealping_tracked_items")) &&
          JSON.parse(localStorage.getItem("dealping_tracked_items") || "[]").length > 0)
      )
    } catch {
      return false
    }
  })

  // Restore saved items on mount
  useEffect(() => {
    async function loadSavedItems() {
      const items = await trackingApiService.fetchTrackingItems()
      if (items.length > 0) {
        setHasEverTracked(true)
        try {
          localStorage.setItem("dealping_has_tracked", "true")
        } catch {}

        if (items[0]) {
          setSlot1((prev) => ({
            ...prev,
            itemId: items[0].id,
            input: items[0].shopeeUrl || items[0].productUrl || items[0].url || "",
            productName: items[0].productName || "Món 1 đang theo dõi",
            productPrice: items[0].targetPrice ? pricingService.formatVND(items[0].targetPrice) : "",
            targetPrice: items[0].targetPrice ? pricingService.formatInputNumber(items[0].targetPrice) : "",
            basePrice: Number(items[0].originalPrice || 0),
            variant: items[0].variantName || prev.variant,
            imageUrl: items[0].imageUrl || null,
            lastChecked: items[0].lastCheckedAgo || items[0].lastCheckedText || prev.lastChecked,
            status: items[0].statusLabel || prev.status,
            advice: items[0].advice || prev.advice,
            active: true,
          }))
        }

        if (items[1]) {
          setSlot2((prev) => ({
            ...prev,
            itemId: items[1].id,
            input: items[1].shopeeUrl || items[1].productUrl || items[1].url || "",
            productName: items[1].productName || "Món 2 đang theo dõi",
            productPrice: items[1].targetPrice ? pricingService.formatVND(items[1].targetPrice) : "",
            targetPrice: items[1].targetPrice ? pricingService.formatInputNumber(items[1].targetPrice) : "",
            basePrice: Number(items[1].originalPrice || 0),
            variant: items[1].variantName || prev.variant,
            imageUrl: items[1].imageUrl || null,
            lastChecked: items[1].lastCheckedAgo || items[1].lastCheckedText || prev.lastChecked,
            status: items[1].statusLabel || prev.status,
            advice: items[1].advice || prev.advice,
            active: true,
          }))
          setSlot2BubbleUnlocked(true)
        }

        if (items[2]) {
          setSlot3((prev) => ({
            ...prev,
            itemId: items[2].id,
            input: items[2].shopeeUrl || items[2].productUrl || items[2].url || "",
            productName: items[2].productName || "Món 3 đang theo dõi",
            productPrice: items[2].targetPrice ? pricingService.formatVND(items[2].targetPrice) : "",
            targetPrice: items[2].targetPrice ? pricingService.formatInputNumber(items[2].targetPrice) : "",
            basePrice: Number(items[2].originalPrice || 0),
            variant: items[2].variantName || prev.variant,
            imageUrl: items[2].imageUrl || null,
            lastChecked: items[2].lastCheckedAgo || items[2].lastCheckedText || prev.lastChecked,
            status: items[2].statusLabel || prev.status,
            advice: items[2].advice || prev.advice,
            active: true,
          }))
          setSlot3Unlocked(true)
        }
      }
    }
    loadSavedItems()
  }, [])

  // Auto preview hook for a slot
  const setupPreviewEffect = (
    slot: SlotItemState,
    setSlot: React.Dispatch<React.SetStateAction<SlotItemState>>
  ) => {
    useEffect(() => {
      if (slot.input.length > 10 && slot.input.startsWith("http") && slot.expanded && !slot.active) {
        let isSubscribed = true
        setSlot((prev) => ({ ...prev, previewLoading: true }))

        trackingApiService
          .fetchPreview(slot.input)
          .then((data) => {
            if (isSubscribed) {
              const pName =
                data.productName &&
                !data.productName.includes("Không thể lấy") &&
                !data.productName.includes("Could not get")
                  ? data.productName
                  : urlParserService.extractCleanProductName(slot.input)

              const rawPrice = Number(data.price) || Number(data.currentPrice) || 0
              const origPrice = Number(data.originalPrice) || Number(data.original_price) || rawPrice
              const autoTarget = pricingService.calculateDefaultTarget(rawPrice, origPrice)

              let firstVariant = ""
              let variantOptions: any[] = []
              if (data.variants && Array.isArray(data.variants)) {
                variantOptions = data.variants
                if (variantOptions.length > 0) {
                  firstVariant =
                    typeof variantOptions[0] === "string"
                      ? variantOptions[0]
                      : variantOptions[0].name || variantOptions[0].value || variantOptions[0][0] || ""
                }
              }

              setSlot((prev) => ({
                ...prev,
                previewName: pName,
                basePrice: rawPrice,
                originalPrice: origPrice,
                previewPrice: pricingService.formatVND(rawPrice),
                voucherPrice: data.voucherPrice ? Number(data.voucherPrice) : null,
                imageUrl: data.imageUrl || prev.imageUrl,
                affiliateUrl: data.affiliateUrl || data.offerLink || prev.affiliateUrl,
                targetPrice: pricingService.formatInputNumber(autoTarget),
                variantOptions,
                variant: firstVariant || prev.variant,
                previewLoading: false,
              }))
            }
          })
          .catch(() => {
            if (isSubscribed) {
              setSlot((prev) => ({
                ...prev,
                previewName: urlParserService.extractCleanProductName(slot.input),
                basePrice: 0,
                originalPrice: 0,
                previewPrice: "",
                targetPrice: "",
                previewLoading: false,
              }))
            }
          })
        return () => {
          isSubscribed = false
        }
      }
    }, [slot.input, slot.expanded, slot.active])
  }

  setupPreviewEffect(slot1, setSlot1)
  setupPreviewEffect(slot2, setSlot2)
  setupPreviewEffect(slot3, setSlot3)

  // Input change
  const handleInputChange = (slotNum: number, v: string) => {
    setLastActiveSlot(slotNum)
    const updater = (prev: SlotItemState) => ({
      ...prev,
      input: v,
      expanded: v.length > 5,
    })
    if (slotNum === 1) setSlot1(updater)
    else if (slotNum === 2) setSlot2(updater)
    else setSlot3(updater)
  }

  // Target price change
  const handleTargetPriceChange = (slotNum: number, v: string) => {
    const updater = (prev: SlotItemState) => ({ ...prev, targetPrice: v })
    if (slotNum === 1) setSlot1(updater)
    else if (slotNum === 2) setSlot2(updater)
    else setSlot3(updater)
  }

  // Variant select
  const handleVariantSelect = (slotNum: number, v: string, price?: number) => {
    const updater = (prev: SlotItemState) => {
      let nextState = { ...prev, variant: v }
      if (price) {
        const autoTarget = pricingService.calculateDefaultTarget(price, prev.originalPrice || price)
        nextState = {
          ...nextState,
          previewPrice: pricingService.formatVND(price),
          basePrice: price,
          targetPrice: pricingService.formatInputNumber(autoTarget),
        }
      }
      return nextState
    }
    if (slotNum === 1) setSlot1(updater)
    else if (slotNum === 2) setSlot2(updater)
    else setSlot3(updater)
  }

  // Paste action
  const handlePaste = async (slotNum: number) => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        showToast("⚠️ Clipboard trống", "Hãy copy link sản phẩm trước.", "⚠️")
        return
      }
      setLastActiveSlot(slotNum)
      const cleanUrl = urlParserService.extractUrl(text)
      handleInputChange(slotNum, cleanUrl)
      showToast("✅ Đã dán link", "Link sản phẩm đã được nhận thành công.", "📋")
    } catch {
      showToast("⚠️ Không thể đọc clipboard", "Hãy click vào ô nhập rồi nhấn Ctrl + V.", "⚠️")
    }
  }

  // Activate tracking
  const handleActivate = async (slotNum: number) => {
    const slot = slotNum === 1 ? slot1 : slotNum === 2 ? slot2 : slot3
    const setSlot = slotNum === 1 ? setSlot1 : slotNum === 2 ? setSlot2 : setSlot3

    if (!slot.input.trim()) {
      showToast("⚠️ Chưa có link", "Hãy dán link sản phẩm trước!", "⚠️")
      return
    }

    setSlot((prev) => ({ ...prev, sending: true }))
    try {
      const result = await trackingApiService.sendToBackend(
        slot.input,
        pricingService.parseVND(slot.targetPrice),
        slot.variant,
        slot.previewName || undefined,
        slot.imageUrl || undefined
      )

      const resolvedName =
        result?.data?.productName ||
        result?.productName ||
        slot.previewName ||
        `Món ${slotNum} đang theo dõi`

      setSlot((prev) => ({
        ...prev,
        itemId: result?.data?.id || prev.itemId,
        productName: resolvedName,
        productPrice: prev.targetPrice,
        lastChecked: result?.data?.lastCheckedAgo || result?.data?.lastCheckedText || prev.lastChecked,
        status: result?.data?.statusLabel || prev.status,
        advice: result?.data?.advice || prev.advice,
        active: true,
        sending: false,
      }))

      setHasEverTracked(true)
      try {
        localStorage.setItem("dealping_has_tracked", "true")
      } catch {}

      if (slotNum === 1) {
        setShowBumpSheet(true)
      } else {
        showToast(`🎉 Đã bật theo dõi Món #${slotNum}!`, `Đang theo dõi: ${slot.variant}`, "🔔")
      }
    } catch (error) {
      setSlot((prev) => ({ ...prev, sending: false }))
      showToast(
        `❌ Lưu Món #${slotNum} thất bại`,
        error instanceof Error ? error.message : "Không kết nối được server.",
        "❌"
      )
    }
  }

  // Remove slot
  const handleRemove = (slotNum: number) => {
    const slot = slotNum === 1 ? slot1 : slotNum === 2 ? slot2 : slot3
    const setSlot = slotNum === 1 ? setSlot1 : slotNum === 2 ? setSlot2 : setSlot3

    if (slot.itemId) {
      trackingApiService.deleteFromBackend(slot.itemId)
    }

    setSlot(createInitialSlotState(`Món ${slotNum} đang theo dõi`))
    showToast(`🗑️ Đã xóa Món #${slotNum}`, `Ô #${slotNum} trống, dán link mới đi!`, "🗑️")
  }

  // Update target price in DB
  const handleUpdateTargetPriceInDb = useCallback(
    async (newPrice: number) => {
      const slotNum = detailModalSlot || 1
      handleTargetPriceChange(slotNum, pricingService.formatInputNumber(newPrice))

      const itemId = slotNum === 3 ? slot3.itemId : slotNum === 2 ? slot2.itemId : slot1.itemId
      if (itemId) {
        const ok = await trackingApiService.updateTargetPrice(itemId, newPrice)
        if (ok) {
          showToast(
            "💾 Đã lưu vào DB",
            `Giá mong muốn ${pricingService.formatVND(newPrice)} đã lưu vào Database!`,
            "✅"
          )
          return
        }
      }
      showToast("💾 Đã lưu giá mong muốn", `Giá: ${pricingService.formatVND(newPrice)}`, "🎯")
    },
    [detailModalSlot, slot1.itemId, slot2.itemId, slot3.itemId, showToast]
  )

  // Simulate drop in DB
  const handleSimulateDropInDb = useCallback(async () => {
    const slotNum = detailModalSlot || 1
    const slot = slotNum === 3 ? slot3 : slotNum === 2 ? slot2 : slot1
    const setSlot = slotNum === 3 ? setSlot3 : slotNum === 2 ? setSlot2 : setSlot1

    if (slot.itemId) {
      await trackingApiService.simulateDrop(slot.itemId)
      setSlot((prev) => ({
        ...prev,
        status: "Đã sập giá",
        advice: "Giá đã chạm đáy mục tiêu trong DB, nên mua ngay kẻo lỡ!",
      }))
    }

    if (onTargetHit) {
      onTargetHit(slot, slotNum)
    }

    setDetailModalSlot(null)
    showToast("🚨 ĐÃ SẬP GIÁ VÀO DB!", "Database đã chuyển sang TARGET_HIT và còi báo động đã hú!", "🔥")
  }, [detailModalSlot, slot1, slot2, slot3, onTargetHit, showToast])

  // Current detail modal data
  const currentDetailData: OrderDetailData | null = detailModalSlot
    ? {
        slotNum: detailModalSlot,
        itemId: detailModalSlot === 3 ? slot3.itemId : detailModalSlot === 2 ? slot2.itemId : slot1.itemId,
        productName:
          (detailModalSlot === 3
            ? slot3.productName || slot3.previewName
            : detailModalSlot === 2
              ? slot2.productName || slot2.previewName
              : slot1.productName || slot1.previewName) || "Sản phẩm đang theo dõi",
        productImage: detailModalSlot === 3 ? slot3.imageUrl : detailModalSlot === 2 ? slot2.imageUrl : slot1.imageUrl,
        productPrice:
          detailModalSlot === 3
            ? slot3.productPrice || slot3.previewPrice
            : detailModalSlot === 2
              ? slot2.productPrice || slot2.previewPrice
              : slot1.productPrice || slot1.previewPrice,
        targetPrice: detailModalSlot === 3 ? slot3.targetPrice : detailModalSlot === 2 ? slot2.targetPrice : slot1.targetPrice,
        basePrice: detailModalSlot === 3 ? slot3.basePrice : detailModalSlot === 2 ? slot2.basePrice : slot1.basePrice,
        voucherPrice: detailModalSlot === 3 ? slot3.voucherPrice : detailModalSlot === 2 ? slot2.voucherPrice : slot1.voucherPrice,
        variant: detailModalSlot === 3 ? slot3.variant : detailModalSlot === 2 ? slot2.variant : slot1.variant,
        url: detailModalSlot === 3 ? slot3.input : detailModalSlot === 2 ? slot2.input : slot1.input,
        affiliateUrl: detailModalSlot === 3 ? slot3.affiliateUrl : detailModalSlot === 2 ? slot2.affiliateUrl : slot1.affiliateUrl,
        status: "monitoring",
        statusLabel: detailModalSlot === 3 ? slot3.status : detailModalSlot === 2 ? slot2.status : slot1.status,
        lastCheckedText: detailModalSlot === 3 ? slot3.lastChecked : detailModalSlot === 2 ? slot2.lastChecked : slot1.lastChecked,
        advice: detailModalSlot === 3 ? slot3.advice : detailModalSlot === 2 ? slot2.advice : slot1.advice,
      }
    : null

  const activeCount = (slot1.active ? 1 : 0) + (slot2.active ? 1 : 0) + (slot3.active ? 1 : 0)

  return {
    slot1,
    slot2,
    slot3,
    slot2BubbleUnlocked,
    setSlot2BubbleUnlocked,
    slot3Unlocked,
    setSlot3Unlocked,
    showBumpSheet,
    setShowBumpSheet,
    lastActiveSlot,
    setLastActiveSlot,
    detailModalSlot,
    setDetailModalSlot,
    currentDetailData,
    hasEverTracked,
    setHasEverTracked,
    activeCount,
    handleInputChange,
    handleTargetPriceChange,
    handleVariantSelect,
    handlePaste,
    handleActivate,
    handleRemove,
    handleUpdateTargetPriceInDb,
    handleSimulateDropInDb,
  }
}
