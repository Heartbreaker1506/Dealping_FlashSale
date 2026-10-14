import React from "react"
import { PriceDropData } from "../../types"
import { pricingService } from "../../services"

interface PushNotificationBannerProps {
  notification: PriceDropData | null
  onOpenAlarm: () => void
  onClose: () => void
}

export function PushNotificationBanner({
  notification,
  onOpenAlarm,
  onClose,
}: PushNotificationBannerProps) {
  if (!notification) return null

  const savingsPct = Math.max(
    0,
    Math.round((1 - notification.newPrice / notification.oldPrice) * 100)
  )

  return (
    <div
      onClick={onOpenAlarm}
      className="absolute top-11 left-3.5 right-3.5 z-50 p-3 rounded-[24px] bg-neutral-900/95 dark:bg-black/95 text-white backdrop-blur-sm md:backdrop-blur- border border-white/25 shadow-[0_16px_45px_rgba(0,0,0,0.65)] cursor-pointer animate-slide-down-notification transition-all duration-300 active:scale-98"
    >
      <div className="flex items-start space-x-2.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center text-lg shrink-0 shadow-md overflow-hidden">
          {notification.imageUrl ? (
            <img
              src={notification.imageUrl}
              alt=""
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                ;(e.currentTarget as HTMLElement).style.display = "none"
              }}
            />
          ) : (
            <span>📡</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300 uppercase tracking-wider">
              DealPing • Vừa xong
            </span>
            <span className="text-[9px] text-white/50">bây giờ</span>
          </div>
          <h4 className="text-xs font-black text-white mt-0.5 truncate flex items-center space-x-1">
            <span>🚨 BÁO ĐỘNG SẬP GIÁ ĐÁY!</span>
          </h4>
          <p className="text-[10px] text-slate-300 font-medium line-clamp-2 mt-0.5 leading-snug">
            <b>{notification.productName}</b> vừa giảm còn{" "}
            <b className="text-emerald-400 font-bold">
              {pricingService.formatVND(notification.newPrice)}
            </b>{" "}
            <span className="text-rose-400 font-bold">(-{savingsPct}%)</span>!
            Chạm để xem deal.
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/70 active:scale-90"
          title="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
