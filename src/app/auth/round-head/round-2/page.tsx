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

interface FormData {
  team1: string
  team2: string
  potion: string
  points: string
  time: string
}

const INITIAL_FORM_STATE: FormData = {
  team1: '',
  team2: '',
  potion: '',
  points: '',
  time: ''
}

interface RoundConfig {
  title: string;
  maxTeams: number;
  houses: string[];
}

// Round-specific configuration
const roundConfig: RoundConfig = {
  title: 'Round 2: Potion Creation',
  maxTeams: 24,
  houses: ['Gryffindor', 'Hufflepuff', 'Ravenclaw'],
}

export default function Round2() {
  const [user, setUser] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [potions, setPotions] = useState<any[]>([])
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: 'info' })
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE)
  const [savedPairs, setSavedPairs] = useState<any[]>([])
  const [formError, setFormError] = useState('')

  // Auth check and data fetching
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/auth/login'
        return false
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (!canAccessRound(payload, 2)) {
          window.location.href = '/auth/login'
          return false
        }
        setUser(payload)
        return true
      } catch (e) {
        window.location.href = '/auth/login'
        return false
      }
    }
    
    const fetchData = async () => {
      try {
        // Get round lock status
        const statusRes = await fetch('/api/admin/round-status?round=round-2')
        const statusData = await statusRes.json()
        setRoundLocked(statusData.isLocked)

        // Get teams data
        const teamsRes = await fetch('/api/teams')
        const teamsData = await teamsRes.json()
        setTeams(teamsData.teams || [])

        // Get potions data
        const potionsRes = await fetch('/api/admin/potions')
        const potionsData = await potionsRes.json()
        setPotions(potionsData.potions || [])

        // Get round data
        const roundRes = await fetch('/api/rounds/round-2')
        const roundData = await roundRes.json()
        if (roundData.round?.results) {
          setSavedPairs(roundData.round.results
            .filter((r: any) => r.team && r.points !== 'N/A')
            .map((r: any) => ({
              id: r.team._id,
              team1: r.team.name,
              team2: r.team2?.name || 'N/A',
              potion: r.potionCreatedRound2?.name || 'N/A',
              points: r.points,
              time: r.time,
            }))
          )
        }
      } catch (err) {
        console.error(err)
        setMessage({ text: 'Failed to load data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    const init = async () => {
      const isAuthorized = checkAuth()
      if (!isAuthorized) return
      await fetchData()
    }

    init()
    const interval = setInterval(fetchData, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [])

  // Submit team pair
  const submitPair = async () => {
    if (roundLocked) {
      setFormError('Round is locked')
      return
    }

    // Validate form
    if (!formData.team1 || !formData.team2 || !formData.potion || !formData.points || !formData.time) {
      setFormError('All fields are required')
      return
    }

    if (formData.team1 === formData.team2) {
      setFormError('Team 1 and Team 2 cannot be the same')
      return
    }

    if (Number(formData.points) < 0) {
      setFormError('Points cannot be negative')
      return
    }

    if (Number(formData.time) < 0) {
      setFormError('Time cannot be negative')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/round-2/submit-pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          team1: formData.team1,
          team2: formData.team2,
          potion: formData.potion,
          points: Number(formData.points),
          time: Number(formData.time)
        }),
      })

      const result = await response.text()
      if (!response.ok) {
        throw new Error(result)
      }

      setMessage({ text: 'Pair saved successfully', type: 'success' })
      setFormData(INITIAL_FORM_STATE)

      // Refresh data
      const roundRes = await fetch('/api/rounds/round-2')
      const roundData = await roundRes.json()
      if (roundData.round?.results) {
        setSavedPairs(roundData.round.results
          .filter((r: any) => r.team && r.points !== 'N/A')
          .map((r: any) => ({
            id: r.team._id,
            team1: r.team.name,
            team2: r.team2?.name || 'N/A',
            potion: r.potionCreatedRound2?.name || 'N/A',
            points: r.points,
            time: r.time,
          }))
        )
      }
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Failed to save pair')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
    }
  }

  // helper to award quaffle
  const awardHouse = async (house: string, roundId = 'round-2') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/award-quaffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ house, round: roundId }),
      })
      if (!res.ok) throw new Error('Failed')
      alert('Quaffle awarded to ' + house)
    } catch (e) {
      console.error(e)
      alert('Failed to award quaffle')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel']">
      Loading...
    </div>
  )

  // Calculate house-wise totals from pairs
  const houseScores = roundConfig.houses.map(house => {
    const houseTeams = teams?.filter(t => t.house === house).map(t => t.name) || []
    return {
      name: house,
      total: savedPairs?.filter(pair => 
        houseTeams.includes(pair.team1) || 
        (pair.team2 !== 'N/A' && houseTeams.includes(pair.team2))
      )?.reduce((sum, pair) => sum + Number(pair.points || 0), 0) || 0,
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            {roundConfig.title}
          </h1>
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

        {/* Award Quaffle for authorized round-head */}
        {!roundLocked && user && (user.role === 'admin' || user.role === 'round-head') && (
          <div className="mb-6 text-center">
            <p className="mb-2 text-amber-200">Award house quaffle:</p>
            <div className="flex justify-center gap-2">
              {['Gryffindor','Hufflepuff','Ravenclaw'].map(h => (
                <button key={h} onClick={() => awardHouse(h)} className="px-3 py-1 bg-amber-600 rounded">Give {h}</button>
              ))}
            </div>
          </div>
        )}
        
        {/* Pair Submission Form */}
        {!roundLocked && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Submit Team Pair</h2>
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block mb-2">Team 1</label>
                  <select
                    className="w-full bg-gray-700 border border-amber-900/50 rounded p-2 text-amber-100"
                    value={formData.team1}
                    onChange={(e) => {
                      setFormData({ ...formData, team1: e.target.value })
                      setFormError('')
                    }}
                  >
                    <option value="">Select Team</option>
                    {teams?.map((team: any) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Team 2</label>
                  <select
                    className="w-full bg-gray-700 border border-amber-900/50 rounded p-2 text-amber-100"
                    value={formData.team2}
                    onChange={(e) => {
                      setFormData({ ...formData, team2: e.target.value })
                      setFormError('')
                    }}
                  >
                    <option value="">Select Team</option>
                    {teams?.map((team: any) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Potion</label>
                  <select
                    className="w-full bg-gray-700 border border-amber-900/50 rounded p-2 text-amber-100"
                    value={formData.potion}
                    onChange={(e) => {
                      setFormData({ ...formData, potion: e.target.value })
                      setFormError('')
                    }}
                  >
                    <option value="">Select Potion</option>
                    {potions?.map((potion: any) => (
                      <option key={potion._id} value={potion._id}>
                        {potion.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Points</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-gray-700 border border-amber-900/50 rounded p-2 text-amber-100"
                    value={formData.points}
                    onChange={(e) => {
                      setFormData({ ...formData, points: e.target.value })
                      setFormError('')
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2">Time (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-gray-700 border border-amber-900/50 rounded p-2 text-amber-100"
                    value={formData.time}
                    onChange={(e) => {
                      setFormData({ ...formData, time: e.target.value })
                      setFormError('')
                    }}
                  />
                </div>
              </div>
              {formError && (
                <div className="mt-4 p-3 bg-red-900 rounded text-center">
                  {formError}
                </div>
              )}
            </div>
            <div className="text-center">
              <button
                onClick={submitPair}
                disabled={saving}
                className="bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold py-2 px-6 rounded-lg border-2 border-amber-400/30 hover:from-amber-800 hover:to-amber-950 transition-all shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Submit Pair'}
              </button>
            </div>
          </div>
        )}

        {/* Saved Pairs Table */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Saved Pairs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-900/30">
                  <th className="p-2">Team 1</th>
                  <th className="p-2">Team 2</th>
                  <th className="p-2">Potion</th>
                  <th className="p-2">Points</th>
                  <th className="p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {savedPairs?.map((pair, idx) => (
                  <tr key={idx} className="border-b border-amber-900/30 hover:bg-gray-700/50">
                    <td className="p-2">{pair.team1}</td>
                    <td className="p-2">{pair.team2}</td>
                    <td className="p-2">{pair.potion}</td>
                    <td className="p-2">{pair.points}</td>
                    <td className="p-2">{pair.time}</td>
                  </tr>
                )) || null}
              </tbody>
            </table>
          </div>
        </div>



        

        {/* Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* House-wise scores */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              House Rankings (Total Points)
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

          {/* Pair Rankings */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              Pair Rankings
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={savedPairs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                  <XAxis dataKey="team1" interval={0} angle={-45} textAnchor="end" height={80} stroke="#fcd34d" />
                  <YAxis stroke="#fcd34d" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #78350f',
                      borderRadius: '4px',
                      color: '#fcd34d'
                    }}
                  />
                  <Bar dataKey="points" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
