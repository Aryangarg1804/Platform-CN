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
  title: 'Task Around Us', // Updated title for Round 4
  houses: ['Gryffindor', 'Hufflepuff', 'Ravenclaw'], // 3 Houses for Round 4
}

export default function Round4() {
  const [user, setUser] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: 'info' })
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // State for current winner

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

  // Fetch teams, round status, and current winner
  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // 1. Get round lock status (Read Only for Round Head)
      const statusRes = await fetch('/api/admin/round-status?round=round-4')
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked)

      // 2. Fetch current round winner status
      const roundDetailsRes = await fetch('/api/rounds/round-4');
      const roundDetailsData = await roundDetailsRes.json();
      if (roundDetailsRes.ok && roundDetailsData.round) {
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null);
      } else {
         console.warn('Could not fetch round details or winner.');
         setRoundWinner(null);
      }

      // 3. Get teams (for charts)
      const teamsRes = await fetch('/api/teams') // Using /api/teams as in original file
      const teamsData = await teamsRes.json()

      // Assuming /api/teams returns { success: boolean, teams: [...] } based on /api/teams/route.ts
      if (teamsData && teamsData.success && teamsData.teams && teamsData.teams.length) {
        let idCounter = 1;
        const mappedTeams: Team[] = teamsData.teams
          .filter((t: any) => t.isActive !== false) // Only show active teams
          .map((dbTeam: any) => ({
            id: idCounter++,
            _id: dbTeam._id,
            name: dbTeam.name,
            house: dbTeam.house,
            totalScore: dbTeam.totalPoints || 0, // Use totalPoints from Team model
          }));
        setTeams(mappedTeams)
      } else {
        setTeams([])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setMessage({ text: 'Failed to load data', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
    } finally {
      setLoading(false)
    }
  }, [user]) // Depend only on user

  // Initial fetch and polling
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [fetchData])


  // Helper to award quaffle (Round Head access)
  const awardQuaffle = async (house: string, roundId = 'round-4') => {
    if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot award.', type: 'error'})
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return
    }
    // Prevent awarding if someone already won
    if (roundWinner) {
        setMessage({ text: `Cannot award: ${roundWinner} already won. Revert first if needed.`, type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
        return;
    }

    setMessage({ text: `Awarding quaffle to ${house}...`, type: 'info' });
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/award-quaffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ house, round: roundId }),
      })
      if (!res.ok) throw new Error('Failed to award quaffle.');

      setRoundWinner(house); // Optimistic UI update
      setMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' })
    } catch (e: any) {
      console.error(e)
      setMessage({ text: `Failed to award quaffle: ${e.message}`, type: 'error' })
    }
    setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
  }

  // **NEW**: Helper to revert quaffle (Round Head access)
  const revertQuaffle = async (house: string, roundId = 'round-4') => {
      if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot revert.', type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
      }

      if (!confirm(`Are you sure you want to REVERT the Quaffle from ${house} for Round 4?`)) {
          return;
      }

      setMessage({ text: `Reverting Quaffle from ${house}...`, type: 'info' });

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/revert-quaffle', {
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
            body: JSON.stringify({ house, round: roundId })
        });

        if (!res.ok) {
           const errorData = await res.json();
           throw new Error(errorData.error || 'Failed to revert quaffle.');
        }

        setRoundWinner(null); // Clear winner in UI state
        setMessage({ text: `Quaffle successfully REVERTED from ${house}!`, type: 'success' });

      } catch (e: any) {
          console.error('Revert failed:', e);
          setMessage({ text: `Revert failed: ${e.message}`, type: 'error' });
      } finally {
        setTimeout(() => setMessage({ text: '', type: 'info' }), 5000);
      }
  }


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel']">
      Loading Round 4 Dashboard...
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
           <p className="text-xl mb-4 text-amber-200">Award or Revert the Quaffle for this round.</p>
          {/* Read-Only Lock Status Display */}
          <div className={`inline-block px-4 py-2 rounded font-semibold ${
            roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
          }`}>
            {roundLocked ? '🔒 Locked by Admin - View Only' : '🔓 Unlocked - Quaffle Management Enabled'}
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
            message.type === 'error' ? 'bg-red-900 border-red-700 text-red-300' : 'bg-green-900 border-green-700 text-green-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Award/Revert Quaffle Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Manage Round 4 Quaffle</h2>

          {roundWinner ? (
            // **NEW**: Show current winner and Revert button
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400 mb-4">🏆 Current Winner: {roundWinner} 🏆</p>
              <button
                onClick={() => revertQuaffle(roundWinner)}
                disabled={roundLocked}
                className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revert Quaffle from {roundWinner}
              </button>
            </div>
          ) : (
             // Original Award buttons
             <>
                <p className="text-amber-200 mb-4 text-xl">Select the house winner of {roundConfig.title}:</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  {roundConfig.houses.map(h=>
                    <button
                      key={h}
                      onClick={()=>awardQuaffle(h)}
                      disabled={roundLocked || !!roundWinner} // Also disable if winner exists
                      className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Give {h} Quaffle
                    </button>
                  )}
                </div>
             </>
          )}
           {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Round must be unlocked by Admin to manage Quaffles)</p>}
        </div>

        {/* Visualizations (Based on total score) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* House-wise scores */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              House Rankings (Overall Score)
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
              Team Rankings (Overall Score)
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