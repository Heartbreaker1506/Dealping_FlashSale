import React from "react"

interface BumpSheetProps {
  isOpen: boolean
  onClose: () => void
  slot3Unlocked: boolean
  onOpenFeedback: () => void
  slot1Variant: string
}

export function BumpSheet({
  isOpen,
  onClose,
  slot3Unlocked,
  onOpenFeedback,
  slot1Variant,
}: BumpSheetProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-3 animate-new-slot">
      <div className="w-full apple-sheet rounded-[36px] p-5 shadow-2xl text-center relative border border-white/20">
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-3" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border-4 border-purple-400/30 mx-auto flex items-center justify-center text-2xl mb-2 shadow-inner">
          🔔
        </div>
        <h3 className="text-sm font-black mb-1">Đã Khóa Mục Tiêu Theo Dõi!</h3>
        <div className="p-3 bg-purple-500/15 rounded-[22px] border border-purple-400/30 mb-2">
          <p className="text-xs font-bold text-purple-400 leading-relaxed">
            "Chúng tôi đang theo dõi đúng phân loại màu/size, hãy yên tâm nhé."
          </p>
        </div>
        <p className="text-[10px] opacity-75 px-2 leading-normal">
          Nguyên tắc: Tối đa 2 món để đảm bảo tốc độ cào giá siêu tốc. Khi mua
          xong bạn có thể bấm "🗑️ Đổi món" bất cứ lúc nào!
        </p>

        {/* Thông báo hướng dẫn mở khóa Ô #3 sau khi hoàn thành theo dõi */}
        {!slot3Unlocked && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-purple-500/20 border border-amber-400/50 text-left shadow-sm">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-sm">🎁</span>
              <span className="text-[11px] font-black text-amber-300">
                QUÀ TẶNG: MỞ KHÓA THÊM Ô TÌM SỐ 3!
              </span>
              <span className="text-[8px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse">
                HOT
              </span>
            </div>
            <p className="text-[9.5px] text-white/85 leading-relaxed">
              Bạn đã hoàn thành theo dõi món đồ! Giờ đây bạn đã đủ điều kiện vào{" "}
              <b>Menu (☰)</b> để gửi Đánh giá & nhận ngay <b>Ô TÌM SỐ 3</b> hoàn
              toàn miễn phí.
            </p>
          </div>
        )}

        {!slot3Unlocked ? (
          <div className="mt-3.5 space-y-2">
            <button
              onClick={() => {
                onClose()
                onOpenFeedback()
              }}
              className="w-full py-3 rounded-[24px] bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition shadow-lg cursor-pointer"
            >
              <span>⭐ Đánh Giá Ngay Để Mở Ô #3</span>
              <span>➔</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-[24px] bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer border border-white/20"
            >
              <span>Tôi đã yên tâm rồi, cảm ơn!</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="mt-4 w-full py-3.5 rounded-[28px] apple-glow-btn text-white font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Tôi đã yên tâm rồi, cảm ơn!</span>
          </button>
        )}
      </div>
    </div>
  )
}
