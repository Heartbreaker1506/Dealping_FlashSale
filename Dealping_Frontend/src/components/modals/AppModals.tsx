import React from "react"
import { OrderDetailData, PriceDropData, SpotlightStep } from "../../types"
import { OrderDetailModal } from "./OrderDetailModal"
import { PriceDropAlarmModal } from "./PriceDropAlarmModal"
import { FeedbackModal } from "./FeedbackModal"
import { Slot3UnlockedModal } from "./Slot3UnlockedModal"
import { SpotlightOverlay } from "./SpotlightOverlay"

interface AppModalsProps {
  detailModalSlot: number | null
  onCloseDetailModal: () => void
  currentDetailData: OrderDetailData | null
  onOpenStore: () => void
  onTriggerAlarm: () => void
  onRemoveFromDetail: () => void
  onCopyLink: () => void
  onUpdateTargetPrice?: (newPrice: number) => Promise<void>
  onSimulateDrop?: () => Promise<void>

  showFeedbackModal: boolean
  onCloseFeedbackModal: () => void
  feedbackRating: number
  onRatingChange: (star: number) => void
  feedbackText: string
  onFeedbackTextChange: (text: string) => void
  feedbackContact: string
  onContactChange: (text: string) => void
  onSubmitFeedback: () => void
  isSendingFeedback: boolean

  showSlot3Modal: boolean
  onCloseSlot3Modal: () => void

  showAlarmModal: boolean
  alarmData: PriceDropData | null
  onCloseAlarmModal: () => void
  onBuyNow: () => void
  onReplayAlarm: () => void

  spotlightStep: SpotlightStep
  slot1InputRef: React.RefObject<HTMLInputElement | null>
  phoneScreenRef: React.RefObject<HTMLDivElement | null>
  onSpotlightNext: () => void
  onSpotlightDone: () => void
}

export function AppModals({
  detailModalSlot,
  onCloseDetailModal,
  currentDetailData,
  onOpenStore,
  onTriggerAlarm,
  onRemoveFromDetail,
  onCopyLink,
  onUpdateTargetPrice,
  onSimulateDrop,
  showFeedbackModal,
  onCloseFeedbackModal,
  feedbackRating,
  onRatingChange,
  feedbackText,
  onFeedbackTextChange,
  feedbackContact,
  onContactChange,
  onSubmitFeedback,
  isSendingFeedback,
  showSlot3Modal,
  onCloseSlot3Modal,
  showAlarmModal,
  alarmData,
  onCloseAlarmModal,
  onBuyNow,
  onReplayAlarm,
  spotlightStep,
  slot1InputRef,
  phoneScreenRef,
  onSpotlightNext,
  onSpotlightDone,
}: AppModalsProps) {
  return (
    <>
      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={detailModalSlot !== null}
        onClose={onCloseDetailModal}
        data={currentDetailData}
        onOpenStore={onOpenStore}
        onTriggerAlarm={onTriggerAlarm}
        onRemove={onRemoveFromDetail}
        onCopyLink={onCopyLink}
        onUpdateTargetPrice={onUpdateTargetPrice}
        onSimulateDrop={onSimulateDrop}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={onCloseFeedbackModal}
        rating={feedbackRating}
        onRatingChange={onRatingChange}
        feedbackText={feedbackText}
        onFeedbackTextChange={onFeedbackTextChange}
        contact={feedbackContact}
        onContactChange={onContactChange}
        onSubmit={onSubmitFeedback}
        isSending={isSendingFeedback}
      />

      {/* Slot 3 Unlocked Celebration Modal */}
      <Slot3UnlockedModal
        isOpen={showSlot3Modal}
        onClose={onCloseSlot3Modal}
      />

      {/* Price Drop Siren Alarm Modal */}
      <PriceDropAlarmModal
        isOpen={showAlarmModal}
        alarmData={alarmData}
        onClose={onCloseAlarmModal}
        onBuyNow={onBuyNow}
        onReplayAlarm={onReplayAlarm}
      />

      {/* Spotlight Tutorial */}
      <SpotlightOverlay
        step={spotlightStep}
        targetRef={slot1InputRef}
        containerRef={phoneScreenRef}
        onNext={onSpotlightNext}
        onDone={onSpotlightDone}
      />
    </>
  )
}
