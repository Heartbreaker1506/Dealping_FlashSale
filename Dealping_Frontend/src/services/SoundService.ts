/**
 * SoundService (OOP)
 * Encapsulates Web Audio API synthesis for bubble pops and siren price-drop alarms.
 */
export class SoundService {
  private getAudioContext(): AudioContext | null {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return null
      return new AudioCtx()
    } catch {
      return null
    }
  }

  /**
   * Plays snappy bubble pop sound
   */
  public playPop(): void {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(450 + Math.random() * 250, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(
        850 + Math.random() * 250,
        ctx.currentTime + 0.08
      )
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch (e) {
      // Audio context may be blocked by browser policy until user gesture
    }
  }

  /**
   * Plays dramatic 2-layer siren price drop alert (sawtooth sweep + high-frequency pings)
   */
  public playPriceDropAlarm(): void {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime

      // 1. Lớp còi hụ báo động (Sawtooth sweep qua filter)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = "sawtooth"
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(1400, now)

      // 4 nhịp hụ còi liên thanh dồn dập (0.45s / nhịp)
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.45
        osc.frequency.setValueAtTime(550, t)
        osc.frequency.linearRampToValueAtTime(1250, t + 0.22)
        osc.frequency.linearRampToValueAtTime(550, t + 0.44)
      }

      gain.gain.setValueAtTime(0.45, now)
      gain.gain.setValueAtTime(0.45, now + 1.8)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.1)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 2.1)

      // 2. Lớp chuông Ping điện tử cao tầng tạo cảm giác giật mình sập giá
      for (let i = 0; i < 4; i++) {
        const pingTime = now + i * 0.45
        const pingOsc = ctx.createOscillator()
        const pingGain = ctx.createGain()

        pingOsc.type = "sine"
        pingOsc.frequency.setValueAtTime(1760, pingTime)
        pingOsc.frequency.exponentialRampToValueAtTime(880, pingTime + 0.2)

        pingGain.gain.setValueAtTime(0.35, pingTime)
        pingGain.gain.exponentialRampToValueAtTime(0.001, pingTime + 0.2)

        pingOsc.connect(pingGain)
        pingGain.connect(ctx.destination)

        pingOsc.start(pingTime)
        pingOsc.stop(pingTime + 0.2)
      }
    } catch (e) {
      console.error("Lỗi phát âm thanh chuông báo động:", e)
    }
  }
}

export const soundService = new SoundService()
