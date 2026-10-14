import React from "react"
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartItem } from "../../types"

interface PriceChartViewProps {
  analyzedCharts: ChartItem[]
  onToggleMenu: () => void
  isMenuOpen: boolean
}

export function PriceChartView({
  analyzedCharts,
  onToggleMenu,
  isMenuOpen,
}: PriceChartViewProps) {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden z-10 pt-24 px-5">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-black">📈 Theo Dõi Biểu Đồ Giá</h2>
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
              isMenuOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            {isMenuOpen ? "✕" : "☰"}
          </div>
        </button>
      </div>
      <p className="text-[10px] text-white/60 mb-4">
        Biểu đồ giá 12 giờ của các món đồ bạn đang theo dõi
      </p>

      <div className="flex-1 overflow-y-auto space-y-4 pb-20">
        {analyzedCharts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-xs">Chưa có biểu đồ nào.</p>
            <p className="text-[10px]">
              Hãy thêm món đồ vào Radar để hệ thống theo dõi biểu đồ tự động nhé!
            </p>
          </div>
        ) : (
          analyzedCharts.map((chart) => (
            <div
              key={chart.id}
              className="w-full bg-white/5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] rounded-2xl p-4 animate-slide-up-notification"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center border border-white/20">
                    {chart.imageUrl ? (
                      <img
                        src={chart.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLElement).style.display =
                            "none"
                        }}
                      />
                    ) : (
                      <span className="text-xl">🛍️</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate text-emerald-50">
                      {chart.name}
                    </h3>
                    <p className="text-[8px] text-emerald-400/70 truncate mt-0.5">
                      {chart.url}
                    </p>
                  </div>
                </div>
                {chart.isBottom && (
                  <span className="px-2 py-1 bg-emerald-500/30 text-emerald-300 text-[10px] rounded-lg font-black shrink-0 animate-pulse border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                    🔥 Đáy 12 giờ
                  </span>
                )}
              </div>
              <div className="h-48 w-full mt-3 bg-white/5 backdrop-blur-sm md:backdrop-blur- rounded-xl p-2 border border-emerald-500/20 shadow-inner relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chart.data}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`colorPrice-${chart.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      fontSize={9}
                      tick={{ fill: "rgba(255,255,255,0.4)" }}
                      axisLine={false}
                      tickLine={false}
                      dy={5}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      orientation="right"
                      fontSize={9}
                      tick={{ fill: "rgba(255,255,255,0.4)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: any) =>
                        value >= 1000 ? value / 1000 + "k" : value
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(20,20,20,0.85)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "11px",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{ color: "#10b981", fontWeight: "900" }}
                      labelStyle={{
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                      }}
                      formatter={(value: any) => [
                        new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(value),
                        "Giá",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={`url(#colorPrice-${chart.id})`}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{
                        r: 6,
                        fill: "#fff",
                        stroke: "#10b981",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
