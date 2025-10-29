'use client'

import { useState, useEffect, useCallback } from 'react';

// Define the Team interface based on expected data
interface Team {
  _id: string; // Database ID
  id: number; // Sequential ID (for stable key)
  name: string;
  house: string;
  totalPoints: number; // Overall points from DB
  score: number;      // Points to ADD in this round (UI input)
  isActive: boolean;
}

// Interface for round submission
interface RoundResult {
  team: string; // The team's _id
  points: number; // The score for this round
  time: number; // Placeholder
  rank: number; // Placeholder
}


export default function Round6() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

  const [teams, setTeams] = useState<Team[]>([]);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // State for current winner

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data (lock status, teams, winner)
  const fetchData = useCallback(async () => {
    // Keep local message unless specifically cleared
    // setMessage('');
    // Only set loading on initial fetch or if already loading
    if (loading || !teams.length) {
       setLoading(true);
    }
    try {
      // 1. Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-6'); //
      const statusData = await statusRes.json();
      setRoundLocked(statusData.isLocked);

      // 2. Fetch current round winner status
      const roundDetailsRes = await fetch('/api/rounds/round-6'); // Fetch round details
      const roundDetailsData = await roundDetailsRes.json();
      if (roundDetailsRes.ok && roundDetailsData.round) {
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null); // Update winner state
      } else {
         console.warn('Could not fetch round 6 details or winner.');
         setRoundWinner(null);
      }

      // 3. Fetch active teams data
      const teamsRes = await fetch('/api/admin/teams'); //
      const teamsData: any[] = await teamsRes.json();

      if (teamsData && teamsData.length) {
        const relevantTeams = teamsData
            .filter((t: any) => t.isActive !== false && t.isEliminated !== true)

        const filledTeams = relevantTeams.map((dbTeam: any, index: number) => ({
          _id: dbTeam._id,
          id: index + 1,
          name: dbTeam.name,
          house: dbTeam.house,
          totalPoints: dbTeam.totalPoints || 0,
          isActive: dbTeam.isActive !== false,
          score: 0, // Reset round score input on fetch
        }));

        filledTeams.sort((a: Team, b: Team) => {
            if (a.house < b.house) return -1;
            if (a.house > b.house) return 1;
            return a.name.localeCompare(b.name);
        });

        setTeams(filledTeams);
      } else {
        setTeams([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Error loading round data.');
    } finally {
       if (loading || !teams.length) {
          setLoading(false);
       }
    }
     // Clear non-error message after a delay
    if (!message.startsWith('Error')) {
      setTimeout(() => setMessage(''), 3000);
    }
  }, [loading, message, teams.length]); // Dependencies for initial load and message clearing

  // Initial fetch - NO POLLING
  useEffect(() => {
    if (isMounted) {
        fetchData(); // Initial fetch
    }
  }, [fetchData, isMounted]);

  // Handle changes in the score input
  const handleChange = (
    id: number,
    value: string | number
  ) => {
    if (roundLocked) return;
    // Allow negative numbers
    const scoreValue = Number(value) || 0; // Treat empty or invalid input as 0
    setTeams(prev =>
      prev.map(team =>
        team.id === id ? { ...team, score: scoreValue } : team
      )
    );
  };

  // Toggle round lock status
  const toggleLock = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/admin/round-status', { //
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-6', isLocked: !roundLocked }),
      });
      const data = await res.json();
      setRoundLocked(data.isLocked);
      setMessage(`Round ${data.isLocked ? 'locked' : 'unlocked'}.`);
    } catch (err) {
      console.error('Error toggling lock:', err);
      setMessage('Error updating lock status.');
    }
     setTimeout(() => setMessage(''), 3000);
  };

  // **COMBINED FUNCTION**: Save scores (increment total) AND submit final round results
  const saveAndSubmitScores = async () => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot save scores.');
       setTimeout(() => setMessage(''), 3000);
      return;
    }
     if (!confirm('Are you sure you want to save these points and finalize Round 6? This action saves the entered points to team totals and logs the round result.')) {
        return;
    }
    setSubmissionStatus('submitting');
    setMessage('Processing: Saving points and finalizing Round 6...');

    let savedTeamData: any = null; // To store result from the first API call

    try {
       // --- Step 1: Save Scores (Increment totalPoints via /api/admin/teams) ---
       const teamsToUpdate = teams
         // Send teams even if score is 0 or negative, as the API handles $inc
         .filter(t => t._id)
         .map(t => ({
            _id: t._id,
            name: t.name,
            house: t.house,
            score: t.score, // Send the incremental score for $inc
            currentRoundScore: t.score, // Keep track for Step 2 logging
          }));

       if (teamsToUpdate.length === 0) {
         setMessage('No teams found to process.');
         setSubmissionStatus('idle');
         setTimeout(() => setMessage(''), 3000);
         return;
       }
       // Check if at least one team has a non-zero score to save/submit
       const hasScoresToSave = teamsToUpdate.some(t => t.score !== 0);
        if (!hasScoresToSave) {
          setMessage('No new points (positive or negative) entered to save.');
          setSubmissionStatus('idle');
          setTimeout(() => setMessage(''), 3000);
          return;
        }


       const token = localStorage.getItem('token');
       const headers: any = { 'Content-Type': 'application/json' };
       if (token) headers['Authorization'] = `Bearer ${token}`;

       const teamSaveRes = await fetch('/api/admin/teams', { //
         method: 'POST',
         headers,
         body: JSON.stringify(teamsToUpdate.filter(t => t.score !== 0)), // Only send those with actual score changes for increment
       });

       savedTeamData = await teamSaveRes.json(); // Store response

       if (!teamSaveRes.ok || !savedTeamData.success) { // Check success flag from API
         throw new Error(savedTeamData.error || 'Failed to apply score adjustment.');
       }

       setMessage('Points saved to totals. Now finalizing round...'); // Update message

       // --- Step 2: Submit Round Results (Log final state via /api/rounds/round-6) ---
       // Use the original `teamsToUpdate` list which includes teams with score 0 for logging purposes
        const resultsForRoundLog: RoundResult[] = teamsToUpdate
            .sort((a, b) => b.currentRoundScore - a.currentRoundScore) // Sort by score achieved in *this* round
            .map((t, idx) => ({
                team: t._id,
                points: t.currentRoundScore, // Log the score achieved in this round
                time: 0, // Placeholder
                rank: idx + 1, // Rank based on this round's score
            }));

        const submitRes = await fetch('/api/rounds/round-6', { //
            method: 'POST',
            headers,
            body: JSON.stringify({ results: resultsForRoundLog, approved: true }),
        });

        if (!submitRes.ok) {
            const errorData = await submitRes.json();
            throw new Error(errorData.error || 'Failed to submit round results after saving scores.');
        }

        setSubmissionStatus('success');
        setMessage('Points saved and Round 6 submission finalized!');

        // Refresh data AFTER both steps are successful
        await fetchData();

    } catch (err: any) {
      console.error('Error in combined save/submit:', err);
      // More specific error message if score saving worked but submission failed
      if (savedTeamData?.success) {
           setMessage(`Error finalizing round after saving scores: ${err.message || 'Could not submit round results.'}`);
      } else {
           setMessage(`Error saving points: ${err.message || 'Could not save scores.'}`);
      }
      setSubmissionStatus('error');
    } finally {
      // Reset status after a delay
      setTimeout(() => setSubmissionStatus('idle'), 3000);
      // Keep final message longer
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Helper to award quaffle
  async function awardQua(house:string){
    if (roundLocked) {
        setMessage('Round is locked. Cannot award quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    // Prevent awarding if someone already won
    if (roundWinner) {
        setMessage(`Cannot award: ${roundWinner} has already won. Revert first if needed.`);
        setTimeout(() => setMessage(''), 4000);
        return;
    }
    setMessage(`Awarding quaffle to ${house}...`);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/award-quaffle',{ //
          method:'POST',
          headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
          body:JSON.stringify({house, round:'round-6'})
      })
      if(!res.ok) throw new Error('Failed to award quaffle');

      setRoundWinner(house); // Optimistic UI update
      setMessage('Quaffle awarded to '+house + '!');
    } catch(e: any){
        console.error(e);
        setMessage(`Failed to award quaffle: ${e.message}`);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  // Helper to revert quaffle
  const revertQua = async (house: string, roundId = 'round-6') => {
      if (roundLocked) {
        setMessage('Round is locked. Cannot revert quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      if (!confirm(`WARNING: Are you sure you want to REVERT the Quaffle from ${house} for Round 6? This will decrement their quaffle count.`)) {
          return;
      }
      setMessage(`Reverting Quaffle from ${house}...`);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/revert-quaffle', { //
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
            body: JSON.stringify({ house, round: roundId })
        });
        if (!res.ok) {
           const errorData = await res.json();
           throw new Error(errorData.error || 'Failed to revert. Check server logs.');
        }
        setRoundWinner(null); // Clear winner in UI state
        setMessage(`Quaffle successfully REVERTED from ${house}!`);
      } catch (e: any) {
          console.error('Revert failed:', e);
          setMessage(`Revert failed: ${e.message}.`);
      } finally {
        setTimeout(() => setMessage(''), 5000);
      }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl">
        Loading Round 6 Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 6: Flash Videos Scoring</h1>
          <p className="text-lg text-amber-200 mb-4">Enter and save points earned by remaining teams. Finalize to lock scores and update leaderboards.</p>
           <button
            onClick={toggleLock}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 ${
              roundLocked
                ? 'bg-red-800 hover:bg-red-700 border border-red-500'
                : 'bg-green-800 hover:bg-green-700 border border-green-500'
            } text-white shadow-lg`}
          >
            {roundLocked ? '🔒 Round Locked - Unlock to Edit' : '🔓 Round Unlocked - Lock to Prevent Edits'}
          </button>
           {message && (
             <p className={`mt-4 text-center font-semibold ${submissionStatus === 'error' || message.startsWith('Error') || message.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
        </header>

        <hr className="border-amber-700/50 my-8"/>

        {!loading && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50">
             <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Enter Round 6 Points</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-amber-900/30 text-amber-400">
                    <th className="p-3">Team Name</th>
                    <th className="p-3">House</th>
                    <th className="p-3">Current Total Points</th>
                    <th className="p-3">Points to Add/Subtract (Round 6)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.filter(t => t.name).map(team => (
                    <tr key={team.id} className="border-t border-amber-900/20 hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 font-medium">{team.name}</td>
                      <td className="p-3">{team.house}</td>
                      <td className="p-3 text-amber-300">{team.totalPoints}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={team.score}
                          onChange={e => handleChange(team.id, e.target.value)}
                          disabled={roundLocked}
                          className={`w-24 bg-gray-700 border ${roundLocked ? 'border-gray-600' : 'border-amber-900/50'} rounded p-1 text-amber-100 text-right focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed`}
                           placeholder="0"
                        />
                      </td>
                       <td className="p-3">
                         <span className={`px-2 py-1 rounded text-xs font-medium ${team.isActive ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                          {team.isActive ? 'Active' : 'Inactive'}
                         </span>
                      </td>
                    </tr>
                  ))}
                   {teams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-amber-200/70 italic">
                        No active, non-eliminated teams found for Round 6.
                      </td>
                    </tr>
                   )}
                </tbody>
              </table>
            </div>
            {!roundLocked && (
              <div className="text-center mt-6">
                 <button
                    onClick={saveAndSubmitScores} // Calls the combined function
                    disabled={submissionStatus === 'submitting' || roundLocked}
                    className="bg-gradient-to-r from-teal-700 to-cyan-900 text-cyan-100 font-bold py-3 px-8 rounded-lg border border-cyan-400/30 hover:from-teal-800 hover:to-cyan-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {submissionStatus === 'submitting' ? 'Processing...' : '✅ Save Points & Finalize Round 6'}
                 </button>
                 <p className="text-sm text-cyan-300/70 mt-2 italic">Enter positive or negative increments. This will update totals and log round results.</p>
              </div>
            )}
          </div>
        )}

        <hr className="border-amber-700/50 my-8"/>

        {/* Award/Revert Quaffle Section */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50">
          <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Manage Round 6 Quaffle</h2>

          {roundWinner ? (
            // Show current winner and Revert button
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400 mb-4">🏆 Current Winner: {roundWinner} 🏆</p>
              <button
                onClick={() => revertQua(roundWinner)}
                disabled={roundLocked || submissionStatus === 'submitting'}
                className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revert Quaffle from {roundWinner}
              </button>
            </div>
          ) : (
            // Show Award buttons
            <>
              <p className="text-amber-200 mb-3 text-lg">Award Round 6 Winner Quaffle:</p>
              <div className="flex justify-center gap-4 flex-wrap">
                {houses.map(h => (
                  <button
                    key={h}
                    onClick={() => awardQua(h)}
                    disabled={roundLocked || !!roundWinner || submissionStatus === 'submitting'}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Award {h}
                  </button>
                ))}
              </div>
            </>
          )}
           {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Unlock the round to award or revert Quaffles)</p>}
        </div>
      </div>
    </div>
  );
}