import { useState, useRef, useCallback } from "react"
import { ToastData } from "../types"

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const showToast = useCallback((title: string, msg: string, icon = "✨") => {
    setToast({ title, msg, icon })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  return { toast, showToast }
}
