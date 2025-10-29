// src/app/admin/rounds/round-5/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
// Note: Removed unused Recharts imports if they were present

// Define the Team interface
interface Team {
  _id: string; // Database ID
  id: number; // Sequential ID for stable key in UI
  name: string;
  house: string;
  totalPoints: number; // Overall points from DB
  isActive: boolean;
  isEliminated?: boolean; // Add eliminated status
}

export default function Round5AdminPage() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']; // Include Slytherin

  const [teams, setTeams] = useState<Team[]>([]);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(''); // For general messages
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // State for Quaffle winner

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data (lock status, teams, winner)
  const fetchData = useCallback(async () => {
    // ... (keep existing fetchData logic) ...
     // Only set loading on initial fetch or if already loading
     if (loading || !teams.length) {
       setLoading(true);
    }
    try {
      // Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-5'); //
      const statusData = await statusRes.json(); //
      setRoundLocked(statusData.isLocked); //

      // --- ADDED: Fetch current round winner status ---
      const roundDetailsRes = await fetch('/api/rounds/round-5'); // Fetch round details //
      const roundDetailsData = await roundDetailsRes.json(); //
      if (roundDetailsRes.ok && roundDetailsData.round) { //
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null); // Update winner state //
      } else {
         console.warn('Could not fetch round 5 details or winner.'); //
         setRoundWinner(null); //
      }
      // --- END ADDED ---

      // Fetch teams
      const teamsRes = await fetch('/api/admin/teams'); //
      const teamsData = await teamsRes.json(); // Expecting array directly //

      if (teamsData && Array.isArray(teamsData)) { // Check if it's an array //
        const fetchedTeams = teamsData
          .filter((t: any) => t.isActive !== false && t.isEliminated !== true) // Filter for active, non-eliminated //
          .map((dbTeam: any, index: number): Team => ({ // Added Team return type //
            id: index + 1, // Re-assign sequential ID after filtering //
            _id: dbTeam._id, //
            name: dbTeam.name, //
            house: dbTeam.house, //
            totalPoints: dbTeam.totalPoints || 0, //
            isActive: dbTeam.isActive !== false, //
            isEliminated: dbTeam.isEliminated === true, //
          }));
        // Sort for consistent display (by house, then name)
        fetchedTeams.sort((a,b)=> { //
            if (a.house < b.house) return -1; //
            if (a.house > b.house) return 1; //
            return a.name.localeCompare(b.name); //
        });
        setTeams(fetchedTeams); //
      } else {
        console.warn("Unexpected data format from /api/admin/teams or no teams found."); //
        setTeams([]); //
      }

    } catch (err) {
      console.error('Error fetching data:', err); //
      // More specific error message if possible
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred.'; //
      setMessage(`Error loading round data: ${errorMessage}`); //
      setTimeout(() => setMessage(''), 3000); //
    } finally {
      // Set loading false only after initial fetch attempt
      setLoading(false); //
    }
  }, [loading, teams.length]); //

  // Fetch data on mount and poll lock status/winner
  useEffect(() => {
    // ... (keep existing polling logic) ...
    let isSubscribed = true; //
    let pollInterval: NodeJS.Timeout | null = null; //

    fetchData(); // Initial full fetch //

    // Polling interval for lock status and winner
    pollInterval = setInterval(async () => { //
      if (!isSubscribed) return; //
      try {
        const [statusRes, detailsRes] = await Promise.all([ //
             fetch('/api/admin/round-status?round=round-5'), //
             fetch('/api/rounds/round-5') //
        ]);

        if (isSubscribed) { //
            if (statusRes.ok) { //
                 const statusData = await statusRes.json(); //
                 setRoundLocked(statusData.isLocked); //
            }
            if (detailsRes.ok) { //
                const detailsData = await detailsRes.json(); //
                setRoundWinner(detailsData.round?.quaffleWinnerHouse || null); //
            }
        }
      } catch (err) {
        console.error('Error polling status/winner:', err); //
      }
    }, 7000); // Poll every 7 seconds //

    return () => { //
      isSubscribed = false; //
      if (pollInterval) clearInterval(pollInterval); //
    };
  }, [fetchData]); //

  const handleHouseChange = ( teamId: string, newHouse: string ) => {
    // ... (keep existing house change logic) ...
    if (roundLocked) return; //
    setTeams(prev => //
      prev.map(team => //
        team._id === teamId ? { ...team, house: newHouse } : team //
      )
    );
    setMessage(''); //
  };

  const toggleLock = async () => {
    // ... (keep existing lock toggle logic) ...
    setMessage(''); //
    try {
      const res = await fetch('/api/admin/round-status', { //
        method: 'POST', //
        headers: { 'Content-Type': 'application/json' }, //
        body: JSON.stringify({ round: 'round-5', isLocked: !roundLocked }), //
      });
      if (!res.ok) throw new Error('Failed to update lock status'); //
      const data = await res.json(); //
      setRoundLocked(data.isLocked); //
      setMessage(`Round ${data.isLocked ? 'locked' : 'unlocked'}.`); //
    } catch (err: any) {
      console.error('Error toggling lock:', err); //
      setMessage(`Error: ${err.message}`); //
    }
    setTimeout(() => setMessage(''), 3000); //
  };

  // Save changes made to team houses
  const saveTeamChanges = async () => {
    // ... (keep existing team change save logic) ...
    if (roundLocked) { //
      setMessage('Round is locked. Cannot save changes.'); //
      setTimeout(() => setMessage(''), 3000); //
      return; //
    }
    setSubmissionStatus('submitting'); //
    setMessage('Saving team changes...'); //

    const teamsToUpdate = teams //
      .filter(t => t._id) // Ensure team has an ID //
      .map(t => ({ //
        _id: t._id, //
        name: t.name, // Include name (API might require it) //
        house: t.house, // Send the potentially updated house //
        // Include isActive only if your API expects/handles it during updates
        // isActive: t.isActive,
      }));

    try {
      const token = localStorage.getItem('token'); // Get token for auth //
      const res = await fetch('/api/admin/teams', { // Use the admin teams endpoint //
        method: 'POST', //
        headers: { //
            'Content-Type': 'application/json', //
            'Authorization': `Bearer ${token}` // Include Auth header //
        },
        body: JSON.stringify(teamsToUpdate), //
      });

      const data = await res.json(); // Always parse response //

      if (!res.ok || !data.success) { // Check API success flag //
        if(res.status === 403){ throw new Error(data.error || 'Permission Denied. Contact Admin.'); } //
        throw new Error(data.error || 'Failed to save team changes'); //
      }

       // Optionally, update local state directly from response if needed, otherwise rely on polling
       // if (data.teams && Array.isArray(data.teams)) { ... update logic ... }
       // For simplicity here, we'll rely on the next poll or manual refresh

      setSubmissionStatus('success'); //
      setMessage('Team changes saved successfully!'); //
      await fetchData(); // Explicitly refresh data after save //

    } catch (err: any) {
      console.error('Error saving team changes:', err); //
      setMessage(`Error: ${err.message}`); //
      setSubmissionStatus('error'); //
    } finally {
      setTimeout(() => setSubmissionStatus('idle'), 2000); //
      // Keep success/error message slightly longer
      setTimeout(() => setMessage(''), 4000); //
    }
  };

  // *** MODIFICATION: Update finalizeRound5Setup ***
  const finalizeRound5Setup = async () => {
    if (roundLocked) { //
      setMessage('Round must be unlocked to finalize setup.'); //
      setTimeout(() => setMessage(''), 3000); //
      return; //
    }
    if (!confirm('Are you sure you want to finalize Round 5 setup? This will create the round entry using current TOTAL scores.')) { // Updated confirmation message //
        return; //
    }
    setSubmissionStatus('submitting'); //
    setMessage('Finalizing Round 5 setup with total scores...'); // Updated message //

    try {
        const token = localStorage.getItem('token'); //
        const headers: any = { 'Content-Type': 'application/json' }; //
        if (token) headers['Authorization'] = `Bearer ${token}`; //

        // --- CHANGE HERE: Use team.totalPoints instead of 0 ---
        const resultsPayload = teams
            .filter(team => team._id && team.isActive && !team.isEliminated) // Ensure we only finalize active teams with IDs
            .map(team => ({
                team: team._id, // Reference to the Team document //
                points: team.totalPoints, // Use the current totalPoints //
                time: 0, // Keep time as 0 //
                rank: 0, // Rank will be calculated later or based on sorting
            }));

        // Sort payload by points (totalPoints) descending before sending
        resultsPayload.sort((a, b) => b.points - a.points);
        // Assign rank based on sorted order
        resultsPayload.forEach((r, index) => { r.rank = index + 1; }); //


        // POST to the specific round API endpoint
        const res = await fetch('/api/rounds/round-5', { // Target round-5 API //
            method: 'POST', //
            headers, //
            body: JSON.stringify({ //
                results: resultsPayload, //
                approved: true // Mark as approved //
            }),
        });

        const data = await res.json(); //
        if (!res.ok || !data.success) { //
            if(res.status === 403){ throw new Error(data.error || 'Permission Denied. Contact Admin.'); } //
            throw new Error(data.error || 'Failed to finalize Round 5 setup.'); //
        }

        setSubmissionStatus('success'); //
        setMessage('Round 5 setup finalized successfully with total scores recorded!'); // Updated message //
         if(data.round?.isLocked) { // Check if API response indicates it locked the round //
            setRoundLocked(true); //
         }
         // Optionally refresh data
         // await fetchData(); //

    } catch (err: any) {
        console.error('Error finalizing Round 5:', err); //
        setMessage(`Error: ${err.message}`); //
        setSubmissionStatus('error'); //
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000); //
        setTimeout(() => setMessage(''), 5000); // Keep message a bit longer //
    }
  };
  // *** END MODIFICATION ***

  // --- awardQuaffle function ---
  const awardQuaffle = async (house: string, roundId = 'round-5') => {
    // ... (keep existing award quaffle logic) ...
    if (roundLocked) { //
        setMessage('Round is locked. Cannot award quaffle.'); //
        setTimeout(() => setMessage(''), 3000); //
        return; //
    }
    if (roundWinner) { //
        setMessage(`Cannot award: ${roundWinner} already won. Revert first if needed.`); //
        setTimeout(() => setMessage(''), 4000); //
        return; //
    }
    setMessage(`Awarding quaffle to ${house}...`); //
    setSubmissionStatus('submitting'); // Disable buttons //
    try {
        const token = localStorage.getItem('token'); //
        const res = await fetch('/api/admin/award-quaffle', { //
            method: 'POST', //
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, //
            body: JSON.stringify({ house: house, round: roundId }) // Send roundId //
        });
        const data = await res.json(); //
        if (!res.ok) { //
            if(res.status === 403){ throw new Error(data.error || 'Permission Denied. Contact Admin.'); } //
            throw new Error(data.error || 'Failed to award quaffle'); //
        }
        setRoundWinner(house); // Update UI //
        setMessage(`Quaffle awarded to ${house}!`); //
        setSubmissionStatus('success'); //
    } catch(e: any) {
        console.error("Award Quaffle Error:", e); //
        setMessage(`Failed to award quaffle: ${e.message}`); //
        setSubmissionStatus('error'); //
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000); //
        setTimeout(() => setMessage(''), 4000); //
    }
  };

  // --- revertQuaffle function ---
  const revertQuaffle = async (house: string, roundId = 'round-5') => {
    // ... (keep existing revert quaffle logic) ...
     if (roundLocked) { //
        setMessage('Round is locked. Cannot revert quaffle.'); //
        setTimeout(() => setMessage(''), 3000); //
        return; //
      }
      if (!confirm(`WARNING: Are you sure you want to REVERT the Quaffle from ${house} for Round 5? This will decrement their quaffle count.`)) { //
          return; //
      }
      setMessage(`Reverting Quaffle from ${house}...`); //
      setSubmissionStatus('submitting'); // Disable buttons //

      try {
        const token = localStorage.getItem('token'); //
        const res = await fetch('/api/admin/revert-quaffle', { // Call revert API //
            method: 'POST', //
            headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''}, //
            body: JSON.stringify({ house, round: roundId }) // Send correct round ID //
        });
        const data = await res.json(); //
        if (!res.ok) { //
           if(res.status === 403){ throw new Error(data.error || 'Permission Denied. Contact Admin.'); } //
           throw new Error(data.error || 'Failed to revert. Check server logs.'); //
        }
        setRoundWinner(null); // Clear winner in UI state //
        setMessage(`Quaffle successfully REVERTED from ${house}!`); //
        setSubmissionStatus('success'); //
      } catch (e: any) {
          console.error('Revert failed:', e); //
          setMessage(`Revert failed: ${e.message}.`); //
          setSubmissionStatus('error'); //
      } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000); //
        setTimeout(() => setMessage(''), 5000); //
      }
  };


  if (loading) {
    // ... (keep existing loading return) ...
    return ( //
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl animate-pulse"> {/* */}
        Loading Round 5 Data... ⏳ {/* */}
      </div>
    );
  }

  return (
    // ... (keep existing JSX structure, buttons, table, etc.) ...
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]"> {/* */}
      <div className="max-w-7xl mx-auto"> {/* */}
        {/* Header */}
        <header className="text-center mb-8"> {/* */}
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 5: House Management (Admin)</h1> {/* */}
          <p className="text-lg text-amber-200 mb-4">Manage lock status, adjust houses, award/revert Quaffle, and finalize setup.</p> {/* */}
          <div className="flex justify-center items-center gap-4 flex-wrap"> {/* */}
              {/* Lock Button */}
              <button
                onClick={toggleLock} //
                className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 ${ //
                  roundLocked //
                    ? 'bg-red-800 hover:bg-red-700 border border-red-500' //
                    : 'bg-green-800 hover:bg-green-700 border border-green-500' //
                } text-white shadow-lg`}
              >
                {roundLocked ? '🔓 Unlock Round' : '🔒 Lock Round'} {/* */}
              </button>
              {/* Finalize Button */}
               {!roundLocked && ( //
                  <button
                    onClick={finalizeRound5Setup} //
                    disabled={submissionStatus === 'submitting'} //
                    className="px-6 py-3 rounded-lg text-lg font-semibold bg-purple-700 hover:bg-purple-600 border border-purple-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300" //
                  >
                     {submissionStatus === 'submitting' ? 'Finalizing...' : '✅ Finalize Round 5 Setup'} {/* */}
                  </button>
               )}
          </div>
          {/* Message Display */}
          {message && ( //
            <p className={`mt-5 text-center font-semibold text-lg ${ //
                message.startsWith('Error') || message.startsWith('Failed') || message.startsWith('Cannot award') //
                ? 'text-red-400' //
                : message.includes('successfully') || message.includes('awarded') || message.includes('REVERTED') //
                ? 'text-green-400' //
                : 'text-blue-400' // For info messages like 'Saving...' //
            }`}>{message}</p>
          )}
        </header>

         {/* Lock Warning */}
         {roundLocked && ( //
            <div className="p-4 mb-6 rounded text-center bg-red-900/50 border border-red-700 text-red-300"> {/* */}
                The round is currently locked. Unlock to make changes or award Quaffles. {/* */}
            </div>
         )}

        {/* Team Management Table */}
        {!loading && ( //
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50 mb-8"> {/* */}
            <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Manage Team Houses</h2> {/* */}
            <div className="overflow-x-auto"> {/* */}
              <table className="w-full min-w-[600px] text-left"> {/* */}
                {/* ... (table thead remains the same) ... */}
                <thead> {/* */}
                  <tr className="border-b border-amber-900/30 text-amber-400"> {/* */}
                    <th className="p-3">Team Name</th> {/* */}
                    <th className="p-3">House</th> {/* */}
                    <th className="p-3">Total Points</th> {/* */}
                    <th className="p-3">Status</th> {/* */}
                  </tr>
                </thead>
                <tbody> {/* */}
                  {teams.map(team => ( //
                    <tr key={team.id} className={`border-t border-amber-900/20 hover:bg-gray-700/50 transition-colors ${team.isEliminated ? 'opacity-50 bg-red-900/20' : ''} ${!team.isActive && !team.isEliminated ? 'opacity-50 bg-gray-600/20' : ''}`}> {/* */}
                      <td className="p-3 font-medium">{team.name}</td> {/* */}
                      <td className="p-2"> {/* */}
                        <select
                          value={team.house} //
                          onChange={(e) => handleHouseChange(team._id, e.target.value)} //
                          disabled={roundLocked || !team.isActive || team.isEliminated} //
                          className={`bg-gray-700 border ${roundLocked || !team.isActive || team.isEliminated ? 'border-gray-600' : 'border-amber-900/50'} rounded p-1 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed`} //
                        >
                          <option value="">Select</option> {/* */}
                          {houses.map(h => ( //
                            <option key={h} value={h}>{h}</option> //
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-amber-300">{team.totalPoints}</td> {/* */}
                      <td className="p-3"> {/* */}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${ //
                          team.isEliminated ? 'bg-red-900/70 text-red-200' : //
                          team.isActive ? 'bg-green-900/50 text-green-300' : //
                          'bg-gray-600/50 text-gray-300' //
                        }`}>
                          {team.isEliminated ? 'Eliminated' : team.isActive ? 'Active' : 'Inactive'} {/* */}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {teams.length === 0 && ( //
                    <tr><td colSpan={4} className="p-4 text-center text-amber-200/70 italic">No active, non-eliminated teams found.</td></tr> //
                  )}
                </tbody>
              </table>
            </div>
            {/* Save Button */}
            {!roundLocked && ( //
              <div className="text-center mt-6"> {/* */}
                <button
                  onClick={saveTeamChanges} //
                  disabled={submissionStatus === 'submitting' || roundLocked} //
                  className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" //
                >
                  {submissionStatus === 'submitting' ? 'Saving...' : '💾 Save House Changes'} {/* */}
                </button>
              </div>
            )}
          </div>
        )}

         {/* --- Quaffle Management Section --- */}
         <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center"> {/* */}
             <h2 className="text-2xl font-['Cinzel'] text-amber-400 mb-4">Manage Round 5 Quaffle</h2> {/* */}
             {roundWinner ? ( //
                // Show current winner and Revert button
                <div className="text-center"> {/* */}
                  <p className="text-2xl font-bold text-yellow-400 mb-4">🏆 Current Winner: {roundWinner} 🏆</p> {/* */}
                  <button
                    onClick={() => revertQuaffle(roundWinner)} //
                    disabled={roundLocked || submissionStatus === 'submitting'} //
                    className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed" //
                  >
                    Revert Quaffle from {roundWinner} {/* */}
                  </button>
                </div>
              ) : (
                 // Show Award buttons
                 <> {/* */}
                    <p className="text-amber-200 mb-4 text-xl">Select the house winner for Round 5:</p> {/* */}
                    <div className="flex justify-center gap-4 flex-wrap"> {/* */}
                      {houses.map(h=> // Use all houses //
                        <button
                          key={h} //
                          onClick={()=>awardQuaffle(h)} //
                          disabled={roundLocked || !!roundWinner || submissionStatus === 'submitting'} //
                          className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" //
                        >
                          Give {h} Quaffle {/* */}
                        </button>
                      )}
                    </div>
                 </>
              )}
             {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Unlock round to award or revert Quaffles)</p>} {/* */}
         </div>
         {/* --- END ADDED --- */}

      </div>
    </div>
  );
}