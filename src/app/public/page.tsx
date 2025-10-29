'use client'

import React, { useState, useEffect, useCallback } from 'react'

const rounds = [
  { id: 1, name: 'Sorting Hat Ceremony', image: '/images/sorting.png', color: '#ffd700', path: '/public/leaderboard/round-1' },
  { id: 2, name: 'Potion Brewing', image: '/images/potion.png', color: '#10b981', path: '/public/leaderboard/round-2' },
  { id: 3, name: 'Escape Loop', image: '/images/escape.png', color: '#3b82f6', path: '/public/leaderboard/round-3' },
  { id: 4, name: 'Triwizard Tournament', image: '/images/fire.png', color: '#f59e0b', path: '/public/leaderboard/round-4' },
  { id: 5, name: 'Emergency Discussion', image: '/images/owl.png', color: '#ef4444', path: '/public/leaderboard/round-5' },
  { id: 6, name: 'Magical Creatures', image: '/images/dragon.png', color: '#a855f7', path: '/public/leaderboard/round-6' },
  { id: 7, name: 'The Horcrux Hunt', image: '/images/skull.png', color: '#94a3b8', path: '/public/leaderboard/round-7' },
]


export default function ParticipantsPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [unlockedRounds, setUnlockedRounds] = useState<number[]>([]) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnlockedRounds = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/round-status')
      if (!res.ok) throw new Error('Failed to fetch round statuses.')
      const data = await res.json()
      setUnlockedRounds(data.unlockedRounds || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnlockedRounds()
  }, [fetchUnlockedRounds])

  const handleCardClick = (roundId: number, path: string) => {
    if (!unlockedRounds.includes(roundId)) {
      alert('This round is currently locked by the Admin and the leaderboard is not yet public.')
      return
    }
    window.location.href = path
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-amber-400 text-2xl font-['Cinzel'] animate-pulse">
        Summoning Magical Portals...
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400 p-8 text-center font-['Cinzel']">
        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">A Failsafe Charm is Active</h2>
          <p>{error}</p>
        </div>
      </div>
    )

  return (
  <div className="min-h-screen relative bg-[#0c0b10] p-8 md:p-12 font-['Harry P'] text-amber-100 overflow-hidden">
    {/* 🏰 Background */}
    <img
      src="/images/castle1.jpg"
      alt="Hogwarts Castle"
      className="absolute inset-0 w-full h-full object-cover opacity-25 blur-[2px] scale-105"
    />

    {/* Floating Particles */}
    {[...Array(25)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: 0.7,
        }}
      ></div>
    ))}

    {/* Main Content */}
    <div className="relative z-10">
      {/* Header */}
      <header className="mb-10 md:mb-16 text-center">
        <h1 className="text-5xl font-bold text-amber-400 mb-3 tracking-wider drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
          Hogwarts Trials
        </h1>
        <p className="text-xl text-amber-200/80 italic font-Harry P">
          Explore the mystical challenges as they unlock
        </p>
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-6 opacity-70"></div>
      </header>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {rounds.map((round) => {
          const isUnlocked = unlockedRounds.includes(round.id)
          const isHovered = hoveredCard === round.id

          return (
            <div
              key={round.id}
              onClick={() => isUnlocked && handleCardClick(round.id, round.path)}
              onMouseEnter={() => setHoveredCard(round.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative p-6 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-transform duration-500 transform overflow-hidden
                ${
  isUnlocked
    ? 'hover:scale-105 cursor-pointer'
    : 'cursor-not-allowed pointer-events-none brightness-75 backdrop-blur-[2px]'
}
`}
              style={{
                background: `radial-gradient(circle at top left, ${round.color}15, transparent 80%)`,
                border: isUnlocked
                  ? `2px solid ${round.color}60`
                  : `2px solid #66666650`,
                boxShadow:
                  isHovered && isUnlocked
                    ? `0 0 30px ${round.color}80, inset 0 0 25px ${round.color}40`
                    : isUnlocked
                    ? `0 0 15px ${round.color}40, inset 0 0 10px ${round.color}20`
                    : `0 0 10px rgba(0,0,0,0.4)`,
              }}
            >
              {/* Magical shimmer aura */}
              {isHovered && isUnlocked && (
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${round.color}20, transparent 70%)`,
                  }}
                />
              )}

              {/* Sparkles (only for unlocked rounds) */}
              {isUnlocked &&
                [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-[3px] h-[3px] bg-white rounded-full animate-twinkle"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      opacity: 0.8,
                    }}
                  ></div>
                ))}

              {/* Card Content */}
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-2`}
                    style={{
                      borderColor: isUnlocked ? round.color : '#666666',
                      boxShadow: isUnlocked
                        ? `0 0 20px ${round.color}60, inset 0 0 10px ${round.color}40`
                        : `0 0 10px rgba(0,0,0,0.5)`,
                      backgroundColor: '#00000080',
                    }}
                  >
                    <img
                      src={round.image}
                      alt={round.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isUnlocked ? 'hover:scale-110' : ''
                      }`}
                      style={{
                        filter: `drop-shadow(0 0 10px ${round.color}90)`,
                        opacity: isUnlocked ? 1 : 0.6,
                      }}
                    />
                  </div>
                </div>

                <h2
                  className="text-2xl font-bold mb-2 tracking-wide"
                  style={{
                    color: isUnlocked ? round.color : '#aaaaaa',
                  }}
                >
                  {round.name}
                </h2>
                <p
                  className="text-sm italic"
                  style={{
                    color: isUnlocked ? `${round.color}b0` : '#aaaaaa',
                  }}
                >
                  Round {round.id}
                </p>
              </div>

              {/* 🔒 Locked Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl text-yellow-300 font-bold text-lg z-20">
                  🔒 Locked
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-amber-600/70 text-sm italic">
        ✦ Access to Round Leaderboards is controlled by the Ministry ✦
      </footer>
    </div>
  </div>
)
}
