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
  drop1: number
  drop2: number
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
   * Săn mức giảm thêm (Delta VNĐ) từ currentPrice
   */
  public calculateTiers(originalPrice: number, currentPrice: number): PriceTiers {
    const validOrig = originalPrice > 0 ? originalPrice : currentPrice
    const validCurrent = currentPrice > 0 ? currentPrice : validOrig

    // Mức 1 (-10%): Tính số tiền giảm thêm
    const drop1 = Math.max(1000, Math.round((validCurrent * 0.10) / 1000) * 1000)
    // Giá mục tiêu lưu xuống DB cho Bot canh: nac1_price = validCurrent - drop1
    const nac1_price = Math.max(0, validCurrent - drop1)
    // Nhãn hiển thị trên UI: Mức 1: Hú còi khi Shop giảm thêm ${this.formatVND(drop1)} (-10%)
    const nac1_label = `Mức 1: Hú còi khi Shop giảm thêm ${this.formatVND(drop1)} (-10%)`

    // Mức 2 (-28%): Tính số tiền giảm thêm
    const drop2 = Math.max(2000, Math.round((validCurrent * 0.28) / 1000) * 1000)
    // Giá mục tiêu lưu xuống DB cho Bot canh: nac2_price = validCurrent - drop2
    const nac2_price = Math.max(0, validCurrent - drop2)
    // Nhãn hiển thị trên UI: Mức 2: Săn Đại Sale khi Shop giảm thêm ${this.formatVND(drop2)} (-28%)
    const nac2_label = `Mức 2: Săn Đại Sale khi Shop giảm thêm ${this.formatVND(drop2)} (-28%)`

    return {
      nac1_price,
      nac2_price,
      nac1_label,
      nac2_label,
      nac1_discount_pct: 10,
      nac2_discount_pct: 28,
      drop1,
      drop2,
    }
  }

  /**
   * Calculates default auto-target price when preview is fetched
   */
  public calculateDefaultTarget(rawPrice: number, origPrice: number): number {
    const tiers = this.calculateTiers(origPrice, rawPrice)
    return tiers.nac2_price
  }
}

export const pricingService = new PricingService()
