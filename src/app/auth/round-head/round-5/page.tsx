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
import { canAccessRound } from '@/lib/roundHeadAuth' //

// Define Team interface for team info display
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
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: 'info' })
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // Add saving state

  // Auth check on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      window.location.href = '/auth/login' //
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 5)) { // Check for Round 5 access
        window.location.href = '/auth/login' //
        return
      }
      setUser(payload)
    } catch (e) {
      console.error('Authentication error:', e)
      window.location.href = '/auth/login' //
    }
  }, [])

  // Fetch teams, round status, and current winner
  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // 1. Get round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-5'); //
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked)

      // 2. Fetch current round winner status
      const roundDetailsRes = await fetch('/api/rounds/round-5'); ///route.ts]
      const roundDetailsData = await roundDetailsRes.json();
      if (roundDetailsRes.ok && roundDetailsData.round) {
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null);
      } else {
         console.warn('Could not fetch round details or winner.');
         setRoundWinner(null);
      }

      // 3. Get teams (for display and charts)
      const teamsRes = await fetch('/api/admin/teams'); // Using admin/teams to get full list
      const teamsData = await teamsRes.json()

      // Check based on actual API response structure (array directly)
      if (teamsData && Array.isArray(teamsData)) {
        // Filter teams that are ACTIVE and NOT ELIMINATED
        const relevantTeams = teamsData.filter((t: any) => t.isActive !== false && t.isEliminated !== true);

        let mappedTeams: Team[] = relevantTeams
            .map((dbTeam: any) => ({
                id: 0, // Temp ID
                _id: dbTeam._id,
                name: dbTeam.name,
                house: dbTeam.house,
                totalScore: dbTeam.totalPoints || 0,
                isActive: dbTeam.isActive,
                isEliminated: dbTeam.isEliminated || false,
            }));

        // Sort teams by house then name
        mappedTeams.sort((a, b) => {
          if (a.house < b.house) return -1;
          if (a.house > b.house) return 1;
          return a.name.localeCompare(b.name);
        });

        // Assign sequential IDs after sorting
        mappedTeams.forEach((team, index) => team.id = index + 1);

        setTeams(mappedTeams);
      } else {
         console.warn("Received unexpected data format from /api/admin/teams or no teams found.");
         setTeams([]); // Set to empty array if data is not as expected
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
    if (user) { // Only fetch if user is authenticated
        fetchData()
        const interval = setInterval(fetchData, 10000) // poll every 10s
        return () => clearInterval(interval)
    }
  }, [fetchData, user]) // Add user dependency here

  // **NEW**: Handle changes for house dropdown
  const handleHouseChange = (id: number, value: string) => {
    if (roundLocked) return; // Prevent changes if locked
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, house: value } : team))
    );
    setMessage({ text: '', type: 'info'}); // Clear message on edit
  };

  // **NEW**: Save Functionality for House Changes (Calls admin API)
  const saveTeamChanges = async () => {
    if (roundLocked) {
      setMessage({ text: 'Round is locked by Admin. Cannot save changes.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
    setSaving(true);
    setMessage({ text: 'Attempting to save house changes...', type: 'info'});

    try {
      const token = localStorage.getItem('token');
      // Prepare data for POST /api/admin/teams.
      // Send only fields relevant to house/name update.
      const teamsToUpdate = teams
        .filter(t => t._id) // Ensure team has a database ID
        .map(team => ({
          _id: team._id,
          name: team.name, // Name might be required by API
          house: team.house,
          // Do NOT send score or totalPoints
        }));

      if (teamsToUpdate.length === 0) {
        setMessage({ text: 'No teams to update.', type: 'info'});
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/teams', { // Calls the admin endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send token for auth check
        },
        body: JSON.stringify(teamsToUpdate),
      });

      const data = await res.json();

      if (!res.ok) {
        // Provide specific feedback if forbidden
        if (res.status === 403) {
            throw new Error(data.error || 'Permission denied. Only Admins can save these changes.');
        }
        throw new Error(data.error || 'Failed to save team information.');
      }

      setMessage({ text: 'House changes saved successfully!', type: 'success' });
      await fetchData(); // Refresh data to confirm changes

    } catch (err: any) {
      console.error('Error saving team info:', err);
      setMessage({ text: `Error saving changes: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: 'info' }), 4000); // Clear message after 4s
    }
  };


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

  // Helper to award quaffle
  const awardQuaffle = async (house: string, roundId = 'round-5') => {
    if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot award.', type: 'error' })
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
        return
    }
     if (roundWinner) {
        setMessage({ text: `Cannot award: ${roundWinner} already won. Revert first if needed.`, type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
        return;
    }

    setMessage({ text: `Awarding quaffle to ${house}...`, type: 'info' });
    const token = localStorage.getItem('token')
    try {
        const res = await fetch('/api/admin/award-quaffle', { //
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({house: house, round: roundId}) // Round 5 quaffle
        });
        if (!res.ok) throw new Error('Failed to award quaffle.');
        setRoundWinner(house); // Optimistic UI update
        setMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' })
    } catch(e: any) {
        console.error(e)
        setMessage({ text: `Failed to award quaffle: ${e.message}`, type: 'error' })
    }
    setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
  }

  // Helper to revert quaffle
  const revertQuaffle = async (house: string, roundId = 'round-5') => {
      if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot revert.', type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
      }

      if (!confirm(`Are you sure you want to REVERT the Quaffle from ${house} for Round 5?`)) {
          return;
      }

      setMessage({ text: `Reverting Quaffle from ${house}...`, type: 'info' });
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/admin/revert-quaffle', { //
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${token}`},
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
      Loading Round 5 Dashboard...
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 5 Dashboard (Round Head): Emergency Discussion
          </h1>
          <p className="text-xl mb-4">Manage House assignments and the Quaffle winner for this round.</p>
          <div className={`inline-block px-4 py-2 rounded font-semibold ${
            roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
          }`}>
            {roundLocked ? '🔒 Locked by Admin - View Only' : '🔓 Unlocked - Management Enabled'}
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
             message.type === 'error' ? 'bg-red-900 border-red-700 text-red-300' : message.type === 'success' ? 'bg-green-900 border-green-700 text-green-300' : 'bg-blue-900 border-blue-700 text-blue-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Team Info Table (House Editable) */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Team House Management</h2>
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
                  <tr key={team.id} className={`border-b border-amber-900/30 hover:bg-gray-700/50 ${team.isEliminated ? 'opacity-50' : ''}`}>
                    <td className="p-2 text-center">{team.id}</td>
                    <td className="p-2 font-medium">{team.name}</td>
                    <td className="p-2">
                        {/* House: Editable when unlocked */}
                        <select
                            className={`w-28 bg-gray-700 border ${roundLocked || team.isEliminated ? 'border-gray-600' : 'border-amber-900/50'} rounded p-1 text-amber-100 disabled:opacity-70 disabled:cursor-not-allowed`}
                            value={team.house}
                            onChange={e => handleHouseChange(team.id, e.target.value)}
                            disabled={roundLocked || team.isEliminated} // Disable if locked OR team eliminated
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
                            team.isEliminated ? 'bg-red-900/70 text-red-200' :
                            team.isActive ? 'bg-green-900/50 text-green-300' :
                            'bg-gray-600/50 text-gray-300'
                          }`}>
                            {team.isEliminated ? 'Eliminated' : team.isActive ? 'Active' : 'Inactive'}
                          </span>
                    </td>
                  </tr>
                ))}
                 {teams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-amber-200/70 italic">
                        No active, non-eliminated teams found for Round 5.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
           {/* **NEW**: Save Button for House Changes */}
           {!roundLocked && (
              <div className="text-center mt-6">
                <button
                    onClick={saveTeamChanges}
                    disabled={saving || roundLocked}
                    className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : '💾 Save House Changes'}
                </button>
                <p className="text-xs text-blue-300/70 mt-2 italic">(Note: Saving requires Admin permissions)</p>
              </div>
           )}
        </div>

        {/* Award/Revert Quaffle Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Manage Round 5 Quaffle</h2>
             {roundWinner ? (
                // Show current winner and Revert button
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400 mb-4">🏆 Current Winner: {roundWinner} 🏆</p>
                  <button
                    onClick={() => revertQuaffle(roundWinner)}
                    disabled={roundLocked || saving}
                    className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revert Quaffle from {roundWinner}
                  </button>
                </div>
              ) : (
                 // Show Award buttons
                 <>
                    <p className="text-amber-200 mb-4 text-xl">Select the house winner for Round 5:</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {houses.map(h=>
                        <button
                          key={h}
                          onClick={()=>awardQuaffle(h)}
                          disabled={roundLocked || !!roundWinner || saving}
                          className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Give {h} Quaffle
                        </button>
                      )}
                    </div>
                 </>
              )}
             {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Round must be unlocked by Admin to manage Quaffles or save house changes)</p>}
        </div>

        {/* Leaderboards */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              House Leaderboard (Overall)
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
                  <Bar dataKey="total" fill="#b45309" name="Total Score"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              Team Leaderboard (Overall)
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
                  <Bar dataKey="score" fill="#d97706" name="Total Score"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}