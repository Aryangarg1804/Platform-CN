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

// Define Team interface for score management
interface Team {
    _id?: string; // Database ID
    id: number;
    name: string;
    house: string;
    totalScore: number; // Current total points (read-only in UI)
    pointsToAdd: number; // Points for current round (editable input)
    isActive: boolean;
    isEliminated: boolean;
}

// Interface for round submission
interface RoundResult {
    team: string; // The team's _id
    points: number; // The score for this round
    time: number; // Placeholder
    rank: number; // Placeholder
}


export default function Round6() {
  const [user, setUser] = useState<any>(null)
  const [roundLocked, setRoundLocked] = useState(true)
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

  const [teams, setTeams] = useState<Team[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: 'info' })
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // State for winner

  // Auth check on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      window.location.href = '/auth/login' //
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 6)) { // Check for Round 6 access
        window.location.href = '/auth/login' //
        return
      }
      setUser(payload)
    } catch (e) {
      console.error('Authentication error:', e)
      window.location.href = '/auth/login' //
    }
  }, [])

  // Fetch teams, round status, and winner
  const fetchData = useCallback(async () => {
    if (!user) return

    // Get the current state of pointsToAdd *before* fetching
    // This local copy won't be stale during the fetch
    let currentPointsMap = new Map<string, number>();
    setTeams(currentTeams => {
        currentPointsMap = new Map(currentTeams.filter(t => t._id).map(t => [t._id!, t.pointsToAdd]));
        return currentTeams; // Return the same state, we just needed to read it
    });

    try {
      // 1. Get round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-6'); //
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked)

      // 2. Fetch current round winner status
      const roundDetailsRes = await fetch('/api/rounds/round-6'); ///route.ts]
      const roundDetailsData = await roundDetailsRes.json();
      if (roundDetailsRes.ok && roundDetailsData.round) {
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null);
      } else {
         console.warn('Could not fetch round 6 details or winner.');
         setRoundWinner(null);
      }

      // 3. Get teams (for scoring and charts)
      const teamsRes = await fetch('/api/admin/teams'); //
      const teamsData: any[] = await teamsRes.json()

      if (teamsData && Array.isArray(teamsData)) {

        const relevantTeams = teamsData.filter(t => t.isActive !== false && t.isEliminated !== true);

        let mappedTeams: Team[] = relevantTeams
            .map((dbTeam: any) => {
                const dbId = dbTeam._id;
                // Check if we are *not* saving, and preserve points.
                // If we *are* saving (or just finished), we want to reset points to 0.
                const oldPoints = saving ? 0 : (currentPointsMap.get(dbId) || 0);

                return {
                    id: 0,
                    _id: dbId,
                    name: dbTeam.name,
                    house: dbTeam.house,
                    totalScore: dbTeam.totalPoints || 0,
                    isActive: dbTeam.isActive !== false,
                    isEliminated: dbTeam.isEliminated === true,
                    // Reset pointsToAdd to 0, or preserve old value if not part of a save operation
                    pointsToAdd: oldPoints
                };
            });

        mappedTeams.sort((a, b) => {
          if (a.house < b.house) return -1;
          if (a.house > b.house) return 1;
          return a.name.localeCompare(b.name);
        });

        mappedTeams.forEach((team, index) => team.id = index + 1);

        setTeams(mappedTeams);
      } else {
        console.warn("Received unexpected data format from /api/admin/teams or no teams found.");
        setTeams([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setMessage({ text: 'Failed to load data', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
    } finally {
      setLoading(false)
    }
  // Removed 'teams' dependency to prevent loops. 'saving' is also managed locally.
  }, [user, saving])


  // Initial fetch (NO POLLING)
  useEffect(() => {
    if(user){ // Only run if user is set
        fetchData()
        // REMOVED: const interval = setInterval(fetchData, 10000)
        // REMOVED: return () => clearInterval(interval)
    }
  }, [fetchData, user]) // Only depends on fetchData and user

  // Handle changes for points to add
  const handleScoreChange = (id: number, value: number) => {
    if (roundLocked) return;
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, pointsToAdd: value >= 0 ? value : 0 } : team)) // Ensure points are non-negative
    );
     setMessage({ text: '', type: 'info'}); // Clear message on edit
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

  // Save functionality for SCORE ADDITION
  const saveScores = async () => {
    if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot save scores.', type: 'error' })
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
        return
    }

    setSaving(true) // Set saving true
    setMessage({ text: 'Saving added points...', type: 'info' });
    try {
      const token = localStorage.getItem('token')

      const teamsToUpdate = teams
        .filter(t => t.pointsToAdd > 0 && t._id)
        .map(team => ({
          _id: team._id,
          name: team.name,
          house: team.house,
          score: team.pointsToAdd
        }));

      if (teamsToUpdate.length === 0) {
        setMessage({ text: 'No new points to add. Enter scores > 0.', type: 'info' })
        setSaving(false); // Reset saving state
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
        return;
      }

      const teamSaveRes = await fetch('/api/admin/teams', { //
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(teamsToUpdate),
      });

      const saveData = await teamSaveRes.json();

      if (!teamSaveRes.ok) {
          if(teamSaveRes.status === 403){
             throw new Error(saveData.error || 'Permission Denied. Contact Admin.');
          }
          throw new Error(saveData.error || 'Failed to save scores data.');
      }

      const resultsForLog: RoundResult[] = teams
          .filter(t => t._id)
          .map((team) => {
            const savedUpdate = teamsToUpdate.find(u => u._id === team._id);
            return {
              team: team._id || '',
              points: savedUpdate ? savedUpdate.score : 0,
              rank: 0,
              time: 0,
           };
          })
          .sort((a, b) => b.points - a.points)
          .map((r, idx) => ({ ...r, rank: idx + 1 }));


      const logRes = await fetch('/api/rounds/round-6', { ///route.ts]
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ results: resultsForLog, approved: true }),
      });

       if (!logRes.ok) {
          const logErrorData = await logRes.json();
          console.warn('Failed to log round results:', logErrorData.error);
          setMessage({ text: 'Points saved, but failed to log round results. Contact Admin.', type: 'error' });
       } else {
           setMessage({ text: 'Points added and round results logged successfully!', type: 'success' });
       }

      // fetchData() will be triggered by setSaving(false) in the finally block,
      // which will then use saving=true in its logic to reset pointsToAdd
      // await fetchData(); // Not needed here, finally block handles it

    } catch (err: any) {
      console.error(err)
      setMessage({ text: `Error saving scores: ${err.message}`, type: 'error' })
    } finally {
      setSaving(false) // Set saving false, this will trigger fetchData
      setTimeout(() => {
          if (message.type !== 'error') setMessage({ text: '', type: 'info' })
      }, 4000);
    }
  }

  // Helper to award quaffle
  const awardQuaffle = async (house: string, roundId = 'round-6') => {
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
            body: JSON.stringify({house: house, round: roundId})
        });
        if (!res.ok) throw new Error('Failed to award quaffle.');
        setRoundWinner(house);
        setMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' })
    } catch(e: any) {
        console.error(e)
        setMessage({ text: `Failed to award quaffle: ${e.message}`, type: 'error' })
    }
    setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
  }

   // Helper to revert quaffle
   const revertQuaffle = async (house: string, roundId = 'round-6') => {
      if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot revert.', type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
      }

      if (!confirm(`Are you sure you want to REVERT the Quaffle from ${house} for Round 6?`)) {
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

        setRoundWinner(null);
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
      Loading Round 6 Dashboard...
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 6 Dashboard (Round Head): Flash Videos
          </h1>
          <p className="text-xl mb-4">Enter points for surviving teams and manage the Quaffle.</p>
          <div className={`inline-block px-4 py-2 rounded font-semibold ${
            roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
          }`}>
            {roundLocked ? '🔒 Locked by Admin - View Only' : '🔓 Unlocked - Ready for Scoring'}
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${
            message.type === 'error' ? 'bg-red-900 border-red-700 text-red-300' : message.type === 'success' ? 'bg-green-900 border-green-700 text-green-300' : 'bg-blue-900 border-blue-700 text-blue-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Team Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-900/30">
                  <th className="p-2">#</th>
                  <th className="p-2">Team Name</th>
                  <th className="p-2">House</th>
                  <th className="p-2">Current Total Score</th>
                  <th className="p-2">Points to Add (Round 6)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id} className={`border-b border-amber-900/30 hover:bg-gray-700/50 ${team.isEliminated ? 'opacity-50' : ''}`}>
                    <td className="p-2 text-center">{team.id}</td>
                    <td className="p-2">
                        <input type="text" className="w-36 bg-gray-700 border-gray-600 rounded p-1 text-amber-100 text-center" value={team.name} disabled={true} />
                    </td>
                    <td className="p-2">
                        <input type="text" className="w-28 bg-gray-700 border-gray-600 rounded p-1 text-amber-100 text-center" value={team.house} disabled={true} />
                    </td>
                    <td className="p-2 text-amber-300 font-semibold">{team.totalScore}</td>
                    <td className="p-2">
                        <input
                            type="number"
                            className={`w-24 bg-gray-700 border ${roundLocked ? 'border-gray-600' : 'border-amber-900/50'} rounded p-1 text-amber-100 text-right disabled:opacity-70 disabled:cursor-not-allowed`}
                            value={team.pointsToAdd}
                            onChange={e => handleScoreChange(team.id, Number(e.target.value))}
                            disabled={roundLocked}
                            placeholder="0"
                            min="0"
                        />
                    </td>
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
                      <td colSpan={6} className="p-4 text-center text-amber-200/70 italic">
                        No active, non-eliminated teams found for Round 6.
                      </td>
                    </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>

        {!roundLocked && (
          <div className="text-center mb-8">
            <button
              onClick={saveScores}
              disabled={saving || roundLocked}
              className="bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold py-3 px-8 rounded-lg border-2 border-amber-400/30 hover:from-amber-800 hover:to-amber-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : '💾 Save Added Points & Submit Results'}
            </button>
             <p className="text-xs text-amber-300/70 mt-2 italic">(This saves points to totals and logs the round result)</p>
          </div>
        )}

        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Manage Round 6 Quaffle</h2>
             {roundWinner ? (
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
                 <>
                    <p className="text-amber-200 mb-4 text-xl">Select the house winner for Round 6:</p>
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
             {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Round must be unlocked by Admin to manage Quaffles)</p>}
        </div>

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
                      color: '#fcd3d'
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