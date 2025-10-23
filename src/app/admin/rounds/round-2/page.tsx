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

interface Team {
  _id: string
  name: string
  house: string
  isActive: boolean
  roundsParticipating: number[]
  score?: number
  time?: number
  rank?: number
}

interface RoundData {
  round: {
    results: Array<{
      team: Team
      points: number
      time: number
      rank: number
    }>
    isLocked: boolean
  }
}

export default function Round2() {
  const [teams, setTeams] = useState<Team[]>([])
  const [roundData, setRoundData] = useState<RoundData | null>(null)
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: 'info' })
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: '',
    house: '',
  })

  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw']

  // Fetch teams and round data
  useEffect(() => {
    async function fetchData() {
      try {
        // Get round lock status
        const statusRes = await fetch('/api/admin/round-status?round=round-2')
        const statusData = await statusRes.json()
        setRoundLocked(statusData.isLocked)

        // Get teams for this round
        const teamsRes = await fetch('/api/admin/teams?round=2')
        const teamsData = await teamsRes.json()
        setTeams(teamsData)

        // Get round scores
        const roundRes = await fetch('/api/rounds/round-2')
        const roundData = await roundRes.json()
        setRoundData(roundData)
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
  }, [])

  // Toggle round lock
  const toggleRoundLock = async () => {
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round: 'round-2',
          isLocked: !roundLocked
        })
      })
      if (res.ok) {
        setRoundLocked(!roundLocked)
        setMessage({
          text: `Round ${!roundLocked ? 'locked' : 'unlocked'} successfully`,
          type: 'success'
        })
      }
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to toggle round lock', type: 'error' })
    }
  }

  // Add new team
  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.house) {
      setMessage({ text: 'Please fill all fields', type: 'error' })
      return
    }

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teams: [{
            name: newTeam.name,
            house: newTeam.house,
            roundsParticipating: [2],
            isActive: true
          }]
        })
      })

      if (res.ok) {
        setMessage({ text: 'Team added successfully', type: 'success' })
        setNewTeam({ name: '', house: '' })
        setShowAddTeam(false)
      }
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to add team', type: 'error' })
    }
  }

  // Reset round scores
  const resetRound = async () => {
    if (!confirm('Are you sure you want to reset all scores for this round?')) return

    try {
      await fetch('/api/rounds/round-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: teams.map(team => ({
            team: team._id,
            points: 0,
            time: 0,
            rank: 0
          })),
          approved: true
        })
      })
      setMessage({ text: 'Round reset successfully', type: 'success' })
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to reset round', type: 'error' })
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel']">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 2: Quidditch Tournament
          </h1>
          <div className="flex justify-center gap-4">
            <button
              onClick={toggleRoundLock}
              className={`px-4 py-2 rounded transition-colors ${
                roundLocked ? 'bg-green-900 hover:bg-green-800' : 'bg-red-900 hover:bg-red-800'
              }`}
            >
              {roundLocked ? '🔓 Unlock Round' : '🔒 Lock Round'}
            </button>
            <button
              onClick={resetRound}
              className="px-4 py-2 rounded bg-red-900 hover:bg-red-800 transition-colors"
            >
              ↺ Reset Round
            </button>
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
            message.type === 'error' ? 'bg-red-900' : 'bg-green-900'
          }`}>
            {message.text}
          </div>
        )}

        {/* Award Quaffle control */}
        <div className="text-center mb-6">
          <p className="text-amber-200 mb-2">Award a house quaffle (round win):</p>
          <div className="flex justify-center gap-2">
            {['Gryffindor','Hufflepuff','Ravenclaw'].map(h => (
              <button key={h} onClick={async () => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                try {
                  await fetch('/api/admin/award-quaffle', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ house: h, round: 'round-2' }) })
                  alert('Quaffle awarded to ' + h)
                } catch (e) { console.error(e); alert('Failed to award quaffle') }
              }} className="px-3 py-1 rounded bg-amber-700">Give {h}</button>
            ))}
          </div>
        </div>

        {/* Add Team Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400">Teams</h2>
            <button
              onClick={() => setShowAddTeam(!showAddTeam)}
              className="px-4 py-2 rounded bg-amber-900 hover:bg-amber-800 transition-colors"
            >
              {showAddTeam ? 'Cancel' : '+ Add Team'}
            </button>
          </div>

          {showAddTeam && (
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Team Name"
                  value={newTeam.name}
                  onChange={e => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-600 text-amber-100 p-2 rounded border border-amber-900/50"
                />
                <select
                  value={newTeam.house}
                  onChange={e => setNewTeam(prev => ({ ...prev, house: e.target.value }))}
                  className="bg-gray-600 text-amber-100 p-2 rounded border border-amber-900/50"
                >
                  <option value="">Select House</option>
                  {houses.map(house => (
                    <option key={house} value={house}>{house}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddTeam}
                  className="px-4 py-2 rounded bg-amber-900 hover:bg-amber-800 transition-colors"
                >
                  Add Team
                </button>
              </div>
            </div>
          )}

          {/* Teams Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-900/30">
                  <th className="p-2">Team</th>
                  <th className="p-2">House</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Rank</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams
                  .sort((a, b) => {
                    const aResult = roundData?.round.results.find(r => r.team._id === a._id)
                    const bResult = roundData?.round.results.find(r => r.team._id === b._id)
                    return (aResult?.rank || 999) - (bResult?.rank || 999)
                  })
                  .map(team => {
                    const result = roundData?.round.results.find(r => r.team._id === team._id)
                    return (
                      <tr key={team._id} className="border-b border-amber-900/30 hover:bg-gray-700/50">
                        <td className="p-2">{team.name}</td>
                        <td className="p-2">{team.house}</td>
                        <td className="p-2">{result?.points || 0}</td>
                        <td className="p-2">{result?.time || 0}</td>
                        <td className="p-2">{result?.rank || '-'}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-1 rounded ${
                            team.isActive ? 'bg-green-900' : 'bg-red-900'
                          }`}>
                            {team.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-2">
                          <button
                            onClick={async () => {
                              if (!confirm('Are you sure you want to remove this team?')) return
                              try {
                                await fetch('/api/admin/teams', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ teamId: team._id })
                                })
                                setMessage({ text: 'Team removed successfully', type: 'success' })
                              } catch (err) {
                                setMessage({ text: 'Failed to remove team', type: 'error' })
                              }
                            }}
                            className="px-3 py-1 rounded bg-red-900 hover:bg-red-800 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* House-wise scores */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              House Rankings
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={houses.map(house => ({
                  name: house,
                  total: roundData?.round.results
                    .filter(r => r.team.house === house)
                    .reduce((sum, r) => sum + (r.points || 0), 0) || 0
                }))}>
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
              Team Rankings
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={roundData?.round.results || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                  <XAxis dataKey="team.name" interval={0} angle={-45} textAnchor="end" height={80} stroke="#fcd34d" />
                  <YAxis stroke="#fcd34d" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #78350f',
                      borderRadius: '4px',
                      color: '#fcd34d'
                    }}
                  />
                  <Bar dataKey="points" fill="#d97706" name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
