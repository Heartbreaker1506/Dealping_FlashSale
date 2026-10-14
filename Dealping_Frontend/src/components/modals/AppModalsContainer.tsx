import React from "react"
import {
  OrderDetailData,
  PriceDropData,
  SpotlightStep,
  SlotItemState,
} from "../../types"
import { soundService } from "../../services"
import { AppModals } from "./AppModals"

interface AppModalsContainerProps {
  // Order Detail Modal
  detailModalSlot: number | null
  setDetailModalSlot: (slot: number | null) => void
  currentDetailData: OrderDetailData | null
  slot1: SlotItemState
  slot2: SlotItemState
  slot3: SlotItemState
  handleRemove: (slotNum: number) => void
  handleUpdateTargetPriceInDb: (newPrice: number) => Promise<void>
  handleSimulateDropInDb: () => Promise<void>

  // Siren Alarm
  showAlarmModal: boolean
  setShowAlarmModal: (show: boolean) => void
  alarmData: PriceDropData | null
  triggerPriceDropAlarm: (data: PriceDropData) => void

  // Feedback
  showFeedbackModal: boolean
  setShowFeedbackModal: (show: boolean) => void
  feedbackRating: number
  setFeedbackRating: (rating: number) => void
  feedbackText: string
  setFeedbackText: (text: string) => void
  feedbackContact: string
  setFeedbackContact: (contact: string) => void
  isSendingFeedback: boolean
  handleSendFeedback: () => void

  // Slot 3 Unlocked Celebration Modal
  showSlot3Modal: boolean
  setShowSlot3Modal: (show: boolean) => void

  // Spotlight Tutorial
  spotlightStep: SpotlightStep
  setSpotlightStep: (step: SpotlightStep) => void
  finishTutorial: () => void
  slot1InputRef: React.RefObject<HTMLInputElement | null>
  phoneScreenRef: React.RefObject<HTMLDivElement | null>

  // Toast
  showToast: (title: string, msg: string, icon?: string) => void
}

export function AppModalsContainer({
  detailModalSlot,
  setDetailModalSlot,
  currentDetailData,
  slot1,
  slot2,
  slot3,
  handleRemove,
  handleUpdateTargetPriceInDb,
  handleSimulateDropInDb,
  showAlarmModal,
  setShowAlarmModal,
  alarmData,
  triggerPriceDropAlarm,
  showFeedbackModal,
  setShowFeedbackModal,
  feedbackRating,
  setFeedbackRating,
  feedbackText,
  setFeedbackText,
  feedbackContact,
  setFeedbackContact,
  isSendingFeedback,
  handleSendFeedback,
  showSlot3Modal,
  setShowSlot3Modal,
  spotlightStep,
  setSpotlightStep,
  finishTutorial,
  slot1InputRef,
  phoneScreenRef,
  showToast,
}: AppModalsContainerProps) {
  const getSlot = (slotNum: number | null) => {
    if (slotNum === 3) return slot3
    if (slotNum === 2) return slot2
    return slot1
  }

  const handleOpenStore = () => {
    const currentSlot = getSlot(detailModalSlot)
    let rawUrl =
      currentSlot.affiliateUrl || currentSlot.input || "https://shopee.vn"
    if (!rawUrl.startsWith("http")) rawUrl = `https://${rawUrl}`
    window.open(rawUrl, "_blank", "noopener,noreferrer")
    showToast(
      "🛍️ Đang mở sàn...",
      "Chuyển hướng đến sản phẩm để săn deal!",
      "⚡"
    )
  }

  const handleTriggerAlarm = () => {
    const currentSlot = getSlot(detailModalSlot)
    const chosenInput = currentSlot.input
    const isTikTok = chosenInput.toLowerCase().includes("tiktok")
    const isLazada =
      chosenInput.toLowerCase().includes("lazada") ||
      chosenInput.toLowerCase().includes("laz")
    const targetP =
      Number(currentSlot.targetPrice.replace(/\D/g, "")) || 350000

    triggerPriceDropAlarm({
      productName:
        currentSlot.productName ||
        currentSlot.previewName ||
        "Sản phẩm đang săn",
      oldPrice: currentSlot.basePrice || 500000,
      newPrice: targetP,
      flashSalePrice: targetP,
      imageUrl: currentSlot.imageUrl,
      affiliateUrl: currentSlot.affiliateUrl || currentSlot.input,
      slotNum: detailModalSlot || 1,
      platformBadge: isTikTok
        ? "TIKTOK SHOP - FLASH SALE"
        : isLazada
          ? "LAZADA - DEAL SẬP SÀN"
          : "SHOPEE MALL - GIÁ ĐÁY LỊCH SỬ",
      discountCodes: [],
    })
    setDetailModalSlot(null)
  }

  const handleRemoveFromDetail = () => {
    if (detailModalSlot) {
      handleRemove(detailModalSlot)
      setDetailModalSlot(null)
    }
  }

  const handleCopyLink = async () => {
    const currentSlot = getSlot(detailModalSlot)
    const linkToCopy = currentSlot.affiliateUrl || currentSlot.input || ""
    if (linkToCopy) {
      try {
        await navigator.clipboard.writeText(linkToCopy)
        showToast(
          "📋 Đã sao chép!",
          "Đã sao chép link sản phẩm vào clipboard.",
          "✨"
        )
      } catch {
        showToast("📋 Link sản phẩm", linkToCopy, "🔗")
      }
    }
  }

  const handleBuyNow = () => {
    if (alarmData) {
      const currentSlot = getSlot(alarmData.slotNum ?? null)
      let rawUrl =
        alarmData.affiliateUrl ||
        currentSlot.affiliateUrl ||
        currentSlot.input ||
        "https://shopee.vn"
      if (!rawUrl.startsWith("http")) rawUrl = `https://${rawUrl}`
      window.open(rawUrl, "_blank", "noopener,noreferrer")
      showToast(
        "🛍️ Đang chuyển hướng...",
        "Mở sàn Shopee/TikTok/Lazada để chốt deal!",
        "⚡"
      )
    }
    setShowAlarmModal(false)
  }

  return (
    <AppModals
      detailModalSlot={detailModalSlot}
      onCloseDetailModal={() => setDetailModalSlot(null)}
      currentDetailData={currentDetailData}
      onOpenStore={handleOpenStore}
      onTriggerAlarm={handleTriggerAlarm}
      onRemoveFromDetail={handleRemoveFromDetail}
      onCopyLink={handleCopyLink}
      onUpdateTargetPrice={handleUpdateTargetPriceInDb}
      onSimulateDrop={handleSimulateDropInDb}
      showFeedbackModal={showFeedbackModal}
      onCloseFeedbackModal={() => setShowFeedbackModal(false)}
      feedbackRating={feedbackRating}
      onRatingChange={setFeedbackRating}
      feedbackText={feedbackText}
      onFeedbackTextChange={setFeedbackText}
      feedbackContact={feedbackContact}
      onContactChange={setFeedbackContact}
      onSubmitFeedback={handleSendFeedback}
      isSendingFeedback={isSendingFeedback}
      showSlot3Modal={showSlot3Modal}
      onCloseSlot3Modal={() => setShowSlot3Modal(false)}
      showAlarmModal={showAlarmModal}
      alarmData={alarmData}
      onCloseAlarmModal={() => setShowAlarmModal(false)}
      onBuyNow={handleBuyNow}
      onReplayAlarm={() => soundService.playPriceDropAlarm()}
      spotlightStep={spotlightStep}
      slot1InputRef={slot1InputRef}
      phoneScreenRef={phoneScreenRef}
      onSpotlightNext={() => setSpotlightStep("radar")}
      onSpotlightDone={finishTutorial}
    />
  )
}
