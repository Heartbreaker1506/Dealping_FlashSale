import React from "react"
import {
  Tag,
  Zap,
  Flame,
  Shirt,
  Headphones,
  Sparkles,
  Gift,
  ShoppingBag,
  ShoppingCart,
  Watch,
  Smartphone,
  Monitor,
} from "lucide-react"
import { Rank } from "../types"

export const BUBBLE_ICONS = [
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
  <Monitor className="w-1/2 h-1/2 text-teal-400" />,
]

export const TARGET_BUBBLES = 10
export const TUTORIAL_KEY = "deal_tutorial_done"

export const RANKS: Rank[] = [
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

export function getRank(friends: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (friends >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

export function getNextRank(friends: number): Rank | null {
  for (let i = 0; i < RANKS.length; i++) {
    if (friends < RANKS[i].min) return RANKS[i]
  }
  return null
}

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")

export const API_URL = isLocalhost
  ? "http://localhost:3000"
  : ((import.meta as any).env?.VITE_API_URL ||
      "https://api-dealping-be-flashsale.onrender.com")

export const VAPID_PUBLIC_KEY =
  ((import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string) ||
  "BDLxf7wjsZz69DdoYJNWWKHB1eg3AeUomsXCW58uCZjxYciyEUxd1vyj-WTdieRDBVX44i-h6EVF4Gt89xnDsRE"
