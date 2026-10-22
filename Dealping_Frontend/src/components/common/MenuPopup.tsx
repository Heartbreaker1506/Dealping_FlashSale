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
      className={`${className} menu-popup backdrop-blur-md rounded-[24px] p-2 w-48 flex flex-col space-y-1 animate-slide-down-notification z-50`}
    >
      <button
        onClick={() => {
          onNavigate("wishlist")
          onClose()
        }}
        className={`menu-item flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98 ${
          currentView === "wishlist"
            ? "active-wishlist font-bold"
            : ""
        }`}
      >
        <Heart className="w-4 h-4 shrink-0" />
        <span className="text-xs">Lịch sử theo dõi</span>
      </button>

      <button
        onClick={() => {
          onNavigate("price_chart")
          onClose()
        }}
        className={`menu-item flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98 ${
          currentView === "price_chart"
            ? "active-price-chart font-bold"
            : ""
        }`}
      >
        <TrendingUp className="w-4 h-4 shrink-0" />
        <span className="text-xs">Biểu đồ giá</span>
      </button>

      <button
        onClick={() => {
          onNavigate("account")
          onClose()
        }}
        className={`menu-item flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98 ${
          currentView === "account"
            ? "active-account font-bold"
            : ""
        }`}
      >
        <User className="w-4 h-4 shrink-0" />
        <span className="text-xs">Tài khoản</span>
      </button>

      <div className="menu-divider h-px my-1 mx-2" />

      <button
        onClick={() => {
          onNavigate("main")
          onClose()
        }}
        className={`menu-item flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98 ${
          currentView === "main"
            ? "active-main font-bold"
            : ""
        }`}
      >
        <Radio className="w-4 h-4 shrink-0" />
        <span className="text-xs">Radar Săn Deal</span>
      </button>

      {/* Mục Đánh giá & Góp ý nhận quà Slot 3 */}
      <div className="menu-divider h-px my-1 mx-2" />

      {canLeaveFeedback ? (
        <button
          onClick={() => {
            onOpenFeedback()
            onClose()
          }}
          className="menu-feedback flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left w-full active:scale-98"
        >
          <span className="text-base shrink-0">⭐</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold">
                {slot3Unlocked ? "Đánh giá & Góp ý" : "Đánh giá nhận Ô #3"}
              </span>
              {!slot3Unlocked && (
                <span className="text-[8px] bg-red-500 text-white font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  HOT
                </span>
              )}
            </div>
            <p className="menu-feedback-sub text-[8px] truncate font-normal">
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
          className="menu-feedback-locked flex items-center space-x-3 px-3 py-2 rounded-xl cursor-pointer text-left w-full"
          title="Cần theo dõi ít nhất 1 sản phẩm để mở khóa chức năng đánh giá"
        >
          <span className="text-base opacity-60 shrink-0">🔒</span>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold">Đánh giá nhận Ô #3</span>
            <p className="text-[8px] truncate font-normal">
              Cần theo dõi ít nhất 1 món
            </p>
          </div>
        </button>
      )}
    </div>
  )
}
