import React from "react"
import { PriceDropData } from "../../types"
import { pricingService } from "../../services"

interface PriceDropAlarmModalProps {
  isOpen: boolean
  alarmData: PriceDropData | null
  onClose: () => void
  onBuyNow: () => void
  onReplayAlarm: () => void
}

export function PriceDropAlarmModal({
  isOpen,
  alarmData,
  onClose,
  onBuyNow,
  onReplayAlarm,
}: PriceDropAlarmModalProps) {
  if (!isOpen || !alarmData) return null

  const savingsPct = Math.max(
    0,
    Math.round((1 - alarmData.newPrice / alarmData.oldPrice) * 100)
  )
  const cashbackBonus = Math.round(alarmData.newPrice * 0.05)

  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm md:backdrop-blur- flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[32px] p-5 shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center relative border-2 border-red-500/80 bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-red-950/80 text-white overflow-hidden animate-new-slot">
        {/* Background glow orbs */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Flashing badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black tracking-wide mb-3 animate-pulse">
          <span className="text-xs">🚨</span>
          <span>
            {alarmData.platformBadge || "BÁO ĐỘNG SẬP GIÁ ĐÁY (RADAR 24/7)"}
          </span>
        </div>

        {/* Main Siren or Product Image */}
        {alarmData.imageUrl ? (
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg border-2 border-red-500/50 relative">
            <img
              src={alarmData.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLElement).style.display = "none"
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white">
              ⚡
            </div>
          </div>
        ) : (
          <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping opacity-75" />
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg text-2xl">
              ⚡
            </div>
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-black text-white mb-1 line-clamp-2 px-2">
          {alarmData.productName}
        </h3>
        <p className="text-[10px] text-red-300 font-medium mb-3">
          Phát hiện mức giá chạm đáy lịch sử!
        </p>

        {/* Price comparison card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-3 backdrop-blur-sm text-left">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="opacity-80 text-[10.5px]">Giá gốc niêm yết sàn:</span>
            <span className="line-through text-slate-400 font-bold">
              {pricingService.formatVND(alarmData.oldPrice)}
            </span>
          </div>
          <p className="text-[8.5px] text-purple-200/80 italic -mt-0.5 mb-1.5">
            (Chưa trừ mã Voucher riêng trên máy bạn)
          </p>
          <div className="flex items-center justify-between">
            <span className="text-red-400 font-bold text-xs flex items-center space-x-1">
              <span>🔥 Giá SALE sập chạm đáy:</span>
            </span>
            <span className="text-xl font-black text-emerald-400 animate-pulse">
              {pricingService.formatVND(alarmData.newPrice)}
            </span>
          </div>

          {/* Discount badge */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-md bg-red-500 text-white font-black">
              TIẾT KIỆM {savingsPct}%
            </span>
            <span className="text-amber-300 font-bold">
              💰 Hoàn tiền: +{pricingService.formatVND(cashbackBonus)}
            </span>
          </div>

          <div className="mt-2 text-[9px] text-amber-200/80 bg-amber-500/10 p-1.5 rounded-lg leading-tight border border-amber-500/20">
            💡 <b>Mô phỏng Radar 24/7:</b> Chuông hú báo động khi sàn sập về đúng
            giá bạn săn (<b>{pricingService.formatVND(alarmData.newPrice)}</b>).
            Bấm mua ngay để vào xem sản phẩm trên sàn!
          </div>
        </div>

        {/* Voucher codes */}
        {alarmData.discountCodes && alarmData.discountCodes.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 mb-3 text-[10px] flex items-center justify-between">
            <span className="text-amber-300 font-bold">🎟️ Mã kèm theo:</span>
            <div className="flex space-x-1">
              {alarmData.discountCodes.map((code) => (
                <span
                  key={code}
                  className="px-1.5 py-0.5 bg-amber-400/20 text-amber-200 font-mono font-bold rounded"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onBuyNow}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>⚡</span>
            <span>MUA NGAY KẺO HẾT DEAL</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onReplayAlarm}
              className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[10px] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>🔊</span>
              <span>Hú chuông lại</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-[10px] active:scale-95 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
