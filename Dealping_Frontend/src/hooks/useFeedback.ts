import { useState } from "react"
import { SlotItemState } from "../types"
import { trackingApiService } from "../services"

interface UseFeedbackProps {
  showToast: (title: string, msg: string, icon?: string) => void
  slot1: SlotItemState
  slot2: SlotItemState
  slot3: SlotItemState
  activeCount: number
  hasEverTracked: boolean
  wishlistItems: any[]
  onUnlockSlot3: () => void
}

export function useFeedback({
  showToast,
  slot1,
  slot2,
  slot3,
  activeCount,
  hasEverTracked,
  wishlistItems,
  onUnlockSlot3,
}: UseFeedbackProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showSlot3Modal, setShowSlot3Modal] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackContact, setFeedbackContact] = useState("")
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)

  const hasActiveTrack = Boolean(
    slot1.active || slot2.active || slot3.active || activeCount > 0
  )
  const hasTrackHistory = Boolean(
    hasEverTracked ||
      wishlistItems.length > 0 ||
      (typeof window !== "undefined" &&
        (localStorage.getItem("dealping_has_tracked") === "true" ||
          (localStorage.getItem("dealping_tracked_items") &&
            JSON.parse(
              localStorage.getItem("dealping_tracked_items") || "[]"
            ).length > 0)))
  )
  const canLeaveFeedback = Boolean(hasActiveTrack || hasTrackHistory)

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      showToast(
        "⚠️ Vui lòng nhập ý kiến",
        "Hãy chia sẻ 1 chút cảm nghĩ hoặc tính năng bạn muốn DealPing bổ sung nhé!",
        "✍️"
      )
      return
    }

    setIsSendingFeedback(true)
    await trackingApiService.sendFeedback(
      feedbackRating,
      feedbackText,
      feedbackContact
    )
    setIsSendingFeedback(false)
    onUnlockSlot3()
    try {
      localStorage.setItem("dealping_slot3_unlocked", "true")
    } catch {}

    setShowFeedbackModal(false)
    setShowSlot3Modal(true)
    showToast(
      "💌 Đã gửi góp ý & mở khóa Slot #3!",
      "Ý kiến của bạn đã được gửi tới dealpingflashsale@gmail.com. Chúc bạn săn deal vui vẻ!",
      "🎉"
    )
  }

  const handleBlockedFeedbackClick = () => {
    showToast(
      "💡 Cần theo dõi 1 món",
      "Bạn hãy dán link và bật theo dõi ít nhất 1 sản phẩm trước khi đánh giá nhé!",
      "🔔"
    )
  }

  return {
    showFeedbackModal,
    setShowFeedbackModal,
    showSlot3Modal,
    setShowSlot3Modal,
    feedbackRating,
    setFeedbackRating,
    feedbackText,
    setFeedbackText,
    feedbackContact,
    setFeedbackContact,
    isSendingFeedback,
    canLeaveFeedback,
    handleSendFeedback,
    handleBlockedFeedbackClick,
  }
}
