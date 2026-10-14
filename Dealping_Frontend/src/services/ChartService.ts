import { ChartPoint } from "../types"

/**
 * ChartService (OOP)
 * Handles historical price series simulation, data interpolation, and chart curve generation.
 */
export class ChartService {
  /**
   * Generates a realistic 12-hour simulation of price fluctuation down to basePrice
   */
  public generateMockDayData(basePrice: number): ChartPoint[] {
    const data: ChartPoint[] = []
    const points = 12 * 2 // 12 hours, each hour 2 points = 24 points
    const now = new Date()

    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 30 * 60000)
      const hours = time.getHours().toString().padStart(2, "0")
      const mins = time.getMinutes().toString().padStart(2, "0")
      const day = time.getDate().toString().padStart(2, "0")
      const month = (time.getMonth() + 1).toString().padStart(2, "0")
      const label = `${hours}:${mins} ${day}/${month}`

      // Simulated trend downwards towards basePrice
      const progress = (points - i) / points // 0 -> 1
      const trend =
        basePrice + basePrice * 0.25 * (1 - Math.pow(progress, 2))

      // Random noise +/- 2%
      const noise = (Math.random() - 0.5) * (basePrice * 0.04)

      let simulatedPrice = Math.round((trend + noise) / 1000) * 1000

      if (i === 0) {
        simulatedPrice = Math.round(basePrice / 1000) * 1000
        data.push({ date: "Vừa quét", price: simulatedPrice })
      } else {
        data.push({ date: label, price: simulatedPrice })
      }
    }
    return data
  }
}

export const chartService = new ChartService()
