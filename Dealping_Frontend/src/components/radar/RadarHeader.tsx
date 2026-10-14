import React from "react"
import { BubbleData, SpotlightStep, View } from "../../types"
import { RadarBubbles } from "./RadarBubbles"
import { MenuPopup } from "../common/MenuPopup"

interface RadarHeaderProps {
  bubbles: BubbleData[]
  onPopBubble: (id: number) => void
  onExpireBubble?: (id: number) => void
  spotlightStep: SpotlightStep
  onTestAlarm: () => void
  alarmLoading: boolean
  isMenuOpen: boolean
  onToggleMenu: () => void
  currentView: View
  onNavigate: (view: View) => void
  canLeaveFeedback: boolean
  slot3Unlocked: boolean
  onOpenFeedback: () => void
  onBlockedFeedbackClick: () => void
}

export function RadarHeader({
  bubbles,
  onPopBubble,
  onExpireBubble,
  spotlightStep,
  onTestAlarm,
  alarmLoading,
  isMenuOpen,
  onToggleMenu,
  currentView,
  onNavigate,
  canLeaveFeedback,
  slot3Unlocked,
  onOpenFeedback,
  onBlockedFeedbackClick,
}: RadarHeaderProps) {
  return (
    <div
      id="radar-header-area"
      className="relative h-[280px] w-full flex items-center justify-center shrink-0 pt-4"
    >
      <div className="absolute w-40 h-40 rounded-full border-2 border-white/30 animate-ping opacity-20 pointer-events-none" />
      <div className="absolute w-28 h-28 rounded-full border border-pink-400/40 animate-pulse opacity-30 pointer-events-none" />

      {/* Floating Bubbles */}
      <RadarBubbles
        bubbles={bubbles}
        onPop={onPopBubble}
        onExpire={onExpireBubble}
        spotlightStep={spotlightStep}
      />

      {/* Radar Central Pill */}
      <div className="relative z-10 px-4 py-2 rounded-2xl apple-glow-btn text-white shadow-xl flex items-center space-x-2.5 border border-white/40">
        <span className="text-base">📡</span>
        <div className="text-center flex-1">
          <div className="text-[11px] font-black leading-tight">
            Radar Săn Deal Đáy
          </div>
          <div className="text-[9px] text-white/90">Quét 24/7</div>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
      </div>

      {/* Test Siren Button (Bottom Left) */}
      <button
        onClick={onTestAlarm}
        disabled={alarmLoading}
        className="absolute bottom-2.5 left-4 z-30 w-8 h-8 rounded-full apple-glass border border-red-500/40 hover:border-red-500 shadow-md flex items-center justify-center text-xs cursor-pointer active:scale-90 transition-all hover:bg-red-500/20 group"
        title="Nhấn để test thông báo hú chuông sập giá"
      >
        <span
          className={
            alarmLoading
              ? "animate-spin text-[10px]"
              : "group-hover:scale-115 transition-transform"
          }
        >
          🚨
        </span>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
      </button>

      {/* Menu Button (Bottom Right) */}
      <div className="absolute bottom-2.5 right-4 z-50">
        <MenuPopup
          isOpen={isMenuOpen}
          onClose={onToggleMenu}
          currentView={currentView}
          onNavigate={onNavigate}
          canLeaveFeedback={canLeaveFeedback}
          slot3Unlocked={slot3Unlocked}
          onOpenFeedback={onOpenFeedback}
          onBlockedFeedbackClick={onBlockedFeedbackClick}
        />

        <button
          onClick={onToggleMenu}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border ${
            isMenuOpen
              ? "bg-white text-black border-transparent scale-90"
              : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"
          }`}
          title="Menu Chức Năng"
        >
          <div
            className={`transform transition-transform duration-300 text-xs ${
              isMenuOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            {isMenuOpen ? "✕" : "☰"}
          </div>
        </button>
      </div>
    </div>
  )
}
