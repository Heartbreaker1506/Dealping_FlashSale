import React from "react"
import { Rank } from "../../types"

interface AccountViewProps {
  currentRank: Rank
  friendsInvited: number
  maxSlots: number
  onBackToMain: () => void
  onToggleMenu: () => void
  isMenuOpen: boolean
}

export function AccountView({
  currentRank,
  friendsInvited,
  maxSlots,
  onBackToMain,
  onToggleMenu,
  isMenuOpen,
}: AccountViewProps) {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-24 px-5">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-black">👤 Tài Khoản</h2>
        <button
          onClick={onToggleMenu}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border z-50 ${
            isMenuOpen
              ? "bg-white text-black border-transparent scale-90"
              : "apple-glass text-white border-white/40 hover:scale-105 active:scale-95"
          }`}
        >
          <div
            className={`transform transition-transform duration-300 text-xs ${
              isMenuOpen ? "rotate-45" : "rotate-0"
            }`}
          >
            {isMenuOpen ? "✕" : "☰"}
          </div>
        </button>
      </div>
      <p className="text-[10px] text-white/60 mb-4">
        Quản lý thông tin & hạng thành viên
      </p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full mb-4 flex items-center justify-center text-3xl shadow-lg border-2 border-white/20">
          😎
        </div>
        <h3 className="text-sm font-black">Người Dùng VIP</h3>
        <p className="text-[10px] text-pink-400 font-bold mt-1 mb-6">
          Hạng: {currentRank.name}
        </p>

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

        <button
          onClick={onBackToMain}
          className="mt-6 px-4 py-2 bg-white/10 rounded-full text-xs font-bold active:scale-95 cursor-pointer"
        >
          Quay về Radar
        </button>
      </div>
    </div>
  )
}
