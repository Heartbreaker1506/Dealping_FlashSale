import React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { PlatformBadges } from "../common/PlatformBadges"
import { pricingService, urlParserService } from "../../services"

export interface SlotCardProps {
  slotNum: number
  label: string
  labelClass: string
  active: boolean
  input: string
  expanded: boolean
  variant: string
  variantOptions: any[]
  accentActive: string
  accentBtn: string
  productEmoji: string
  productName: string
  productPrice: string
  onInputChange: (v: string) => void
  onPaste: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  targetPrice?: string
  onTargetPriceChange?: (v: string) => void
  onVariantSelect: (v: string, price?: number) => void
  onActivate: () => void
  loading?: boolean
  previewName?: string
  previewPrice?: string
  previewLoading?: boolean
  onRemove: () => void
  onViewDetails?: () => void
  basePrice?: number
  originalPrice?: number
  voucherPrice?: number | null
  previewImage?: string | null
  productImage?: string | null
  affiliateUrl?: string | null
  priceHistory?: { labels: string[]; price: number[] }
  statusLabel?: string
  lastCheckedText?: string
  advice?: string
  slot3Unlocked?: boolean
  onOpenFeedback?: () => void
}

export function SlotCard({
  slotNum,
  label,
  labelClass,
  active,
  input,
  expanded,
  variant,
  variantOptions,
  accentActive,
  productEmoji,
  productName,
  productPrice,
  onInputChange,
  onPaste,
  inputRef,
  targetPrice,
  onTargetPriceChange,
  onVariantSelect,
  onActivate,
  loading,
  previewName,
  previewPrice,
  previewLoading,
  onRemove,
  onViewDetails,
  basePrice,
  originalPrice: propOriginalPrice,
  voucherPrice,
  previewImage,
  productImage,
  affiliateUrl,
  priceHistory,
  statusLabel,
  lastCheckedText,
  advice,
  slot3Unlocked,
  onOpenFeedback,
}: SlotCardProps) {
  const isSlot1 = slotNum === 1
  const borderClass = isSlot1
    ? "border-purple-400/40 dark:border-purple-400/30"
    : slotNum === 2
      ? "border-pink-500/70 border-2 bg-gradient-to-b from-pink-500/15 to-purple-500/10"
      : "border-amber-500/70 border-2 bg-gradient-to-b from-amber-500/15 to-rose-500/10"

  // 1. Tính toán giá Nấc 1 và Nấc 2 (chống lỗi Nấc 1 đắt hơn giá sàn)
  const currentPrice =
    basePrice && basePrice > 0
      ? basePrice
      : voucherPrice && voucherPrice > 0
        ? voucherPrice
        : pricingService.parseVND(previewPrice || "") ||
          pricingService.parseVND(productPrice || "") ||
          0

  const originalPriceRaw =
    propOriginalPrice && propOriginalPrice > 0
      ? propOriginalPrice
      : currentPrice > 0
        ? currentPrice
        : 0

  // Giá gốc luôn >= giá sàn (tránh dữ liệu API trả về giá gốc < giá hiện tại)
  const originalPrice = Math.max(originalPriceRaw, currentPrice)

  // Tính theo PricingService (Chế độ Săn Đại Sale Mức 2: -28%)
  const tiers = pricingService.calculateTiers(originalPrice, currentPrice)
  const nac2_price = currentPrice > 0 ? tiers.nac2_price : null
  const nac2_label = tiers.nac2_label
  const drop2 = tiers.drop2

  const selectedTargetNum = pricingService.parseVND(targetPrice || "")
  const isTier2Active = Boolean(
    nac2_price &&
      selectedTargetNum > 0 &&
      (selectedTargetNum === nac2_price ||
        Math.abs(selectedTargetNum - nac2_price) <=
          (currentPrice > 1000000 ? 50000 : 500))
  )

  const discountPct =
    currentPrice > 0 && selectedTargetNum > 0 && currentPrice >= selectedTargetNum
      ? Math.max(0, Math.round(((currentPrice - selectedTargetNum) / currentPrice) * 100))
      : 28

  const history = priceHistory

  const chartData = history
    ? history.labels.map((lbl, i) => ({
        label: lbl,
        price: history.price[i],
      }))
    : []
  const minPrice = history ? Math.min(...history.price) : 0
  const maxPrice = history ? Math.max(...history.price) : 0
  const currentPriceRaw =
    pricingService.parseVND(productPrice) || basePrice || 0
  const isAtBottom =
    history && currentPriceRaw > 0 && currentPriceRaw <= minPrice

  return (
    <div
      className={`p-3 rounded-[24px] ${borderClass} apple-glass shadow-sm transition-all duration-300 relative ${
        slotNum !== 1 ? "animate-new-slot" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${labelClass}`}
        >
          {label}
        </span>
        <PlatformBadges />
      </div>

      {!active ? (
        <>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) =>
                onInputChange(urlParserService.extractUrl(e.target.value))
              }
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData("text")
                if (pastedText) {
                  e.preventDefault()
                  onInputChange(urlParserService.extractUrl(pastedText))
                }
              }}
              placeholder={`Dán link Shopee/TikTok/Lazada vào đây (Ô số ${slotNum})`}
              className="w-full apple-input placeholder-slate-400 font-medium text-xs rounded-[20px] px-3.5 py-3 pr-20 shadow-inner focus:outline-none transition"
            />
            <button
              onClick={onPaste}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl apple-glow-btn text-white text-[9px] font-bold shadow-sm active:scale-95 cursor-pointer"
            >
              📋 Dán link
            </button>
          </div>

          {expanded && (
            <div className="mt-2 space-y-2">
              {(previewName || previewLoading) && (
                <div className="bg-black/5 rounded-[18px] p-2.5 flex items-center space-x-2 border border-current/10">
                  <div
                    className={`w-10 h-10 rounded-xl ${
                      isSlot1 ? "bg-purple-500/20" : "bg-pink-500/20"
                    } flex items-center justify-center text-base shrink-0 overflow-hidden ${
                      previewLoading ? "animate-pulse" : ""
                    }`}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLElement).style.display =
                            "none"
                        }}
                      />
                    ) : (
                      <span>🛍️</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {previewLoading ? (
                      <>
                        <div className="h-2.5 bg-black/10 rounded w-3/4 mb-1.5 animate-pulse"></div>
                        <div className="h-2 bg-black/10 rounded w-1/2 animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <h5 className="text-xs font-bold truncate">
                          {previewName}
                        </h5>
                        <div className="flex items-center flex-wrap gap-1.5 text-[10.5px] mt-0.5">
                          <span className="font-bold text-pink-500 dark:text-pink-400">
                            Giá gốc niêm yết sàn:
                          </span>
                          <span className="font-black text-xs text-amber-500 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-500/30 tracking-tight shadow-xs">
                            {previewPrice || (currentPrice > 0 ? pricingService.formatVND(currentPrice) : "Đang lấy giá...")}
                          </span>
                          <span className="text-[8.5px] font-normal text-slate-500 dark:text-white/60">
                            (Chưa trừ mã Voucher riêng trên máy bạn)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-slate-100/80 dark:bg-black/5 rounded-[18px] p-2.5 text-[10px] space-y-2 border border-slate-200/60 dark:border-transparent">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-slate-800 dark:text-white/80 text-[10px]">
                    🎯 Chế độ Săn Đại Sale món {slotNum}:
                  </span>
                  <span
                    className={`font-black text-[10px] ${
                      isSlot1
                        ? "text-purple-600 dark:text-purple-400"
                        : slotNum === 2
                          ? "text-pink-600 dark:text-pink-400"
                          : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    Giảm -{discountPct}%
                  </span>
                </div>

                {/* Chế độ Săn Đại Sale (Mức 2 duy nhất) */}
                <button
                  type="button"
                  title={nac2_label}
                  onClick={() => {
                    if (nac2_price) {
                      onTargetPriceChange?.(
                        pricingService.formatInputNumber(nac2_price)
                      )
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between ${
                    isTier2Active
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/60"
                      : "bg-white/80 dark:bg-black/20 border-slate-300/80 dark:border-white/10 text-slate-800 dark:text-white/70 hover:bg-white dark:hover:bg-black/30 hover:border-slate-400 dark:hover:border-white/20 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
                      <span>🔥</span>
                      <span>Mức 2: Săn Đại Sale (-28%)</span>
                    </span>
                    <span className="text-[8.5px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <span>⭐</span>
                      <span>Gợi ý tốt nhất</span>
                    </span>
                  </div>
                  <p className="text-[9px] font-medium text-slate-700 dark:text-emerald-100/90 mt-1.5 leading-snug">
                    Săn Đại Sale khi Shop giảm thêm{" "}
                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                      {pricingService.formatVND(drop2)}
                    </span>{" "}
                    (-28%)
                    <span className="text-slate-500 dark:text-white/60 ml-1">
                      (Chế độ Mua Chậm Giá Hời)
                    </span>
                  </p>
                  {nac2_price && (
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-emerald-500/20">
                      <span className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300">
                        Giá mục tiêu rình sale:
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {pricingService.formatVND(nac2_price)}
                      </span>
                    </div>
                  )}
                </button>

                {/* Ghi chú Nấc 2 */}
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-1.5">
                  <span className="text-[11px] shrink-0">👉</span>
                  <span className="leading-tight font-medium">
                    <b>Dự kiến chờ 2 - 4 ngày để rình đợt Sale lớn</b> (Chế độ
                    "Mua Chậm Giá Hời").
                  </span>
                </div>

                {/* Tinh chỉnh giá cụ thể */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[9px] text-slate-700 dark:text-white/60 font-semibold">
                    <span>Hoặc tinh chỉnh số tiền cụ thể:</span>
                    {currentPrice > 0 && (
                      <span className="text-slate-800 dark:text-white/90 font-bold">
                        Giá gốc niêm yết:{" "}
                        <b className="text-amber-500 dark:text-amber-300 font-black">
                          {pricingService.formatVND(currentPrice)}
                        </b>
                      </span>
                    )}
                  </div>
                  <div className="relative mb-1.5 flex items-center">
                    <input
                      type="text"
                      value={targetPrice ?? ""}
                      onChange={(e) =>
                        onTargetPriceChange?.(
                          pricingService.formatInputNumber(e.target.value)
                        )
                      }
                      placeholder="Nhập giá mong muốn"
                      className="w-full bg-white dark:bg-black/10 text-slate-900 dark:text-white text-xs font-bold rounded-lg pl-2.5 pr-7 py-1.5 border border-slate-300 dark:border-white/20 focus:outline-none"
                    />
                    <span className="absolute right-2.5 text-xs font-bold text-slate-500 dark:text-white/60 pointer-events-none">
                      đ
                    </span>
                  </div>
                </div>

                {/* Phân loại variant */}
                <div className="pt-1.5 border-t border-slate-200 dark:border-white/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 dark:text-white/80 text-[10px]">
                      Phân loại cần săn:
                    </span>
                    <span className={`font-bold text-[9px] ${accentActive}`}>
                      {variant}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {variantOptions && variantOptions.length > 0 ? (
                      variantOptions.map((opt: any, idx: number) => {
                        const optVal =
                          typeof opt === "string"
                            ? opt
                            : opt.name ||
                              opt.value ||
                              (Array.isArray(opt) ? opt[0] : "")
                        const optPrice =
                          typeof opt === "string" ? null : opt.price
                        const optLabel =
                          typeof opt === "string"
                            ? opt
                            : opt.name ||
                              opt.label ||
                              (Array.isArray(opt) ? opt[1] : "")
                        const isSelected = variant === optVal
                        return (
                          <button
                            key={idx}
                            onClick={() => onVariantSelect(optVal, optPrice)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                              isSelected
                                ? "bg-pink-500/20 border-pink-500 text-pink-500 dark:text-pink-400 scale-105 shadow-md"
                                : "bg-white/80 dark:bg-black/20 border-slate-200 dark:border-transparent text-slate-800 dark:text-white/70 hover:bg-white dark:hover:bg-black/30 hover:scale-105"
                            }`}
                          >
                            <span>🔘</span>
                            <span>
                              {optLabel}{" "}
                              {optPrice
                                ? `- ${
                                    optPrice >= 1000
                                      ? optPrice / 1000 + "k"
                                      : optPrice
                                  }`
                                : ""}
                            </span>
                          </button>
                        )
                      })
                    ) : (
                      <>
                        <input
                          type="text"
                          list={`variant-opts-${slotNum}`}
                          value={variant}
                          onChange={(e) => onVariantSelect(e.target.value)}
                          placeholder="Nhập màu, size (VD: Đen - Size M)"
                          className="w-full bg-white dark:bg-black/10 text-slate-900 dark:text-white text-xs font-bold rounded-lg px-2 py-2 border border-slate-300 dark:border-white/20 focus:outline-none"
                        />
                        <datalist id={`variant-opts-${slotNum}`}>
                          {variantOptions &&
                            variantOptions.map((opt: any, idx: number) => {
                              const optVal =
                                typeof opt === "string"
                                  ? opt
                                  : opt.name ||
                                    opt.value ||
                                    (Array.isArray(opt) ? opt[0] : "")
                              const optLabel =
                                typeof opt === "string"
                                  ? opt
                                  : opt.name ||
                                    opt.label ||
                                    (Array.isArray(opt) ? opt[1] : "")
                              return (
                                <option key={idx} value={optVal}>
                                  {optLabel}
                                </option>
                              )
                            })}
                        </datalist>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex space-x-1 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-md ${
                      isSlot1
                        ? "bg-purple-600"
                        : slotNum === 2
                          ? "bg-pink-500"
                          : "bg-amber-500"
                    } text-white font-bold text-[9px]`}
                  >
                    ⭐ 4.{isSlot1 ? "8" : slotNum === 2 ? "9" : "9"}+
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-black/10 text-slate-800 dark:text-white text-[9px] font-semibold">
                    Mall
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-black/10 text-slate-800 dark:text-white text-[9px] font-semibold">
                    Freeship
                  </span>
                </div>
              </div>

              <button
                onClick={onActivate}
                disabled={loading}
                className="w-full py-2.5 rounded-[20px] apple-glow-btn text-white font-bold text-xs flex items-center justify-center space-x-1.5 active:scale-95 shadow-md cursor-pointer"
              >
                {loading
                  ? "⏳ Radar đang kết nối sàn (~15s)..."
                  : slotNum === 1
                    ? "🔔 Bật Radar / Săn Deal"
                    : slotNum === 2
                      ? "🔔 Kích Hoạt Theo Dõi Món 2"
                      : "🔔 Kích Hoạt Theo Dõi Món 3"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="apple-glass rounded-[18px] p-2.5 flex flex-col">
          <div className="flex items-center justify-between space-x-2 w-full">
            <div
              onClick={onViewDetails}
              className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1 group"
              title="Bấm xem chi tiết thông tin đơn hàng & deal"
            >
              <div
                className={`w-10 h-10 rounded-xl ${
                  isSlot1 ? "bg-purple-500/20" : "bg-pink-500/20"
                } flex items-center justify-center text-base shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform`}
              >
                {productImage || previewImage ? (
                  <img
                    src={productImage || previewImage || undefined}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = "none"
                    }}
                  />
                ) : (
                  <span>{productEmoji || "🛍️"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold truncate group-hover:text-purple-400 transition-colors">
                  {productName}
                </h5>
                <p className="text-[9px] opacity-90 truncate">
                  Giá gốc niêm yết: <span className="font-bold text-amber-500 dark:text-amber-300">{productPrice}</span> | <b className={accentActive}>{variant}</b>
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5 overflow-hidden">
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>{statusLabel || "Đang rình giá"}</span>
                  </span>
                  <span className="text-[8px] text-slate-600 dark:text-white/50 whitespace-nowrap truncate">
                    • {lastCheckedText || "Vừa xong"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={onViewDetails}
                className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-600 dark:text-sky-400 text-[9px] font-bold active:scale-95 transition cursor-pointer flex items-center space-x-0.5 border border-sky-500/30"
                title="Xem chi tiết đơn hàng, hình ảnh & giá săn"
              >
                <span>ℹ️ Chi tiết</span>
              </button>
              <button
                onClick={() => {
                  let buyUrl = affiliateUrl || input || "https://shopee.vn"
                  if (!buyUrl.startsWith("http")) buyUrl = `https://${buyUrl}`
                  window.open(buyUrl, "_blank", "noopener,noreferrer")
                }}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold active:scale-95 transition cursor-pointer flex items-center space-x-0.5 border border-emerald-500/30"
              >
                <span>🛒 Mua</span>
              </button>
              <button
                onClick={onRemove}
                className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-600 dark:text-red-400 text-[9px] font-bold active:scale-95 transition cursor-pointer border border-red-500/20"
              >
                🗑️ Đổi
              </button>
            </div>
          </div>

          {/* Bot Advice Banner */}
          <div className="mt-2 bg-amber-500/10 dark:bg-black/20 rounded-xl px-2.5 py-1.5 border border-amber-500/20 dark:border-white/5 flex items-center space-x-1.5 text-[9px] text-amber-900 dark:text-yellow-200/90">
            <span>💡</span>
            <span className="truncate italic font-medium">
              {advice || "Giá vẫn neo cao, khuyên chưa nên mua vội"}
            </span>
          </div>

          {/* Nhịp tim Radar & Thông điệp Mua Chậm Giá Hời */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 text-[9.5px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-2.5 py-1.5 shadow-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
              <span className="truncate">
                Radar vừa quét giá 10 phút trước — Giá chưa giảm, kiên nhẫn đợi
                giá đáy!
              </span>
            </div>

            <div className="flex items-start space-x-1.5 text-[8.5px] text-slate-800 dark:text-white/75 bg-purple-500/10 border border-purple-500/20 rounded-xl px-2.5 py-1.5">
              <span className="shrink-0 text-[10px]">🛡️</span>
              <span className="leading-tight">
                <b className="text-purple-700 dark:text-purple-300 font-bold">
                  Khi bot im lặng
                </b>{" "}
                = Tiền bạn an toàn trong túi.{" "}
                <span className="text-pink-700 dark:text-pink-300 font-bold">
                  Mua chậm một nhịp, tiết kiệm một nửa!
                </span>
              </span>
            </div>

            {/* Thông báo hướng dẫn mở khóa Ô #3 sau khi hoàn thành theo dõi */}
            {!slot3Unlocked && (
              <div className="flex items-center justify-between text-[9px] bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-400/40 rounded-xl px-2.5 py-1.5 shadow-xs">
                <div className="flex items-center space-x-1.5 min-w-0 pr-1">
                  <span className="text-xs shrink-0">🎁</span>
                  <span className="text-slate-800 dark:text-white/90 truncate font-medium">
                    Đã bật theo dõi! Vào <b>Menu (☰)</b> đánh giá để nhận{" "}
                    <b>Ô #3</b>
                  </span>
                </div>
                {onOpenFeedback && (
                  <button
                    onClick={onOpenFeedback}
                    className="text-amber-700 dark:text-amber-300 font-black shrink-0 hover:underline cursor-pointer flex items-center space-x-0.5 ml-1"
                  >
                    <span>Mở ngay</span>
                    <span>➔</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Price Badges & Chart */}
          {history && chartData.length > 0 && (
            <div className="w-full mt-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/80 font-bold">
                  📉 Đáy: {pricingService.formatVND(minPrice)}
                </span>
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/80 font-bold">
                  📈 Đỉnh: {pricingService.formatVND(maxPrice)}
                </span>
                {isAtBottom && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[9px] text-emerald-400 font-black animate-pulse">
                    🔥 ĐANG Ở ĐÁY GIÁ 12 GIỜ
                  </span>
                )}
              </div>

              <div className="h-28 w-full mt-1 bg-black/20 rounded-xl p-2 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="label"
                      fontSize={8}
                      tick={{ fill: "#888" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(val: any) => pricingService.formatVND(val)}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isAtBottom ? "#34d399" : "#f472b6"}
                      strokeWidth={2}
                      dot={{
                        r: 2,
                        fill: isAtBottom ? "#34d399" : "#f472b6",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
