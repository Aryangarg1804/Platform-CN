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

// Define Team interface for type safety with new fields for score management
interface Team {
    _id?: string; // Optional DB ID
    id: number;
    name: string;
    house: string;
    totalScore: number; // Current total points (read-only in UI)
    pointsToAdd: number; // Points for current round (editable input)
}

export default function Round1() {
  const [user, setUser] = useState<any>(null)
  const [roundLocked, setRoundLocked] = useState(true)
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw'] 

  // Auth check on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      window.location.href = '/auth/login'
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 1)) {
        window.location.href = '/auth/login'
        return
      }
      setUser(payload)
    } catch (e) {
      console.error('Authentication error:', e)
      window.location.href = '/auth/login'
    }
  }, [])

  // Initial blank 24 teams structure
  const initialTeams: Team[] = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: '',
    house: '',
    totalScore: 0,
    pointsToAdd: 0,
  }))

  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [saving, setSaving] = useState(false)

  // Fetch teams and round status from DB on mount and on poll
  const fetchData = async () => {
    if (!user) return

    try {
      // Get round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-1')
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked) 

      // Get teams
      const teamsRes = await fetch('/api/teams')
      const teamsData = await teamsRes.json()
      
      // Map current teams input state to preserve any pointsToAdd that haven't been saved
      const currentPointsToAddMap = new Map(teams.map(t => [t.id, t.pointsToAdd]));

      if (teamsData && teamsData.teams && teamsData.teams.length) {
        // Fill only first 24 slots with actual teams
        const filledTeams = initialTeams.map((team, idx) => {
          const dbTeam = teamsData.teams[idx];
          if (dbTeam) {
            return {
              ...team,
              _id: dbTeam._id,
              name: dbTeam.name,
              house: dbTeam.house,
              totalScore: dbTeam.totalPoints || 0,
              // Keep old pointsToAdd value if available, otherwise reset to 0
              pointsToAdd: currentPointsToAddMap.get(team.id) || 0,
            };
          }
          return team;
        }).filter(t => t.name.trim() !== ''); // Filter out blank placeholder rows

        // Append remaining active teams if any
        const existingIds = new Set(filledTeams.map(t => t._id));
        let nextId = filledTeams.length + 1;
        
        const additionalTeams = teamsData.teams
            .filter((dbTeam: any) => !existingIds.has(dbTeam._id))
            .map((dbTeam: any) => ({
                id: nextId++,
                _id: dbTeam._id,
                name: dbTeam.name,
                house: dbTeam.house,
                totalScore: dbTeam.totalPoints || 0,
                pointsToAdd: 0,
            }));

        setTeams(filledTeams.concat(additionalTeams));
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Effect for fetching data
  useEffect(() => {
    fetchData()
    // Polling interval to keep status and scores updated
    const interval = setInterval(fetchData, 10000) 
    return () => clearInterval(interval)
  }, [user]) // Re-run effect when user object changes

  // Handle changes for points to add
  const handleChange = (id: number, value: number) => {
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, pointsToAdd: value } : team))
    )
  }

  // House-wise leaderboard uses the totalScore
  const houseScores = houses.map(house => ({
    name: house,
    total: teams
      .filter(t => t.house === house && t.name.trim() !== '')
      .reduce((sum, t) => sum + Number(t.totalScore || 0), 0),
  }))

  // Team-wise leaderboard uses the totalScore
  const teamScores = teams
    .filter(t => t.name.trim() !== '')
    .map(t => ({
      name: t.name,
      score: Number(t.totalScore || 0),
      house: t.house,
    }))
    .sort((a, b) => b.score - a.score)

  // Save functionality now handles score addition
  const saveTeams = async () => {
    if (roundLocked) {
        alert('Round is currently locked by the admin. Cannot save.')
        return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      // 1. Prepare data for POST /api/admin/teams (Performs $inc/addition)
      const teamsToUpdate = teams
        .filter(t => t.pointsToAdd > 0 && t._id) // Only send if points added and team has a DB ID
        .map(team => ({
          _id: team._id,
          name: team.name, 
          house: team.house,
          score: team.pointsToAdd // Mapped to $inc totalPoints on backend
        }));

      if (teamsToUpdate.length === 0) {
        alert('No new points to add. Ensure you have entered scores > 0.')
        return;
      }
        
      const teamSaveRes = await fetch('/api/admin/teams', { // Changed to Admin endpoint for $inc logic
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(teamsToUpdate),
      })
      
      const teamSaveData = await teamSaveRes.json()

      if (!teamSaveRes.ok) {
          throw new Error(teamSaveData.error || 'Failed to save teams data.')
      }

      // 2. Refresh data immediately to show updated total scores and reset input fields
      await fetchData();

      // 3. Save round results (logs the state of this round to the Round model)
      // Use the newly fetched data (stored in `teams` after fetchData) to submit round results
      const results = teams.filter(t => t.name.trim() !== '').map((team, idx) => ({
          team: team._id,
          points: team.totalScore, // Send the current total score
          rank: idx + 1,
          time: 0,
      }));

      await fetch('/api/rounds/round-1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ results, approved: true }),
      })

      alert('Points added and scores updated successfully!')
    } catch (err: any) {
      console.error(err)
      alert('Error saving scores: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Helper to award quaffle
  const awardQuaffle = async (house: string) => {
    if (roundLocked) {
        alert('Round is currently locked by the admin. Cannot award quaffle.')
        return
    }
    const token = localStorage.getItem('token')
    try { 
        const res = await fetch('/api/admin/award-quaffle', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`
            }, 
            body: JSON.stringify({house: house, round: 'round-1'})
        }); 
        if (!res.ok) throw new Error('Failed to award quaffle.');
        alert('Quaffle awarded to ' + house);
    } catch(e) {
        console.error(e); 
        alert('Failed to award quaffle');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 1 Dashboard (Round Head)</h1>
        <p className="text-2xl mb-6">Sorting Hat Ceremony</p>
        {/* Read-Only Lock Status Display */}
        <div className={`inline-block px-4 py-2 rounded font-semibold ${
          roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
        }`}>
          {roundLocked ? '🔒 Round Locked - Read Only' : '🔓 Round Unlocked - Ready for Scoring'}
        </div>
      </header>

      {/* Warning/Info message */}
      {roundLocked && (
         <div className="p-4 mb-6 rounded text-center bg-red-900/50 border border-red-700 text-red-300">
             The round is currently locked by the Admin. You cannot edit data or award Quaffles.
         </div>
      )}

      {/* Team Entry Table */}
      <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg w-full max-w-5xl mb-6 overflow-x-auto border-2 border-amber-900/30">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-900/50 text-amber-400">
            <tr>
              <th className="p-2 border border-amber-900/30">#</th>
              <th className="p-2 border border-amber-900/30">Team Name</th>
              <th className="p-2 border border-amber-900/30">House</th>
              <th className="p-2 border border-amber-900/30">Current Total Score</th>
              <th className="p-2 border border-amber-900/30">Points to Add (Round 1)</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="border-t border-amber-900/30 hover:bg-gray-700/50">
                <td className="p-2 border border-amber-900/30">{team.id}</td>
                <td className="p-2 border border-amber-900/30">
                  {/* Team Name: Always disabled */}
                  <input
                    type="text"
                    className="w-40 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100 text-center"
                    value={team.name}
                    disabled={true} 
                  />
                </td>
                <td className="p-2 border border-amber-900/30">
                  {/* House: Always disabled */}
                  <select
                    className="bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100"
                    value={team.house}
                    disabled={true} 
                  >
                    <option value="">Select</option>
                    {houses.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border border-amber-900/30 text-amber-300 font-semibold">
                  {/* Current Total Score: Read-only display */}
                  {team.totalScore}
                </td>
                <td className="p-2 border border-amber-900/30">
                  {/* Points to Add: Editable when unlocked */}
                  <input
                    type="number"
                    className="w-24 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100 text-right"
                    value={team.pointsToAdd}
                    onChange={e =>
                      handleChange(team.id, Number(e.target.value) < 0 ? 0 : Number(e.target.value))
                    }
                    disabled={roundLocked} // Disabled when locked
                    placeholder="0"
                    min="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      {!roundLocked && (
        <button
          onClick={saveTeams}
          disabled={saving || roundLocked}
          className="bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold py-2 px-6 rounded-lg mb-8 border-2 border-amber-400/30 hover:from-amber-800 hover:to-amber-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : '💾 Save Added Points'}
        </button>
      )}

      {/* Award Quaffle (for authorized Round Head) */}
      <div className="mb-8 p-4 bg-gray-800/50 rounded-lg border border-amber-900/30">
        <p className="mb-3 text-amber-200 font-semibold">Award a house quaffle (Round 1 Winner):</p>
        <div className="flex gap-4 items-center justify-center">
          {houses.map(h => (
            <button 
              key={h} 
              onClick={() => awardQuaffle(h)} 
              disabled={roundLocked} // Disabled when locked
              className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Give {h} Quaffle
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* House-wise Leaderboard */}
        <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-xl font-semibold mb-4 text-center text-amber-400 font-serif">
            🏆 House-wise Leaderboard
          </h2>
          <ResponsiveContainer width="100%" height={300}>
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
              <Legend />
              <Bar dataKey="total" fill="#b45309" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team-wise Leaderboard */}
        <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-xl font-semibold mb-4 text-center text-amber-400 font-serif">
            ⚡ Team-wise Leaderboard
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#fcd34d"
              />
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
  )
}