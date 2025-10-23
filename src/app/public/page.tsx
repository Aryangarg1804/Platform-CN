'use client'

import React, { useState, useEffect } from 'react'

const rounds = [
  { id: 1, name: 'Sorting Hat Ceremony', icon: '🎩', color: 'from-purple-900 to-indigo-800', path: '/public/round-1' },
  { id: 2, name: 'Potion Brewing', icon: '🧪', color: 'from-green-900 to-emerald-800', path: '/public/round-2' },
  { id: 3, name: 'Escape Loop', icon: '🔮', color: 'from-blue-900 to-cyan-800', path: '/public/round-3' },
  { id: 4, name: 'Task Around Us', icon: '📜', color: 'from-amber-900 to-yellow-800', path: '/public/round-4' },
  { id: 5, name: 'Emergency Discussion', icon: '⚡', color: 'from-red-900 to-orange-800', path: '/public/round-5' },
  { id: 6, name: 'Flash Videos', icon: '🎬', color: 'from-pink-900 to-rose-800', path: '/public/round-6' },
  { id: 7, name: 'The Horcrux Hunt', icon: '💀', color: 'from-gray-900 to-slate-800', path: '/public/round-7' },
]

export default function ParticipantsPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [unlockedRounds, setUnlockedRounds] = useState<number[]>([]) // store IDs of unlocked rounds

  useEffect(() => {
    async function fetchUnlockedRounds() {
      try {
        const res = await fetch('/api/admin/round-status')
        const data = await res.json()
        setUnlockedRounds(data.unlockedRounds || [])
        } catch (err) {
        console.error('Error fetching round status:', err)
        setUnlockedRounds([])
      }
    }
    fetchUnlockedRounds()
  }, [])

  const handleCardClick = (roundId: number, path: string) => {
    if (!unlockedRounds.includes(roundId)) {
      alert('This round is locked by admin.')
      return
    }
    window.location.href = path
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Event Rounds</h1>
        <nav>
          <ul className="flex gap-6">
            <li><a href="/" className="hover:underline">Home</a></li>
            <li><a href="/public/house-leaderboard" className="hover:underline">House Leaderboard</a></li>
            <li><a href="/public/team-leaderboard" className="hover:underline">Team Leaderboard</a></li>
          </ul>
        </nav>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {rounds.map((round) => {
          const isUnlocked = unlockedRounds.includes(round.id)
          return (
            <div
              key={round.id}
              onClick={() => handleCardClick(round.id, round.path)}
              onMouseEnter={() => setHoveredCard(round.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative p-6 rounded-xl shadow-lg cursor-pointer transition transform duration-300 
                ${isUnlocked ? 'hover:scale-105' : 'opacity-40 blur-sm pointer-events-none'}`}
              style={{
                background: `linear-gradient(145deg, rgba(40,20,10,0.9), rgba(20,10,5,0.9))`,
              }}
            >
              <div className="text-5xl mb-4 text-center">{round.icon}</div>
              <h2 className="text-xl font-bold text-center">{round.name}</h2>
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl text-yellow-300 font-bold text-lg">
                  🔒 Locked
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
