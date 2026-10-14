import React from "react"

interface AppLayoutProps {
  phoneScreenRef: React.RefObject<HTMLDivElement | null>
  isDark: boolean
  isAlarmFlashing: boolean
  children: React.ReactNode
}

export function AppLayout({
  phoneScreenRef,
  isDark,
  isAlarmFlashing,
  children,
}: AppLayoutProps) {
  const themeClass = isDark ? "dark-mode" : "light-mode"

  return (
    <div className="min-h-screen bg-[#0b0c12] flex items-center justify-center p-0 sm:p-4 select-none font-sans">
      <div className="w-full sm:w-98.25 h-screen sm:h-213 sm:rounded-[52px] p-0 sm:p-3 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 sm:shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(124,58,237,0.3)] sm:border-4 sm:border-neutral-700 relative flex flex-col overflow-hidden">
        {/* Phone Screen */}
        <div
          ref={phoneScreenRef}
          className={`w-full h-full sm:rounded-[42px] overflow-hidden relative ${themeClass} ${
            isDark ? "dark" : ""
          } ${
            isAlarmFlashing ? "alarm-pulsing-active" : ""
          } flex flex-col transition-colors duration-500`}
        >
          {/* Ambient Background Orbs */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <div
              className={`orb-1 absolute -top-16 -left-16 w-64 h-64 rounded-full ${
                isDark
                  ? "bg-gradient-to-tr from-pink-600 to-rose-500 opacity-65 mix-blend-screen"
                  : "bg-gradient-to-tr from-pink-500 to-rose-400 opacity-70 mix-blend-multiply"
              }`}
            />
            <div
              className={`orb-2 absolute top-1/4 -right-20 w-72 h-72 rounded-full ${
                isDark
                  ? "bg-gradient-to-bl from-purple-600 via-indigo-600 to-blue-600 opacity-70 mix-blend-screen"
                  : "bg-gradient-to-bl from-purple-600 via-indigo-500 to-blue-500 opacity-70 mix-blend-multiply"
              }`}
            />
            <div
              className={`orb-3 absolute -bottom-16 left-8 w-64 h-64 rounded-full ${
                isDark
                  ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 opacity-60 mix-blend-screen"
                  : "bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 opacity-65 mix-blend-multiply"
              }`}
            />
            <div
              className={`orb-4 absolute top-1/2 left-1/4 w-56 h-56 rounded-full ${
                isDark
                  ? "bg-gradient-to-r from-cyan-500 to-sky-600 opacity-60 mix-blend-screen"
                  : "bg-gradient-to-r from-cyan-400 to-sky-500 opacity-60 mix-blend-multiply"
              }`}
            />
          </div>

          {/* Screen Content */}
          {children}

          {/* iOS Home Indicator */}
          <div className="pb-2 pt-1 flex justify-center z-50 bg-transparent shrink-0 absolute bottom-0 w-full pointer-events-none">
            <div className="w-32 h-1 bg-white opacity-40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
