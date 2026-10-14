/**
 * PricingService (OOP)
 * Encapsulates pricing logic, currency formatting, and dynamic flash sale formulas.
 */
export interface PriceTiers {
  nac1_price: number
  nac2_price: number
  nac1_label: string
  nac2_label: string
  nac1_discount_pct: number
  nac2_discount_pct: number
}

export class PricingService {
  /**
   * Formats a raw number or string into Vietnamese Dong (VND), e.g. "120.000 đ"
   */
  public formatVND(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return ""
    const digits = val.toString().replace(/\D/g, "")
    return digits !== ""
      ? new Intl.NumberFormat("vi-VN").format(Number(digits)) + " đ"
      : ""
  }

  /**
   * Formats a raw number or string into thousand-separated digits for input fields, e.g. "120.000"
   */
  public formatInputNumber(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return ""
    const digits = val.toString().replace(/\D/g, "")
    if (!digits) return ""
    return new Intl.NumberFormat("vi-VN").format(Number(digits))
  }

  /**
   * Parses formatted VND string or numeric input into raw integer value
   */
  public parseVND(val: string | number | null | undefined): number {
    if (typeof val === "number") return val
    if (!val) return 0
    return Number(val.replace(/\D/g, "")) || 0
  }

  /**
   * Universal dynamic tier calculator:
   * Works for all price points from 20k to 20M without pricing inversion bugs.
   */
  public calculateTiers(originalPrice: number, currentPrice: number): PriceTiers {
    const validOrig = originalPrice > 0 ? originalPrice : currentPrice
    const validCurrent = currentPrice > 0 ? currentPrice : validOrig

    // Nấc 1: Luôn lấy con số nhỏ hơn giữa mức giảm 10% và giá sàn đang bán
    const rawNac1 = validOrig >= 1000
      ? Math.round((validOrig * 0.9) / 1000) * 1000
      : Math.round(validOrig * 0.9)
    const nac1_price = Math.min(rawNac1, validCurrent)

    // Nấc 2 (Mua chậm giá hời): Canh đợt đại sale giảm sâu 28%
    const rawNac2 = validOrig >= 1000
      ? Math.round((validOrig * 0.72) / 1000) * 1000
      : Math.round(validOrig * 0.72)
    const nac2_price = (validCurrent > 0 && rawNac2 >= validCurrent)
      ? Math.min(rawNac2, Math.round((validCurrent * 0.85) / 1000) * 1000 || Math.round(validCurrent * 0.85))
      : rawNac2

    // Hiển thị nhãn thông minh khách quan
    let nac1_label = "Mức 1: Giảm nhẹ 10% (Cho ai cần mua gấp)"
    if (validCurrent < validOrig * 0.9) {
      const discountPercent = Math.round(((validOrig - validCurrent) / validOrig) * 100)
      nac1_label = `Mức 1: Giá sàn hiện tại (Đang rẻ hơn gốc ${discountPercent}%)`
    }

    const nac2_label = "Mức 2: Săn Đại Sale -28% (Mua chậm giá hời)"

    const nac1_discount_pct = validOrig > 0
      ? Math.max(0, Math.round(((validOrig - nac1_price) / validOrig) * 100))
      : 10
    const nac2_discount_pct = validOrig > 0
      ? Math.max(0, Math.round(((validOrig - nac2_price) / validOrig) * 100))
      : 28

    return {
      nac1_price,
      nac2_price,
      nac1_label,
      nac2_label,
      nac1_discount_pct,
      nac2_discount_pct,
    }
  }

  /**
   * Calculates default auto-target price when preview is fetched
   */
  public calculateDefaultTarget(rawPrice: number, origPrice: number): number {
    const validOrig = Math.max(origPrice, rawPrice)
    const rawNac2 = validOrig >= 1000
      ? Math.round((validOrig * 0.72) / 1000) * 1000
      : Math.round(validOrig * 0.72)

    return (rawPrice > 0 && rawNac2 >= rawPrice)
      ? Math.min(rawNac2, Math.round((rawPrice * 0.85) / 1000) * 1000 || Math.round(rawPrice * 0.85))
      : rawNac2
  }
}

export const pricingService = new PricingService()
