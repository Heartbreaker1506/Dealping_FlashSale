import React from "react"

export type View = "onboarding" | "welcome" | "main" | "wishlist" | "price_chart" | "account"

export type SpotlightStep = "none" | "slot1" | "radar"

export interface PriceDropData {
  productName: string
  oldPrice: number
  newPrice: number
  flashSalePrice: number
  imageUrl?: string | null
  affiliateUrl?: string | null
  slotNum?: number
  cashbackCommission?: number
  discountCodes?: string[]
  platformBadge?: string
  timestamp?: string
}

export interface BubbleData {
  id: number
  icon: React.ReactNode
  left: number
  size: number
  duration: number
  popped: boolean
}

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export interface Rank {
  name: string
  emoji: string
  min: number
  slots: number
  color: string
}

export interface ToastData {
  title: string
  msg: string
  icon: string
}

export interface OrderDetailData {
  slotNum?: number
  itemId?: string | null
  productName: string
  productImage?: string | null
  productPrice?: string | number
  targetPrice?: string | number
  basePrice?: number
  originalPrice?: number
  voucherPrice?: number | null
  variant?: string
  url?: string
  affiliateUrl?: string | null
  status?: string
  statusLabel?: string
  lastCheckedText?: string
  advice?: string
}

export interface SlotItemState {
  itemId: string | null
  input: string
  expanded: boolean
  active: boolean
  variant: string
  variantOptions: any[]
  targetPrice: string
  productName: string
  productPrice: string
  previewName: string
  previewPrice: string
  basePrice: number
  originalPrice: number
  voucherPrice: number | null
  imageUrl: string | null
  affiliateUrl: string | null
  previewLoading: boolean
  sending: boolean
  lastChecked: string
  status: string
  advice: string
}

export interface ChartPoint {
  date: string
  price: number
}

export interface ChartItem {
  id: string
  name: string
  url: string
  imageUrl?: string | null
  isBottom?: boolean
  data: ChartPoint[]
}

export interface PreviewData {
  productName: string
  price: number
  currentPrice: number
  originalPrice?: number
  voucherPrice: number | null
  imageUrl: string | null
  affiliateUrl: string
  offerLink?: string
  variants: any[]
}
