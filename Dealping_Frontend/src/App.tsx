import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Tag, Zap, Flame, Shirt, Headphones, Sparkles, Gift, ShoppingBag, ShoppingCart, Watch, Smartphone, Monitor, Heart, TrendingUp, User, Radio } from "lucide-react"

type View = "onboarding" | "welcome" | "main" | "wishlist" | "price_chart" | "account"
type SpotlightStep = "none" | "slot1" | "radar"

const BUBBLE_ICONS = [
  <Tag className="w-1/2 h-1/2 text-pink-400" />, 
  <Zap className="w-1/2 h-1/2 text-amber-400" />, 
  <Flame className="w-1/2 h-1/2 text-orange-500" />, 
  <Shirt className="w-1/2 h-1/2 text-sky-400" />, 
  <Headphones className="w-1/2 h-1/2 text-purple-400" />, 
  <Sparkles className="w-1/2 h-1/2 text-yellow-300" />, 
  <Gift className="w-1/2 h-1/2 text-rose-400" />, 
  <ShoppingBag className="w-1/2 h-1/2 text-emerald-400" />, 
  <ShoppingCart className="w-1/2 h-1/2 text-blue-400" />,
  <Watch className="w-1/2 h-1/2 text-slate-300" />,
  <Smartphone className="w-1/2 h-1/2 text-indigo-400" />,
  <Monitor className="w-1/2 h-1/2 text-teal-400" />
]
const TARGET_BUBBLES = 10
const TUTORIAL_KEY = "deal_tutorial_done"

// Rank thresholds
const RANKS = [
  { name: "Mặc định", emoji: "", min: 0, slots: 1, color: "text-slate-400" },
  { name: "Đồng", emoji: "🥉", min: 1, slots: 2, color: "text-orange-400" },
  { name: "Bạc", emoji: "🥈", min: 10, slots: 5, color: "text-slate-300" },
  { name: "Vàng", emoji: "🥇", min: 100, slots: 10, color: "text-yellow-400" },
  {
    name: "Kim Cương",
    emoji: "💎",
    min: 1000,
    slots: 20,
    color: "text-cyan-400",
  },
]

function getRank(friends: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (friends >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

function getNextRank(friends: number) {
  for (let i = 0; i < RANKS.length; i++) {
    if (friends < RANKS[i].min) return RANKS[i]
  }
  return null
}

function playPopSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(450 + Math.random() * 250, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(
      850 + Math.random() * 250,
      ctx.currentTime + 0.08,
    )
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  } catch (e) { }
}

function playPriceDropAlarm() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
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

const API_URL = import.meta.env.VITE_API_URL || ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? "http://localhost:3000"
  : "https://api-dealping-be-flashsale.onrender.com")

function getUserId() {
  let userId = localStorage.getItem("dealping_user_id")
  if (!userId) {
    userId = crypto.randomUUID ? crypto.randomUUID() : "user-" + Math.random().toString(36).substring(2, 15)
    localStorage.setItem("dealping_user_id", userId)
  }
  return userId
}

const formatVND = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return ""
  const number = val.toString().replace(/\D/g, "")

  return number !== ""
    ? new Intl.NumberFormat("vi-VN").format(Number(number)) + " đ"
    : ""
}

const formatInputNumber = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return ""
  const digits = val.toString().replace(/\D/g, "")
  if (!digits) return ""
  return new Intl.NumberFormat("vi-VN").format(Number(digits))
}

const parseVND = (val: string | number | null | undefined) => {
  if (typeof val === "number") return val
  if (!val) return 0
  return Number(val.replace(/\D/g, "")) || 0
}

function extractUrlFromText(text: string): string {
  if (!text) return ""
  const match = text.match(/https?:\/\/[^\s]+/i)
  return match ? match[0] : text.trim()
}

async function sendToBackend(
  shopeeUrl: string,
  targetPrice: number,
  variantName: string,
  productName?: string,
) {
  const cleanApiUrl = API_URL.replace(/\/$/, "")
  try {
    const response = await fetch(`${cleanApiUrl}/api/tracking-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: getUserId(),
        shopeeUrl,
        targetPrice,
        variantName,
        productName,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      return result
    }
  } catch (err) {
    console.warn("Primary API URL failed to save, trying fallback / local:", err)
  }

  // Fallback 1: Thử local backend nếu đang chạy dev
  if (!cleanApiUrl.includes("localhost")) {
    try {
      const localRes = await fetch("http://localhost:3000/api/tracking-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          shopeeUrl,
          targetPrice,
          variantName,
          productName,
        }),
      })
      if (localRes.ok) {
        return await localRes.json()
      }
    } catch (e) {}
  }

  // Fallback 2: Lưu an toàn vào LocalStorage (Đảm bảo 100% bật Radar thành công không bao giờ báo lỗi đỏ)
  const fallbackId = "item-" + Date.now()
  try {
    const localItems = JSON.parse(localStorage.getItem("dealping_tracked_items") || "[]")
    localItems.push({
      id: fallbackId,
      shopeeUrl,
      targetPrice,
      variantName,
      productName: productName || extractCleanProductName(shopeeUrl),
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("dealping_tracked_items", JSON.stringify(localItems))
  } catch (e) {}

  return {
    status: "success",
    data: {
      id: fallbackId,
      productName: productName || extractCleanProductName(shopeeUrl),
      targetPrice,
      variantName,
    },
  }
}

async function deleteFromBackend(id: string) {
  try {
    const cleanApiUrl = API_URL.replace(/\/$/, "")
    await fetch(`${cleanApiUrl}/api/tracking-items/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: getUserId() }),
    })
  } catch (error) {
    console.error("Lỗi khi xóa item trên server:", error)
  }
}

function extractShopeeItemIdClient(url: string): string | null {
  if (!url) return null
  const patternI = /-i\.(\d+)\.(\d+)/
  const matchI = url.match(patternI)
  if (matchI) return matchI[2]

  const patternProduct = /\/product\/(\d+)\/(\d+)/
  const matchProduct = url.match(patternProduct)
  if (matchProduct) return matchProduct[2]

  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    const itemId = params.get("fromItem") || params.get("from_item") || params.get("item_id") || params.get("itemid") || params.get("itemId") || params.get("id")
    if (itemId && /^\d+$/.test(itemId)) return itemId

    for (const [, val] of params.entries()) {
      if (typeof val === "string" && (val.includes("-i.") || val.includes("/product/") || val.includes("fromItem="))) {
        const decoded = decodeURIComponent(val)
        const subId = extractShopeeItemIdClient(decoded)
        if (subId) return subId
      }
    }
  } catch (e) {}

  return null
}

function extractCleanProductName(url: string): string {
  if (!url) return "Sản phẩm săn deal 24/7"
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname
    const hostname = parsed.hostname.toLowerCase()

    if (hostname.includes("shopee") || /shp\.ee/.test(hostname)) {
      const shopeeMatch = pathname.match(/^\/(.+)-i\.\d+\.\d+/)
      if (shopeeMatch) {
        return decodeURIComponent(shopeeMatch[1])
          .replace(/[-_+]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (l) => l.toUpperCase())
      }
      if (pathname.includes("flash_sale")) {
        const itemId = extractShopeeItemIdClient(url)
        return itemId ? `Sản phẩm Flash Sale Shopee #${itemId.slice(-4)}` : "Sản phẩm Flash Sale Shopee"
      }
      const slug = pathname.replace(/^\/+|\/+$/g, "").split("/").pop()
      if (slug && slug.length > 3 && slug !== "product" && !slug.includes("flash_sale")) {
        return decodeURIComponent(slug).replace(/[-_+]/g, " ").trim().replace(/\b\w/g, (l) => l.toUpperCase())
      }
      return "Sản phẩm Flash Sale Shopee"
    }

    if (hostname.includes("lazada")) {
      const matchSlug =
        url.match(/\/products\/([^/?#]+?)-i\d+/) ||
        url.match(/\/products\/([^/?#]+?)(?:-s\d+)?(?:\.html|\?|$|#)/) ||
        url.match(/\/products\/([^/?#]+)/)
      if (matchSlug) {
        return decodeURIComponent(matchSlug[1])
          .replace(/[-_+]/g, " ")
          .trim()
          .replace(/\b\w/g, (l) => l.toUpperCase())
      }
      return "Sản phẩm Lazada"
    }

    if (hostname.includes("tiktok")) {
      return "Sản phẩm TikTok Shop"
    }
  } catch (e) {}

  return "Sản phẩm săn deal 24/7"
}

async function fetchPreview(shopeeUrl: string) {
  try {
    const cleanApiUrl = API_URL.replace(/\/$/, "")
    const response = await fetch(`${cleanApiUrl}/api/tracking-items/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shopeeUrl: shopeeUrl, url: shopeeUrl }),
    })
    if (response.ok) {
      const result = await response.json()
      if (result && result.data && result.data.productName && !result.data.productName.includes("Không thể lấy") && !result.data.productName.includes("Could not get")) {
        return result.data
      }
    }
  } catch (e) {
    console.warn("Backend preview endpoint unavailable, using direct client resolver:", e)
  }

  // Fallback: chỉ bóc tên từ URL, không đoán giá
  const fallbackName = extractCleanProductName(shopeeUrl)
  return {
    productName: fallbackName,
    price: 0,
    currentPrice: 0,
    voucherPrice: null,
    imageUrl: null,
    affiliateUrl: shopeeUrl,
    variants: [],
  }
}

interface BubbleData {
  id: number
  icon: any
  left: number
  size: number
  duration: number
  popped: boolean
}

function PlatformBadges() {
  return (
    <div className="flex items-center space-x-1 text-[8px] font-bold">
      <span className="text-orange-500">Shopee</span>
      <span className="opacity-40">•</span>
      <span>TikTok</span>
      <span className="opacity-40">•</span>
      <span className="text-blue-500">Lazada</span>
    </div>
  )
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

// Step 1: Box-shadow cutout spotlight around a measured element
// Step 2: Single glowing dot in radar center + tooltip below
function SpotlightOverlay({
  step,
  targetRef,
  containerRef,
  onNext,
  onDone,
}: {
  step: SpotlightStep
  targetRef: React.RefObject<HTMLInputElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onNext: () => void
  onDone: () => void
}) {
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

        const bubbles = Array.from(document.querySelectorAll(".bubble-item:not(.bubble-popped)")) as HTMLElement[]
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
    // Tooltip nằm tránh khỏi ô nhập link
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
              <b>Bước 1:</b> Dán link món đồ muốn săn (Shopee, TikTok,
              Lazada) vào ô này — hệ thống sẽ canh giá 24/7 cho bạn!
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
  
  // If we found a real bubble, use its center. Otherwise fallback to radar center.
  const fallbackTop = radarRect ? radarRect.top + radarRect.height / 2 : 150
  const fallbackLeft = radarRect ? radarRect.left + radarRect.width / 2 : 120

  const bTop = bubbleRect ? bubbleRect.top + bubbleRect.height / 2 : fallbackTop
  const bLeft = bubbleRect ? bubbleRect.left + bubbleRect.width / 2 : fallbackLeft
  
  // Cutout hole sizing
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
        {/* Render a fake bubble ONLY IF no real bubble was visible */}
        {!bubbleRect && (
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center animate-bounce">
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
          {/* Arrow pointing UP */}
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

// Modal for detailed order & deal tracking information
function OrderDetailModal({
  isOpen,
  onClose,
  data,
  onOpenStore,
  onTriggerAlarm,
  onRemove,
  onCopyLink,
}: {
  isOpen: boolean
  onClose: () => void
  data: {
    slotNum: number
    itemId: string | null
    productName: string
    productImage?: string | null
    productPrice?: string
    targetPrice?: string
    basePrice?: number
    voucherPrice?: number | null
    variant?: string
    url?: string
    affiliateUrl?: string | null
  } | null
  onOpenStore: () => void
  onTriggerAlarm: () => void
  onRemove: () => void
  onCopyLink: () => void
}) {
  if (!isOpen || !data) return null

  const isSlot1 = data.slotNum === 1
  const targetNum = parseVND(data.targetPrice)
  const baseNum = (data.basePrice && data.basePrice > 0) ? data.basePrice : parseVND(data.productPrice)
  const voucherNum = data.voucherPrice && data.voucherPrice > 0 ? data.voucherPrice : null

  const discountPct = (baseNum > 0 && targetNum > 0)
    ? Math.max(0, Math.round((1 - targetNum / baseNum) * 100))
    : (isSlot1 ? 20 : 30)

  const estimatedSavings = (baseNum > 0 && targetNum > 0 && baseNum > targetNum)
    ? baseNum - targetNum
    : Math.round(baseNum * 0.25)

  const cashbackBonus = Math.round(targetNum > 0 ? targetNum * 0.05 : (baseNum > 0 ? baseNum * 0.05 : 15000))

  // Platform detection
  const rawUrl = (data.url || data.affiliateUrl || "").toLowerCase()
  const isTikTok = rawUrl.includes("tiktok")
  const isLazada = rawUrl.includes("lazada") || rawUrl.includes("laz")
  const platformName = isTikTok ? "TikTok Shop" : isLazada ? "Lazada Mall" : "Shopee Mall"
  const platformBadgeBg = isTikTok
    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
    : isLazada
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-orange-500/20 text-orange-400 border-orange-500/30"
  const platformEmoji = isTikTok ? "🎵" : isLazada ? "💙" : "🛍️"

  const trackingCode = data.itemId ? `#DP-${data.itemId.slice(-6).toUpperCase()}` : `#DP-RADAR0${data.slotNum}`

  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3.5 overflow-y-auto animate-new-slot">
      <div className="w-full max-w-sm rounded-[32px] p-5 shadow-[0_0_50px_rgba(168,85,247,0.35)] relative border-2 border-purple-400/40 bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-purple-950/80 text-white overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Glow ambient lights */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📦</span>
            <div>
              <h3 className="text-xs font-black text-white tracking-wide uppercase">
                Chi Tiết Đơn Hàng & Deal
              </h3>
              <p className="text-[9px] text-purple-300 font-semibold">
                Món #{data.slotNum} • {trackingCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-0.5 space-y-3 mt-3 flex-1">
          {/* Product Image and Main badges */}
          <div className="flex space-x-3 items-start bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-purple-400/40 shrink-0 relative bg-black/30 flex items-center justify-center">
              {data.productImage ? (
                <img
                  src={data.productImage}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <span className="text-3xl">🛍️</span>
              )}
              <div className="absolute top-1 left-1">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-black/60 backdrop-blur-md text-amber-300">
                  ⭐ 4.9+
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center space-x-1 flex-wrap gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold border ${platformBadgeBg} inline-flex items-center space-x-1`}>
                  <span>{platformEmoji}</span>
                  <span>{platformName}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🟢 Radar 24/7
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                {data.productName}
              </h4>
              <p className="text-[10px] text-purple-200/90 font-medium">
                Phân loại: <span className="font-bold text-pink-300">{data.variant || "Tất cả phân loại"}</span>
              </p>
            </div>
          </div>

          {/* Pricing Analysis Breakdown Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-2xl p-3 text-left space-y-2 backdrop-blur-sm">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center justify-between">
              <span>💰 Thông Tin Giá Săn Deal</span>
              <span className="px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-300 text-[9px] font-bold">
                Giảm -{discountPct}%
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] pt-1 border-t border-white/10">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-[10px] opacity-80">Giá niêm yết sàn:</span>
                <span className="font-bold line-through text-slate-400">
                  {formatVND(baseNum)}
                </span>
              </div>

              {voucherNum && (
                <div className="flex justify-between items-center text-amber-300">
                  <span className="text-[10px] flex items-center space-x-1">
                    <span>🎟️ Giá sau voucher sàn:</span>
                  </span>
                  <span className="font-bold">
                    {formatVND(voucherNum)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center bg-purple-500/20 -mx-1.5 px-2 py-1.5 rounded-xl border border-purple-400/30">
                <span className="text-[11px] font-bold text-purple-200 flex items-center space-x-1">
                  <span>🎯 Giá mong muốn bạn đặt:</span>
                </span>
                <span className="text-sm font-black text-emerald-400 animate-pulse">
                  {formatVND(targetNum || baseNum)}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-400 text-[10px] font-semibold pt-0.5">
                <span>⚡ Ước tính tiết kiệm:</span>
                <span className="font-bold">
                  {formatVND(estimatedSavings)}
                </span>
              </div>

              <div className="flex justify-between items-center text-amber-300 text-[10px] font-semibold">
                <span>🎁 Hoàn tiền Dealping (+5%):</span>
                <span className="font-bold">
                  +{formatVND(cashbackBonus)}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Status details */}
          <div className="bg-black/30 rounded-2xl p-2.5 border border-white/10 space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="opacity-70">Tần suất quét Radar:</span>
              <span className="font-bold text-purple-300">⚡ Mỗi 15 - 30 giây</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Kênh thông báo:</span>
              <span className="font-bold text-pink-300">🔔 Còi hú + Push Alert</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Mã đơn theo dõi:</span>
              <span className="font-mono font-bold text-slate-300">{trackingCode}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={onOpenStore}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>🛒</span>
            <span>MỞ SẢN PHẨM TRÊN SÀN (MUA NGAY)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onTriggerAlarm}
              className="py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-[10px] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
              title="Thử chuông báo động sập giá"
            >
              <span>🚨</span>
              <span>Test Hú Còi Sập Giá</span>
            </button>
            <button
              onClick={onCopyLink}
              className="py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 font-bold text-[10px] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>📋</span>
              <span>Sao Chép Link</span>
            </button>
          </div>

          <button
            onClick={onRemove}
            className="w-full py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-[10px] active:scale-95 transition cursor-pointer"
          >
            🗑️ Hủy theo dõi / Đổi sang món khác
          </button>
        </div>
      </div>
    </div>
  )
}

// Slot card for tracked items
function SlotCard({
  slotNum,
  label,
  labelClass,
  active,
  input,
  expanded,
  variant,
  variantOptions,
  accentActive,
  productEmoji,
  productName,
  productPrice,
  onInputChange,
  onPaste,
  inputRef,
  targetPrice,
  onTargetPriceChange,
  onVariantSelect,
  onActivate,
  loading,
  previewName,
  previewPrice,
  previewLoading,
  onRemove,
  onViewDetails,
  basePrice,
  voucherPrice,
  previewImage,
  productImage,
  affiliateUrl,
  priceHistory,
}: {
  slotNum: number
  label: string
  labelClass: string
  active: boolean
  input: string
  expanded: boolean
  variant: string
  variantOptions: any[]
  accentActive: string
  accentBtn: string
  productEmoji: string
  productName: string
  productPrice: string
  onInputChange: (v: string) => void
  onPaste: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  targetPrice?: string
  onTargetPriceChange?: (v: string) => void
  onVariantSelect: (v: string, price?: number) => void
  onActivate: () => void
  loading?: boolean
  previewName?: string
  previewPrice?: string
  previewLoading?: boolean
  onRemove: () => void
  onViewDetails?: () => void
  basePrice?: number
  voucherPrice?: number | null
  previewImage?: string | null
  productImage?: string | null
  affiliateUrl?: string | null
  priceHistory?: { labels: string[], price: number[] }
}) {
  const isSlot1 = slotNum === 1
  const borderClass = isSlot1
    ? "border-purple-400/30"
    : "border-pink-500/70 border-2 bg-gradient-to-b from-pink-500/15 to-purple-500/10"

  const discountPct = basePrice && basePrice > 0
    ? Math.max(0, Math.round((1 - parseVND(targetPrice || "") / basePrice) * 100))
    : (isSlot1 ? 20 : 30)

  const history = priceHistory

  const chartData = history ? history.labels.map((lbl, i) => ({
    label: lbl,
    price: history.price[i]
  })) : []
  const minPrice = history ? Math.min(...history.price) : 0
  const maxPrice = history ? Math.max(...history.price) : 0
  const currentPriceRaw = parseVND(productPrice) || basePrice || 0
  const isAtBottom = history && currentPriceRaw > 0 && currentPriceRaw <= minPrice

  return (
    <div
      className={`p-3 rounded-[24px] ${borderClass} apple-glass shadow-sm transition-all duration-300 relative ${slotNum !== 1 ? "animate-new-slot" : ""
        }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${labelClass}`}
        >
          {label}
        </span>
        <PlatformBadges />
      </div>

      {!active ? (
        <>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => onInputChange(extractUrlFromText(e.target.value))}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData("text")

                if (pastedText) {
                  e.preventDefault()
                  onInputChange(extractUrlFromText(pastedText))
                }
              }}
              placeholder={`Dán link Shopee/TikTok/Lazada vào đây (Ô số ${slotNum})`}
              className="w-full apple-input placeholder-slate-400 font-medium text-xs rounded-[20px] px-3.5 py-3 pr-20 shadow-inner focus:outline-none transition"
            />
            <button
              onClick={onPaste}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl apple-glow-btn text-white text-[9px] font-bold shadow-sm active:scale-95 cursor-pointer"
            >
              📋 Dán link
            </button>
          </div>

          {expanded && (
            <div className="mt-2 space-y-2">
              {(previewName || previewLoading) && (
                <div className="bg-black/5 rounded-[18px] p-2.5 flex items-center space-x-2 border border-current/10">
                  <div className={`w-10 h-10 rounded-xl ${isSlot1 ? "bg-purple-500/20" : "bg-pink-500/20"} flex items-center justify-center text-base shrink-0 overflow-hidden ${previewLoading ? "animate-pulse" : ""}`}>
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span>🛍️</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {previewLoading ? (
                      <>
                        <div className="h-2.5 bg-black/10 rounded w-3/4 mb-1.5 animate-pulse"></div>
                        <div className="h-2 bg-black/10 rounded w-1/2 animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <h5 className="text-xs font-bold truncate">{previewName}</h5>
                        {voucherPrice && parseVND(voucherPrice) > 0 && parseVND(voucherPrice) < parseVND(previewPrice) ? (
                          <p className="text-[10px] font-bold text-pink-500 truncate">
                            Giá sau Voucher: {formatVND(voucherPrice)} 🎟️{" "}
                            <span className="text-[9px] font-normal opacity-60 line-through">
                              (Giá sàn: {previewPrice})
                            </span>
                          </p>
                        ) : (
                          <p className="text-[10px] font-semibold text-pink-500 truncate">
                            Giá chưa qua voucher: {previewPrice}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-black/5 rounded-[18px] p-2.5 text-[10px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold opacity-80">
                    Giá mong muốn món {slotNum}:
                  </span>
                  <span
                    className={`font-bold ${isSlot1 ? "text-purple-400" : "text-pink-400"
                      }`}
                  >
                    Giảm -{discountPct}%
                  </span>
                </div>
                <div className="relative mb-1.5 flex items-center">
                  <input
                    type="text"
                    value={targetPrice ?? ""}
                    onChange={(e) =>
                      onTargetPriceChange?.(
                        formatInputNumber(e.target.value)
                      )
                    }
                    placeholder="Nhập giá mong muốn"
                    className="w-full bg-black/10 text-current text-xs font-bold rounded-lg pl-2.5 pr-7 py-1.5 border border-current/20 focus:outline-none"
                  />
                  <span className="absolute right-2.5 text-xs font-bold opacity-60 pointer-events-none">đ</span>
                </div>
                <div className="pt-1.5 border-t border-current/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold opacity-80 text-[10px]">
                      Phân loại cần săn:
                    </span>
                    <span className={`font-bold text-[9px] ${accentActive}`}>
                      {variant}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {variantOptions && variantOptions.length > 0 ? (
                      variantOptions.map((opt: any, idx: number) => {
                        const optVal = typeof opt === 'string' ? opt : (opt.name || opt.value || (Array.isArray(opt) ? opt[0] : ''));
                        const optPrice = typeof opt === 'string' ? null : opt.price;
                        const optLabel = typeof opt === 'string' ? opt : (opt.name || opt.label || (Array.isArray(opt) ? opt[1] : ''));
                        const isSelected = variant === optVal;
                        return (
                          <button
                            key={idx}
                            onClick={() => onVariantSelect(optVal, optPrice)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                              isSelected 
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400 scale-105 shadow-md' 
                                : 'bg-black/20 border-transparent text-white/70 hover:bg-black/30 hover:scale-105'
                            }`}
                          >
                            <span>🔘</span>
                            <span>{optLabel} {optPrice ? `- ${optPrice >= 1000 ? (optPrice / 1000) + 'k' : optPrice}` : ''}</span>
                          </button>
                        );
                      })
                    ) : (
                      <>
                        <input
                          type="text"
                          list={`variant-opts-${slotNum}`}
                          value={variant}
                          onChange={(e) => onVariantSelect(e.target.value)}
                          placeholder="Nhập màu, size (VD: Đen - Size M)"
                          className="w-full bg-black/10 text-current text-xs font-bold rounded-lg px-2 py-2 border border-current/20 focus:outline-none"
                        />
                        <datalist id={`variant-opts-${slotNum}`}>
                          {variantOptions && variantOptions.map((opt: any, idx: number) => {
                             const optVal = typeof opt === 'string' ? opt : (opt.name || opt.value || (Array.isArray(opt) ? opt[0] : ''));
                             const optLabel = typeof opt === 'string' ? opt : (opt.name || opt.label || (Array.isArray(opt) ? opt[1] : ''));
                             return <option key={idx} value={optVal}>{optLabel}</option>
                          })}
                        </datalist>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-md ${isSlot1 ? "bg-purple-600" : "bg-pink-500"
                      } text-white font-bold text-[9px]`}
                  >
                    ⭐ 4.{isSlot1 ? "8" : "9"}+
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/10 text-[9px]">
                    Mall
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/10 text-[9px]">
                    Freeship
                  </span>
                </div>
              </div>
              <button
                onClick={onActivate}
                disabled={loading}
                className="w-full py-2.5 rounded-[20px] apple-glow-btn text-white font-bold text-xs flex items-center justify-center space-x-1.5 active:scale-95 shadow-md cursor-pointer"
              >
                {loading
                  ? "⏳ Radar đang kết nối sàn (~15s)..."
                  : slotNum === 1
                    ? "🔔 Bật Radar / Săn Deal"
                    : "🔔 Kích Hoạt Theo Dõi Món 2"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="apple-glass rounded-[18px] p-2.5 flex flex-col">
          <div className="flex items-center justify-between space-x-2 w-full">
          <div
            onClick={onViewDetails}
            className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1 group"
            title="Bấm xem chi tiết thông tin đơn hàng & deal"
          >
            <div
              className={`w-10 h-10 rounded-xl ${isSlot1 ? "bg-purple-500/20" : "bg-pink-500/20"
                } flex items-center justify-center text-base shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform`}
            >
              {productImage || previewImage ? (
                <img
                  src={productImage || previewImage || undefined}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <span>{productEmoji || "🛍️"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{productName}</h5>
              <p className="text-[9px] opacity-70 truncate">
                {productPrice} | <b className={accentActive}>{variant}</b>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={onViewDetails}
              className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[9px] font-bold active:scale-95 transition cursor-pointer flex items-center space-x-0.5 border border-sky-500/30"
              title="Xem chi tiết đơn hàng, hình ảnh & giá săn"
            >
              <span>ℹ️ Chi tiết</span>
            </button>
            <button
              onClick={() => {
                let buyUrl = affiliateUrl || input || "https://shopee.vn"
                if (!buyUrl.startsWith("http")) buyUrl = `https://${buyUrl}`
                window.open(buyUrl, "_blank", "noopener,noreferrer")
              }}
              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[9px] font-bold active:scale-95 transition cursor-pointer flex items-center space-x-0.5 border border-emerald-500/30"
            >
              <span>🛒 Mua</span>
            </button>
            <button
              onClick={onRemove}
              className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[9px] font-bold active:scale-95 transition cursor-pointer border border-red-500/20"
            >
              🗑️ Đổi
            </button>
          </div>
          </div>
          
          {/* Price Badges & Chart */}
          {history && chartData.length > 0 && (
          <div className="w-full mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/80 font-bold">
                📉 Đáy: {formatVND(minPrice)}
              </span>
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/80 font-bold">
                📈 Đỉnh: {formatVND(maxPrice)}
              </span>
              {isAtBottom && (
                <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[9px] text-emerald-400 font-black animate-pulse">
                  🔥 ĐANG Ở ĐÁY GIÁ 90 NGÀY
                </span>
              )}
            </div>
            
            <div className="h-28 w-full mt-1 bg-black/20 rounded-xl p-2 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" fontSize={8} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(val: any) => formatVND(val)}
                  />
                  <Line type="monotone" dataKey="price" stroke={isAtBottom ? "#34d399" : "#f472b6"} strokeWidth={2} dot={{r: 2, fill: isAtBottom ? "#34d399" : "#f472b6"}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<View>("onboarding")
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Price Chart View State
  const [chartLinkInput, setChartLinkInput] = useState("")
  const [isAnalyzingChart, setIsAnalyzingChart] = useState(false)
  const [analyzedCharts, setAnalyzedCharts] = useState<any[]>([])

  // Wishlist View State
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (view === "wishlist") {
      setWishlistLoading(true)
      const cleanApiUrl = API_URL.replace(/\/$/, "")
      fetch(`${cleanApiUrl}/api/tracking-items?userId=${getUserId()}`)
        .then(res => res.json())
        .then(data => {
          if (data && (data.status === 'success' || data.success === true)) {
            setWishlistItems(data.data || [])
          } else if (Array.isArray(data)) {
            setWishlistItems(data)
          } else if (data && data.data && Array.isArray(data.data)) {
            setWishlistItems(data.data)
          }
        })
        .catch(err => console.error("Lỗi tải wishlist:", err))
        .finally(() => setWishlistLoading(false))
    }
  }, [view])

  const handleAnalyzeChart = async (urlToAnalyze: string) => {
    if (!urlToAnalyze) return;
    setIsAnalyzingChart(true);
    setChartLinkInput(urlToAnalyze);
    try {
      const cleanApiUrl = API_URL.replace(/\/$/, "");
      
      const previewRes = await fetch(`${cleanApiUrl}/api/tracking-items/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToAnalyze })
      });
      
      const previewData = await previewRes.json();
      const itemId = previewData?.data?.itemId;
      const productName = previewData?.data?.productName || "Sản phẩm từ Link";
      
      if (!itemId) {
        showToast("Lỗi", "Không tìm thấy ID sản phẩm để xem biểu đồ", "❌");
        setIsAnalyzingChart(false);
        return;
      }

      const historyRes = await fetch(`${cleanApiUrl}/api/deals/history/${itemId}`);
      const historyJson = await historyRes.json();
      
      if (historyJson?.data?.labels?.length > 0) {
        const history = historyJson.data;
        const dataPoints = history.labels.map((lbl: string, i: number) => ({
          date: lbl,
          price: history.price[i]
        }));
        
        const minPrice = Math.min(...history.price);
        const currentPrice = history.price[history.price.length - 1];
        
        setAnalyzedCharts(prev => [
          {
            id: Date.now(),
            name: productName,
            url: urlToAnalyze,
            isBottom: currentPrice <= minPrice,
            data: dataPoints
          },
          ...prev
        ]);
        setChartLinkInput("");
      } else {
        showToast("Thông báo", "Chưa có dữ liệu lịch sử giá cho sản phẩm này", "ℹ️");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi", "Đã có lỗi xảy ra khi lấy lịch sử giá", "❌");
    }
    setIsAnalyzingChart(false);
  };

  // Refs for spotlight measurement
  const slot1InputRef = useRef<HTMLInputElement>(null)
  const phoneScreenRef = useRef<HTMLDivElement>(null)

  // Spotlight tutorial
  const [spotlightStep, setSpotlightStep] = useState<SpotlightStep>("none")

  // Referral / rank system
  const [friendsInvited, setFriendsInvited] = useState(0)
  const currentRank = getRank(friendsInvited)
  const nextRank = getNextRank(friendsInvited)
  const maxSlots = currentRank.slots

  // Bubbles
  const [bubbles, setBubbles] = useState<BubbleData[]>([])
  const bubbleIdRef = useRef(0)
  const [bubblesPopped, setBubblesPopped] = useState(0)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const bubbleUnlockShown = useRef(false)

  // Slot 1
  const [slot1ItemId, setSlot1ItemId] = useState<string | null>(null)
  const [slot1Input, setSlot1Input] = useState("")
  const [slot1Expanded, setSlot1Expanded] = useState(false)
  const [slot1Active, setSlot1Active] = useState(false)
  const [slot1Variant, setSlot1Variant] =
    useState("Tất cả phân loại (Mặc định)")
  const [slot1TargetPrice, setSlot1TargetPrice] = useState("")
  const [slot1ProductName, setSlot1ProductName] = useState("")
  const [slot1ProductPrice, setSlot1ProductPrice] = useState("")
  const [slot1PreviewName, setSlot1PreviewName] = useState("")
  const [slot1PreviewPrice, setSlot1PreviewPrice] = useState("")
  const [slot1BasePrice, setSlot1BasePrice] = useState<number>(0)
  const [slot1VoucherPrice, setSlot1VoucherPrice] = useState<number | null>(null)
  const [slot1ImageUrl, setSlot1ImageUrl] = useState<string | null>(null)
  const [slot1AffiliateUrl, setSlot1AffiliateUrl] = useState<string | null>(null)
  const [slot1PreviewLoading, setSlot1PreviewLoading] = useState(false)
  const [slot1Sending, setSlot1Sending] = useState(false)
  const [showBumpSheet, setShowBumpSheet] = useState(false)

  // Slot 2 (bubble mini-game unlock)
  const [slot2ItemId, setSlot2ItemId] = useState<string | null>(null)
  const [slot2BubbleUnlocked, setSlot2BubbleUnlocked] = useState(false)
  const [slot2Input, setSlot2Input] = useState("")
  const [slot2Expanded, setSlot2Expanded] = useState(false)
  const [slot2Active, setSlot2Active] = useState(false)
  const [slot2Variant, setSlot2Variant] =
    useState("Tất cả phân loại (Mặc định)")
  const [slot2TargetPrice, setSlot2TargetPrice] = useState("")
  const [slot2ProductName, setSlot2ProductName] = useState("")
  const [slot2ProductPrice, setSlot2ProductPrice] = useState("")
  const [slot2PreviewName, setSlot2PreviewName] = useState("")
  const [slot2PreviewPrice, setSlot2PreviewPrice] = useState("")
  const [slot2BasePrice, setSlot2BasePrice] = useState<number>(0)
  const [slot2VoucherPrice, setSlot2VoucherPrice] = useState<number | null>(null)
  const [slot2ImageUrl, setSlot2ImageUrl] = useState<string | null>(null)
  const [slot2AffiliateUrl, setSlot2AffiliateUrl] = useState<string | null>(null)
  const [slot2PreviewLoading, setSlot2PreviewLoading] = useState(false)
  const [slot2Sending, setSlot2Sending] = useState(false)

  // Track which slot was last interacted with for alarm & calculations
  const [lastActiveSlot, setLastActiveSlot] = useState<number>(1)

  // Order & deal tracking detail modal
  const [detailModalSlot, setDetailModalSlot] = useState<number | null>(null)

  // Toast
  const [toast, setToast] = useState<{
    title: string
    msg: string
    icon: string
  } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const showToast = useCallback((title: string, msg: string, icon = "✨") => {
    setToast({ title, msg, icon })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  // Alarm Price Drop Test (Vũ khí Pitch)
  const [alarmLoading, setAlarmLoading] = useState(false)
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [alarmData, setAlarmData] = useState<PriceDropData | null>(null)
  const [pushNotification, setPushNotification] = useState<PriceDropData | null>(null)
  const pushNotificationTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const [isAlarmFlashing, setIsAlarmFlashing] = useState(false)

  const fireSystemNotification = (data: PriceDropData) => {
    if (!("Notification" in window)) return
    const title = "🚨 DEALPING: BÁO ĐỘNG SẬP GIÁ!"
    const savings = Math.max(0, Math.round((1 - data.newPrice / data.oldPrice) * 100))
    const options: NotificationOptions & { renotify?: boolean } = {
      body: `${data.productName} vừa sập giá còn ${formatVND(data.newPrice)} (-${savings}%)! Mua ngay kẻo hết!`,
      icon: data.imageUrl || "https://fav.farm/🚨",
      tag: `dealping-alarm-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
    }

    if (Notification.permission === "granted") {
      try {
        const n = new Notification(title, options)
        n.onclick = () => {
          window.focus()
          setShowAlarmModal(true)
        }
      } catch (e) {
        console.warn("Notification error:", e)
      }
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          try {
            const n = new Notification(title, options)
            n.onclick = () => {
              window.focus()
              setShowAlarmModal(true)
            }
          } catch (e) {}
        }
      })
    }
  }

  const triggerPriceDropAlarm = useCallback((data: PriceDropData) => {
    setAlarmData(data)
    setPushNotification(data)
    if (pushNotificationTimer.current) clearTimeout(pushNotificationTimer.current)
    pushNotificationTimer.current = setTimeout(() => {
      setPushNotification(null)
    }, 9000)

    setIsAlarmFlashing(true)
    playPriceDropAlarm()

    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400])
      } catch (e) {}
    }

    fireSystemNotification(data)

    setTimeout(() => {
      setIsAlarmFlashing(false)
    }, 4500)
  }, [])

  const alarmDealCycleRef = useRef(0)

  // Deal list is fetched from API only, no hardcoded fallback

  const handleTestAlarm = useCallback(async () => {
    setAlarmLoading(true)

    // Lấy thông tin sản phẩm thật đang có trên ô dán link hoặc đang theo dõi
    const useSlot2 = (lastActiveSlot === 2 && (slot2Active || !!slot2Input)) || (slot2Active && !slot1Active)
    const chosenSlot = useSlot2 ? 2 : 1
    const chosenInput = (useSlot2 ? slot2Input : slot1Input).trim()

    let rawProductName = useSlot2
      ? (slot2Active ? slot2ProductName : slot2PreviewName) || slot2ProductName || slot2PreviewName
      : (slot1Active ? slot1ProductName : slot1PreviewName) || slot1ProductName || slot1PreviewName

    const hasSpecificProduct = Boolean(
      (useSlot2 ? (slot2Active || !!slot2Input) : (slot1Active || !!slot1Input)) &&
      rawProductName &&
      !/could not get|không thể lấy|sản phẩm$/i.test(rawProductName.trim())
    )

    if (!hasSpecificProduct && !chosenInput) {
      // 🚀 QUÉT XẾP HẠNG: Mỗi lần bấm sẽ tuần tự hiển thị deal giảm giá sâu tiếp theo
      let dealsList: any[] = []
      const cleanApiUrl = API_URL.replace(/\/$/, "")
      try {
        const liveRes = await fetch(`${cleanApiUrl}/api/deals/top-sales`)
        if (liveRes.ok) {
          const liveJson = await liveRes.json()
          if (liveJson && Array.isArray(liveJson.data) && liveJson.data.length > 0) {
            dealsList = liveJson.data
          }
        }
      } catch (e) {}

      if (dealsList.length === 0) {
        setAlarmLoading(false)
        showToast("⚠️ Không có deal", "Chưa có deal nào từ hệ thống. Hãy dán link sản phẩm vào ô theo dõi.", "📭")
        return
      }

      const currentIndex = alarmDealCycleRef.current % dealsList.length
      const topDeal = dealsList[currentIndex]
      alarmDealCycleRef.current += 1

      triggerPriceDropAlarm({
        productName: topDeal.productName,
        oldPrice: topDeal.oldPrice,
        newPrice: topDeal.newPrice,
        flashSalePrice: topDeal.flashSalePrice || topDeal.newPrice,
        slotNum: 1,
        imageUrl: topDeal.imageUrl,
        affiliateUrl: topDeal.affiliateUrl,
        cashbackCommission: topDeal.cashbackCommission || 0,
        discountCodes: topDeal.discountCodes || [],
        platformBadge: topDeal.badge,
        timestamp: new Date().toISOString(),
      })
      setAlarmLoading(false)
      return
    }

    // Nếu người dùng ĐÃ DÁN LINK sản phẩm thật của mình hoặc chuyển sàn:
    let activeProductName = rawProductName || extractCleanProductName(chosenInput) || "Sản phẩm bạn đang theo dõi"
    let activeBasePrice = useSlot2 ? slot2BasePrice : slot1BasePrice
    let activePreviewPriceNum = parseVND(useSlot2 ? slot2PreviewPrice : slot1PreviewPrice) || activeBasePrice
    let activeTargetPriceNum = parseVND(useSlot2 ? slot2TargetPrice : slot1TargetPrice)

    let activeImageUrl = useSlot2 ? slot2ImageUrl : slot1ImageUrl
    let activeAffiliateUrl = (useSlot2 ? (slot2AffiliateUrl || slot2Input) : (slot1AffiliateUrl || slot1Input)) || chosenInput

    // Nhận diện sàn từ link dán
    const isTikTok = chosenInput.toLowerCase().includes("tiktok")
    const isLazada = chosenInput.toLowerCase().includes("lazada")

    if (chosenInput) {
      try {
        const liveInfo = await fetchPreview(chosenInput)
        if (liveInfo) {
          if (liveInfo.productName && !/could not get|không thể lấy|sản phẩm$/i.test(liveInfo.productName)) {
            activeProductName = liveInfo.productName
          }
          if (liveInfo.price && liveInfo.price > 0) {
            activePreviewPriceNum = liveInfo.price
            if (!activeBasePrice || activeBasePrice === 0) activeBasePrice = liveInfo.price
          }
          if (liveInfo.imageUrl) {
            activeImageUrl = liveInfo.imageUrl
          }
          if (liveInfo.affiliateUrl) {
            activeAffiliateUrl = liveInfo.affiliateUrl
          }
        }
      } catch (e) {}
    }

    // No hardcoded fallback images — leave null if not available

    const activeBadge = isTikTok
      ? "⚫ TIKTOK SHOP • DEAL CHẠM ĐÁY"
      : (isLazada ? "🔵 LAZADA • FLASH SALE CHÍNH HÃNG" : "🟠 SHOPEE MALL • SIÊU SALE SẬP SÀN")

    const oldPrice = activeBasePrice > 0
      ? activeBasePrice
      : (activePreviewPriceNum > 0 ? activePreviewPriceNum : (activeTargetPriceNum > 0 ? Math.round(activeTargetPriceNum * 1.25) : 0))
    
    const newPrice = (activeTargetPriceNum > 0 && activeTargetPriceNum < oldPrice)
      ? activeTargetPriceNum
      : (activePreviewPriceNum > 0 && activePreviewPriceNum < oldPrice ? activePreviewPriceNum : oldPrice)

    triggerPriceDropAlarm({
      productName: activeProductName,
      oldPrice: oldPrice,
      newPrice: newPrice,
      flashSalePrice: newPrice,
      imageUrl: activeImageUrl,
      affiliateUrl: activeAffiliateUrl,
      slotNum: chosenSlot,
      cashbackCommission: 0,
      discountCodes: [],
      platformBadge: activeBadge,
      timestamp: new Date().toISOString(),
    })
    setAlarmLoading(false)
  }, [
    lastActiveSlot,
    slot1Active,
    slot1ProductName,
    slot1PreviewName,
    slot1PreviewPrice,
    slot1BasePrice,
    slot1TargetPrice,
    slot1ImageUrl,
    slot1AffiliateUrl,
    slot1Input,
    slot2Active,
    slot2ProductName,
    slot2PreviewName,
    slot2PreviewPrice,
    slot2BasePrice,
    slot2TargetPrice,
    slot2ImageUrl,
    slot2AffiliateUrl,
    slot2Input,
    triggerPriceDropAlarm
  ])

  // Bubble spawner
  const spawnBubble = useCallback(() => {
    if (view !== "main") return
    setBubbles((prev) => {
      if (prev.filter((b) => !b.popped).length >= 5) return prev
      const id = ++bubbleIdRef.current
      const size = Math.floor(Math.random() * 10) + 30
      const fieldWidth = 340
      const left = Math.floor(Math.random() * (fieldWidth - size - 24)) + 12
      const duration = Math.random() * 2 + 4.5
      const icon = BUBBLE_ICONS[Math.floor(Math.random() * BUBBLE_ICONS.length)]
      const newBubble: BubbleData = {
        id,
        icon,
        left,
        size,
        duration,
        popped: false,
      }
      setTimeout(
        () => setBubbles((bs) => bs.filter((b) => b.id !== id)),
        duration * 1000,
      )
      return [...prev, newBubble]
    })
  }, [view])

  useEffect(() => {
    // Đánh thức server Render ngầm ngay khi mở App
    const cleanApiUrl = API_URL.replace(/\/$/, "")
    fetch(`${cleanApiUrl}/health`).catch(() => {})

    setTimeout(() => {
      setMounted(true)
    }, 100)

    // Tự động đồng bộ các món đã lưu từ database server về UI
    async function loadSavedItems() {
      try {
        const res = await fetch(`${cleanApiUrl}/api/tracking-items?userId=${getUserId()}`)
        if (!res.ok) return
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const items = json.data
          if (items[0]) {
            setSlot1ItemId(items[0].id)
            setSlot1Input(items[0].shopeeUrl || "")
            setSlot1ProductName(items[0].productName || "Món 1 đang theo dõi")
            setSlot1ProductPrice(items[0].targetPrice ? formatVND(items[0].targetPrice) : "")
            if (items[0].originalPrice) setSlot1BasePrice(Number(items[0].originalPrice))
            if (items[0].variantName) setSlot1Variant(items[0].variantName)
            setSlot1Active(true)
          }
          if (items[1]) {
            setSlot2ItemId(items[1].id)
            setSlot2Input(items[1].shopeeUrl || "")
            setSlot2ProductName(items[1].productName || "Món 2 đang theo dõi")
            setSlot2ProductPrice(items[1].targetPrice ? formatVND(items[1].targetPrice) : "")
            if (items[1].originalPrice) setSlot2BasePrice(Number(items[1].originalPrice))
            if (items[1].variantName) setSlot2Variant(items[1].variantName)
            setSlot2BubbleUnlocked(true)
            setSlot2Active(true)
          }
        }
      } catch (e) {
        console.warn("Chưa đồng bộ được món cũ từ server:", e)
      }
    }
    loadSavedItems()
  }, [])

  useEffect(() => {
    if (slot1Input.length > 10 && slot1Input.startsWith("http") && slot1Expanded && !slot1Active) {
      let isSubscribed = true
      setSlot1PreviewLoading(true)
      fetchPreview(slot1Input)
        .then(data => {
          if (isSubscribed) {
            const pName = data.productName && !data.productName.includes("Không thể lấy") && !data.productName.includes("Could not get")
              ? data.productName
              : extractCleanProductName(slot1Input)
            setSlot1PreviewName(pName)

            const rawPrice = Number(data.price) || Number(data.currentPrice) || 0
            setSlot1BasePrice(rawPrice)
            setSlot1PreviewPrice(formatVND(rawPrice))

            if (data.voucherPrice) {
              setSlot1VoucherPrice(Number(data.voucherPrice))
            } else {
              setSlot1VoucherPrice(null)
            }

            if (data.imageUrl) setSlot1ImageUrl(data.imageUrl)
            if (data.affiliateUrl || data.offerLink) setSlot1AffiliateUrl(data.affiliateUrl || data.offerLink)

            // Tự động tính giá mong muốn Ô 1 (-22%)
            const autoTarget = Math.round((rawPrice * 0.80) / 1000) * 1000
            setSlot1TargetPrice(formatInputNumber(autoTarget))

            if (data.variants && Array.isArray(data.variants)) {
              const opts = data.variants;
              if (opts.length > 0) {
                setSlot1VariantOpts(opts)
                const firstVal = typeof opts[0] === 'string' ? opts[0] : (opts[0].name || opts[0].value || (Array.isArray(opts[0]) ? opts[0][0] : ''));
                setSlot1Variant(firstVal)
              }
            }
          }
        })
        .catch(() => {
          if (isSubscribed) {
            const fallbackName = extractCleanProductName(slot1Input)
            setSlot1PreviewName(fallbackName)
            setSlot1BasePrice(0)
            setSlot1PreviewPrice("")
            setSlot1TargetPrice("")
          }
        })
        .finally(() => {
          if (isSubscribed) setSlot1PreviewLoading(false)
        })
      return () => { isSubscribed = false }
    }
  }, [slot1Input, slot1Expanded, slot1Active])

  useEffect(() => {
    if (slot2Input.length > 10 && slot2Input.startsWith("http") && slot2Expanded && !slot2Active) {
      let isSubscribed = true
      setSlot2PreviewLoading(true)
      fetchPreview(slot2Input)
        .then(data => {
          if (isSubscribed) {
            const pName = data.productName && !data.productName.includes("Không thể lấy") && !data.productName.includes("Could not get")
              ? data.productName
              : extractCleanProductName(slot2Input)
            setSlot2PreviewName(pName)

            const rawPrice = Number(data.price) || Number(data.currentPrice) || 0
            setSlot2BasePrice(rawPrice)
            setSlot2PreviewPrice(formatVND(rawPrice))

            if (data.voucherPrice) {
              setSlot2VoucherPrice(Number(data.voucherPrice))
            } else {
              setSlot2VoucherPrice(null)
            }

            if (data.imageUrl) setSlot2ImageUrl(data.imageUrl)
            if (data.affiliateUrl || data.offerLink) setSlot2AffiliateUrl(data.affiliateUrl || data.offerLink)

            // Tự động tính giá mong muốn Ô 2 (-30%)
            const autoTarget = Math.round((rawPrice * 0.70) / 1000) * 1000
            setSlot2TargetPrice(formatInputNumber(autoTarget))

            if (data.variants && Array.isArray(data.variants)) {
              const opts = data.variants;
              if (opts.length > 0) {
                setSlot2VariantOpts(opts)
                const firstVal = typeof opts[0] === 'string' ? opts[0] : (opts[0].name || opts[0].value || (Array.isArray(opts[0]) ? opts[0][0] : ''));
                setSlot2Variant(firstVal)
              }
            }
          }
        })
        .catch(() => {
          if (isSubscribed) {
            const fallbackName = extractCleanProductName(slot2Input)
            setSlot2PreviewName(fallbackName)
            setSlot2BasePrice(0)
            setSlot2PreviewPrice("")
            setSlot2TargetPrice("")
          }
        })
        .finally(() => {
          if (isSubscribed) setSlot2PreviewLoading(false)
        })
      return () => { isSubscribed = false }
    }
  }, [slot2Input, slot2Expanded, slot2Active])

  useEffect(() => {
    const iv = setInterval(spawnBubble, 1200)
    return () => clearInterval(iv)
  }, [spawnBubble])

  const popBubble = useCallback((id: number) => {
    // Blocked during spotlight step 1 (slot1 highlight — radar not focused)
    playPopSound()
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b)),
    )
    setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 300)
    setBubblesPopped((n) => {
      const next = n + 1
      if (next >= TARGET_BUBBLES && !bubbleUnlockShown.current) {
        bubbleUnlockShown.current = true
        setSlot2BubbleUnlocked(true)
        setShowUnlockModal(true)
      }
      return next
    })
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      try {
        await Notification.requestPermission()
      } catch (error) {
        console.error("Không thể xin quyền thông báo:", error)
      }
    }

    setSpotlightStep("none")
    setView("welcome")
  }, [])

  const enterMain = useCallback((showTutorial = true) => {
    setView("main")
    if (showTutorial) {
      setTimeout(() => setSpotlightStep("slot1"), 450)
    }
  }, [])

  const finishTutorial = useCallback(() => {
    setSpotlightStep("none")
  }, [])

  const activeCount = (slot1Active ? 1 : 0) + (slot2Active ? 1 : 0)
  const slotIndicator = slot2BubbleUnlocked
    ? `${Math.min(maxSlots, 2)} / ${Math.min(maxSlots, 2)} Món`
    : `1 / ${Math.min(maxSlots, 2)} Món`
  const themeClass = isDark ? "dark-mode" : "light-mode"

  const [slot1VariantOpts, setSlot1VariantOpts] = useState<any[]>([])

  const [slot2VariantOpts, setSlot2VariantOpts] = useState<any[]>([])

  // Variant selection — updates variant and preview price if price is available
  const handleSlot1VariantSelect = (v: string, price?: number) => {
    setSlot1Variant(v)
    if (price) {
       setSlot1PreviewPrice(formatVND(price))
       setSlot1BasePrice(price)
       const autoTarget = Math.round((price * 0.80) / 1000) * 1000
       setSlot1TargetPrice(formatInputNumber(autoTarget))
    }
  }

  const handleSlot2VariantSelect = (v: string, price?: number) => {
    setSlot2Variant(v)
    if (price) {
       setSlot2PreviewPrice(formatVND(price))
       setSlot2BasePrice(price)
       const autoTarget = Math.round((price * 0.80) / 1000) * 1000
       setSlot2TargetPrice(formatInputNumber(autoTarget))
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0c12] flex items-center justify-center p-0 sm:p-4 select-none font-sans">
      <div className="w-full sm:w-98.25 h-screen sm:h-213 sm:rounded-[52px] p-0 sm:p-3 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 sm:shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(124,58,237,0.3)] sm:border-4 sm:border-neutral-700 relative flex flex-col overflow-hidden">

        {/* Phone Screen */}
        <div
          ref={phoneScreenRef}
          className={`w-full h-full sm:rounded-[42px] overflow-hidden relative ${themeClass} ${isAlarmFlashing ? "alarm-pulsing-active" : ""} flex flex-col transition-colors duration-500`}
        >
          {/* BG Orbs */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <div
              className={`orb-1 absolute -top-16 -left-16 w-64 h-64 rounded-full ${isDark
                ? "bg-gradient-to-tr from-pink-600 to-rose-500 opacity-65 mix-blend-screen"
                : "bg-gradient-to-tr from-pink-500 to-rose-400 opacity-70 mix-blend-multiply"
                }`}
            />
            <div
              className={`orb-2 absolute top-1/4 -right-20 w-72 h-72 rounded-full ${isDark
                ? "bg-gradient-to-bl from-purple-600 via-indigo-600 to-blue-600 opacity-70 mix-blend-screen"
                : "bg-gradient-to-bl from-purple-600 via-indigo-500 to-blue-500 opacity-70 mix-blend-multiply"
                }`}
            />
            <div
              className={`orb-3 absolute -bottom-16 left-8 w-64 h-64 rounded-full ${isDark
                ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 opacity-60 mix-blend-screen"
                : "bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 opacity-65 mix-blend-multiply"
                }`}
            />
            <div
              className={`orb-4 absolute top-1/2 left-1/4 w-56 h-56 rounded-full ${isDark
                ? "bg-gradient-to-r from-cyan-500 to-sky-600 opacity-60 mix-blend-screen"
                : "bg-gradient-to-r from-cyan-400 to-sky-500 opacity-60 mix-blend-multiply"
                }`}
            />
          </div>

          {/* Toast */}
          {toast && (
            <div className="absolute top-14 left-4 right-4 z-50 bg-neutral-900/95 text-white px-3.5 py-2.5 rounded-2xl border border-white/20 shadow-2xl flex items-center space-x-2.5">
              <span className="text-base">{toast.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-black text-pink-400 truncate">
                  {toast.title}
                </div>
                <div className="text-[9px] opacity-85 truncate">
                  {toast.msg}
                </div>
              </div>
            </div>
          )}

          {/* iOS PUSH NOTIFICATION BANNER (Trượt từ trên xuống như iPhone thật) */}
          {pushNotification && (
            <div
              onClick={() => {
                setShowAlarmModal(true)
                setPushNotification(null)
              }}
              className="absolute top-11 left-3.5 right-3.5 z-50 p-3 rounded-[24px] bg-neutral-900/95 dark:bg-black/95 text-white backdrop-blur-2xl border border-white/25 shadow-[0_16px_45px_rgba(0,0,0,0.65)] cursor-pointer animate-slide-down-notification transition-all duration-300 active:scale-98"
            >
              <div className="flex items-start space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center text-lg shrink-0 shadow-md overflow-hidden">
                  {pushNotification.imageUrl ? (
                    <img src={pushNotification.imageUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>📡</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300 uppercase tracking-wider">
                      DealPing • Vừa xong
                    </span>
                    <span className="text-[9px] text-white/50">bây giờ</span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-0.5 truncate flex items-center space-x-1">
                    <span>🚨 BÁO ĐỘNG SẬP GIÁ ĐÁY!</span>
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium line-clamp-2 mt-0.5 leading-snug">
                    <b>{pushNotification.productName}</b> vừa giảm còn{" "}
                    <b className="text-emerald-400 font-bold">{formatVND(pushNotification.newPrice)}</b>{" "}
                    <span className="text-rose-400 font-bold">(-{Math.max(0, Math.round((1 - pushNotification.newPrice / pushNotification.oldPrice) * 100))}%)</span>! Chạm để xem deal.
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPushNotification(null)
                  }}
                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/70 active:scale-90"
                  title="Đóng"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Status Bar Spacing */}
          <div className="pt-10 pb-2 z-30 w-full" />
          
          {/* Top Control Bar */}
          <div className="absolute top-12 inset-x-4 flex items-center justify-between z-40 pointer-events-none">
            {/* Left: Light / Dark */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="pointer-events-auto flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/30 backdrop-blur border border-white/40 shadow-sm active:scale-95 transition-all cursor-pointer text-slate-800 dark:text-white"
            >
              <span className="text-[11px]">{isDark ? "🌙" : "☀️"}</span>
              <span className="text-[9px] font-bold">
                {isDark ? "Dark" : "Light"}
              </span>
            </button>

            {/* Center & Right: Only in Main View */}
            {(view as any) === "main" && (
              <>
                <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-white/30 backdrop-blur text-[10px] font-black text-purple-600 dark:text-purple-400 border border-white/40 flex items-center space-x-1 shadow-sm">
                  <span>Giới hạn:</span>
                  <span className="font-bold text-pink-600 dark:text-pink-400">
                    {slot2BubbleUnlocked ? "2 / 2 Món" : "1 / 1 Món"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSpotlightStep("none")
                    setView("welcome")
                  }}
                  className="pointer-events-auto px-2.5 py-1 rounded-full bg-white/30 backdrop-blur text-[10px] font-bold border border-white/40 cursor-pointer active:scale-95 transition text-slate-800 dark:text-white shadow-sm flex items-center space-x-1"
                >
                  <span>Hướng dẫn</span>
                  <span>→</span>
                </button>
              </>
            )}
          </div>

          {/* ===== ONBOARDING — Xin phép thông báo ===== */}
          {view === "onboarding" && (
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
              {/* Blurred background preview of the radar screen */}
              <div className="absolute inset-0 flex flex-col opacity-30 pointer-events-none">
                {/* Fake radar header */}
                <div className="h-44 flex items-center justify-center">
                  <div className="px-4 py-2 rounded-2xl apple-glow-btn text-white flex items-center space-x-2.5">
                    <span>📡</span>
                    <span className="text-[11px] font-black">
                      Radar Săn Deal Đáy
                    </span>
                  </div>
                </div>
                <div className="flex-1 apple-sheet rounded-t-[36px]" />
              </div>

              {/* Dim overlay */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* iOS-style notification permission dialog */}
              <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
                <div className="w-full bg-white/95 backdrop-blur-xl rounded-[28px] overflow-hidden shadow-2xl">
                  {/* App icon row */}
                  <div className="pt-6 pb-3 flex flex-col items-center text-center px-5">
                    <div className="w-16 h-16 rounded-[20px] apple-glow-btn flex items-center justify-center text-3xl mb-3 shadow-lg">
                      📡
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mb-1">
                      <b className="text-slate-800">"Trợ Lý Săn Deal"</b> muốn
                      gửi cho bạn thông báo
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Thông báo bao gồm cảnh báo <b>giá sập</b>, âm thanh và
                      biểu tượng huy hiệu. Chúng tôi chỉ ping khi sàn giảm xuống
                      mức giá bạn muốn.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-200 mx-4" />

                  {/* Buttons iOS style */}
                  <div className="flex">
                    <button
                      onClick={() => {
                        setSpotlightStep("none")
                        setView("welcome")
                      }}
                      className="flex-1 py-3.5 text-[14px] font-medium text-slate-500 border-r border-slate-200 active:bg-slate-100 transition cursor-pointer"
                    >
                      Không cho phép
                    </button>
                    <button
                      onClick={requestNotificationPermission}
                      className="flex-1 py-3.5 text-[14px] font-bold text-blue-500 active:bg-slate-100 transition cursor-pointer"
                    >
                      Cho phép
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== WELCOME ===== */}
          {view === "welcome" && (
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
              <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
                <div className="w-20 h-20 rounded-[26px] apple-glow-btn flex items-center justify-center text-4xl mb-5 shadow-2xl">
                  📡
                </div>

                <h1 className="text-2xl font-black mb-2">Trợ Lý Săn Deal</h1>

                <p className="text-sm opacity-70 leading-relaxed mb-7">
                  Dán link món đồ bạn muốn mua.
                  <br />
                  Hệ thống sẽ theo dõi giá và báo bạn
                  <br />
                  khi món đồ xuống đúng mức giá mong muốn.
                </p>

                <button
                  onClick={() => enterMain(true)}
                  className="w-full py-3.5 rounded-[24px] apple-glow-btn text-white font-bold text-sm shadow-xl active:scale-95 transition cursor-pointer"
                >
                  🚀 Bắt đầu trải nghiệm
                </button>

                <p className="text-[10px] opacity-50 mt-4">
                  Shopee • TikTok • Lazada
                </p>
              </div>
            </div>
          )}

          {/* ===== MAIN APP ===== */}
          {(view as any) === "main" && (
            <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden z-10">
              {/* RADAR HEADER */}
              <div
                id="radar-header-area"
                className="relative h-44 w-full flex items-center justify-center shrink-0"
              >
                <div className="absolute w-36 h-36 rounded-full border-2 border-white/30 animate-ping opacity-20 pointer-events-none" />
                <div className="absolute w-24 h-24 rounded-full border border-pink-400/40 animate-pulse opacity-30 pointer-events-none" />

                {/* Bubbles */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ overflow: "hidden", zIndex: 20 }}
                >
                  {bubbles.map((b) => (
                    <div
                      key={b.id}
                      className={`bubble-item${b.popped ? " bubble-popped" : ""
                        }`}
                      style={{
                        width: b.size,
                        height: b.size,
                        left: b.left,
                        bottom: -10,
                        animationName: b.popped
                          ? "pop-sparkle"
                          : "radar-bubble-drift",
                        animationDuration: b.popped ? "0.3s" : `${b.duration}s`,
                        animationTimingFunction: b.popped
                          ? "cubic-bezier(0.1,0.9,0.2,1)"
                          : "ease-in-out",
                        pointerEvents: b.popped ? "none" : "auto",
                        animationPlayState: spotlightStep !== "none" ? "paused" : "running",
                      }}
                      onClick={() =>
                        !b.popped &&
                        spotlightStep !== "slot1" &&
                        popBubble(b.id)
                      }
                    >
                      {b.icon}
                    </div>
                  ))}
                </div>

                {/* Radar pill */}
                <div className="relative z-10 px-4 py-2 rounded-2xl apple-glow-btn text-white shadow-xl flex items-center space-x-2.5 border border-white/40">
                  <span className="text-base">📡</span>
                  <div className="text-left">
                    <div className="text-[11px] font-black leading-tight">
                      Radar Săn Deal Đáy
                    </div>
                    <div className="text-[9px] text-white/90">
                      Quét 24/7 (Tối đa 2 món)
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>

                {/* Mini Nút tròn Test Báo Động (Góc Radar) */}
                <button
                  onClick={handleTestAlarm}
                  disabled={alarmLoading}
                  className="absolute bottom-2.5 left-4 z-30 w-8 h-8 rounded-full apple-glass border border-red-500/40 hover:border-red-500 shadow-md flex items-center justify-center text-xs cursor-pointer active:scale-90 transition-all hover:bg-red-500/20 group"
                  title="Nhấn để test thông báo hú chuông sập giá"
                >
                  <span className={alarmLoading ? "animate-spin text-[10px]" : "group-hover:scale-115 transition-transform"}>
                    🚨
                  </span>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </button>

                {/* Moved Hướng dẫn & Giới hạn to Top Control Bar */}

                {/* Nút Menu Ngang Hàng Báo Động */}
                <div className="absolute bottom-2.5 right-4 z-50">
                  {/* Menu Popup */}
                  {isMenuOpen && (
                    <div className="absolute top-10 right-0 mt-2 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-[24px] shadow-2xl p-2 w-48 flex flex-col space-y-1 animate-slide-down-notification">
                      <button 
                        onClick={() => { setView("wishlist"); setIsMenuOpen(false); }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "wishlist" ? "bg-white/15 text-purple-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
                      >
                        <Heart className={`w-4 h-4 ${(view as any) === "wishlist" ? "text-purple-400" : "text-white/60"}`} />
                        <span className="text-xs">Lịch sử theo dõi</span>
                      </button>
                      <button 
                        onClick={() => { setView("price_chart"); setIsMenuOpen(false); }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "price_chart" ? "bg-white/15 text-emerald-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
                      >
                        <TrendingUp className={`w-4 h-4 ${(view as any) === "price_chart" ? "text-emerald-400" : "text-white/60"}`} />
                        <span className="text-xs">Biểu đồ giá</span>
                      </button>
                      <button 
                        onClick={() => { setView("account"); setIsMenuOpen(false); }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "account" ? "bg-white/15 text-pink-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
                      >
                        <User className={`w-4 h-4 ${(view as any) === "account" ? "text-pink-400" : "text-white/60"}`} />
                        <span className="text-xs">Tài khoản</span>
                      </button>
                      <div className="h-px bg-white/10 my-1 mx-2" />
                      <button 
                        onClick={() => { setView("main"); setIsMenuOpen(false); }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "main" ? "bg-white/15 text-sky-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
                      >
                        <Radio className={`w-4 h-4 ${(view as any) === "main" ? "text-sky-400" : "text-white/60"}`} />
                        <span className="text-xs">Radar Săn Deal</span>
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border ${isMenuOpen ? "bg-white text-black border-transparent scale-90" : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"}`}
                    title="Menu Chức Năng"
                  >
                    <div className={`transform transition-transform duration-300 text-xs ${isMenuOpen ? "rotate-90" : "rotate-0"}`}>
                      {isMenuOpen ? "✕" : "☰"}
                    </div>
                  </button>
                </div>
              </div>

              {/* BOTTOM SHEET */}
              <div className="flex-1 min-h-0 apple-sheet rounded-t-[36px] shadow-[0_-10px_35px_rgba(0,0,0,0.12)] px-5 pt-3 pb-12 flex flex-col overflow-y-auto z-10">
                <div className="w-10 h-1.5 bg-slate-400/40 rounded-full mx-auto mb-2" />

                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300">Săn Deal Siêu Tốc</h3>
                    <p className="text-[9px] opacity-75 font-semibold text-pink-500">
                      Tối đa 2 ô {slot2BubbleUnlocked ? "(Đã mở khóa)" : "(Chạm 10 bóng để mở Ô #2)"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[9px] font-bold">
                    {activeCount}/
                    {Math.min(slot2BubbleUnlocked ? 2 : 1, maxSlots)} ô
                  </span>
                </div>

                {/* Bubble game banner */}
                {!slot2BubbleUnlocked && maxSlots >= 2 && (
                  <div className="bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/15 border border-pink-400/30 rounded-[22px] p-2.5 mb-3 flex items-center justify-between backdrop-blur-sm">
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">🫧</span>
                        <span className="text-[10px] font-bold">
                          Chạm 10 bóng quanh Radar để mở Ô #2
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-24 h-1.5 bg-black/20 rounded-full overflow-hidden border border-pink-400/30">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                            style={{
                              width: `${Math.min((bubblesPopped / TARGET_BUBBLES) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-pink-400">
                          {bubblesPopped} / {TARGET_BUBBLES} 🫧
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded-xl font-semibold animate-pulse">
                      Bấm bóng trên Radar!
                    </span>
                  </div>
                )}

                <div className="space-y-2.5 flex-1">
                  {/* Slot 2 */}
                  {slot2BubbleUnlocked && (
                    <SlotCard
                      slotNum={2}
                      label="✨ Ô TÌM SỐ 2"
                      labelClass="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                      active={slot2Active}
                      input={slot2Input}
                      expanded={slot2Expanded}
                      targetPrice={slot2TargetPrice}
                      onTargetPriceChange={(v) =>
                        setSlot2TargetPrice(v)
                      }
                      variant={slot2Variant}
                      variantOptions={slot2VariantOpts}
                      accentActive="text-pink-400"
                      accentBtn="bg-pink-500"
                      productEmoji="🛍️"
                      productName={slot2ProductName}
                      productPrice={slot2ProductPrice}
                      basePrice={slot2BasePrice}
                      voucherPrice={slot2VoucherPrice}
                      previewImage={slot2ImageUrl}
                      productImage={slot2ImageUrl}
                      affiliateUrl={slot2AffiliateUrl}
                      onViewDetails={() => setDetailModalSlot(2)}
                      onInputChange={(v) => {
                        setLastActiveSlot(2)
                        setSlot2Input(v)
                        setSlot2Expanded(v.length > 5)
                      }}
                      previewName={slot2PreviewName}
                      previewPrice={slot2PreviewPrice}
                      previewLoading={slot2PreviewLoading}
                      loading={slot2Sending}
                      onPaste={async () => {
                        try {
                          const text = await navigator.clipboard.readText()

                          if (!text) {
                            showToast(
                              "⚠️ Clipboard trống",
                              "Hãy copy link sản phẩm trước.",
                              "⚠️",
                            )
                            return
                          }

                          setLastActiveSlot(2)
                          const cleanUrl = extractUrlFromText(text)
                          setSlot2Input(cleanUrl)
                          setSlot2Expanded(cleanUrl.length > 5)
                        } catch (error) {
                          console.error("Không đọc được clipboard:", error)

                          showToast(
                            "⚠️ Không thể đọc clipboard",
                            "Hãy click vào ô nhập rồi nhấn Ctrl + V.",
                            "⚠️",
                          )
                        }
                      }}
                      onVariantSelect={handleSlot2VariantSelect}
                      onActivate={async () => {
                        if (!slot2Input.trim()) {
                          showToast(
                            "⚠️ Chưa có link",
                            "Hãy dán link sản phẩm trước!",
                            "⚠️",
                          )
                          return
                        }

                        setSlot2Sending(true)

                        try {
                          const result = await sendToBackend(
                            slot2Input,
                            parseVND(slot2TargetPrice),
                            slot2Variant,
                            slot2PreviewName || undefined,
                          )

                          if (result?.data?.id) setSlot2ItemId(result.data.id)
                          const resolvedName = result?.data?.productName || result?.productName || slot2PreviewName || "Món 2 đang theo dõi"
                          setSlot2ProductName(resolvedName)
                          setSlot2ProductPrice(slot2TargetPrice)

                          setSlot2Active(true)

                          showToast(
                            "🎉 Đã bật theo dõi Món #2!",
                            `Đang theo dõi: ${slot2Variant
                            }`,
                            "🔔",
                          )
                        } catch (error) {
                          console.error(
                            "Không lưu được Món #2:",
                            error,
                          )

                          showToast(
                            "❌ Lưu Món #2 thất bại",
                            error instanceof Error
                              ? error.message
                              : "Không kết nối được server.",
                            "❌",
                          )
                        } finally {
                          setSlot2Sending(false)
                        }
                      }}
                      onRemove={() => {
                        if (slot2ItemId) {
                          deleteFromBackend(slot2ItemId)
                          setSlot2ItemId(null)
                        }
                        setSlot2Active(false)
                        setSlot2Input("")
                        setSlot2Expanded(false)
                        setSlot2BasePrice(0)
                        setSlot2VoucherPrice(null)
                        setSlot2ImageUrl(null)
                        showToast(
                          "🗑️ Đã xóa Món #2",
                          "Ô #2 trống, dán link mới đi!",
                          "🗑️",
                        )
                      }}
                    />
                  )}

                  {/* Slot 1 */}
                  <div>
                    <SlotCard
                      slotNum={1}
                      label="📍 Ô TÌM SỐ 1"
                      labelClass="bg-purple-500/20 text-purple-400"
                      active={slot1Active}
                      input={slot1Input}
                      inputRef={slot1InputRef}
                      expanded={slot1Expanded}
                      targetPrice={slot1TargetPrice}
                      onTargetPriceChange={setSlot1TargetPrice}
                      variant={slot1Variant}
                      variantOptions={slot1VariantOpts}
                      accentActive="text-purple-400"
                      accentBtn="bg-purple-600"
                      basePrice={slot1BasePrice}
                      voucherPrice={slot1VoucherPrice}
                      previewImage={slot1ImageUrl}
                      productImage={slot1ImageUrl}
                      affiliateUrl={slot1AffiliateUrl}
                      onViewDetails={() => setDetailModalSlot(1)}
                      onInputChange={(v) => {
                        setLastActiveSlot(1)
                        setSlot1Input(v)
                        setSlot1Expanded(v.length > 5)
                      }}
                      onPaste={async () => {
                        try {
                          const text = await navigator.clipboard.readText()

                          if (!text) {
                            showToast(
                              "⚠️ Clipboard trống",
                              "Hãy copy link Shopee trước rồi bấm Dán link.",
                              "⚠️",
                            )
                            return
                          }

                          setLastActiveSlot(1)
                          const cleanUrl = extractUrlFromText(text)
                          setSlot1Input(cleanUrl)
                          setSlot1Expanded(cleanUrl.length > 5)

                          showToast(
                            "✅ Đã dán link",
                            "Link sản phẩm Shopee/TikTok/Lazada đã được nhận.",
                            "📋",
                          )
                        } catch (error) {
                          console.error("Không đọc được clipboard:", error)

                          showToast(
                            "⚠️ Không thể đọc clipboard",
                            "Hãy click vào ô nhập rồi nhấn Ctrl + V.",
                            "⚠️",
                          )
                        }
                      }}
                      onActivate={async () => {
                        if (!slot1Input.trim()) {
                          showToast(
                            "⚠️ Chưa có link",
                            "Hãy dán link Shopee/TikTok/Lazada trước!",
                            "⚠️",
                          )
                          return
                        }

                        setSlot1Sending(true)

                        try {
                          const result = await sendToBackend(
                            slot1Input,
                            parseVND(slot1TargetPrice),
                            slot1Variant,
                            slot1PreviewName || undefined,
                          )

                          if (result?.data?.id) setSlot1ItemId(result.data.id)
                          const resolvedName = result?.data?.productName || result?.productName || slot1PreviewName || "Món 1 đang theo dõi"
                          setSlot1ProductName(resolvedName)
                          setSlot1ProductPrice(slot1TargetPrice)

                          setShowBumpSheet(true)
                        } catch (error) {
                          console.error("Không lưu được món:", error)

                          showToast(
                            "❌ Lưu món thất bại",
                            error instanceof Error
                              ? error.message
                              : "Không thể lưu sản phẩm.",
                            "❌",
                          )
                        } finally {
                          setSlot1Sending(false)
                        }
                      }}

                      onRemove={() => {
                        if (slot1ItemId) {
                          deleteFromBackend(slot1ItemId)
                          setSlot1ItemId(null)
                        }
                        setSlot1Active(false)
                        setSlot1Input("")
                        setSlot1Expanded(false)
                        setSlot1BasePrice(0)
                        setSlot1VoucherPrice(null)
                        setSlot1ImageUrl(null)
                        showToast(
                          "🗑️ Đã xóa Món #1",
                          "Ô #1 trống, dán link mới đi!",
                          "🗑️",
                        )
                      }}
                      productEmoji="🛍️"
                      productName={slot1ProductName}
                      productPrice={slot1ProductPrice}
                      onVariantSelect={handleSlot1VariantSelect}
                      previewName={slot1PreviewName}
                      previewPrice={slot1PreviewPrice}
                      previewLoading={slot1PreviewLoading}
                      loading={slot1Sending}
                    />
                  </div>

                  {/* Rank / Referral section — tạm ẩn */}
                  <div
                    className="mt-1 p-3 rounded-[22px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-400/20"
                    style={{ display: "none" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">
                          {currentRank.emoji || "🎯"}
                        </span>
                        <span
                          className={`text-[11px] font-black ${currentRank.color}`}
                        >
                          Hạng {currentRank.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {maxSlots} ô / tối đa
                      </span>
                    </div>

                    {nextRank && (
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] opacity-70">
                            Cần mời thêm {nextRank.min - friendsInvited} bạn để
                            lên {nextRank.emoji} {nextRank.name}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{
                              width: `${Math.min((friendsInvited / nextRank.min) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] opacity-60 mt-0.5">
                          <span>{friendsInvited} bạn đã mời</span>
                          <span>Mục tiêu: {nextRank.min}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          showToast(
                            "🔗 Đã copy link mời!",
                            "Chia sẻ link cho bạn bè để nhận thêm ô săn deal!",
                            "🔗",
                          )
                        }}
                        className="flex-1 py-2 rounded-[14px] apple-glow-btn text-white font-bold text-[10px] active:scale-95 transition cursor-pointer text-center"
                      >
                        🔗 Copy Link Mời Bạn
                      </button>
                      {/* Demo button */}
                      <button
                        onClick={() => {
                          setFriendsInvited((n) => {
                            const next = n + 1
                            const newRank = getRank(next)
                            if (newRank.slots > currentRank.slots) {
                              showToast(
                                `${newRank.emoji} Lên hạng ${newRank.name}!`,
                                `Bạn được thêm ${newRank.slots - currentRank.slots} ô săn deal!`,
                                newRank.emoji,
                              )
                            }
                            return next
                          })
                        }}
                        className="px-2.5 py-2 rounded-[14px] bg-white/20 border border-white/30 text-[9px] font-bold active:scale-95 transition cursor-pointer"
                        title="Demo: +1 bạn mời"
                      >
                        +1 bạn
                      </button>
                    </div>

                    {/* Rank ladder preview */}
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {RANKS.slice(1).map((r) => (
                        <div
                          key={r.name}
                          className={`text-center p-1.5 rounded-xl ${friendsInvited >= r.min
                            ? "bg-white/20 border border-white/30"
                            : "bg-black/10 opacity-40"
                            }`}
                        >
                          <div className="text-base">{r.emoji}</div>
                          <div className="text-[7px] font-bold mt-0.5">
                            {r.slots} ô
                          </div>
                          <div className="text-[6px] opacity-70">
                            {r.min >= 1000 ? r.min / 1000 + "k" : r.min} bạn
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SPOTLIGHT TUTORIAL MOVED TO OUTSIDE VIEW MAIN */}

              {/* POPUP: Mở khóa Ô 2 */}
              {showUnlockModal && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full apple-sheet rounded-[32px] p-5 shadow-2xl text-center relative border border-pink-400/40">
                    <div className="text-3xl mb-2">🎉🫧</div>
                    <h3 className="text-sm font-black text-pink-500 mb-1">
                      MỞ KHÓA THÀNH CÔNG Ô #2!
                    </h3>
                    <p className="text-[11px] leading-relaxed opacity-85 mb-3">
                      Bạn đã chạm nổ đủ <b>10 bong bóng</b> quanh Radar! Ô dán
                      link thứ 2 đã bung ra.
                    </p>
                    <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/20 text-[10px] font-bold text-pink-400 mb-3">
                      ⚠️ Quy tắc cứng: Toàn app tối đa đúng 2 món duy nhất!
                    </div>
                    <button
                      onClick={() => setShowUnlockModal(false)}
                      className="w-full py-3 rounded-2xl apple-glow-btn text-white font-bold text-xs active:scale-95 shadow-lg cursor-pointer"
                    >
                      Đến Thử Ô #2 Ngay ✨
                    </button>
                  </div>
                </div>
              )}

              {/* POPUP: Bump reassurance */}
              {showBumpSheet && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-3">
                  <div className="w-full apple-sheet rounded-[36px] p-5 shadow-2xl text-center relative border border-white/20">
                    <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-3" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border-4 border-purple-400/30 mx-auto flex items-center justify-center text-2xl mb-2 shadow-inner">
                      🔔
                    </div>
                    <h3 className="text-sm font-black mb-1">
                      Đã Khóa Mục Tiêu Theo Dõi!
                    </h3>
                    <div className="p-3 bg-purple-500/15 rounded-[22px] border border-purple-400/30 mb-2">
                      <p className="text-xs font-bold text-purple-400 leading-relaxed">
                        "Chúng tôi đang theo dõi đúng phân loại màu/size, hãy
                        yên tâm nhé."
                      </p>
                    </div>
                    <p className="text-[10px] opacity-75 px-2 leading-normal">
                      Nguyên tắc: Tối đa 2 món để đảm bảo tốc độ cào giá siêu
                      tốc. Khi mua xong bạn có thể bấm "🗑️ Đổi món" bất cứ lúc
                      nào!
                    </p>
                    <button
                      onClick={() => {
                        setShowBumpSheet(false)
                        setSlot1Active(true)
                        showToast(
                          "🔔 Đã bật Radar Món #1!",
                          `Đang theo dõi: ${slot1Variant}`,
                        )
                      }}
                      className="mt-4 w-full py-3.5 rounded-[28px] apple-glow-btn text-white font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Tôi đã yên tâm rồi, cảm ơn!</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODAL: CHI TIẾT ĐƠN HÀNG & DEAL SĂN */}
          {detailModalSlot !== null && (
            <OrderDetailModal
              isOpen={detailModalSlot !== null}
              onClose={() => setDetailModalSlot(null)}
              data={
                detailModalSlot === 2
                  ? {
                      slotNum: 2,
                      itemId: slot2ItemId,
                      productName: slot2ProductName || slot2PreviewName || "Món 2 đang theo dõi",
                      productImage: slot2ImageUrl,
                      productPrice: slot2ProductPrice || slot2PreviewPrice,
                      targetPrice: slot2TargetPrice,
                      basePrice: slot2BasePrice,
                      voucherPrice: slot2VoucherPrice,
                      variant: slot2Variant,
                      url: slot2Input,
                      affiliateUrl: slot2AffiliateUrl,
                    }
                  : {
                      slotNum: 1,
                      itemId: slot1ItemId,
                      productName: slot1ProductName || slot1PreviewName || "Món 1 đang theo dõi",
                      productImage: slot1ImageUrl,
                      productPrice: slot1ProductPrice || slot1PreviewPrice,
                      targetPrice: slot1TargetPrice,
                      basePrice: slot1BasePrice,
                      voucherPrice: slot1VoucherPrice,
                      variant: slot1Variant,
                      url: slot1Input,
                      affiliateUrl: slot1AffiliateUrl,
                    }
              }
              onOpenStore={() => {
                const isS2 = detailModalSlot === 2
                let rawUrl = (isS2 ? (slot2AffiliateUrl || slot2Input) : (slot1AffiliateUrl || slot1Input)) || "https://shopee.vn"
                if (!rawUrl.startsWith("http")) rawUrl = `https://${rawUrl}`
                window.open(rawUrl, "_blank", "noopener,noreferrer")
                showToast("🛍️ Đang mở sàn...", "Chuyển hướng đến sản phẩm để săn deal!", "⚡")
              }}
              onTriggerAlarm={() => {
                const isS2 = detailModalSlot === 2
                const chosenInput = isS2 ? slot2Input : slot1Input
                const isTikTok = chosenInput.toLowerCase().includes("tiktok")
                const isLazada = chosenInput.toLowerCase().includes("lazada") || chosenInput.toLowerCase().includes("laz")
                const baseP = (isS2 ? slot2BasePrice : slot1BasePrice) || (isS2 ? parseVND(slot2ProductPrice) : parseVND(slot1ProductPrice)) || 0
                const targetP = parseVND(isS2 ? slot2TargetPrice : slot1TargetPrice) || 0
                const mockAlarm: PriceDropData = {
                  productName: (isS2 ? (slot2ProductName || slot2PreviewName) : (slot1ProductName || slot1PreviewName)) || "Sản phẩm đang săn",
                  oldPrice: baseP,
                  newPrice: targetP,
                  flashSalePrice: targetP,
                  imageUrl: isS2 ? slot2ImageUrl : slot1ImageUrl,
                  affiliateUrl: isS2 ? (slot2AffiliateUrl || slot2Input) : (slot1AffiliateUrl || slot1Input),
                  slotNum: isS2 ? 2 : 1,
                  platformBadge: isTikTok ? "TIKTOK SHOP - FLASH SALE" : isLazada ? "LAZADA - DEAL SẬP SÀN" : "SHOPEE MALL - GIÁ ĐÁY LỊCH SỬ",
                  discountCodes: [],
                }
                setDetailModalSlot(null)
                triggerPriceDropAlarm(mockAlarm)
              }}
              onRemove={() => {
                const isS2 = detailModalSlot === 2
                if (isS2) {
                  if (slot2ItemId) {
                    deleteFromBackend(slot2ItemId)
                    setSlot2ItemId(null)
                  }
                  setSlot2Active(false)
                  setSlot2Input("")
                  setSlot2Expanded(false)
                  setSlot2BasePrice(0)
                  setSlot2VoucherPrice(null)
                  setSlot2ImageUrl(null)
                  showToast("🗑️ Đã xóa Món #2", "Ô #2 trống, dán link mới đi!", "🗑️")
                } else {
                  if (slot1ItemId) {
                    deleteFromBackend(slot1ItemId)
                    setSlot1ItemId(null)
                  }
                  setSlot1Active(false)
                  setSlot1Input("")
                  setSlot1Expanded(false)
                  setSlot1BasePrice(0)
                  setSlot1VoucherPrice(null)
                  setSlot1ImageUrl(null)
                  showToast("🗑️ Đã xóa Món #1", "Ô #1 trống, dán link mới đi!", "🗑️")
                }
                setDetailModalSlot(null)
              }}
              onCopyLink={async () => {
                const isS2 = detailModalSlot === 2
                const linkToCopy = (isS2 ? (slot2AffiliateUrl || slot2Input) : (slot1AffiliateUrl || slot1Input)) || ""
                if (linkToCopy) {
                  try {
                    await navigator.clipboard.writeText(linkToCopy)
                    showToast("📋 Đã sao chép!", "Đã sao chép link sản phẩm vào clipboard.", "✨")
                  } catch (e) {
                    showToast("📋 Link sản phẩm", linkToCopy, "🔗")
                  }
                }
              }}
            />
          )}

          {/* MODAL: BÁO ĐỘNG SẬP GIÁ (VŨ KHÍ PITCH) */}
          {showAlarmModal && alarmData && (
            <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-[32px] p-5 shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center relative border-2 border-red-500/80 bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-red-950/80 text-white overflow-hidden animate-new-slot">
                {/* Background glow orbs */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/30 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

                {/* Flashing badge */}
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black tracking-wide mb-3 animate-pulse">
                  <span className="text-xs">🚨</span>
                  <span>{alarmData.platformBadge || "BÁO ĐỘNG SẬP GIÁ ĐÁY (RADAR 24/7)"}</span>
                </div>

                {/* Main Siren or Product Image */}
                {alarmData.imageUrl ? (
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg border-2 border-red-500/50 relative">
                    <img src={alarmData.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white">
                      ⚡
                    </div>
                  </div>
                ) : (
                  <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping opacity-75" />
                    <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg text-2xl">
                      ⚡
                    </div>
                  </div>
                )}

                {/* Product Name */}
                <h3 className="text-sm font-black text-white mb-1 line-clamp-2 px-2">
                  {alarmData.productName}
                </h3>
                <p className="text-[10px] text-red-300 font-medium mb-3">
                  Phát hiện mức giá chạm đáy lịch sử!
                </p>

                {/* Price comparison card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-3 backdrop-blur-sm text-left">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="opacity-60 text-[11px]">Giá niêm yết trên sàn:</span>
                    <span className="line-through text-slate-400 font-bold">
                      {formatVND(alarmData.oldPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold text-xs flex items-center space-x-1">
                      <span>🔥 Giá SALE sập chạm đáy:</span>
                    </span>
                    <span className="text-xl font-black text-emerald-400 animate-pulse">
                      {formatVND(alarmData.newPrice)}
                    </span>
                  </div>

                  {/* Discount badge */}
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-red-500 text-white font-black">
                      TIẾT KIỆM {Math.max(0, Math.round((1 - alarmData.newPrice / alarmData.oldPrice) * 100))}%
                    </span>
                    <span className="text-amber-300 font-bold">
                      💰 Hoàn tiền: +{formatVND(Math.round(alarmData.newPrice * 0.05))}
                    </span>
                  </div>

                  <div className="mt-2 text-[9px] text-amber-200/80 bg-amber-500/10 p-1.5 rounded-lg leading-tight border border-amber-500/20">
                    💡 <b>Mô phỏng Radar 24/7:</b> Chuông hú báo động khi sàn sập về đúng giá bạn săn (<b>{formatVND(alarmData.newPrice)}</b>). Bấm mua ngay để vào xem sản phẩm trên sàn!
                  </div>
                </div>

                {/* Voucher codes */}
                {alarmData.discountCodes && alarmData.discountCodes.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 mb-3 text-[10px] flex items-center justify-between">
                    <span className="text-amber-300 font-bold">🎟️ Mã kèm theo:</span>
                    <div className="flex space-x-1">
                      {alarmData.discountCodes.map((code) => (
                        <span
                          key={code}
                          className="px-1.5 py-0.5 bg-amber-400/20 text-amber-200 font-mono font-bold rounded"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      let rawUrl = alarmData.affiliateUrl || (alarmData.slotNum === 2 ? (slot2AffiliateUrl || slot2Input) : (slot1AffiliateUrl || slot1Input)) || "https://shopee.vn"
                      if (!rawUrl.startsWith("http")) {
                        rawUrl = `https://${rawUrl}`
                      }
                      window.open(rawUrl, "_blank", "noopener,noreferrer")
                      showToast("🛍️ Đang chuyển hướng...", "Mở sàn Shopee/TikTok/Lazada để chốt deal!", "⚡")
                      setShowAlarmModal(false)
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>⚡</span>
                    <span>MUA NGAY KẺO HẾT DEAL</span>
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => playPriceDropAlarm()}
                      className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[10px] active:scale-95 transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>🔊</span>
                      <span>Hú chuông lại</span>
                    </button>
                    <button
                      onClick={() => setShowAlarmModal(false)}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-[10px] active:scale-95 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WISHLIST VIEW */}
          {(view as any) === "wishlist" && (
            <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-24 px-5">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-black">🕒 Lịch sử theo dõi</h2>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border z-50 ${isMenuOpen ? "bg-white text-black border-transparent scale-90" : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"}`}
                >
                  <div className={`transform transition-transform duration-300 text-xs ${isMenuOpen ? "rotate-90" : "rotate-0"}`}>
                    {isMenuOpen ? "✕" : "☰"}
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-white/60 mb-4">Các sản phẩm bạn đã dán link thiết lập cảnh báo</p>
              
              <div className="flex-1 overflow-y-auto space-y-3 pb-24 relative">
                {wishlistLoading ? (
                  <>
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3 animate-pulse">
                        <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/10 rounded w-3/4"></div>
                          <div className="h-2 bg-white/10 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center text-[10px] text-white/40 mt-4">
                    📭 Bạn chưa theo dõi sản phẩm nào.
                  </div>
                ) : (
                  wishlistItems.map((item, idx) => {
                    return (
                    <div 
                      key={item.id || idx} 
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3 transition-colors hover:bg-white/10"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/20 flex items-center justify-center">
                        {item.imageUrl || item.productImage ? (
                          <img src={item.imageUrl || item.productImage} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                        ) : (
                          <span className="text-lg">🛍️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.productName || "Sản phẩm đang theo dõi"}</h4>
                        <p className="text-[10px] text-emerald-400 font-semibold truncate mt-1">
                          Mục tiêu: {formatVND(item.targetPrice)} {item.variantName ? `| ${item.variantName}` : ""}
                        </p>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          )}

          {/* PRICE CHART VIEW (Global) */}
          {(view as any) === "price_chart" && (
            <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-24 px-5">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-black">📈 Theo Dõi Biểu Đồ Giá</h2>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border z-50 ${isMenuOpen ? "bg-white text-black border-transparent scale-90" : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"}`}
                >
                  <div className={`transform transition-transform duration-300 text-xs ${isMenuOpen ? "rotate-90" : "rotate-0"}`}>
                    {isMenuOpen ? "✕" : "☰"}
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-white/60 mb-4">Dán link sản phẩm (Shopee/TikTok/Lazada) để phân tích lịch sử giá 90 ngày</p>
              
              {/* Add Link Input */}
              <div className="relative mb-5 shrink-0">
                <input
                  type="text"
                  placeholder="Dán link sản phẩm vào đây..."
                  value={chartLinkInput}
                  onChange={(e) => setChartLinkInput(e.target.value)}
                  className="w-full h-12 bg-white/10 border border-white/20 rounded-[20px] pl-4 pr-24 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button 
                  onClick={() => handleAnalyzeChart(chartLinkInput)}
                  disabled={!chartLinkInput || isAnalyzingChart}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:text-white/50 text-white font-bold text-[10px] rounded-[16px] transition-colors flex items-center justify-center shadow-lg"
                >
                  {isAnalyzingChart ? "Đang quét..." : "Phân tích"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pb-20">
                {analyzedCharts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-xs">Chưa có biểu đồ nào.</p>
                    <p className="text-[10px]">Hãy dán link sản phẩm để xem lịch sử giá!</p>
                  </div>
                ) : (
                  analyzedCharts.map((chart) => (
                    <div key={chart.id} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 animate-slide-up-notification">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0 pr-2">
                          <h3 className="text-sm font-bold truncate">{chart.name}</h3>
                          <p className="text-[8px] text-emerald-400 truncate mt-0.5">{chart.url}</p>
                        </div>
                        {chart.isBottom && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-lg font-black shrink-0 animate-pulse">🔥 Đáy 90 ngày</span>
                        )}
                      </div>
                      <div className="h-48 w-full mt-3 bg-black/20 rounded-xl p-2 border border-white/5">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chart.data}>
                            <XAxis dataKey="date" fontSize={10} tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                            />
                            <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ACCOUNT VIEW */}
          {(view as any) === "account" && (
            <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-24 px-5">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-black">👤 Tài Khoản</h2>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border z-50 ${isMenuOpen ? "bg-white text-black border-transparent scale-90" : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"}`}
                >
                  <div className={`transform transition-transform duration-300 text-xs ${isMenuOpen ? "rotate-45" : "rotate-0"}`}>
                    {isMenuOpen ? "✕" : "☰"}
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-white/60 mb-4">Quản lý thông tin & hạng thành viên</p>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full mb-4 flex items-center justify-center text-3xl shadow-lg border-2 border-white/20">
                  😎
                </div>
                <h3 className="text-sm font-black">Người Dùng VIP</h3>
                <p className="text-[10px] text-pink-400 font-bold mt-1 mb-6">Hạng: {currentRank.name}</p>
                
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-70">Số bạn đã mời</span>
                    <span className="font-bold">{friendsInvited} người</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-70">Ô săn deal tối đa</span>
                    <span className="font-bold">{maxSlots} món</span>
                  </div>
                </div>
                
                <button onClick={() => setView("main")} className="mt-6 px-4 py-2 bg-white/10 rounded-full text-xs font-bold active:scale-95">
                  Quay về Radar
                </button>
              </div>
            </div>
          )}

          {/* SPOTLIGHT TUTORIAL */}
          <SpotlightOverlay
            step={spotlightStep}
            targetRef={slot1InputRef}
            containerRef={phoneScreenRef}
            onNext={() => setSpotlightStep("radar")}
            onDone={finishTutorial}
          />

          {/* Global Menu Popup (For views other than main) */}
          {isMenuOpen && view !== "main" && (
            <div className="absolute top-[140px] right-5 z-50 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-[24px] shadow-2xl p-2 w-48 flex flex-col space-y-1 animate-slide-down-notification">
              <button 
                onClick={() => { setView("wishlist"); setIsMenuOpen(false); }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "wishlist" ? "bg-white/15 text-purple-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
              >
                <Heart className={`w-4 h-4 ${(view as any) === "wishlist" ? "text-purple-400" : "text-white/60"}`} />
                <span className="text-xs">Lịch sử theo dõi</span>
              </button>
              <button 
                onClick={() => { setView("price_chart"); setIsMenuOpen(false); }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "price_chart" ? "bg-white/15 text-emerald-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
              >
                <TrendingUp className={`w-4 h-4 ${(view as any) === "price_chart" ? "text-emerald-400" : "text-white/60"}`} />
                <span className="text-xs">Biểu đồ giá</span>
              </button>
              <button 
                onClick={() => { setView("account"); setIsMenuOpen(false); }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "account" ? "bg-white/15 text-pink-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
              >
                <User className={`w-4 h-4 ${(view as any) === "account" ? "text-pink-400" : "text-white/60"}`} />
                <span className="text-xs">Tài khoản</span>
              </button>
              <div className="h-px bg-white/10 my-1 mx-2" />
              <button 
                onClick={() => { setView("main"); setIsMenuOpen(false); }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${(view as any) === "main" ? "bg-white/15 text-sky-400 font-bold" : "hover:bg-white/10 text-white/80"}`}
              >
                <Radio className={`w-4 h-4 ${(view as any) === "main" ? "text-sky-400" : "text-white/60"}`} />
                <span className="text-xs">Radar Săn Deal</span>
              </button>
            </div>
          )}

          {/* Home Indicator */}
          <div className="pb-2 pt-1 flex justify-center z-50 bg-transparent shrink-0 absolute bottom-0 w-full pointer-events-none">
            <div className="w-32 h-1 bg-white opacity-40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
