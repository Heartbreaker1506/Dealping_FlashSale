import { useState, useRef } from "react"
import { getRank } from "./constants"
import {
  TopControlBar,
  ToastNotification,
  PushNotificationBanner,
  MenuPopup,
} from "./components/common"
import { AppLayout } from "./components/layout"
import { ViewRouter } from "./components/views"
import { AppModalsContainer } from "./components/modals"
import {
  useToast,
  useTutorial,
  useWishlist,
  usePriceChart,
  usePriceAlarm,
  useTrackingSlots,
  useRadarBubbles,
  useFeedback,
} from "./hooks"

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const slot1InputRef = useRef<HTMLInputElement>(null)
  const phoneScreenRef = useRef<HTMLDivElement>(null)

  // 1. Toast Notification System
  const { toast, showToast } = useToast()

  // 2. View Routing & Spotlight Tutorial Flow
  const {
    view,
    setView,
    spotlightStep,
    setSpotlightStep,
    enterMain,
    finishTutorial,
    restartTutorial,
  } = useTutorial()

  // 3. Price Drop Siren Alarm & Push Notification System
  const {
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
  } = usePriceAlarm(showToast)

  // 4. Tracking Slots Engine
  const {
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
  } = useTrackingSlots(showToast, triggerAlarmFromSlot)

  // 5. Radar Bubbles Mini-Game (Throttled & Auto-cleaned)
  const {
    bubbles,
    bubblesPopped,
    showUnlockModal,
    setShowUnlockModal,
    popBubble,
    removeBubble,
  } = useRadarBubbles(() => setSlot2BubbleUnlocked(true))

  // 6. Wishlist Data Sync
  const { wishlistItems, wishlistLoading } = useWishlist(
    view,
    setHasEverTracked
  )

  // 7. Dynamic Price Chart Engine (12-hour history & mock curve)
  const { analyzedCharts } = usePriceChart({
    view,
    slot1,
    slot2,
    slot3,
  })

  // 8. Feedback & Slot 3 Unlock Engine
  const {
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
  } = useFeedback({
    showToast,
    slot1,
    slot2,
    slot3,
    activeCount,
    hasEverTracked,
    wishlistItems,
    onUnlockSlot3: () => setSlot3Unlocked(true),
  })

  // Rank / Slots configuration
  const [friendsInvited] = useState(0)
  const currentRank = getRank(friendsInvited)
  const maxSlots = currentRank.slots

  return (
    <AppLayout
      phoneScreenRef={phoneScreenRef}
      isDark={isDark}
      isAlarmFlashing={isAlarmFlashing}
    >
      {/* Toast Notification */}
      <ToastNotification toast={toast} />

      {/* iOS Push Notification Banner */}
      <PushNotificationBanner
        notification={pushNotification}
        onOpenAlarm={() => {
          setShowAlarmModal(true)
          setPushNotification(null)
        }}
        onClose={() => setPushNotification(null)}
      />

      {/* Top Control Bar */}
      <TopControlBar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        view={view}
        slot3Unlocked={slot3Unlocked}
        slot2BubbleUnlocked={slot2BubbleUnlocked}
        onRestartTutorial={restartTutorial}
      />

      {/* View Router */}
      <ViewRouter
        view={view}
        onNavigate={setView}
        onEnterMain={enterMain}
        onSpotlightStepChange={setSpotlightStep}
        wishlistItems={wishlistItems}
        wishlistLoading={wishlistLoading}
        analyzedCharts={analyzedCharts}
        currentRank={currentRank}
        friendsInvited={friendsInvited}
        maxSlots={maxSlots}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        bubbles={bubbles}
        onPopBubble={popBubble}
        onExpireBubble={removeBubble}
        bubblesPopped={bubblesPopped}
        showUnlockModal={showUnlockModal}
        onCloseUnlockModal={() => setShowUnlockModal(false)}
        spotlightStep={spotlightStep}
        slot1InputRef={slot1InputRef}
        slot1={slot1}
        slot2={slot2}
        slot3={slot3}
        slot2BubbleUnlocked={slot2BubbleUnlocked}
        slot3Unlocked={slot3Unlocked}
        activeCount={activeCount}
        onInputChange={handleInputChange}
        onTargetPriceChange={handleTargetPriceChange}
        onVariantSelect={handleVariantSelect}
        onPaste={handlePaste}
        onActivate={handleActivate}
        onRemove={handleRemove}
        onViewDetails={(num) => setDetailModalSlot(num)}
        showBumpSheet={showBumpSheet}
        onCloseBumpSheet={() => {
          setShowBumpSheet(false)
          showToast(
            "🔔 Đã bật Radar Món #1!",
            `Đang theo dõi: ${slot1.variant}`
          )
        }}
        onTestAlarm={() => handleTestAlarm(slot1, slot2, lastActiveSlot)}
        alarmLoading={alarmLoading}
        canLeaveFeedback={canLeaveFeedback}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onBlockedFeedbackClick={handleBlockedFeedbackClick}
      />

      {/* Consolidated Modals */}
      <AppModalsContainer
        detailModalSlot={detailModalSlot}
        setDetailModalSlot={setDetailModalSlot}
        currentDetailData={currentDetailData}
        slot1={slot1}
        slot2={slot2}
        slot3={slot3}
        handleRemove={handleRemove}
        handleUpdateTargetPriceInDb={handleUpdateTargetPriceInDb}
        handleSimulateDropInDb={handleSimulateDropInDb}
        showAlarmModal={showAlarmModal}
        setShowAlarmModal={setShowAlarmModal}
        alarmData={alarmData}
        triggerPriceDropAlarm={triggerPriceDropAlarm}
        showFeedbackModal={showFeedbackModal}
        setShowFeedbackModal={setShowFeedbackModal}
        feedbackRating={feedbackRating}
        setFeedbackRating={setFeedbackRating}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        feedbackContact={feedbackContact}
        setFeedbackContact={setFeedbackContact}
        isSendingFeedback={isSendingFeedback}
        handleSendFeedback={handleSendFeedback}
        showSlot3Modal={showSlot3Modal}
        setShowSlot3Modal={setShowSlot3Modal}
        spotlightStep={spotlightStep}
        setSpotlightStep={setSpotlightStep}
        finishTutorial={finishTutorial}
        slot1InputRef={slot1InputRef}
        phoneScreenRef={phoneScreenRef}
        showToast={showToast}
      />

      {/* Global Menu Popup (For views other than main) */}
      <MenuPopup
        isOpen={isMenuOpen && view !== "main"}
        onClose={() => setIsMenuOpen(false)}
        currentView={view}
        onNavigate={setView}
        canLeaveFeedback={canLeaveFeedback}
        slot3Unlocked={slot3Unlocked}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onBlockedFeedbackClick={handleBlockedFeedbackClick}
        className="absolute top-[140px] right-5"
      />
    </AppLayout>
  )
}
