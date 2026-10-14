import { useState, useCallback } from "react"
import { View, SpotlightStep } from "../types"
import { TUTORIAL_KEY } from "../constants"

export function useTutorial() {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem("dealping_onboarded")
      if (done === "true") return "main"
    }
    return typeof Notification !== "undefined" &&
      Notification.permission === "granted"
      ? "welcome"
      : "onboarding"
  })

  const [spotlightStep, setSpotlightStep] = useState<SpotlightStep>("none")

  const enterMain = useCallback((showTutorial = true) => {
    localStorage.setItem("dealping_onboarded", "true")
    setView("main")
    const isTutorialDone = localStorage.getItem(TUTORIAL_KEY)
    if (showTutorial && !isTutorialDone) {
      setTimeout(() => setSpotlightStep("slot1"), 450)
    }
  }, [])

  const finishTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, "true")
    setSpotlightStep("none")
  }, [])

  const restartTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_KEY)
    setSpotlightStep("none")
    setView("welcome")
  }, [])

  return {
    view,
    setView,
    spotlightStep,
    setSpotlightStep,
    enterMain,
    finishTutorial,
    restartTutorial,
  }
}
