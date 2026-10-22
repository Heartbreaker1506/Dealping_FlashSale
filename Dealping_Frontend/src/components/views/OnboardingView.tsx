import React from "react"

interface OnboardingViewProps {
  onAllowNotification: () => void
  onDenyNotification: () => void
}

export function OnboardingView({
  onAllowNotification,
  onDenyNotification,
}: OnboardingViewProps) {
  return (
    <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
      {/* Blurred background preview of the radar screen */}
      <div className="absolute inset-0 flex flex-col opacity-30 pointer-events-none">
        <div className="h-44 flex items-center justify-center">
          <div className="px-4 py-2 rounded-2xl apple-glow-btn text-white flex items-center space-x-2.5">
            <span>📡</span>
            <span className="text-[11px] font-black">Radar Săn Deal Đáy</span>
          </div>
        </div>
        <div className="flex-1 apple-sheet rounded-t-[36px]" />
      </div>

      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* iOS-style notification permission dialog */}
      <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
        <div className="w-full onboarding-dialog bg-white/95 dark:bg-[#161a29]/95 backdrop-blur-sm rounded-[28px] overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/15">
          <div className="pt-6 pb-3 flex flex-col items-center text-center px-5">
            <div className="w-16 h-16 rounded-[20px] apple-glow-btn flex items-center justify-center text-3xl mb-3 shadow-lg">
              📡
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1">
              <b className="text-slate-900 dark:text-white font-bold">"Trợ Lý Săn Deal"</b> muốn gửi cho
              bạn thông báo
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Thông báo bao gồm cảnh báo <b className="text-slate-700 dark:text-white">giá sập</b>, âm thanh và biểu tượng
              huy hiệu. Chúng tôi chỉ ping khi sàn giảm xuống mức giá bạn muốn.
            </p>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/10 mx-4" />

          <div className="flex">
            <button
              onClick={onDenyNotification}
              className="flex-1 py-3.5 text-[14px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-white/10 active:bg-slate-100 dark:active:bg-white/10 transition cursor-pointer"
            >
              Không cho phép
            </button>
            <button
              onClick={onAllowNotification}
              className="flex-1 py-3.5 text-[14px] font-bold text-blue-500 active:bg-slate-100 dark:active:bg-white/10 transition cursor-pointer"
            >
              Cho phép
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
