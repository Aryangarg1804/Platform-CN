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

// Define Team interface for team info management
interface Team {
    _id?: string; // Database ID
    id: number;
    name: string;
    house: string;
    totalScore: number; // Current total points (read-only)
    isActive: boolean;
    isEliminated: boolean;
}


export default function Round5() {
  const [user, setUser] = useState<any>(null)
  const [roundLocked, setRoundLocked] = useState(true)
  // Round 5 and onwards include Slytherin
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']

  const [teams, setTeams] = useState<Team[]>([])
  const [saving, setSaving] = useState(false)
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
      if (!canAccessRound(payload, 5)) { // Check for Round 5 access
        window.location.href = '/auth/login'
        return
      }
      setUser(payload)
    } catch (e) {
      console.error('Authentication error:', e)
      window.location.href = '/auth/login'
    }
  }, [])

  // Fetch teams and round status from DB on mount and on poll
  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // 1. Get round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-5')
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked)

      // 2. Get teams (for editing and charts)
      const teamsRes = await fetch('/api/admin/teams')
      const teamsData: any[] = await teamsRes.json()

      // Map current teams input state to preserve any local changes (name/house edits)
      const currentLocalStateMap = new Map(teams.filter(t => t._id).map(t => [t._id, { name: t.name, house: t.house }]));

      if (teamsData && teamsData.length) {
        
        // Filter teams that are ACTIVE and NOT ELIMINATED for Round 5 
        const relevantTeams = teamsData.filter(t => t.isActive !== false && t.isEliminated !== true);
        
        // 1. Map DB teams to local format
        let mappedTeams: Team[] = relevantTeams
            .map((dbTeam: any) => {
                const dbId = dbTeam._id;
                const localOverrides = currentLocalStateMap.get(dbId);
                
                return {
                    id: 0, // Temporary ID for sorting
                    _id: dbId,
                    name: localOverrides?.name || dbTeam.name, // Use local override if available (unsaved changes)
                    house: localOverrides?.house || dbTeam.house, // Use local override if available (unsaved changes)
                    totalScore: dbTeam.totalPoints || 0,
                    isActive: dbTeam.isActive,
                    isEliminated: dbTeam.isEliminated || false,
                };
            });
        
        // 2. SORT TEAMS: Sort by house (A-Z) then by name (A-Z)
        mappedTeams.sort((a, b) => {
          if (a.house < b.house) return -1;
          if (a.house > b.house) return 1;
          return a.name.localeCompare(b.name);
        });

        // 3. Reassign sequential IDs after sorting to keep the first column logical
        mappedTeams.forEach((team, index) => team.id = index + 1);

        setTeams(mappedTeams);
      } else {
        setTeams([]);
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

  // Handle changes for name and house
  const handleTeamInfoChange = (id: number, field: keyof Omit<Team, 'totalScore'|'isActive'|'isEliminated'|'id'>, value: string) => {
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, [field]: value } : team))
    )
  }

  // Calculate house-wise totals for charts (based on total score)
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

  // Save functionality for HOUSE/NAME changes (no score update)
  const saveTeamChanges = async () => {
    if (roundLocked) {
      setMessage({ text: 'Round is locked. Cannot save house/name changes.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // Prepare data for POST /api/admin/teams. 
      // Do NOT send a 'score' field to avoid modifying totalPoints.
      const teamsToUpdate = teams
        .filter(t => t._id) 
        .map(team => ({
          _id: team._id,
          name: team.name, 
          house: team.house,
          isActive: team.isActive,
        }));

      const res = await fetch('/api/admin/teams', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(teamsToUpdate), // Sends array of teams for update
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save team information.');
      }

      await fetchData(); // Refresh data to confirm changes (which will also resort the list)
      setMessage({ text: 'Team name/house updated successfully!', type: 'success' });

    } catch (err: any) {
      console.error('Error saving team info:', err);
      setMessage({ text: 'Error saving team info: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
    }
  };

  // Helper to award quaffle
  const awardQuaffle = async (house: string, roundId = 'round-5') => {
    if (roundLocked) {
        setMessage({ text: 'Round is currently locked by the admin. Cannot award quaffle.', type: 'error' })
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
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
            body: JSON.stringify({house: house, round: roundId}) // Round 5 quaffle
        });
        if (!res.ok) throw new Error('Failed to award quaffle.');
        setMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' })
    } catch(e: any) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 5 Dashboard (Round Head): Emergency Discussion
          </h1>
          <p className="text-xl mb-4">Manage House/Name info and award Quaffle. Score modification disabled.</p>
          {/* Read-Only Lock Status Display */}
          <div className={`inline-block px-4 py-2 rounded font-semibold ${
            roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
          }`}>
            {roundLocked ? '🔒 Round Locked - Read Only' : '🔓 Round Unlocked - Ready for Info/Quaffle'}
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
            message.type === 'error' ? 'bg-red-900' : 'bg-green-900'
          }`}>
            {message.text}
          </div>
        )}

        {/* Team Info Table (No scoring input) */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Team Info Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-900/30">
                  <th className="p-2">#</th>
                  <th className="p-2">Team Name</th>
                  <th className="p-2">House</th>
                  <th className="p-2">Current Total Score</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id} className="border-b border-amber-900/30 hover:bg-gray-700/50">
                    <td className="p-2 text-center">{team.id}</td>
                    <td className="p-2">
                        {/* Team Name: Editable when unlocked */}
                        <input 
                            type="text" 
                            className="w-36 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100 text-center" 
                            value={team.name} 
                            onChange={e => handleTeamInfoChange(team.id, 'name', e.target.value)}
                            disabled={roundLocked} 
                            placeholder="Enter team name"
                        />
                    </td>
                    <td className="p-2">
                        {/* House: Editable when unlocked */}
                        <select
                            className="w-28 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100"
                            value={team.house}
                            onChange={e => handleTeamInfoChange(team.id, 'house', e.target.value)}
                            disabled={roundLocked}
                        >
                            <option value="">Select</option>
                            {houses.map(h => (
                                <option key={h} value={h}>
                                    {h}
                                </option>
                            ))}
                        </select>
                    </td>
                    <td className="p-2 text-amber-300 font-semibold">{team.totalScore}</td>
                     <td className="p-2">
                         <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            team.isActive ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                          }`}>
                            {team.isActive ? 'Active' : 'Inactive'}
                          </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button - Only one button for House/Name changes */}
        {!roundLocked && (
          <div className="text-center mb-8 flex justify-center gap-4 flex-wrap">
             <button
                onClick={saveTeamChanges}
                disabled={saving || roundLocked}
                className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-3 px-8 rounded-lg border-2 border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save House/Name Changes'}
            </button>
          </div>
        )}

        {/* Award Quaffle (4 Houses) */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Award Round 5 Quaffle</h2>
            <p className="mb-4 text-amber-200">Select the house winner of the Round 5:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {houses.map(h=>
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

        {/* Leaderboards */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* House-wise scores */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              🏆 House-wise Leaderboard
            </h2>
            <div className="h-[300px]">
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
                  <Bar dataKey="total" fill="#b45309" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Rankings */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              ⚡ Team-wise Leaderboard
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
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