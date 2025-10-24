"use client"
import React, { useEffect, useState } from 'react'
import LeaderboardCard from '@/components/Leaderboard'

export default function TeamLeaderboardPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setTeams(data.teamScores || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8 text-amber-100">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-amber-400">Team Leaderboard</h1>
          <p className="text-amber-200 mt-2">Top performing teams across all rounds</p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <LeaderboardCard title="Top Teams" items={teams.map((t: any) => ({ name: t.name, house: t.house, score: t.score }))} />
        </div>
      </div>
    </div>
  )
}
