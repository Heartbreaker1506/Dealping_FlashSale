import React, { useState } from "react"

export interface AppNotification {
  id: string
  title: string
  message: string
  productName?: string | null
  imageUrl?: string | null
  productUrl?: string | null
  oldPrice?: number | string | null
  newPrice?: number | string | null
  targetPrice?: number | string | null
  type?: string
  isRead: boolean
  createdAt: string
}

const formatVND = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return ""
  const number = val.toString().replace(/\D/g, "")
  return number !== ""
    ? new Intl.NumberFormat("vi-VN").format(Number(number)) + " đ"
    : ""
}

const formatTimeAgo = (dateStr: string) => {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return "Vừa xong"
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    })
  } catch (e) {
    return "Vừa xong"
  }
}

interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
  isDark?: boolean
  variant?: "bottom" | "top"
}

export function NotificationBell({
  unreadCount,
  onClick,
  isDark = true,
  variant = "bottom",
}: NotificationBellProps) {
  if (variant === "bottom") {
    return (
      <button
        onClick={onClick}
        className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 text-white shadow-[0_8px_25px_rgba(236,72,153,0.5)] border-2 border-white/30 flex items-center justify-center cursor-pointer active:scale-90 transition-all hover:scale-105"
        title="Xem danh sách thông báo sập giá"
      >
        <span className="text-xl select-none">🔔</span>

        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-black shadow-md border-2 border-[#0b0c12]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-red-500 animate-ping opacity-75 pointer-events-none" />
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
        isDark
          ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
          : "bg-black/5 hover:bg-black/10 text-slate-800 border border-black/10 shadow-sm"
      }`}
      title="Xem danh sách thông báo sập giá"
    >
      <span className="text-base select-none">🔔</span>

      {unreadCount > 0 && (
        <>
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white text-[9px] font-black shadow-md border-2 border-[#0b0c12]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
          <span className="absolute -top-1 -right-1 h-4.5 min-w-4.5 rounded-full bg-red-500 animate-ping opacity-75 pointer-events-none" />
        </>
      )}
    </button>
  )
}

interface NotificationCenterModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: AppNotification[]
  unreadCount: number
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onSelectNotification: (item: AppNotification) => void
  isDark?: boolean
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onDelete,
  onSelectNotification,
  isDark = true,
}: NotificationCenterModalProps) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL")

  if (!isOpen) return null

  const filteredList =
    filter === "UNREAD"
      ? notifications.filter((n) => !n.isRead)
      : notifications

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm md:backdrop-blur- flex items-center justify-center p-3 animate-new-slot">
      <div
        className={`w-full max-w-sm rounded-[32px] p-4.5 shadow-[0_0_50px_rgba(236,72,153,0.35)] relative border-2 border-pink-500/40 ${
          isDark
            ? "bg-gradient-to-b from-neutral-900/98 via-neutral-900/95 to-purple-950/90 text-white"
            : "bg-white/98 text-slate-900"
        } overflow-hidden my-auto max-h-[88vh] flex flex-col`}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-600/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-base shadow-md">
              🔔
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-black tracking-wide uppercase">
                  Thông Báo Sập Giá
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-[9px] text-pink-400 font-semibold">
                Radar tự động cập nhật khi sập giá
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[9px] font-bold text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
                title="Đánh dấu tất cả đã đọc"
              >
                ✓ Đã đọc hết
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold active:scale-90"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mt-3 mb-2 shrink-0">
          <div className="flex space-x-1 p-0.5 rounded-xl bg-black/20 border border-white/10 text-[10px] font-bold">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "UNREAD"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          <span className="text-[9px] text-slate-400">
            {filteredList.length} deal sập sàn
          </span>
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 mt-1">
          {filteredList.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl relative">
                <span>📡</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-1">
                  Chưa có thông báo sập giá nào
                </p>
                <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Radar đang quét 24/7. Khi giá sản phẩm giảm bằng hoặc thấp hơn
                  giá bạn mong muốn, thông báo sẽ lập tức xuất hiện tại đây!
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((item) => {
              const oldP = Number(item.oldPrice) || 0
              const newP = Number(item.newPrice) || 0
              const targetP = Number(item.targetPrice) || 0
              const discountPct =
                oldP > 0 && newP > 0
                  ? Math.max(0, Math.round((1 - newP / oldP) * 100))
                  : 25

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead) onMarkRead(item.id)
                    onSelectNotification(item)
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-98 relative group overflow-hidden ${
                    !item.isRead
                      ? "bg-gradient-to-r from-red-950/50 via-purple-950/40 to-neutral-900/90 border-red-500/40 shadow-[0_4px_20px_rgba(239,68,68,0.15)]"
                      : "bg-white/5 hover:bg-white/10 border-white/10"
                  }`}
                >
                  {/* Unread Indicator Bar */}
                  {!item.isRead && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-pink-500" />
                  )}

                  <div className="flex items-start space-x-2.5">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLElement).style.display =
                              "none"
                          }}
                        />
                      ) : (
                        <span className="text-xl">🛍️</span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-red-600/90 text-white text-[7px] font-black text-center py-0.2">
                        -{discountPct}%
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-amber-300 uppercase tracking-wider flex items-center space-x-1">
                          <span>🚨 SẬP GIÁ ĐÁY</span>
                        </span>
                        <span className="text-[8px] text-slate-400">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-[11px] font-bold text-white leading-snug line-clamp-2 mt-0.5">
                        {item.productName || "Sản phẩm đang theo dõi"}
                      </h4>

                      {/* Pricing Comparison */}
                      <div className="flex items-baseline space-x-1.5 mt-1">
                        {oldP > 0 && (
                          <span className="text-[9px] line-through text-slate-400">
                            {formatVND(oldP)}
                          </span>
                        )}
                        <span className="text-xs font-black text-emerald-400">
                          {formatVND(newP)}
                        </span>
                        {targetP > 0 && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            🎯 Đạt giá mục tiêu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/20 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-red-400 transition text-[9px] shrink-0"
                      title="Xóa thông báo"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Quick CTA */}
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[9px] text-pink-300 font-medium">
                      Chạm để xem chi tiết & mở sàn
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                      <span>Mua ngay</span>
                      <span>➔</span>
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2.5 mt-2 border-t border-white/10 text-center shrink-0">
          <p className="text-[9px] text-slate-400">
            💡 Radar Dealping quét tự động và báo ngay khi sập về mức giá mong muốn.
          </p>
        </div>
      </div>
    </div>
  )
}
