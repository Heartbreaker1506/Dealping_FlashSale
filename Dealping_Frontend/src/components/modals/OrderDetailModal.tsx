import React, { useState } from "react"
import { OrderDetailData } from "../../types"
import { pricingService } from "../../services"

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  data: OrderDetailData | null
  onOpenStore: () => void
  onTriggerAlarm: () => void
  onRemove: () => void
  onCopyLink: () => void
  onUpdateTargetPrice?: (newPrice: number) => Promise<void>
  onSimulateDrop?: () => Promise<void>
}

export function OrderDetailModal({
  isOpen,
  onClose,
  data,
  onOpenStore,
  onTriggerAlarm,
  onRemove,
  onCopyLink,
  onUpdateTargetPrice,
  onSimulateDrop,
}: OrderDetailModalProps) {
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [editTargetVal, setEditTargetVal] = useState("")
  const [isSavingTarget, setIsSavingTarget] = useState(false)
  const [isSimulatingDrop, setIsSimulatingDrop] = useState(false)

  if (!isOpen || !data) return null

  const isSlot1 = data.slotNum === 1
  const targetNum = pricingService.parseVND(data.targetPrice)
  const baseNum =
    data.basePrice && data.basePrice > 0
      ? data.basePrice
      : pricingService.parseVND(data.productPrice)
  const voucherNum =
    data.voucherPrice && data.voucherPrice > 0 ? data.voucherPrice : null

  const discountPct =
    baseNum > 0 && targetNum > 0
      ? Math.max(0, Math.round((1 - targetNum / baseNum) * 100))
      : isSlot1
        ? 20
        : 30

  const estimatedSavings =
    baseNum > 0 && targetNum > 0 && baseNum > targetNum
      ? baseNum - targetNum
      : Math.round(baseNum * 0.25)

  const cashbackBonus = Math.round(
    targetNum > 0 ? targetNum * 0.05 : baseNum > 0 ? baseNum * 0.05 : 15000
  )

  // Platform detection
  const rawUrl = (data.url || data.affiliateUrl || "").toLowerCase()
  const isTikTok = rawUrl.includes("tiktok")
  const isLazada = rawUrl.includes("lazada") || rawUrl.includes("laz")
  const platformName = isTikTok
    ? "TikTok Shop"
    : isLazada
      ? "Lazada Mall"
      : "Shopee Mall"
  const platformBadgeBg = isTikTok
    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
    : isLazada
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-orange-500/20 text-orange-400 border-orange-500/30"
  const platformEmoji = isTikTok ? "🎵" : isLazada ? "💙" : "🛍️"

  const trackingCode = data.itemId
    ? `#DP-${data.itemId.slice(-6).toUpperCase()}`
    : `#DP-RADAR0${data.slotNum}`

  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm md:backdrop-blur- flex items-center justify-center p-3.5 overflow-y-auto animate-new-slot">
      <div className="w-full max-w-sm rounded-[32px] p-5 shadow-[0_0_50px_rgba(168,85,247,0.35)] relative border-2 border-purple-400/40 bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-purple-950/80 text-white overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Glow ambient lights */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📦</span>
            <div>
              <h3 className="text-xs font-black text-white tracking-wide uppercase">
                Chi Tiết Đơn Hàng & Deal
              </h3>
              <p className="text-[9px] text-purple-300 font-semibold">
                Món #{data.slotNum} • {trackingCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-0.5 space-y-3 mt-3 flex-1">
          {/* Product Image and Main badges */}
          <div className="flex space-x-3 items-start bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-purple-400/40 shrink-0 relative bg-black/30 flex items-center justify-center">
              {data.productImage ? (
                <img
                  src={data.productImage}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLElement).style.display = "none"
                  }}
                />
              ) : (
                <span className="text-3xl">🛍️</span>
              )}
              <div className="absolute top-1 left-1">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-black/60 backdrop-blur-sm md:backdrop-blur- text-amber-300">
                  ⭐ 4.9+
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center space-x-1 flex-wrap gap-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold border ${platformBadgeBg} inline-flex items-center space-x-1`}
                >
                  <span>{platformEmoji}</span>
                  <span>{platformName}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🟢 Radar 24/7
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                {data.productName}
              </h4>
              <p className="text-[10px] text-purple-200/90 font-medium">
                Phân loại:{" "}
                <span className="font-bold text-pink-300">
                  {data.variant || "Tất cả phân loại"}
                </span>
              </p>
            </div>
          </div>

          {/* Pricing Analysis Breakdown Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-2xl p-3 text-left space-y-2 backdrop-blur-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center justify-between">
              <span>💰 Thông Tin Giá Săn Deal</span>
              <span className="px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-300 text-[9px] font-bold">
                {discountPct <= 15
                  ? "⚡ Nấc 1: Giảm nhẹ 10%"
                  : `🔥 Nấc 2: Mua Chậm Giá Hời (-${discountPct}%)`}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] pt-1 border-t border-white/10">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-[10px] opacity-80">Giá niêm yết sàn:</span>
                <span className="font-bold line-through text-slate-400">
                  {pricingService.formatVND(baseNum)}
                </span>
              </div>

              {voucherNum && (
                <div className="flex justify-between items-center text-amber-300">
                  <span className="text-[10px] flex items-center space-x-1">
                    <span>🎟️ Giá sau voucher sàn:</span>
                  </span>
                  <span className="font-bold">
                    {pricingService.formatVND(voucherNum)}
                  </span>
                </div>
              )}

              {isEditingTarget ? (
                <div className="bg-purple-950/70 p-2.5 rounded-xl border border-purple-400/50 space-y-2 -mx-1">
                  <div className="flex justify-between items-center text-[10px] text-purple-200 font-bold">
                    <span>🎯 Nhập giá mong muốn mới:</span>
                    <button
                      onClick={() => setIsEditingTarget(false)}
                      className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                    >
                      ✕ Hủy
                    </button>
                  </div>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="VD: 350.000 đ"
                      value={editTargetVal}
                      onChange={(e) =>
                        setEditTargetVal(
                          pricingService.formatInputNumber(e.target.value)
                        )
                      }
                      className="flex-1 bg-black/70 border border-purple-400/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-pink-400"
                    />
                    <button
                      disabled={
                        isSavingTarget ||
                        !pricingService.parseVND(editTargetVal)
                      }
                      onClick={async () => {
                        if (!onUpdateTargetPrice) return
                        const val = pricingService.parseVND(editTargetVal)
                        if (val <= 0) return
                        setIsSavingTarget(true)
                        try {
                          await onUpdateTargetPrice(val)
                          setIsEditingTarget(false)
                        } finally {
                          setIsSavingTarget(false)
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-[10px] cursor-pointer whitespace-nowrap shadow"
                    >
                      {isSavingTarget ? "Đang lưu..." : "💾 Lưu vào DB"}
                    </button>
                  </div>
                  <p className="text-[8.5px] text-purple-300">
                    * Giá sẽ được lưu trực tiếp vào Database & tự động hú còi
                    khi giá sàn sập về mức này.
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-purple-500/20 -mx-1.5 px-2 py-1.5 rounded-xl border border-purple-400/30">
                  <span className="text-[11px] font-bold text-purple-200 flex items-center space-x-1">
                    <span>🎯 Giá mong muốn bạn đặt:</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-emerald-400 animate-pulse">
                      {pricingService.formatVND(targetNum || baseNum)}
                    </span>
                    {onUpdateTargetPrice && (
                      <button
                        onClick={() => {
                          setEditTargetVal(
                            pricingService.formatInputNumber(
                              targetNum || baseNum
                            )
                          )
                          setIsEditingTarget(true)
                        }}
                        className="px-1.5 py-0.5 rounded-md bg-purple-500/40 hover:bg-purple-500/60 border border-purple-400/50 text-[9px] font-bold text-purple-100 hover:text-white cursor-pointer"
                        title="Chỉnh sửa giá mong muốn lưu vào database"
                      >
                        ✏️ Sửa
                      </button>
                    )}
                  </div>
                </div>
              )}

              {discountPct >= 20 && (
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-300 flex items-center space-x-1">
                  <span>👉</span>
                  <span>Dự kiến chờ 2 - 4 ngày để rình đợt Sale lớn</span>
                </div>
              )}

              <div className="flex justify-between items-center text-emerald-400 text-[10px] font-semibold pt-0.5">
                <span>⚡ Ước tính tiết kiệm:</span>
                <span className="font-bold">
                  {pricingService.formatVND(estimatedSavings)}
                </span>
              </div>

              <div className="flex justify-between items-center text-amber-300 text-[10px] font-semibold">
                <span>🎁 Hoàn tiền Dealping (+5%):</span>
                <span className="font-bold">
                  +{pricingService.formatVND(cashbackBonus)}
                </span>
              </div>
            </div>
          </div>

          {/* Nhịp tim Radar & Thông điệp Mua Chậm Giá Hời */}
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-2.5 space-y-1.5 shadow-sm">
            <div className="flex items-center space-x-2 text-[10px] font-semibold text-emerald-400">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
              <span className="truncate">
                Radar vừa quét giá 10 phút trước — Giá chưa giảm, kiên nhẫn đợi
                giá đáy!
              </span>
            </div>
            <div className="flex items-start space-x-1.5 text-[8.5px] text-white/75 pt-1 border-t border-emerald-500/20">
              <span className="shrink-0 text-[10px]">🛡️</span>
              <span className="leading-tight">
                <b className="text-purple-300 font-bold">Khi bot im lặng</b> =
                Tiền bạn an toàn trong túi.{" "}
                <span className="text-pink-300 font-bold">
                  Mua chậm một nhịp, tiết kiệm một nửa!
                </span>
              </span>
            </div>
          </div>

          {/* Tracking Status details */}
          <div className="bg-black/30 rounded-2xl p-2.5 border border-white/10 space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="opacity-70">Trạng thái rà soát:</span>
              <span className="font-bold text-amber-300 inline-flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{data.statusLabel || "Đang rình giá"}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Lần quét gần nhất:</span>
              <span className="font-bold text-emerald-400">
                🕒 {data.lastCheckedText || "Vừa xong"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Tần suất quét Radar:</span>
              <span className="font-bold text-purple-300">
                ⚡ Tự động 24/7 (mỗi 10 phút)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Kênh thông báo:</span>
              <span className="font-bold text-pink-300">
                🔔 Còi hú + Push Alert
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Mã đơn theo dõi:</span>
              <span className="font-mono font-bold text-slate-300">
                {trackingCode}
              </span>
            </div>
          </div>

          {/* Lời khuyên của bot */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 text-[10px] space-y-1">
            <span className="font-extrabold text-amber-300 uppercase flex items-center space-x-1">
              <span>💡</span>
              <span>Lời khuyên Dealping Bot</span>
            </span>
            <p className="text-white/80 italic">
              "{data.advice || "Giá vẫn neo cao, khuyên chưa nên mua vội"}"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={onOpenStore}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>🛒</span>
            <span>MỞ SẢN PHẨM TRÊN SÀN (MUA NGAY)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={isSimulatingDrop}
              onClick={async () => {
                if (onSimulateDrop) {
                  setIsSimulatingDrop(true)
                  try {
                    await onSimulateDrop()
                  } finally {
                    setIsSimulatingDrop(false)
                  }
                } else {
                  onTriggerAlarm()
                }
              }}
              className="py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 border border-red-400/50 text-white font-bold text-[10px] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-red-900/40 disabled:opacity-50"
              title="Kích hoạt sập giá vào Database và phát còi hú về giao diện"
            >
              <span>{isSimulatingDrop ? "⏳" : "🚨"}</span>
              <span>
                {isSimulatingDrop ? "Đang lưu DB..." : "Sập Giá Vào DB (Hú)"}
              </span>
            </button>
            <button
              onClick={onCopyLink}
              className="py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 font-bold text-[10px] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>📋</span>
              <span>Sao Chép Link</span>
            </button>
          </div>

          <button
            onClick={onRemove}
            className="w-full py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-[10px] active:scale-95 transition cursor-pointer"
          >
            🗑️ Hủy theo dõi / Đổi sang món khác
          </button>
        </div>
      </div>
    </div>
  )
}
