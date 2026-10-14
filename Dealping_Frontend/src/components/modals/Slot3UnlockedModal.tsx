import React from "react"

interface Slot3UnlockedModalProps {
  isOpen: boolean
  onClose: () => void
}

export function Slot3UnlockedModal({
  isOpen,
  onClose,
}: Slot3UnlockedModalProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-new-slot">
      <div className="w-full max-w-sm apple-sheet rounded-[32px] p-5 shadow-2xl text-center relative border-2 border-amber-400 bg-neutral-900/95 text-white">
        <div className="text-4xl mb-2 animate-bounce">👑🎉</div>
        <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 mb-1">
          MỞ KHÓA THÀNH CÔNG Ô #3!
        </h3>
        <p className="text-[11px] leading-relaxed opacity-90 mb-3 px-2">
          Cảm ơn bạn rất nhiều vì đã gửi đóng góp quý báu! DealPing đã tặng bạn
          vĩnh viễn <b>Ô TÌM SỐ 3</b>.
        </p>
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/50 text-[10px] font-bold text-amber-300 mb-4">
          ✨ Giờ đây Radar của bạn quét đồng thời 3 món hàng 24/7!
        </div>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl apple-glow-btn text-white font-black text-xs active:scale-95 shadow-lg cursor-pointer"
        >
          Trải Nghiệm Ô #3 Ngay ✨
        </button>
      </div>
    </div>
  )
}
