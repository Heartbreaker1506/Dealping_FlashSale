import React from "react"
import { ToastData } from "../../types"

interface ToastNotificationProps {
  toast: ToastData | null
}

export function ToastNotification({ toast }: ToastNotificationProps) {
  if (!toast) return null

  return (
    <div className="absolute top-14 left-4 right-4 z-50 bg-neutral-900/95 text-white px-3.5 py-2.5 rounded-2xl border border-white/20 shadow-2xl flex items-center space-x-2.5 animate-slide-down-notification">
      <span className="text-base">{toast.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-black text-pink-400 truncate">
          {toast.title}
        </div>
        <div className="text-[9px] opacity-85 truncate">{toast.msg}</div>
      </div>
    </div>
  )
}
