import React from "react"

interface UnlockModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UnlockModal({ isOpen, onClose }: UnlockModalProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full apple-sheet rounded-[32px] p-5 shadow-2xl text-center relative border border-pink-400/40">
        <div className="text-3xl mb-2">🎉🫧</div>
        <h3 className="text-sm font-black text-pink-500 mb-1">
          MỞ KHÓA THÀNH CÔNG Ô #2!
        </h3>
        <p className="text-[11px] leading-relaxed opacity-85 mb-3">
          Bạn đã chạm nổ đủ <b>10 bong bóng</b> quanh Radar! Ô dán link thứ 2 đã
          bung ra.
        </p>
        <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/20 text-[10px] font-bold text-pink-400 mb-3">
          ⚠️ Quy tắc cứng: Toàn app tối đa đúng 2 món duy nhất!
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl apple-glow-btn text-white font-bold text-xs active:scale-95 shadow-lg cursor-pointer"
        >
          Đến Thử Ô #2 Ngay ✨
        </button>
      </div>
    </div>
  )
}
