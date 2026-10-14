import React from "react"
import { Heart, TrendingUp, User, Radio } from "lucide-react"
import { View } from "../../types"

interface MenuPopupProps {
  isOpen: boolean
  onClose: () => void
  currentView: View
  onNavigate: (view: View) => void
  canLeaveFeedback: boolean
  slot3Unlocked: boolean
  onOpenFeedback: () => void
  onBlockedFeedbackClick: () => void
  className?: string
}

export function MenuPopup({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  canLeaveFeedback,
  slot3Unlocked,
  onOpenFeedback,
  onBlockedFeedbackClick,
  className = "absolute top-10 right-0 mt-2",
}: MenuPopupProps) {
  if (!isOpen) return null

  return (
    <div
      className={`${className} bg-neutral-900/95 backdrop-blur-sm md:backdrop-blur- border border-white/20 rounded-[24px] shadow-2xl p-2 w-48 flex flex-col space-y-1 animate-slide-down-notification z-50`}
    >
      <button
        onClick={() => {
          onNavigate("wishlist")
          onClose()
        }}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
          currentView === "wishlist"
            ? "bg-white/15 text-purple-400 font-bold"
            : "hover:bg-white/10 text-white/80"
        }`}
      >
        <Heart
          className={`w-4 h-4 ${
            currentView === "wishlist" ? "text-purple-400" : "text-white/60"
          }`}
        />
        <span className="text-xs">Lịch sử theo dõi</span>
      </button>

      <button
        onClick={() => {
          onNavigate("price_chart")
          onClose()
        }}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
          currentView === "price_chart"
            ? "bg-white/15 text-emerald-400 font-bold"
            : "hover:bg-white/10 text-white/80"
        }`}
      >
        <TrendingUp
          className={`w-4 h-4 ${
            currentView === "price_chart"
              ? "text-emerald-400"
              : "text-white/60"
          }`}
        />
        <span className="text-xs">Biểu đồ giá</span>
      </button>

      <button
        onClick={() => {
          onNavigate("account")
          onClose()
        }}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
          currentView === "account"
            ? "bg-white/15 text-pink-400 font-bold"
            : "hover:bg-white/10 text-white/80"
        }`}
      >
        <User
          className={`w-4 h-4 ${
            currentView === "account" ? "text-pink-400" : "text-white/60"
          }`}
        />
        <span className="text-xs">Tài khoản</span>
      </button>

      <div className="h-px bg-white/10 my-1 mx-2" />

      <button
        onClick={() => {
          onNavigate("main")
          onClose()
        }}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
          currentView === "main"
            ? "bg-white/15 text-sky-400 font-bold"
            : "hover:bg-white/10 text-white/80"
        }`}
      >
        <Radio
          className={`w-4 h-4 ${
            currentView === "main" ? "text-sky-400" : "text-white/60"
          }`}
        />
        <span className="text-xs">Radar Săn Deal</span>
      </button>

      {/* Mục Đánh giá & Góp ý nhận quà Slot 3 */}
      <div className="h-px bg-white/10 my-1 mx-2" />

      {canLeaveFeedback ? (
        <button
          onClick={() => {
            onOpenFeedback()
            onClose()
          }}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/10 text-amber-400 font-bold cursor-pointer text-left w-full"
        >
          <span className="text-base">⭐</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs">
                {slot3Unlocked ? "Đánh giá & Góp ý" : "Đánh giá nhận Ô #3"}
              </span>
              {!slot3Unlocked && (
                <span className="text-[8px] bg-red-500 text-white font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  HOT
                </span>
              )}
            </div>
            <p className="text-[8px] text-amber-300/70 truncate font-normal">
              {slot3Unlocked
                ? "Chia sẻ cảm nghĩ về app"
                : "Phần thưởng: Mở khóa Ô #3"}
            </p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => {
            onBlockedFeedbackClick()
            onClose()
          }}
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white/40 cursor-pointer text-left w-full opacity-70"
          title="Cần theo dõi ít nhất 1 sản phẩm để mở khóa chức năng đánh giá"
        >
          <span className="text-base opacity-50">🔒</span>
          <div className="min-w-0 flex-1">
            <span className="text-xs">Đánh giá nhận Ô #3</span>
            <p className="text-[8px] text-white/40 truncate font-normal">
              Cần theo dõi ít nhất 1 món
            </p>
          </div>
        </button>
      )}
    </div>
  )
}
