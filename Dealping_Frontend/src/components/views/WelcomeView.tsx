import React from "react"

interface WelcomeViewProps {
  onStart: () => void
}

export function WelcomeView({ onStart }: WelcomeViewProps) {
  return (
    <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <div className="w-20 h-20 rounded-[26px] apple-glow-btn flex items-center justify-center text-4xl mb-5 shadow-2xl">
          📡
        </div>

        <h1 className="text-2xl font-black mb-2">Trợ Lý Săn Deal</h1>

        <p className="text-sm opacity-70 leading-relaxed mb-7">
          Dán link món đồ bạn muốn mua.
          <br />
          Hệ thống sẽ theo dõi giá và báo bạn
          <br />
          khi món đồ xuống đúng mức giá mong muốn.
        </p>

        <button
          onClick={onStart}
          className="w-full py-3.5 rounded-[24px] apple-glow-btn text-white font-bold text-sm shadow-xl active:scale-95 transition cursor-pointer"
        >
          🚀 Bắt đầu trải nghiệm
        </button>

        <p className="text-[10px] opacity-50 mt-4">Shopee • TikTok • Lazada</p>
      </div>
    </div>
  )
}
