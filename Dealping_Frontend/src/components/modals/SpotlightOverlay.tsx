import React, { useState, useLayoutEffect } from "react"
import { SpotlightStep, Rect } from "../../types"

interface SpotlightOverlayProps {
  step: SpotlightStep
  targetRef: React.RefObject<HTMLInputElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onNext: () => void
  onDone: () => void
}

export function SpotlightOverlay({
  step,
  targetRef,
  containerRef,
  onNext,
  onDone,
}: SpotlightOverlayProps) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [bubbleRect, setBubbleRect] = useState<Rect | null>(null)
  const [radarRect, setRadarRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    if (!containerRef.current) return

    if (step === "slot1" && targetRef.current) {
      const slotBox = targetRef.current.getBoundingClientRect()
      const containerBox = containerRef.current.getBoundingClientRect()

      setRect({
        top: slotBox.top - containerBox.top,
        left: slotBox.left - containerBox.left,
        width: slotBox.width,
        height: slotBox.height,
      })
    } else if (step === "radar") {
      const radarEl = document.getElementById("radar-header-area")
      const cBox = containerRef.current.getBoundingClientRect()

      if (radarEl) {
        const rBox = radarEl.getBoundingClientRect()
        setRadarRect({
          top: rBox.top - cBox.top,
          left: rBox.left - cBox.left,
          width: rBox.width,
          height: rBox.height,
        })

        const bubbles = Array.from(
          document.querySelectorAll(".bubble-item:not(.bubble-popped)")
        ) as HTMLElement[]
        let foundVisible = false
        for (const b of bubbles) {
          const bBox = b.getBoundingClientRect()
          const bCenterY = bBox.top + bBox.height / 2
          if (bCenterY > rBox.top + 20 && bCenterY < rBox.bottom - 20) {
            const style = window.getComputedStyle(b)
            if (parseFloat(style.opacity) > 0.1) {
              setBubbleRect({
                top: bBox.top - cBox.top,
                left: bBox.left - cBox.left,
                width: bBox.width,
                height: bBox.height,
              })
              foundVisible = true
              break
            }
          }
        }
        if (!foundVisible) setBubbleRect(null)
      }
    }
  }, [step, targetRef, containerRef])

  if (step === "none") return null

  // ── STEP 1: spotlight the slot1 card ──────────────────────────────────────
  if (step === "slot1") {
    const pad = 4
    const r = rect ?? { top: 310, left: 16, width: 340, height: 70 }
    const holeTop = r.top - pad
    const holeLeft = r.left - pad
    const holeW = r.width + pad * 2
    const holeH = r.height + pad * 2
    const holeBottom = holeTop + holeH
    const tooltipTop = holeBottom + 16

    return (
      <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
        {/* Invisible blocker to prevent interacting with background during tutorial */}
        <div className="absolute inset-0 pointer-events-auto" />

        {/* Cutout using box-shadow to make it fully rounded */}
        <div
          className="absolute pointer-events-none rounded-[24px]"
          style={{
            top: holeTop,
            left: holeLeft,
            width: holeW,
            height: holeH,
            boxShadow:
              "0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 2px rgba(139,92,246,0.8), 0 0 24px 6px rgba(139,92,246,0.35)",
          }}
        />

        {/* Tooltip below the input */}
        <div
          className="absolute pointer-events-auto"
          style={{
            top: tooltipTop,
            left: 16,
            right: 16,
          }}
        >
          <div className="bg-white rounded-[20px] p-4 shadow-2xl relative">
            <p className="text-[12px] font-bold text-slate-800 leading-snug mb-3">
              <b>Bước 1:</b> Dán link món đồ muốn săn (Shopee, TikTok, Lazada) vào
              ô này — hệ thống sẽ canh giá 24/7 cho bạn!
            </p>
            <button
              onClick={onNext}
              className="w-full py-2 rounded-xl apple-glow-btn text-white font-bold text-[11px] active:scale-95 transition cursor-pointer"
            >
              Tiếp tục ➔
            </button>
            {/* Arrow pointing UP to the input */}
            <div
              className="absolute w-0 h-0"
              style={{
                top: -10,
                left: 36,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "10px solid white",
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: glowing dot in radar area, tooltip below ─────────────────────
  const fallbackTop = radarRect
    ? radarRect.top + radarRect.height / 2 - 50
    : 100
  const fallbackLeft = radarRect
    ? radarRect.left + radarRect.width / 2 - 100
    : 60

  const bTop = bubbleRect ? bubbleRect.top + bubbleRect.height / 2 : fallbackTop
  const bLeft = bubbleRect
    ? bubbleRect.left + bubbleRect.width / 2
    : fallbackLeft

  const bW = bubbleRect ? bubbleRect.width + 16 : 56
  const bH = bubbleRect ? bubbleRect.height + 16 : 56

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {/* Invisible blocker to prevent interacting with background during tutorial */}
      <div className="absolute inset-0 pointer-events-auto" />

      {/* Cutout hole capturing the bubble */}
      <div
        className="absolute pointer-events-none rounded-full flex items-center justify-center"
        style={{
          top: bTop - bH / 2,
          left: bLeft - bW / 2,
          width: bW,
          height: bH,
          boxShadow:
            "0 0 0 9999px rgba(0,0,0,0.78), 0 0 10px 2px rgba(236,72,153,0.55), 0 0 20px 4px rgba(139,92,246,0.3)",
        }}
      >
        {!bubbleRect && (
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm md:backdrop-blur- border border-white/50 flex items-center justify-center animate-bounce">
            <span className="text-xl">🎁</span>
          </div>
        )}
      </div>

      {/* Arrow line from dot down to tooltip */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: bTop + bH / 2 + 4,
          left: bLeft,
          transform: "translateX(-50%)",
          width: 2,
          height: 32,
          background:
            "linear-gradient(to bottom, rgba(236,72,153,0.8), transparent)",
        }}
      />

      {/* Tooltip below */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: bTop + bH / 2 + 40, left: 16, right: 16 }}
      >
        <div className="bg-white rounded-[20px] p-4 shadow-2xl relative">
          <div
            className="absolute w-0 h-0"
            style={{
              top: -10,
              left: bLeft - 16,
              transform: "translateX(-50%)",
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid white",
            }}
          />
          <p className="text-[12px] font-bold text-slate-800 leading-snug mb-3">
            <b>Bước 2:</b> Thấy bong bóng bay quanh Radar chưa? Chạm nổ đủ{" "}
            <b>10 bóng</b> để mở khoá thêm Ô săn deal thứ 2!
          </p>
          <button
            onClick={onDone}
            className="w-full py-2 rounded-xl apple-glow-btn text-white font-bold text-[11px] active:scale-95 transition cursor-pointer"
          >
            Đã hiểu, bắt đầu săn ngay! 🎉
          </button>
        </div>
      </div>
    </div>
  )
}
