'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { canAccessRound } from '@/lib/roundHeadAuth'

interface ScoringLabels {
  dueling: string;
  strategy: string;
}

interface RoundConfig {
  title: string;
  maxTeams: number;
  scoringFields: Array<keyof ScoringLabels>;
  scoringLabels: ScoringLabels;
}

const roundConfig: RoundConfig = {
  title: 'Final Battle',
  maxTeams: 8,
  scoringFields: ['dueling', 'strategy'],
  scoringLabels: {
    dueling: 'Dueling Score',
    strategy: 'Strategy Points',
  },
}

export default function Round7() {
  const [user, setUser] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: 'info' })

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/auth/login'
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 7)) {
        window.location.href = '/auth/login'
        return
      }
      setUser(payload)
    } catch (e) {
      window.location.href = '/auth/login'
    }
  }, [])

  // Fetch teams and round status
  useEffect(() => {
    if (!user) return

    async function fetchData() {
      try {
        // Get round lock status
        const statusRes = await fetch('/api/admin/round-status?round=round-7')
        const statusData = await statusRes.json()
        setRoundLocked(statusData.isLocked)

        // Get round data
        const roundRes = await fetch('/api/rounds/round-7')
        const roundData = await roundRes.json()
        if (roundData.round?.results) {
          setTeams(roundData.round.results.map((r: any) => ({
            id: r.team._id,
            name: r.team.name,
            dueling: r.points,
            strategy: r.strategy,
            rank: r.rank,
          })))
        }
      } catch (err) {
        console.error(err)
        setMessage({ text: 'Failed to load data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [user])

  // Save team scores
  const saveScores = async () => {
    if (roundLocked) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const results = teams.map((team, idx) => ({
        team: team.id,
        points: Number(team.dueling) || 0,
        strategy: Number(team.strategy) || 0,
        rank: idx + 1,
      }))

      await fetch('/api/rounds/round-7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ results, approved: true }),
      })

      setMessage({ text: 'Scores saved successfully', type: 'success' })
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to save scores', type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
    }
  }

  const awardHouse = async (house:string, roundId='round-7') => {
    try{ const token = localStorage.getItem('token'); const res = await fetch('/api/admin/award-quaffle',{method:'POST', headers:{'Content-Type':'application/json','Authorization': token? `Bearer ${token}` : ''}, body: JSON.stringify({house, round: roundId})}); if(!res.ok) throw new Error('Failed'); alert('Quaffle awarded to '+house)}catch(e){console.error(e); alert('Failed to award')}
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel']">
      Loading...
    </div>
  )

  const sortedTeams = [...teams].sort((a, b) => {
    const aTotal = (Number(a.dueling) || 0) + (Number(a.strategy) || 0)
    const bTotal = (Number(b.dueling) || 0) + (Number(b.strategy) || 0)
    return bTotal - aTotal
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 7: {roundConfig.title}
          </h1>
          <p className="text-xl mb-4">The Final Challenge</p>
          <div className={`inline-block px-4 py-2 rounded ${
            roundLocked ? 'bg-red-900' : 'bg-green-900'
          }`}>
            {roundLocked ? '🔒 Round Locked' : '🔓 Round Unlocked'}
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
            message.type === 'error' ? 'bg-red-900' : 'bg-green-900'
          }`}>
            {message.text}
          </div>
        )}

        {!roundLocked && user && (user.role === 'admin' || user.role === 'round-head') && (
          <div className="mb-6 text-center">
            <p className="mb-2 text-amber-200">Award house quaffle:</p>
            <div className="flex justify-center gap-2">
              {['Gryffindor','Hufflepuff','Ravenclaw','Slytherin'].map(h=> <button key={h} onClick={()=>awardHouse(h)} className="px-3 py-1 bg-amber-600 rounded">Give {h}</button>)}
            </div>
          </div>
        )}
        {/* Scoring Table */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Final Battle Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-900/30">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Team</th>
                  {roundConfig.scoringFields.map(field => (
                    <th key={field} className="p-2">{roundConfig.scoringLabels[field]}</th>
                  ))}
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, idx) => {
                  const total = (Number(team.dueling) || 0) + (Number(team.strategy) || 0)
                  return (
                    <tr key={team.id} className="border-b border-amber-900/30 hover:bg-gray-700/50">
                      <td className="p-2 text-center">{idx + 1}</td>
                      <td className="p-2">{team.name}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-24 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100"
                          value={team.dueling || 0}
                          onChange={e => {
                            const newTeams = [...teams]
                            const index = newTeams.findIndex(t => t.id === team.id)
                            newTeams[index].dueling = Number(e.target.value)
                            setTeams(newTeams)
                          }}
                          disabled={roundLocked}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-24 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100"
                          value={team.strategy || 0}
                          onChange={e => {
                            const newTeams = [...teams]
                            const index = newTeams.findIndex(t => t.id === team.id)
                            newTeams[index].strategy = Number(e.target.value)
                            setTeams(newTeams)
                          }}
                          disabled={roundLocked}
                        />
                      </td>
                      <td className="p-2 text-center font-semibold text-amber-400">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!roundLocked && (
          <div className="text-center mb-8">
            <button
              onClick={saveScores}
              disabled={saving || roundLocked}
              className="bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold py-3 px-8 rounded-lg border-2 border-amber-400/30 hover:from-amber-800 hover:to-amber-950 transition-all shadow-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Scores'}
            </button>
          </div>
        )}

        {/* Team Rankings Visualization */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
            Final Battle Rankings
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer>
              <BarChart data={sortedTeams}>
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
                <Legend />
                <Bar dataKey="dueling" stackId="a" fill="#d97706" name="Dueling Score" />
                <Bar dataKey="strategy" stackId="a" fill="#92400e" name="Strategy Points" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
