'use client'

import { useState, useEffect, useCallback } from 'react';

// Define the Team interface for incremental scoring
interface Team {
  _id: string; // Database ID
  id: number; // Sequential ID (1-24 or more) for stable key
  name: string;
  house: string;
  totalPoints: number; // Overall points from DB
  score: number;      // Points to ADD/SUBTRACT in this round (UI input)
  isActive: boolean;
}

// Interface for round submission
interface RoundResult {
  team: string; 
  points: number; // Incremental score achieved in the round
  time: number; 
  rank: number; 
}


export default function Round3() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw'];

  const initialTeams: Team[] = []; 

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(''); // For general messages
  const [roundWinner, setRoundWinner] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data and current Round 3 scores
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-3');
      const statusData = await statusRes.json();
      setRoundLocked(statusData.isLocked);

      // 2. Fetch round details (for quaffle winner)
      const historicalRes = await fetch('/api/rounds/round-3');
      const historicalData = await historicalRes.json();
      setRoundWinner(historicalData.round?.quaffleWinnerHouse || null);
      
      // 3. Fetch all teams data (for totalPoints and current roster)
      const teamsRes = await fetch('/api/admin/teams'); 
      const teamsData: any[] = await teamsRes.json();

      if (teamsData && teamsData.length) {
        const activeTeams = teamsData.filter(t => t.isActive !== false && t.isEliminated !== true);
        
        const filledTeams: Team[] = activeTeams.map((dbTeam: any, index: number) => ({
            _id: dbTeam._id,
            id: index + 1, 
            name: dbTeam.name,
            house: dbTeam.house,
            totalPoints: dbTeam.totalPoints || 0,
            isActive: dbTeam.isActive !== false,
            score: 0, // Reset input score to 0 on fetch
        }));
        
        filledTeams.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(filledTeams);
      } else {
        setTeams([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Error loading round data.');
    } finally {
      setLoading(false);
    }
  }, []); 


  // Initial fetch and polling setup
  useEffect(() => {
    fetchData(); // Initial full fetch

    // Polling interval 
    const interval = setInterval(() => {
      if(isMounted) {
          fetchData(); 
      }
    }, 7000); 

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [fetchData, isMounted]); 

  // Handle changes in the score input (allows negative scores for increment)
  const handleChange = (
    id: number, 
    value: string | number
  ) => {
    if (roundLocked) return;
    setTeams(prev =>
      prev.map(team =>
        team.id === id ? { ...team, score: Number(value) } : team
      )
    );
  };

  // Toggle round lock status (Admin function)
  const toggleLock = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-3', isLocked: !roundLocked }), // Specify round
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

  // CONSOLIDATED FUNCTION: Increments totalPoints AND Logs incremental score to Round schema
  const saveAndSubmitScores = async () => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot save scores.');
       setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSubmissionStatus('submitting');
    setMessage('Processing: Saving points and submitting round finalization...');

    try {
      // 1. Prepare data for POST /api/admin/teams ($inc totalPoints)
      // We must only send teams that have a non-zero incremental score.
      const teamsToIncrement = teams
       .filter(t => t.score !== 0 && t._id) 
       .map(t => ({
          _id: t._id,
          name: t.name, 
          house: t.house, 
          currentRoundScore: t.score, // Store the incremental score for logging (Step 2)
          score: t.score, // Send the incremental score for $inc
        }));

      if (teamsToIncrement.length === 0) {
        setMessage('No new points (positive or negative) entered to save.');
        setSubmissionStatus('idle');
         setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };

      // API Call 1: Save Scores (increments totalPoints)
      const teamSaveRes = await fetch('/api/admin/teams', { 
        method: 'POST',
        headers,
        body: JSON.stringify(teamsToIncrement),
      });

      const teamSaveData = await teamSaveRes.json(); 

      if (!teamSaveRes.ok || !teamSaveData.teams) { 
        throw new Error(teamSaveData.error || 'Failed to apply score adjustment.');
      }

      // 2. Prepare data for POST /api/rounds/round-3 (Log Final Round Results)
      
      // We log ALL active teams. Teams not in teamsToIncrement get a score of 0.
      const teamsForRoundLog = teams.filter(t => t.isActive).map(team => {
        const incrementData = teamsToIncrement.find(t => t._id === team._id);
          return {
              team: team._id, 
              // Log the incremental score (0 for teams not scored)
              points: incrementData ? incrementData.currentRoundScore : 0, 
              rank: 0,
              time: 0,
          };
      });

      // Sort results by the incremental score to determine rank
      const results: RoundResult[] = teamsForRoundLog
          .sort((a, b) => b.points - a.points)
          .map((r, idx) => ({ ...r, rank: idx + 1 }));


      // API Call 2: Submit Round Results (logs round state with incremental score)
      const submitRes = await fetch('/api/rounds/round-3', { 
        method: 'POST',
        headers,
        body: JSON.stringify({ results, approved: true }), 
      });

      if (!submitRes.ok) {
          const errorData = await submitRes.json();
          throw new Error(errorData.error || 'Failed to submit round results.');
      }

      setSubmissionStatus('success');
      setMessage('Incremental points saved and Round 3 submission finalized!');

      // Final update: Trigger a fresh fetch to reload accurate totals
      await fetchData();

    } catch (err: any) {
      console.error('Error in consolidated save:', err);
      setMessage(`Error: ${err.message || 'Could not save and submit scores.'}`);
      setSubmissionStatus('error');
    } finally {
      // Reset status after a delay
      setTimeout(() => setSubmissionStatus('idle'), 3000);
      setTimeout(() => setMessage(''), 5000); // Clear message after 5s
    }
  };


  // Helper to award quaffle with confirmation
  async function awardQua(house:string, roundId = 'round-3'){
    if (roundLocked) {
        setMessage('Round is locked. Cannot award quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    
    // Confirmation check
    if (!confirm(`Are you sure you want to award the Round 3 Quaffle to ${house}? This will overwrite the current winner (${roundWinner || 'None'})!`)) {
        return;
    }

    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/award-quaffle',{
          method:'POST',
          headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
          body:JSON.stringify({house,round:roundId})
      })
      if(!res.ok) throw new Error('Failed to award quaffle');
      
      setRoundWinner(house); // Optimistic UI update
      setMessage('Quaffle awarded to '+house + '!');

    }catch(e){
        console.error(e); 
        setMessage('Failed to award quaffle.');
    }
    setTimeout(() => setMessage(''), 3000);
  }

  // Helper to revert quaffle
  const revertQua = async (house: string, roundId = 'round-3') => {
      if (roundLocked) {
        setMessage('Round is locked. Cannot revert quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      if (!confirm(`WARNING: This action is destructive. Are you sure you want to REVERT the Quaffle from ${house} for Round 3? This will decrement the house quaffle count.`)) {
          return;
      }

      setMessage(`Reverting Quaffle from ${house}.`);
      setSubmissionStatus('submitting');
      
      try {
        const token = localStorage.getItem('token');
        
        // Calls the new API route to handle database changes (decrement + clear winner)
        const res = await fetch('/api/admin/revert-quaffle', { 
            method: 'POST', 
            headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
            body: JSON.stringify({ house, round: roundId })
        });
        
        if (!res.ok) throw new Error('Failed to revert. Check server logs.');

        setRoundWinner(null); // Clear optimistic UI update
        setMessage(`Quaffle successfully REVERTED from ${house}!`);
        
      } catch (e: any) {
          console.error('Revert failed:', e);
          setMessage(`Revert failed: ${e.message}.`);
      } finally {
        setSubmissionStatus('idle');
        setTimeout(() => setMessage(''), 5000);
      }
  }

  // Helper function to calculate scores for charts
  const calculateScores = () => {
    // Note: The charts should always use the current totalPoints, which is updated on save.
    const houseScores = houses.map(house => ({
      name: house,
      total: teams
        .filter(t => t.house === house && t.name.trim() !== '')
        .reduce((sum, t) => sum + Number(t.totalPoints || 0), 0),
    }))

    const teamScores = teams
      .filter(t => t.name.trim() !== '')
      .map(t => ({
        name: t.name,
        score: Number(t.totalPoints || 0),
        house: t.house,
      }))
      .sort((a, b) => b.score - a.score)
      
      return { houseScores, teamScores };
  };

  const { houseScores, teamScores } = calculateScores();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 3: Escape Loop (Admin)</h1>
          <p className="text-lg text-amber-200 mb-4">Add or subtract points and manage lock status.</p>
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
             <p className={`mt-4 text-center font-semibold ${submissionStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
        </header>


        {/* Team Scoring Table */}
         {!loading && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50">
             <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Enter Points to Add/Subtract</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-amber-900/30 text-amber-400">
                    <th className="p-3">Team Name</th>
                    <th className="p-3">House</th>
                    <th className="p-3">Current Total Points</th>
                    <th className="p-3">Points to Add/Subtract (R3)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.filter(t => t.name).map(team => ( // Only show teams with names
                    <tr key={team._id} className="border-t border-amber-900/20 hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 font-medium">{team.name}</td>
                      <td className="p-3">{team.house}</td>
                      <td className="p-3 text-amber-300">{team.totalPoints}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={team.score}
                          onChange={e => handleChange(team.id, Number(e.target.value))}
                          disabled={roundLocked}
                          className={`w-32 bg-gray-700 border ${roundLocked ? 'border-gray-600' : 'border-amber-900/50'} rounded p-1 text-amber-100 text-right focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed`}
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
                </tbody>
              </table>
            </div>
             {/* Save Button */}
            {!roundLocked && (
              <div className="text-center mt-6">
                 <button
                    onClick={saveAndSubmitScores}
                    disabled={submissionStatus === 'submitting' || roundLocked}
                    className="bg-gradient-to-r from-amber-700 to-red-900 text-amber-100 font-bold py-3 px-8 rounded-lg border border-amber-400/30 hover:from-amber-800 hover:to-red-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {submissionStatus === 'submitting' ? 'Processing...' : '✅ Save Points & Finalize Round 3'}
                 </button>
                 <p className="text-sm text-yellow-400/70 mt-2">Enter positive or negative increments.</p>
              </div>
            )}
          </div>
        )}


        {/* Award Quaffle Section */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50">
          <p className="text-amber-200 mb-3 text-lg">Award Round 3 Winner Quaffle:</p>
          
          {roundWinner ? (
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
            <div className="flex justify-center gap-4">
              {houses.map(h => (
                <button
                  key={h}
                  onClick={() => awardQua(h)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow"
                  disabled={roundLocked || submissionStatus === 'submitting'}
                >
                  Award {h}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 