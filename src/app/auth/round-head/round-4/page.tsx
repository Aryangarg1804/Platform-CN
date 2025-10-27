'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { canAccessRound } from '@/lib/roundHeadAuth'

// Define Team interface for minimal data fetching (only for charts)
interface Team {
    _id?: string;
    id: number;
    name: string;
    house: string;
    totalScore: number;
}

const roundConfig = {
  title: 'Triwizard Tournament',
  houses: ['Gryffindor', 'Hufflepuff', 'Ravenclaw'], // 3 Houses for Round 4
}

export default function Round4() {
  const [user, setUser] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: 'info' })

  // Auth check on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      window.location.href = '/auth/login'
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 4)) { // Check for Round 4 access
        window.location.href = '/auth/login'
        return
      }
      setUser(payload)
    } catch (e) {
      console.error('Authentication error:', e)
      window.location.href = '/auth/login'
    }
  }, [])

  // Fetch teams and round status from DB
  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // 1. Get round lock status (Read Only)
      const statusRes = await fetch('/api/admin/round-status?round=round-4')
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked)

      // 2. Get teams (for charts, we fetch all active teams and their total points)
      const teamsRes = await fetch('/api/teams')
      const teamsData = await teamsRes.json()

      if (teamsData && teamsData.teams && teamsData.teams.length) {
        let idCounter = 1;
        const mappedTeams: Team[] = teamsData.teams
          .filter((t: any) => t.isActive !== false) // Only show active teams
          .map((dbTeam: any) => ({
            id: idCounter++,
            _id: dbTeam._id,
            name: dbTeam.name,
            house: dbTeam.house,
            totalScore: dbTeam.totalPoints || 0,
          }));
        setTeams(mappedTeams)
      } else {
        setTeams([])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setMessage({ text: 'Failed to load data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch and polling
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [fetchData])


  // Helper to award quaffle (Round Head access)
  const awardQuaffle = async (house: string, roundId = 'round-4') => {
    if (roundLocked) {
        alert('Round is currently locked by the admin. Cannot award quaffle.')
        return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/award-quaffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ house, round: roundId }),
      })
      if (!res.ok) throw new Error('Failed to award quaffle.')

      setMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' })
    } catch (e) {
      console.error(e)
      setMessage({ text: 'Failed to award quaffle.', type: 'error' })
    }
    setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel']">
      Loading...
    </div>
  )

  // Calculate house-wise totals for charts (based on total score)
  const houseScores = roundConfig.houses.map(house => ({
    name: house,
    total: teams
      .filter(t => t.house === house && t.name)
      .reduce((sum, t) => sum + Number(t.totalScore || 0), 0),
  }))

  // Team-wise totals for charts (based on total score)
  const teamScores = teams
    .filter(t => t.name.trim() !== '')
    .map(t => ({
      name: t.name,
      score: Number(t.totalScore || 0),
      house: t.house,
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 4 Dashboard (Round Head): {roundConfig.title}
          </h1>
          {/* Read-Only Lock Status Display */}
          <div className={`inline-block px-4 py-2 rounded font-semibold ${
            roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
          }`}>
            {roundLocked ? '🔒 Round Locked - Read Only' : '🔓 Round Unlocked - Quaffle Award Ready'}
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
            message.type === 'error' ? 'bg-red-900' : 'bg-green-900'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* Warning/Info message */}
        {roundLocked && (
            <div className="p-4 mb-6 rounded text-center bg-red-900/50 border border-red-700 text-red-300">
                The round is currently locked by the Admin. You can only view data.
            </div>
        )}

        {/* Award Quaffle Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Award Round 4 Quaffle</h2>
            <p className="mb-4 text-amber-200">Select the house winner of the {roundConfig.title}:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {roundConfig.houses.map(h=> 
                <button 
                  key={h} 
                  onClick={()=>awardQuaffle(h)} 
                  disabled={roundLocked} // Disabled when locked
                  className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Give {h} Quaffle
                </button>
              )}
            </div>
        </div>

        {/* Visualizations (Based on total score) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* House-wise scores */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              House Rankings (Total Score)
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={houseScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                  <XAxis dataKey="name" stroke="#fcd34d" />
                  <YAxis stroke="#fcd34d" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #78350f',
                      borderRadius: '4px',
                      color: '#fcd34d'
                    }}
                  />
                  <Bar dataKey="total" fill="#b45309" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Rankings */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              Team Rankings (Total Score)
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={teamScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                  <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} stroke="#fcd34d" />
                  <YAxis stroke="#fcd34d" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #78350f',
                      borderRadius: '4px',
                      color: '#fcd34d'
                    }}
                  />
                  <Bar dataKey="score" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}