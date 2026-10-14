import { useState, useRef, useCallback, useEffect } from "react"
import { BubbleData } from "../types"
import { BUBBLE_ICONS, TARGET_BUBBLES } from "../constants"
import { soundService } from "../services"

export function useRadarBubbles(onUnlockSlot2: () => void) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([])
  const bubbleIdRef = useRef(0)
  const [bubblesPopped, setBubblesPopped] = useState(0)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const bubbleUnlockShown = useRef(false)

  const removeBubble = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const spawnBubble = useCallback(() => {
    const icons = BUBBLE_ICONS
    const randomIcon = icons[Math.floor(Math.random() * icons.length)]
    const duration = Math.random() * 2 + 5.5 // 5.5s - 7.5s
    const id = bubbleIdRef.current++

    const newBubble: BubbleData = {
      id,
      icon: randomIcon,
      left: Math.random() * 240 + 20,
      size: Math.random() * 14 + 36, // 36px - 50px
      duration,
      popped: false,
    }

    setBubbles((prev) => {
      // Giữ tối đa 4-5 bong bóng cùng lúc để tránh nổi lên quá dày đặc
      const active = prev.filter((b) => !b.popped)
      if (active.length >= 5) {
        return [...active.slice(-4), newBubble]
      }
      return [...active, newBubble]
    })
  }, [])

  useEffect(() => {
    // Nhịp độ 2.8s/bóng: nhẹ nhàng, thanh thoát, không bị ngợp
    const iv = setInterval(spawnBubble, 2800)
    return () => clearInterval(iv)
  }, [spawnBubble])

  const popBubble = useCallback(
    (id: number) => {
      soundService.playPop()
      setBubbles((prev) =>
        prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
      )
      setTimeout(() => {
        removeBubble(id)
      }, 300)

      setBubblesPopped((n) => {
        const next = n + 1
        if (next >= TARGET_BUBBLES && !bubbleUnlockShown.current) {
          bubbleUnlockShown.current = true
          onUnlockSlot2()
          setShowUnlockModal(true)
        }
        return next
      })
    },
    [onUnlockSlot2, removeBubble]
  )

  return {
    bubbles,
    bubblesPopped,
    showUnlockModal,
    setShowUnlockModal,
    popBubble,
    removeBubble,
  }
}
