import React from "react"
import { BubbleData, SpotlightStep } from "../../types"

interface RadarBubblesProps {
  bubbles: BubbleData[]
  onPop: (id: number) => void
  onExpire?: (id: number) => void
  spotlightStep: SpotlightStep
}

export function RadarBubbles({
  bubbles,
  onPop,
  onExpire,
  spotlightStep,
}: RadarBubblesProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: "hidden", zIndex: 20 }}
    >
      {bubbles.map((b) => (
        <div
          key={b.id}
          className={`bubble-item${b.popped ? " bubble-popped" : ""}`}
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            bottom: -10,
            animationName: b.popped ? "pop-sparkle" : "radar-bubble-drift",
            animationDuration: b.popped ? "0.3s" : `${b.duration}s`,
            animationTimingFunction: b.popped
              ? "cubic-bezier(0.1,0.9,0.2,1)"
              : "ease-in-out",
            pointerEvents: b.popped ? "none" : "auto",
            animationPlayState:
              spotlightStep !== "none" ? "paused" : "running",
          }}
          onClick={() =>
            !b.popped && spotlightStep !== "slot1" && onPop(b.id)
          }
          onAnimationEnd={(e) => {
            if (e.animationName === "radar-bubble-drift" && onExpire) {
              onExpire(b.id)
            }
          }}
        >
          {b.icon}
        </div>
      ))}
    </div>
  )
}
