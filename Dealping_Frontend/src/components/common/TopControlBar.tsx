import React from "react"
import { View } from "../../types"

interface TopControlBarProps {
  isDark: boolean
  onToggleTheme: () => void
  view: View
  slot3Unlocked: boolean
  slot2BubbleUnlocked: boolean
  onRestartTutorial: () => void
}

export function TopControlBar({
  isDark,
  onToggleTheme,
  view,
  slot3Unlocked,
  slot2BubbleUnlocked,
  onRestartTutorial,
}: TopControlBarProps) {
  const slotText = slot3Unlocked
    ? "3 / 3 Món"
    : slot2BubbleUnlocked
      ? "2 / 2 Món"
      : "1 / 1 Món"

  return (
    <>
      {/* Status Bar Spacing */}
      <div className="pt-10 pb-2 z-30 w-full" />

      {/* Top Control Bar */}
      <div className="absolute top-12 inset-x-4 flex items-center justify-between z-40 pointer-events-none">
        {/* Left: Light / Dark Toggle */}
        <button
          onClick={onToggleTheme}
          className={`pointer-events-auto flex items-center space-x-1.5 px-2.5 py-1 rounded-full backdrop-blur border shadow-sm active:scale-95 transition-all cursor-pointer ${
            isDark
              ? "bg-white/20 border-white/30 text-white"
              : "bg-white/90 border-slate-300 text-slate-900 shadow-slate-200"
          }`}
        >
          <span className="text-[11px]">{isDark ? "🌙" : "☀️"}</span>
          <span
            className={`text-[9px] font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {isDark ? "Dark" : "Light"}
          </span>
        </button>

        {/* Center & Right: Only in Main View */}
        {view === "main" && (
          <>
            <div
              className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full backdrop-blur text-[10px] font-black border flex items-center space-x-1 shadow-sm ${
                isDark
                  ? "bg-white/20 border-white/30 text-purple-300"
                  : "bg-white/90 border-slate-300 text-purple-900 shadow-slate-200"
              }`}
            >
              <span className={isDark ? "text-purple-300" : "text-slate-900"}>
                Giới hạn:
              </span>
              <span
                className={`font-bold ${
                  isDark ? "text-pink-400" : "text-pink-600"
                }`}
              >
                {slotText}
              </span>
            </div>

            <button
              onClick={onRestartTutorial}
              className={`pointer-events-auto px-2.5 py-1 rounded-full backdrop-blur text-[10px] font-black border cursor-pointer active:scale-95 transition shadow-sm flex items-center space-x-1 ${
                isDark
                  ? "bg-white/20 border-white/30 text-white"
                  : "bg-white/90 border-slate-300 text-slate-950 shadow-slate-200"
              }`}
            >
              <span
                className={isDark ? "text-white" : "text-slate-950 font-black"}
              >
                Hướng dẫn
              </span>
              <span
                className={isDark ? "text-white/70" : "text-slate-900 font-black"}
              >
                →
              </span>
            </button>
          </>
        )}
      </div>
    </>
  )
}
