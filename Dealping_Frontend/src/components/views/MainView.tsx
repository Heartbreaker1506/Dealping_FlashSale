import React from "react"
import { BubbleData, SpotlightStep, View } from "../../types"
import { RadarHeader } from "../radar"
import { SlotCard } from "../slots"
import { UnlockModal, BumpSheet } from "../modals"
import { SlotItemState } from "../../hooks/useTrackingSlots"

interface MainViewProps {
  bubbles: BubbleData[]
  onPopBubble: (id: number) => void
  onExpireBubble?: (id: number) => void
  bubblesPopped: number
  spotlightStep: SpotlightStep
  slot1InputRef?: React.RefObject<HTMLInputElement | null>
  slot1: SlotItemState
  slot2: SlotItemState
  slot3: SlotItemState
  slot2BubbleUnlocked: boolean
  slot3Unlocked: boolean
  activeCount: number
  maxSlots: number
  onInputChange: (slotNum: number, v: string) => void
  onTargetPriceChange: (slotNum: number, v: string) => void
  onVariantSelect: (slotNum: number, v: string, price?: number) => void
  onPaste: (slotNum: number) => void
  onActivate: (slotNum: number) => void
  onRemove: (slotNum: number) => void
  onViewDetails: (slotNum: number) => void
  onTestAlarm: () => void
  alarmLoading: boolean
  isMenuOpen: boolean
  onToggleMenu: () => void
  onNavigate: (view: View) => void
  canLeaveFeedback: boolean
  onOpenFeedback: () => void
  onBlockedFeedbackClick: () => void
  showUnlockModal: boolean
  onCloseUnlockModal: () => void
  showBumpSheet: boolean
  onCloseBumpSheet: () => void
}

export function MainView({
  bubbles,
  onPopBubble,
  onExpireBubble,
  bubblesPopped,
  spotlightStep,
  slot1InputRef,
  slot1,
  slot2,
  slot3,
  slot2BubbleUnlocked,
  slot3Unlocked,
  activeCount,
  maxSlots,
  onInputChange,
  onTargetPriceChange,
  onVariantSelect,
  onPaste,
  onActivate,
  onRemove,
  onViewDetails,
  onTestAlarm,
  alarmLoading,
  isMenuOpen,
  onToggleMenu,
  onNavigate,
  canLeaveFeedback,
  onOpenFeedback,
  onBlockedFeedbackClick,
  showUnlockModal,
  onCloseUnlockModal,
  showBumpSheet,
  onCloseBumpSheet,
}: MainViewProps) {
  const allowedSlots = Math.max(
    slot3Unlocked ? 3 : slot2BubbleUnlocked ? 2 : 1,
    maxSlots
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden z-10">
      {/* Radar Area */}
      <RadarHeader
        bubbles={bubbles}
        onPopBubble={onPopBubble}
        onExpireBubble={onExpireBubble}
        spotlightStep={spotlightStep}
        onTestAlarm={onTestAlarm}
        alarmLoading={alarmLoading}
        isMenuOpen={isMenuOpen}
        onToggleMenu={onToggleMenu}
        currentView="main"
        onNavigate={onNavigate}
        canLeaveFeedback={canLeaveFeedback}
        slot3Unlocked={slot3Unlocked}
        onOpenFeedback={onOpenFeedback}
        onBlockedFeedbackClick={onBlockedFeedbackClick}
      />

      {/* Bottom Sheet containing Slot Cards */}
      <div className="flex-1 min-h-0 apple-sheet rounded-t-[36px] shadow-[0_-10px_35px_rgba(0,0,0,0.12)] px-5 pt-3 pb-12 flex flex-col overflow-y-auto z-10">
        <div className="w-10 h-1.5 bg-slate-400/40 rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300">
              Săn Deal Siêu Tốc
            </h3>
            <p className="text-[9px] opacity-75 font-semibold text-pink-500">
              Tối đa {allowedSlots} ô{" "}
              {slot3Unlocked
                ? "(Đã mở khóa Ô #3)"
                : slot2BubbleUnlocked
                  ? "(Đã mở khóa Ô #2)"
                  : "(Chạm 10 bóng để mở Ô #2)"}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[9px] font-bold">
            {activeCount}/{allowedSlots} ô
          </span>
        </div>

        {/* Bubble game banner */}
        {!slot2BubbleUnlocked && maxSlots >= 2 && (
          <div className="bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/15 border border-pink-400/30 rounded-[22px] p-2.5 mb-3 flex items-center justify-between backdrop-blur-sm">
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-sm">🫧</span>
                <span className="text-[10px] font-bold">
                  Chạm 10 bóng quanh Radar để mở Ô #2
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-24 h-1.5 bg-black/20 rounded-full overflow-hidden border border-pink-400/30">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min((bubblesPopped / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[9px] font-bold text-pink-400">
                  {bubblesPopped} / 10 🫧
                </span>
              </div>
            </div>
            <span className="text-[8px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded-xl font-semibold animate-pulse">
              Bấm bóng trên Radar!
            </span>
          </div>
        )}

        <div className="space-y-2.5 flex-1">
          {/* Slot 3 */}
          {slot3Unlocked && (
            <SlotCard
              slotNum={3}
              label="👑 Ô TÌM SỐ 3 (VIP GÓP Ý)"
              labelClass="bg-gradient-to-r from-amber-500 to-rose-500 text-white"
              active={slot3.active}
              input={slot3.input}
              expanded={slot3.expanded}
              targetPrice={slot3.targetPrice}
              onTargetPriceChange={(v) => onTargetPriceChange(3, v)}
              variant={slot3.variant}
              variantOptions={slot3.variantOptions}
              accentActive="text-amber-400"
              accentBtn="bg-amber-500"
              productEmoji="✨"
              productName={slot3.productName}
              productPrice={slot3.productPrice}
              basePrice={slot3.basePrice}
              originalPrice={slot3.originalPrice}
              voucherPrice={slot3.voucherPrice}
              previewImage={slot3.imageUrl}
              productImage={slot3.imageUrl}
              affiliateUrl={slot3.affiliateUrl}
              statusLabel={slot3.status}
              lastCheckedText={slot3.lastChecked}
              advice={slot3.advice}
              onViewDetails={() => onViewDetails(3)}
              onInputChange={(v) => onInputChange(3, v)}
              previewName={slot3.previewName}
              previewPrice={slot3.previewPrice}
              previewLoading={slot3.previewLoading}
              loading={slot3.sending}
              onPaste={() => onPaste(3)}
              onVariantSelect={(v, p) => onVariantSelect(3, v, p)}
              onActivate={() => onActivate(3)}
              onRemove={() => onRemove(3)}
            />
          )}

          {/* Slot 2 */}
          {slot2BubbleUnlocked && (
            <SlotCard
              slotNum={2}
              label="✨ Ô TÌM SỐ 2"
              labelClass="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
              active={slot2.active}
              input={slot2.input}
              expanded={slot2.expanded}
              targetPrice={slot2.targetPrice}
              onTargetPriceChange={(v) => onTargetPriceChange(2, v)}
              variant={slot2.variant}
              variantOptions={slot2.variantOptions}
              accentActive="text-pink-400"
              accentBtn="bg-pink-500"
              productEmoji="🛍️"
              productName={slot2.productName}
              productPrice={slot2.productPrice}
              basePrice={slot2.basePrice}
              originalPrice={slot2.originalPrice}
              voucherPrice={slot2.voucherPrice}
              previewImage={slot2.imageUrl}
              productImage={slot2.imageUrl}
              affiliateUrl={slot2.affiliateUrl}
              statusLabel={slot2.status}
              lastCheckedText={slot2.lastChecked}
              advice={slot2.advice}
              slot3Unlocked={slot3Unlocked}
              onOpenFeedback={onOpenFeedback}
              onViewDetails={() => onViewDetails(2)}
              onInputChange={(v) => onInputChange(2, v)}
              previewName={slot2.previewName}
              previewPrice={slot2.previewPrice}
              previewLoading={slot2.previewLoading}
              loading={slot2.sending}
              onPaste={() => onPaste(2)}
              onVariantSelect={(v, p) => onVariantSelect(2, v, p)}
              onActivate={() => onActivate(2)}
              onRemove={() => onRemove(2)}
            />
          )}

          {/* Slot 1 */}
          <div>
            <SlotCard
              slotNum={1}
              label="📍 Ô TÌM SỐ 1"
              labelClass="bg-purple-500/20 text-purple-400"
              active={slot1.active}
              input={slot1.input}
              inputRef={slot1InputRef}
              expanded={slot1.expanded}
              targetPrice={slot1.targetPrice}
              onTargetPriceChange={(v) => onTargetPriceChange(1, v)}
              variant={slot1.variant}
              variantOptions={slot1.variantOptions}
              accentActive="text-purple-400"
              accentBtn="bg-purple-600"
              basePrice={slot1.basePrice}
              originalPrice={slot1.originalPrice}
              voucherPrice={slot1.voucherPrice}
              previewImage={slot1.imageUrl}
              productImage={slot1.imageUrl}
              affiliateUrl={slot1.affiliateUrl}
              statusLabel={slot1.status}
              lastCheckedText={slot1.lastChecked}
              advice={slot1.advice}
              slot3Unlocked={slot3Unlocked}
              onOpenFeedback={onOpenFeedback}
              onViewDetails={() => onViewDetails(1)}
              onInputChange={(v) => onInputChange(1, v)}
              onPaste={() => onPaste(1)}
              onActivate={() => onActivate(1)}
              onRemove={() => onRemove(1)}
              productEmoji="🛍️"
              productName={slot1.productName}
              productPrice={slot1.productPrice}
              onVariantSelect={(v, p) => onVariantSelect(1, v, p)}
              previewName={slot1.previewName}
              previewPrice={slot1.previewPrice}
              previewLoading={slot1.previewLoading}
              loading={slot1.sending}
            />
          </div>
        </div>
      </div>

      {/* Unlock Modal (10 bubbles) */}
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={onCloseUnlockModal}
      />

      {/* Bump Sheet Reassurance */}
      <BumpSheet
        isOpen={showBumpSheet}
        onClose={onCloseBumpSheet}
        slot3Unlocked={slot3Unlocked}
        onOpenFeedback={onOpenFeedback}
        slot1Variant={slot1.variant}
      />
    </div>
  )
}
