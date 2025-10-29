"use client"
import React, { useEffect, useState } from 'react'

function LeaderboardCard({ title, items }: { title: string; items: any[] }) {
  return (
    <div
      className="relative bg-gradient-to-b from-[#0E1A40]/95 to-[#1a2654]/95 border-4 border-[#D3A625] rounded-xl p-5 sm:p-6 md:p-8 shadow-2xl backdrop-blur-sm w-full"
      style={{
        boxShadow: '0 0 40px rgba(236, 185, 57, 0.3), inset 0 0 60px rgba(14, 26, 64, 0.5)',
      }}
    >
      {/* Decorative Corners */}
      {['-top-2 -left-2 border-t-4 border-l-4',
        '-top-2 -right-2 border-t-4 border-r-4',
        '-bottom-2 -left-2 border-b-4 border-l-4',
        '-bottom-2 -right-2 border-b-4 border-r-4'
      ].map((pos, i) => (
        <div key={i} className={`absolute w-6 sm:w-8 h-6 sm:h-8 border-[#ECB939] ${pos}`}></div>
      ))}

      <h3
        className="text-xl sm:text-2xl md:text-3xl font-bold text-[#ECB939] mb-4 text-center tracking-wide"
        style={{ textShadow: '0 0 10px rgba(236, 185, 57, 0.5)' }}
      >
        {title}
      </h3>

      <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-transparent via-[#D3A625] to-transparent mx-auto mb-6"></div>

      <div className="space-y-3 sm:space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0E1A40]/60 border-2 border-[#5D5D5D] rounded-lg p-3 sm:p-4 md:p-5 hover:border-[#4169E1] transition-all duration-300 hover:shadow-[0_0_15px_rgba(65,105,225,0.4)]"
          >
            <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[#ECB939] font-bold text-lg sm:text-xl w-6 sm:w-8 text-center">
                  #{idx + 1}
                </span>
                <span className="text-[#AAAAAA] font-semibold text-base sm:text-lg truncate max-w-[160px] sm:max-w-[200px] md:max-w-[250px]">
                  {item.house}
                </span>
              </div>
              <span className="text-[#4169E1] font-bold text-lg sm:text-xl md:text-2xl">
                {item.totalScore !== undefined ? item.totalScore : item.quaffles}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HouseLeaderboardPage() {
  const [houses, setHouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setHouses(data.houseScores || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0E1A40] via-[#1a2654] to-[#0E1A40]">
        <div className="text-center">
          <div className="inline-block w-12 sm:w-16 h-12 sm:h-16 border-4 border-[#ECB939] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#ECB939] mt-4 text-lg sm:text-xl animate-pulse">
            Summoning the House Scores...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1A40] via-[#1a2654] to-[#0E1A40] relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#ECB939] rounded-full animate-shimmer"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-14 md:py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Header */}
          <header className="mb-10 sm:mb-12 md:mb-16">
            <div className="animate-float-gentle inline-block mb-4 sm:mb-6">
              <div className="bg-gradient-to-b from-[#4169E1] to-[#2d4da3] border-4 border-[#ECB939] rounded-lg px-6 sm:px-8 py-3 sm:py-4 shadow-2xl animate-glow">
                <h1
                  className="harry-font text-3xl sm:text-4xl md:text-5xl text-[#ECB939] tracking-wider"
                  style={{ textShadow: '0 2px 8px rgba(236, 185, 57, 0.8)' }}
                >
                  House Championship
                </h1>
              </div>
            </div>

            <div className="w-28 sm:w-32 h-1 bg-gradient-to-r from-transparent via-[#D3A625] to-transparent mx-auto mb-4 sm:mb-6"></div>

            <p className="text-[#AAAAAA] text-base sm:text-lg italic leading-relaxed">
              The magical standings of all competing houses
            </p>
            <p className="text-[#5D5D5D] text-xs sm:text-sm mt-2">
              Total scores and quaffles earned through valor and wisdom
            </p>
          </header>

          {/* Leaderboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
            <LeaderboardCard
              title="House Standings"
              items={houses.map((h: any) => ({
                house: h.house,
                totalScore: h.totalScore,
              }))}
            />
            <LeaderboardCard
              title="House Quaffles"
              items={houses.map((h: any) => ({
                house: h.house,
                quaffles: h.quaffles,
              }))}
            />
          </div>

          {/* Footer */}
          <div className="text-center mt-10 sm:mt-12 text-[#D3A625] text-[10px] sm:text-xs tracking-widest opacity-60">
            ✦ MAY THE BEST HOUSE WIN ✦
          </div>
        </div>
      </div>
    </div>
  )
}
