'use client'

import React, { useState, useEffect, useCallback } from 'react'

const rounds = [
  // IMPORTANT: The path should lead to a round-specific public leaderboard page (e.g., /public/leaderboard/round-1)
  { id: 1, name: 'Sorting Hat Ceremony', icon: '🎩', color: '#ffd700', path: '/public/leaderboard/round-1' }, // Gold
  { id: 2, name: 'Potion Brewing', icon: '🧪', color: '#10b981', path: '/public/leaderboard/round-2' }, // Emerald
  { id: 3, name: 'Escape Loop', icon: '🔮', color: '#3b82f6', path: '/public/leaderboard/round-3' }, // Blue
  { id: 4, name: 'Triwizard Tournament', icon: '🐉', color: '#f59e0b', path: '/public/leaderboard/round-4' }, // Amber/Orange
  { id: 5, name: 'Emergency Discussion', icon: '⚡', color: '#ef4444', path: '/public/leaderboard/round-5' }, // Red
  { id: 6, name: 'Magical Creatures', icon: '🐾', color: '#a855f7', path: '/public/leaderboard/round-6' }, // Purple
  { id: 7, name: 'The Horcrux Hunt', icon: '💀', color: '#94a3b8', path: '/public/leaderboard/round-7' }, // Slate
]

export default function ParticipantsPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [unlockedRounds, setUnlockedRounds] = useState<number[]>([]) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);

  const fetchUnlockedRounds = useCallback(async () => {
    setError(null);
    try {
      // Call the updated API endpoint which now returns all unlocked round IDs
      const res = await fetch('/api/admin/round-status')
      
      if (!res.ok) {
          throw new Error('Failed to fetch round statuses.');
      }
      
      const data = await res.json()

      // The new API endpoint returns 'unlockedRounds' as an array of IDs
      setUnlockedRounds(data.unlockedRounds || [])
      
    } catch (err: any) {
      console.error('Error fetching round status:', err)
      setError(`Failed to load round status: ${err.message}`);
      setUnlockedRounds([])
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
    // Navigate to the public leaderboard for the round if unlocked
    window.location.href = path
  }
  
  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-amber-400 text-2xl font-['Cinzel'] animate-pulse">
            Loading Magical Portals...
        </div>
     )
  }
  
  if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400 p-8 text-center font-['Cinzel']">
            <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">A Failsafe Charm is Active</h2>
                <p>{error}</p>
            </div>
        </div>
      );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120b05] via-[#1b0f07] to-[#2b1a0e] p-8 md:p-12 font-['Cinzel'] text-amber-100">
      <header className="mb-10 md:mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-3 tracking-wider drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
          Hogwarts Trials
        </h1>
        <p className="text-xl text-amber-200/80 italic mt-2 font-serif">
          View the leaderboards for trials as they are made public by the Ministry.
        </p>
         <div className="w-48 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-6 opacity-70"></div>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rounds.map((round) => {
          const isUnlocked = unlockedRounds.includes(round.id)
          const isHovered = hoveredCard === round.id
          
          return (
            <div
              key={round.id}
              onClick={() => handleCardClick(round.id, round.path)}
              onMouseEnter={() => setHoveredCard(round.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative p-6 rounded-2xl shadow-xl transition transform duration-500 
                font-['Cinzel'] text-white overflow-hidden
                ${isUnlocked 
                    ? 'hover:scale-105 cursor-pointer' 
                    : 'opacity-40 blur-sm pointer-events-none cursor-default'}` // Blur and disable clicks
              }
              style={{
                background: `linear-gradient(145deg, rgba(26, 15, 8, 0.9), rgba(43, 26, 13, 0.9))`,
                border: isUnlocked ? `3px solid ${round.color}80` : '3px solid #66666650',
                boxShadow: isUnlocked && isHovered 
                            ? `0 0 30px ${round.color}80, 0 8px 30px rgba(0,0,0,0.8)` 
                            : isUnlocked 
                            ? `0 0 10px ${round.color}40, 0 4px 20px rgba(0,0,0,0.6)`
                            : `0 4px 10px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Inner Glow/Shimmer */}
              {isUnlocked && (
                <div 
                  className={`absolute inset-0 transition-opacity duration-300`} 
                  style={{ 
                    background: `radial-gradient(circle at center, ${round.color}30 0%, transparent 60%)`,
                    opacity: isHovered ? 1 : 0.5,
                  }}
                />
              )}
              
              <div className="relative z-10">
                  <div 
                    className="text-6xl mb-4 text-center drop-shadow-[0_0_10px_#00000080]"
                    style={{ color: isUnlocked ? round.color : '#aaaaaa' }}
                  >
                      {round.icon}
                  </div>
                  <h2 className="text-xl font-bold text-center mb-2" style={{ color: isUnlocked ? round.color : '#aaaaaa' }}>{round.name}</h2>
                  <p className="text-sm text-center italic" style={{ color: isUnlocked ? `${round.color}b0` : '#aaaaaa' }}>Round {round.id}</p>
              </div>

              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl text-yellow-300 font-bold text-lg z-20">
                  🔒 Locked
                </div>
              )}
            </div>
          )
        })}
      </div>
       <footer className="text-center mt-12 text-amber-600/70 text-sm italic">
           Access to Round Leaderboards is controlled by the Event Administrator.
       </footer>
    </div>
  )
}
