import React from "react"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  rating: number
  onRatingChange: (star: number) => void
  feedbackText: string
  onFeedbackTextChange: (text: string) => void
  contact: string
  onContactChange: (contact: string) => void
  onSubmit: () => void
  isSending: boolean
}

export function FeedbackModal({
  isOpen,
  onClose,
  rating,
  onRatingChange,
  feedbackText,
  onFeedbackTextChange,
  contact,
  onContactChange,
  onSubmit,
  isSending,
}: FeedbackModalProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-new-slot">
      <div className="w-full max-w-sm apple-sheet rounded-[32px] p-5 shadow-2xl relative border-2 border-amber-400/60 bg-neutral-900/95 text-white">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎁</span>
            <div>
              <h3 className="text-sm font-black text-amber-400">
                ĐÁNH GIÁ & GÓP Ý Ô #3
              </h3>
              <p className="text-[9px] text-slate-300">
                Mở khóa quyền theo dõi 3 món cùng lúc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white/70 active:scale-90 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-left">
          {/* Đánh giá sao */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              ⭐ Bạn cảm thấy trải nghiệm săn deal thế nào?
            </label>
            <div className="flex space-x-2 justify-center py-1.5 bg-white/5 rounded-xl border border-white/10">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onRatingChange(star)}
                  className={`text-2xl transition-transform active:scale-125 cursor-pointer ${
                    star <= rating
                      ? "scale-110 filter drop-shadow(0 0 4px #fbbf24)"
                      : "opacity-30"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Ô nhập góp ý */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              💬 Chia sẻ ý kiến hoặc tính năng bạn muốn DealPing bổ sung:{" "}
              <span className="text-red-400">*</span>
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => onFeedbackTextChange(e.target.value)}
              rows={3}
              placeholder="VD: Cần thêm thông báo Zalo, canh deal Shopee nhanh hơn, giao diện thân thiện..."
              className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Thông tin liên hệ */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              📱 SĐT / Zalo / Email (Tùy chọn nhận thêm voucher):
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => onContactChange(e.target.value)}
              placeholder="0912... hoặc email"
              className="w-full bg-black/40 border border-white/20 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Phần thưởng preview */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/40 text-[9.5px] text-amber-200">
            <p className="font-bold flex items-center space-x-1">
              <span>🎉</span>
              <span>Phần thưởng mở khóa ngay lập tức:</span>
            </p>
            <p className="mt-0.5 opacity-90 leading-tight">
              Mở vĩnh viễn <b>Ô TÌM SỐ 3</b> để săn 3 sản phẩm cùng lúc không giới
              hạn!
            </p>
          </div>

          {/* Nút gửi */}
          <button
            onClick={onSubmit}
            disabled={isSending || !feedbackText.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-xs active:scale-95 shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSending ? (
              <span>⏳ Đang gửi & mở khóa...</span>
            ) : (
              <span>🚀 Gửi Đánh Giá & Mở Khóa Ô #3 Ngay</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
