// src/app/auth/round-head/round-7/page.tsx
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
  Legend, // Added Legend import
} from 'recharts'
import { canAccessRound } from '@/lib/roundHeadAuth' // Make sure this utility exists and works

// Define Team interface for score management
interface Team {
    _id?: string; // Database ID
    id: number;
    name: string;
    house: string;
    totalScore: number; // Current total points (read-only in UI) - Renamed from totalPoints for clarity
    pointsToAdd: number; // Points for current round (editable input) - Renamed from score for clarity
    isActive: boolean;
    isEliminated?: boolean;
}

// Interface for round submission (logging)
interface RoundResult {
    team: string; // The team's _id
    points: number; // The score achieved *in this round*
    time: number; // Placeholder
    rank: number; // Placeholder
}


export default function Round7RoundHead() { // Renamed component
  const [user, setUser] = useState<any>(null) // State to hold authenticated user info
  const [roundLocked, setRoundLocked] = useState(true)
  // Round 7 uses all four houses
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']

  const [teams, setTeams] = useState<Team[]>([])
  const [saving, setSaving] = useState(false) // Renamed submissionStatus to saving for clarity
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: 'info' })
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // State for winner

  // Auth check on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      window.location.href = '/auth/login' // Redirect if no token
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 7)) { // <<< Check for Round 7 access
        console.warn('User cannot access Round 7. Redirecting.');
        window.location.href = '/auth/login' // Redirect if not authorized
        return
      }
      setUser(payload) // Set user state if authorized
    } catch (e) {
      console.error('Authentication error:', e)
      localStorage.removeItem('token'); // Clear invalid token
      window.location.href = '/auth/login' // Redirect on error
    }
  }, []) // Run only once on mount

  // Fetch teams, round status, and winner
  const fetchData = useCallback(async () => {
    if (!user) return // Don't fetch if user isn't authenticated yet

    // Store current pointsToAdd state before fetching to preserve unsaved input
    let currentPointsMap = new Map<string, number>();
    setTeams(currentTeams => {
        // Use functional update to get the latest state
        currentPointsMap = new Map(currentTeams.filter(t => t._id).map(t => [t._id!, t.pointsToAdd]));
        return currentTeams; // Return the same state, we just needed to read it
    });


    try {
      // 1. Get round lock status (Read Only for Round Head)
      const statusRes = await fetch('/api/admin/round-status?round=round-7') // Target round-7
      const statusData = await statusRes.json()
      setRoundLocked(statusData.isLocked)

      // 2. Fetch current round winner status
      const roundDetailsRes = await fetch('/api/rounds/round-7'); // Target round-7
      const roundDetailsData = await roundDetailsRes.json();
      if (roundDetailsRes.ok && roundDetailsData.round) {
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null);
      } else {
         console.warn('Could not fetch round 7 details or winner.');
         setRoundWinner(null);
      }

      // 3. Get teams (for scoring and charts)
      const teamsRes = await fetch('/api/admin/teams') // Fetch all active teams
      const teamsData: any[] = await teamsRes.json() // Expecting array directly

      if (teamsData && Array.isArray(teamsData)) { // Check if it's an array
        // Filter teams that are ACTIVE and NOT ELIMINATED
        const relevantTeams = teamsData.filter((t: any) => t.isActive !== false && t.isEliminated !== true);

        let idCounter = 1;
        let mappedTeams: Team[] = relevantTeams
            .map((dbTeam: any) => {
                const dbId = dbTeam._id;
                 // Retrieve old pointsToAdd value OR reset to 0 IF the 'saving' flag is currently true (meaning a save just finished)
                 // Otherwise, keep the value from the map.
                const oldPoints = saving ? 0 : (currentPointsMap.get(dbId) || 0);
                return {
                    id: 0, // Temp ID for sorting/mapping
                    _id: dbId,
                    name: dbTeam.name,
                    house: dbTeam.house,
                    totalScore: dbTeam.totalPoints || 0, // Use totalPoints from DB
                    isActive: dbTeam.isActive,
                    isEliminated: dbTeam.isEliminated || false,
                    pointsToAdd: oldPoints, // Use the determined pointsToAdd value
                };
            });

        // Sort by house then name for consistent display
        mappedTeams.sort((a, b) => {
          if (a.house < b.house) return -1;
          if (a.house > b.house) return 1;
          return a.name.localeCompare(b.name);
        });

        // Reassign sequential IDs after sorting
        mappedTeams.forEach((team, index) => team.id = index + 1);

        setTeams(mappedTeams);
      } else {
         console.warn("Received unexpected data format from /api/admin/teams or no teams found.");
         setTeams([]); // Set empty if data is not as expected
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setMessage({ text: 'Failed to load round data', type: 'error' })
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000); // Clear error message
    } finally {
      setLoading(false)
    }
  // Depends on user state and saving flag (to reset pointsToAdd after save)
  }, [user, saving]) // Include 'saving' here

  // Initial fetch and polling for lock status/winner (less frequent full data refresh)
  useEffect(() => {
    let isSubscribed = true;
    let dataFetchTimeoutId: NodeJS.Timeout | null = null; // Changed interval to timeout for less frequent refresh
    let statusPollInterval: NodeJS.Timeout | null = null;

    const loadInitialData = async () => {
      if (!user) return;
      try {
        if (isSubscribed) setLoading(true);
        await fetchData(); // Initial full fetch
        // Schedule next full data refresh after initial load completes
        if (isSubscribed) {
             dataFetchTimeoutId = setTimeout(refreshFullData, 60000); // Refresh after 60s
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

     // Separate function for less frequent full data refresh
     const refreshFullData = async () => {
         if (!user || !isSubscribed) return;
         await fetchData();
         if (isSubscribed) {
            dataFetchTimeoutId = setTimeout(refreshFullData, 60000); // Schedule next refresh
         }
     };


    const pollStatusAndWinner = async () => {
      if (!user || !isSubscribed) return;
      try {
        const [statusRes, detailsRes] = await Promise.all([
          fetch('/api/admin/round-status?round=round-7'),
          fetch('/api/rounds/round-7')
        ]);
        if (isSubscribed) {
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setRoundLocked(statusData.isLocked);
          }
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            setRoundWinner(detailsData.round?.quaffleWinnerHouse || null);
          }
        }
      } catch (pollErr) {
        console.error("Status polling error:", pollErr);
      }
    };

    loadInitialData(); // Load data once user is set

    // Set intervals after initial load
    statusPollInterval = setInterval(pollStatusAndWinner, 7000); // Poll status/winner more frequently

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (dataFetchTimeoutId) clearTimeout(dataFetchTimeoutId);
      if (statusPollInterval) clearInterval(statusPollInterval);
    };
  // Removed fetchData from dependency array as it's now called within and uses useCallback
  }, [user]);


  // Handle changes for points to add
  const handleScoreChange = (id: number, value: number) => {
    if (roundLocked) return;
    // Allow negative numbers
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, pointsToAdd: value } : team))
    );
     setMessage({ text: '', type: 'info'}); // Clear message on edit
  };

  // Save functionality using COMBINED approach
 const saveAndSubmitScores = async () => {
    if (roundLocked) {
      setMessage({ text: 'Round is locked by Admin. Cannot save scores.', type: 'error' });
       setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
     if (!confirm('Are you sure you want to save these points and submit the results for Round 7? This action updates team totals and logs this round\'s outcome.')) {
        return;
    }
    setSaving(true); // Indicate saving process START
    setMessage({ text: 'Processing: Saving points and submitting Round 7 results...', type: 'info' });

    let savedTeamData: any = null; // To check if step 1 succeeded

    try {
       // --- Step 1: Save Scores (Increment totalPoints via /api/admin/teams) ---
       // Prepare data including teams with 0 pointsToAdd for logging later
       const teamsToProcess = teams
         .filter(t => t._id) // Ensure team has a database ID
         .map(t => ({
            _id: t._id,
            name: t.name, // Include name/house as API might require them
            house: t.house,
            score: t.pointsToAdd, // Send the incremental score for $inc
            currentRoundScore: t.pointsToAdd, // Keep track for Step 2 logging
          }));

        // Filter again specifically for the API call to only send non-zero score changes
        const teamsToUpdateApi = teamsToProcess.filter(t => t.score !== 0);


       if (teamsToProcess.length === 0) { // Check if there are any teams at all
         setMessage({ text: 'No teams found to process.', type: 'info' });
         setSaving(false);
         setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
         return;
       }
       // Check if at least one team has a non-zero score to save/submit
        if (teamsToUpdateApi.length === 0) {
          setMessage({ text: 'No new points (positive or negative) entered to save/submit.', type: 'info' });
          setSaving(false);
          setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
          return;
        }


       const token = localStorage.getItem('token');
       const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }; // Add Authorization

       // --- API Call 1: Update Team Scores ---
       const teamSaveRes = await fetch('/api/admin/teams', { // Use ADMIN endpoint (needs permission check)
         method: 'POST',
         headers,
         body: JSON.stringify(teamsToUpdateApi), // Send only teams with score changes
       });

       savedTeamData = await teamSaveRes.json();

       if (!teamSaveRes.ok || !savedTeamData.success) { // Check API success flag
          // Provide specific feedback if forbidden
         if(teamSaveRes.status === 403){
             throw new Error(savedTeamData.error || 'Permission Denied for saving scores. Contact Admin.');
          }
         throw new Error(savedTeamData.error || 'Failed to apply score adjustment.');
       }

       setMessage({ text: 'Points saved to totals. Now submitting round results...', type: 'info' });

       // --- Step 2: Submit Round Results (Log final state via /api/rounds/round-7) ---
       // Use the full list `teamsToProcess` which includes teams with score 0 for complete logging
        const resultsForRoundLog: RoundResult[] = teamsToProcess
            .sort((a, b) => b.currentRoundScore - a.currentRoundScore) // Sort by score achieved *in this* round
            .map((t, idx) => ({
                team: t._id!, // Use non-null assertion as we filtered earlier
                points: t.currentRoundScore, // Log the score achieved in this round
                time: 0, // Placeholder
                rank: idx + 1, // Rank based on this round's score
            }));

        // --- API Call 2: Log Round Results ---
        const submitRes = await fetch('/api/rounds/round-7', { // Use ROUNDS endpoint
            method: 'POST',
            headers, // Send token again
            body: JSON.stringify({ results: resultsForRoundLog, approved: true }), // Mark as approved/final
        });

        if (!submitRes.ok) {
            const errorData = await submitRes.json();
            // Check for forbidden status from this endpoint too
             if(submitRes.status === 403){
                throw new Error(errorData.error || 'Permission Denied for submitting round results. Contact Admin.');
             }
            throw new Error(errorData.error || 'Failed to submit round results after saving scores.');
        }

        setMessage({ text: 'Points added and Round 7 results submitted successfully!', type: 'success' });
        // Set saving false HERE, *before* triggering fetchData, so pointsToAdd resets correctly
        setSaving(false); // Indicate saving process END
        // await fetchData(); // Let the useEffect trigger the refresh based on 'saving' state change

    } catch (err: any) {
      console.error('Error in combined save/submit:', err);
      if (savedTeamData?.success) { // If step 1 worked but step 2 failed
           setMessage({ text: `Error submitting round results after saving points: ${err.message}`, type: 'error' });
      } else {
           setMessage({ text: `Error saving points: ${err.message}`, type: 'error' });
      }
      setSaving(false); // Ensure saving is reset on error
    } finally {
      // Clear message after a delay, only if not an error
      setTimeout(() => { if (message.type !== 'error') setMessage({ text: '', type: 'info' })}, 5000);
    }
  };


  // Helper to award quaffle (Round Head access)
  const awardQuaffle = async (house: string, roundId = 'round-7') => { // Default to round-7
    if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot award.', type: 'error'})
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return
    }
    if (roundWinner) {
        setMessage({ text: `Cannot award: ${roundWinner} already won. Revert first if needed.`, type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
        return;
    }

    setMessage({ text: `Awarding quaffle to ${house}...`, type: 'info' });
    setSaving(true); // Disable buttons during API call
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/award-quaffle', { // Use ADMIN endpoint (needs permission check)
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, // Send token
        body: JSON.stringify({ house, round: roundId }),
      })
       const data = await res.json(); // Always parse JSON
      if (!res.ok) {
           if(res.status === 403){ throw new Error(data.error || 'Permission Denied. Contact Admin.'); }
           throw new Error(data.error || 'Failed to award quaffle.');
      }

      setRoundWinner(house); // Optimistic UI update
      setMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' })
    } catch (e: any) {
      console.error(e)
      setMessage({ text: `Failed to award quaffle: ${e.message}`, type: 'error' })
    } finally {
        setSaving(false); // Re-enable buttons
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000)
    }
  }

  // Helper to revert quaffle (Round Head access)
  const revertQuaffle = async (house: string, roundId = 'round-7') => { // Default to round-7
      if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot revert.', type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
      }

      if (!confirm(`Are you sure you want to REVERT the Quaffle from ${house} for Round 7?`)) {
          return;
      }

      setMessage({ text: `Reverting Quaffle from ${house}...`, type: 'info' });
      setSaving(true); // Disable buttons during API call

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/revert-quaffle', { // Use ADMIN endpoint (needs permission check)
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, // Send token
            body: JSON.stringify({ house, round: roundId })
        });

        const data = await res.json(); // Always parse JSON
        if (!res.ok) {
           if(res.status === 403){ throw new Error(data.error || 'Permission Denied. Contact Admin.'); }
           throw new Error(data.error || 'Failed to revert quaffle.');
        }

        setRoundWinner(null); // Clear winner in UI state
        setMessage({ text: `Quaffle successfully REVERTED from ${house}!`, type: 'success' });

      } catch (e: any) {
          console.error('Revert failed:', e);
          setMessage({ text: `Revert failed: ${e.message}`, type: 'error' });
      } finally {
        setSaving(false); // Re-enable buttons
        setTimeout(() => setMessage({ text: '', type: 'info' }), 5000); // Clear message after 5s
      }
  }


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel'] animate-pulse">
      Loading Round 7 Dashboard... ✨
    </div>
  )

  // Calculate scores for charts based on TOTAL score from fetched data
  const houseScores = houses.map(house => ({
    name: house,
    total: teams
      .filter(t => t.house === house && t.name.trim() !== '')
      .reduce((sum, t) => sum + Number(t.totalScore || 0), 0), // Use totalScore
  }))

  const teamScores = teams
    .filter(t => t.name.trim() !== '')
    .map(t => ({
      name: t.name,
      score: Number(t.totalScore || 0), // Use totalScore
      house: t.house,
    }))
    .sort((a, b) => b.score - a.score) // Sort by totalScore

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Updated Title */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400 font-['Cinzel']">
            Round 7 Dashboard (Round Head): The Horcrux Hunt (Finals)
          </h1>
          <p className="text-xl mb-4 text-amber-200">Enter final points and manage the Quaffle winner.</p>
          {/* Read-Only Lock Status Display */}
          <div className={`inline-block px-4 py-2 rounded font-semibold ${
            roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
          }`}>
            {roundLocked ? '🔒 Locked by Admin - View Only' : '🔓 Unlocked - Ready for Scoring'}
          </div>
        </header>

        {/* General Message Display */}
        {message.text && (
          <div className={`p-4 mb-6 rounded text-center font-semibold border ${
             message.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : message.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-blue-900/30 border-blue-700 text-blue-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Team Scoring Table */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Team Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-900/30 text-amber-400">
                  <th className="p-2">#</th>
                  <th className="p-2">Team Name</th>
                  <th className="p-2">House</th>
                  <th className="p-2">Current Total Score</th>
                  <th className="p-2">Points to Add/Subtract (R7)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id} className={`border-b border-amber-900/30 hover:bg-gray-700/50 ${team.isEliminated ? 'opacity-50' : ''}`}>
                    <td className="p-2 text-center">{team.id}</td>
                    <td className="p-2 font-medium">{team.name}</td>
                    <td className="p-2">{team.house}</td>
                    <td className="p-2 text-amber-300 font-semibold">{team.totalScore}</td>
                    <td className="p-2">
                        {/* Points to Add: Editable when unlocked */}
                        <input
                            type="number"
                            className={`w-24 bg-gray-700 border ${roundLocked ? 'border-gray-600 cursor-not-allowed' : 'border-amber-900/50'} rounded p-1 text-amber-100 text-right disabled:opacity-70`}
                            value={team.pointsToAdd}
                            // Ensure input value is treated as a number
                            onChange={e => handleScoreChange(team.id, parseInt(e.target.value, 10) || 0)}
                            onWheel={e => e.currentTarget.blur()} // Prevent scroll change
                            disabled={roundLocked}
                            placeholder="0"
                            // Removed min="0" to allow negative score changes
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
                     <tr><td colSpan={6} className="p-4 text-center text-amber-200/70 italic">No active, non-eliminated teams found for Round 7.</td></tr>
                 )}
              </tbody>
            </table>
          </div>
            {/* Save Button */}
           {!roundLocked && (
              <div className="text-center mt-6">
                <button
                    onClick={saveAndSubmitScores} // Use combined function
                    disabled={saving || roundLocked} // Disable during saving
                    className="bg-gradient-to-r from-purple-700 to-indigo-900 text-indigo-100 font-bold py-3 px-8 rounded-lg border border-indigo-400/30 hover:from-purple-800 hover:to-indigo-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Processing...' : '✅ Save Points & Submit Results'}
                </button>
                 <p className="text-xs text-indigo-300/70 mt-2 italic">(Updates totals and logs final round results)</p>
              </div>
           )}
        </div>


        {/* Award/Revert Quaffle Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
            <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Manage Round 7 Quaffle</h2>
             {roundWinner ? (
                // Show current winner and Revert button
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400 mb-4">🏆 Current Winner: {roundWinner} 🏆</p>
                  <button
                    onClick={() => revertQuaffle(roundWinner)}
                    disabled={roundLocked || saving} // Disable during saving/revert
                    className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revert Quaffle from {roundWinner}
                  </button>
                </div>
              ) : (
                 // Show Award buttons
                 <>
                    <p className="text-amber-200 mb-4 text-xl">Select the house winner for the Final Round:</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {houses.map(h=>
                        <button
                          key={h}
                          onClick={()=>awardQuaffle(h)}
                          disabled={roundLocked || !!roundWinner || saving} // Disable if locked, winner exists, or saving
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

        {/* Leaderboards (Based on TOTAL score) */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
          {/* House-wise scores */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              🏆 House Leaderboard (Overall Score)
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
                  <Legend />
                  <Bar dataKey="total" fill="#b45309" name="Total Score"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Rankings */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
            <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
              🏅 Team Leaderboard (Overall Score)
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
                   <Legend />
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