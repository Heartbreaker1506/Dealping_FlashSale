import React from "react"
import {
  View,
  SpotlightStep,
  SlotItemState,
  BubbleData,
  Rank,
  ChartItem,
} from "../../types"
import { OnboardingView } from "./OnboardingView"
import { WelcomeView } from "./WelcomeView"
import { WishlistView } from "./WishlistView"
import { PriceChartView } from "./PriceChartView"
import { AccountView } from "./AccountView"
import { MainView } from "./MainView"

interface ViewRouterProps {
  view: View
  onNavigate: (view: View) => void
  onEnterMain: (showTutorial?: boolean) => void
  onSpotlightStepChange: (step: SpotlightStep) => void

  // Wishlist
  wishlistItems: any[]
  wishlistLoading: boolean

  // Price Charts
  analyzedCharts: ChartItem[]

  // Account
  currentRank: Rank
  friendsInvited: number
  maxSlots: number

  // Menu
  isMenuOpen: boolean
  onToggleMenu: () => void

  // Bubbles
  bubbles: BubbleData[]
  onPopBubble: (id: number) => void
  onExpireBubble?: (id: number) => void
  bubblesPopped: number
  showUnlockModal: boolean
  onCloseUnlockModal: () => void

  // Tutorial
  spotlightStep: SpotlightStep
  slot1InputRef: React.RefObject<HTMLInputElement | null>

  // Slots
  slot1: SlotItemState
  slot2: SlotItemState
  slot3: SlotItemState
  slot2BubbleUnlocked: boolean
  slot3Unlocked: boolean
  activeCount: number
  onInputChange: (slotNum: number, value: string) => void
  onTargetPriceChange: (slotNum: number, value: string) => void
  onVariantSelect: (slotNum: number, variant: string) => void
  onPaste: (slotNum: number) => void
  onActivate: (slotNum: number) => void
  onRemove: (slotNum: number) => void
  onViewDetails: (slotNum: number) => void
  showBumpSheet: boolean
  onCloseBumpSheet: () => void

  // Test Alarm
  onTestAlarm: () => void
  alarmLoading: boolean

  // Feedback
  canLeaveFeedback: boolean
  onOpenFeedback: () => void
  onBlockedFeedbackClick: () => void
}

export function ViewRouter({
  view,
  onNavigate,
  onEnterMain,
  onSpotlightStepChange,
  wishlistItems,
  wishlistLoading,
  analyzedCharts,
  currentRank,
  friendsInvited,
  maxSlots,
  isMenuOpen,
  onToggleMenu,
  bubbles,
  onPopBubble,
  onExpireBubble,
  bubblesPopped,
  showUnlockModal,
  onCloseUnlockModal,
  spotlightStep,
  slot1InputRef,
  slot1,
  slot2,
  slot3,
  slot2BubbleUnlocked,
  slot3Unlocked,
  activeCount,
  onInputChange,
  onTargetPriceChange,
  onVariantSelect,
  onPaste,
  onActivate,
  onRemove,
  onViewDetails,
  showBumpSheet,
  onCloseBumpSheet,
  onTestAlarm,
  alarmLoading,
  canLeaveFeedback,
  onOpenFeedback,
  onBlockedFeedbackClick,
}: ViewRouterProps) {
  switch (view) {
    case "onboarding":
      return (
        <OnboardingView
          onAllowNotification={() => {
            if ("Notification" in window) {
              Notification.requestPermission().catch(() => {})
            }
            localStorage.setItem("dealping_onboarded", "true")
            onSpotlightStepChange("none")
            onNavigate("welcome")
          }}
          onDenyNotification={() => {
            localStorage.setItem("dealping_onboarded", "true")
            onSpotlightStepChange("none")
            onNavigate("welcome")
          }}
        />
      )

    case "welcome":
      return <WelcomeView onStart={() => onEnterMain(true)} />

    case "wishlist":
      return (
        <WishlistView
          wishlistItems={wishlistItems}
          loading={wishlistLoading}
          onToggleMenu={onToggleMenu}
          isMenuOpen={isMenuOpen}
        />
      )

    case "price_chart":
      return (
        <PriceChartView
          analyzedCharts={analyzedCharts}
          onToggleMenu={onToggleMenu}
          isMenuOpen={isMenuOpen}
        />
      )

    case "account":
      return (
        <AccountView
          currentRank={currentRank}
          friendsInvited={friendsInvited}
          maxSlots={maxSlots}
          onBackToMain={() => onNavigate("main")}
          onToggleMenu={onToggleMenu}
          isMenuOpen={isMenuOpen}
        />
      )

    case "main":
      return (
        <MainView
          bubbles={bubbles}
          onPopBubble={onPopBubble}
          onExpireBubble={onExpireBubble}
          bubblesPopped={bubblesPopped}
          spotlightStep={spotlightStep}
          slot1InputRef={slot1InputRef}
          slot1={slot1}
          slot2={slot2}
          slot3={slot3}
          slot2BubbleUnlocked={slot2BubbleUnlocked}
          slot3Unlocked={slot3Unlocked}
          activeCount={activeCount}
          maxSlots={maxSlots}
          onInputChange={onInputChange}
          onTargetPriceChange={onTargetPriceChange}
          onVariantSelect={onVariantSelect}
          onPaste={onPaste}
          onActivate={onActivate}
          onRemove={onRemove}
          onViewDetails={onViewDetails}
          onTestAlarm={onTestAlarm}
          alarmLoading={alarmLoading}
          isMenuOpen={isMenuOpen}
          onToggleMenu={onToggleMenu}
          onNavigate={onNavigate}
          canLeaveFeedback={canLeaveFeedback}
          onOpenFeedback={onOpenFeedback}
          onBlockedFeedbackClick={onBlockedFeedbackClick}
          showUnlockModal={showUnlockModal}
          onCloseUnlockModal={onCloseUnlockModal}
          showBumpSheet={showBumpSheet}
          onCloseBumpSheet={onCloseBumpSheet}
        />
      )

    default:
      return null
  }
}
