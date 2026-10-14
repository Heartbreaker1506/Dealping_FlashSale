import React from "react"
import { pricingService } from "../../services"

interface WishlistViewProps {
  wishlistItems: any[]
  loading: boolean
  onToggleMenu: () => void
  isMenuOpen: boolean
}

export function WishlistView({
  wishlistItems,
  loading,
  onToggleMenu,
  isMenuOpen,
}: WishlistViewProps) {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-24 px-5">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-black">🕒 Lịch sử theo dõi</h2>
        <button
          onClick={onToggleMenu}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border z-50 ${
            isMenuOpen
              ? "bg-white text-black border-transparent scale-90"
              : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"
          }`}
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
      <p className="text-[10px] text-white/60 mb-4">
        Các sản phẩm bạn đã dán link thiết lập cảnh báo
      </p>

      <div className="flex-1 overflow-y-auto space-y-3 pb-24 relative">
        {loading ? (
          <>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3 animate-pulse"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center text-[10px] text-white/40 mt-4">
            📭 Bạn chưa theo dõi sản phẩm nào.
          </div>
        ) : (
          wishlistItems.map((item, idx) => {
            const isHit =
              item.status === "target_hit" || item.rawStatus === "TARGET_HIT"
            return (
              <div
                key={item.id || idx}
                className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col space-y-2.5 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/20 flex items-center justify-center border border-white/10">
                    {item.imageUrl || item.productImage ? (
                      <img
                        src={item.imageUrl || item.productImage}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <span className="text-lg">🛍️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                          isHit
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHit ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                          }`}
                        />
                        <span>
                          {item.statusLabel ||
                            (isHit ? "Đã sập giá" : "Đang rình giá")}
                        </span>
                      </span>
                      <span className="text-[9px] text-white/50 shrink-0 font-medium">
                        🕒 {item.lastCheckedAgo || item.lastCheckedText || "Vừa xong"}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.productName || "Sản phẩm đang theo dõi"}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-semibold truncate mt-0.5">
                      Mục tiêu: {pricingService.formatVND(item.targetPrice)}{" "}
                      {item.variantName ? `| ${item.variantName}` : ""}
                    </p>
                  </div>
                </div>

                {/* Nhịp tim Radar & Lời khuyên rà soát giá của Bot */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div
                    className={`flex items-center space-x-2 text-[9px] font-semibold rounded-xl px-2.5 py-1.5 shadow-sm border ${
                      isHit
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${
                          isHit ? "bg-emerald-300" : "bg-emerald-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isHit
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                        }`}
                      />
                    </span>
                    <span className="truncate">
                      {isHit
                        ? "🎯 Giá đã chạm đáy mục tiêu! Mua ngay kẻo lỡ cơ hội!"
                        : item.advice ||
                          `Radar quét giá ${
                            item.lastCheckedAgo || "10 phút trước"
                          } — Chưa giảm, kiên nhẫn đợi giá đáy!`}
                    </span>
                  </div>

                  {/* Thông điệp Mua Chậm Giá Hời */}
                  <div className="flex items-start space-x-1.5 text-[8.5px] text-white/70 px-1">
                    <span className="shrink-0 text-[9px]">🛡️</span>
                    <span className="leading-tight">
                      <b className="text-purple-300">Khi bot im lặng</b> = Tiền
                      bạn an toàn trong túi.{" "}
                      <span className="text-pink-300 font-bold">
                        Mua chậm một nhịp, tiết kiệm một nửa!
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
