'use client'

import { useState, useEffect, useCallback } from 'react';

// Define the Team interface based on expected data (similar to round-3/page.tsx)
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
  // Houses now include Slytherin as requested
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

  // Initialize with placeholder teams (no fixed number, will be populated on fetch)
  const [teams, setTeams] = useState<Team[]>([]);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(''); // For general messages

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data and poll round lock status
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-6');
      const statusData = await statusRes.json();
      setRoundLocked(statusData.isLocked);

      // 2. Fetch active teams data (filtered for non-eliminated teams for this round)
      const teamsRes = await fetch('/api/admin/teams'); 
      const teamsData: any[] = await teamsRes.json();
      
      if (teamsData && teamsData.length) {
        // Filter teams that are active and not eliminated (Round 6 is post-elimination)
        const relevantTeams = teamsData
            .filter(t => t.isActive !== false && t.isEliminated !== true)
            
        // Map API data to local state structure
        const filledTeams = relevantTeams.map((dbTeam: any, index: number) => ({
          _id: dbTeam._id,
          id: index + 1, // Assign stable index ID
          name: dbTeam.name,
          house: dbTeam.house,
          totalPoints: dbTeam.totalPoints || 0,
          isActive: dbTeam.isActive !== false,
          score: 0, // Reset round score input on fetch
        }));
        
        // Sort teams for a consistent view
        filledTeams.sort((a, b) => {
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
      setLoading(false);
    }
     // Clear message after a delay
    setTimeout(() => setMessage(''), 3000);
  }, []); 

  // Initial fetch and polling setup
  useEffect(() => {
    fetchData(); // Initial fetch

    // Polling for lock status (and full data to reflect totalPoints changes)
    const interval = setInterval(() => {
      if(isMounted) fetchData();
    }, 7000); 

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [fetchData, isMounted]); 

  // Handle changes in the score input
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

  // Toggle round lock status
  const toggleLock = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-6', isLocked: !roundLocked }), // Specify round-6
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

  // Save the scores entered in this round (adds points to totalPoints)
  const saveScores = async () => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot save scores.');
       setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSubmissionStatus('submitting');
    try {
       // Filter teams that actually have a score entered for this round
      const teamsToUpdate = teams
       .filter(t => t.score !== 0 && t._id) // Only send teams with scores > 0 and a database ID
       .map(t => ({
          _id: t._id,
          name: t.name, 
          house: t.house, 
          score: t.score, // Send only the score TO ADD for this round
        }));

      if (teamsToUpdate.length === 0) {
        setMessage('No new scores entered to save.');
        setSubmissionStatus('idle');
         setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      const res = await fetch('/api/admin/teams', { // This endpoint handles point increment
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsToUpdate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save scores');
      }

      setSubmissionStatus('success');
      setMessage('Scores added successfully! Refreshing data...');
      // Re-fetch data to reflect updated totalPoints and reset round scores
      await fetchData(); 

    } catch (err: any) {
      console.error('Error saving scores:', err);
      setMessage(`Error: ${err.message || 'Could not save scores.'}`);
      setSubmissionStatus('error');
    } finally {
      setTimeout(() => setSubmissionStatus('idle'), 2000);
    }
  };
  
  // Submit Round Results (logs this round's scores to a separate Round model)
   const submitRoundResults = async () => {
    if (roundLocked) {
        setMessage("Round is locked. Cannot submit results.");
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    if (!confirm('Are you sure you want to finalize and submit these scores for Round 6? This is typically done only once.')) {
        return;
    }
    setSubmissionStatus('submitting'); 
    try {
        // Prepare results from the current local state
        const results: RoundResult[] = teams
            .filter((t: any) => t._id && t.name && t.name.trim() !== '') // Filter valid teams with DB ID
            .map((t: any, idx: number) => ({
                team: t._id, 
                points: Number(t.score || 0), // Use the score entered/saved in THIS round's UI
                time: 0, // Placeholder
                rank: idx + 1, // Placeholder rank
            }));

        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/rounds/round-6', { // Endpoint for Round 6 results
            method: 'POST',
            headers,
            body: JSON.stringify({ results, approved: true }), 
        });

        const data = await res.json();
        if (data.success) {
            setMessage('Round 6 results submitted successfully! Scores are finalized.');
            setSubmissionStatus('success');
        } else {
            throw new Error(data.error || 'Failed to submit round results');
        }
    } catch (err: any) {
        console.error('submitRoundResults error:', err);
        setMessage(`Error submitting results: ${err.message}`);
        setSubmissionStatus('error');
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000); 
    }
};

  // Helper to award quaffle
  async function awardQua(house:string){
    if (roundLocked) {
        setMessage('Round is locked. Cannot award quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/award-quaffle',{
          method:'POST',
          headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
          body:JSON.stringify({house,round:'round-6'})
      })
      if(!res.ok) throw new Error('Failed to award quaffle');
      setMessage('Quaffle awarded to '+house + '!');
    }catch(e){
        console.error(e); 
        setMessage('Failed to award quaffle.');
    }
    setTimeout(() => setMessage(''), 3000);
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
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 6: Flash Videos Scoring</h1>
          <p className="text-lg text-amber-200 mb-4">Enter and save points earned by remaining teams in this knockout round.</p>
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

<hr/>

        {/* Team Scoring Table */}
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
                    <th className="p-3">Points to Add (Round 6)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.filter(t => t.name).map(team => ( // Only show teams with names
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
                </tbody>
              </table>
            </div>
             {/* Save Button */}
            {!roundLocked && (
              <div className="text-center mt-6">
                 <button
                    onClick={saveScores}
                    disabled={submissionStatus === 'submitting' || roundLocked}
                    className="bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold py-2 px-6 rounded-lg border border-amber-400/30 hover:from-amber-800 hover:to-amber-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {submissionStatus === 'submitting' ? 'Saving...' : submissionStatus === 'success' ? 'Saved!' : submissionStatus === 'error' ? 'Error!' : 'Save Added Points'}
                 </button>
                 {/* Optional Submit Button (if needed to log final round data) */}
                 <button
                    onClick={submitRoundResults}
                    disabled={submissionStatus === 'submitting' || roundLocked}
                    className="ml-4 bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit Final Round 6 Scores'}
                 </button>
              </div>
            )}
          </div>
        )}

<hr/>

        {/* Award Quaffle (Updated with 4 houses) */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50">
          <p className="text-amber-200 mb-3 text-lg">Award Round 6 Winner Quaffle:</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {houses.map(h => (
              <button
                key={h}
                onClick={() => awardQua(h)}
                disabled={roundLocked}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Award {h}
              </button>
            ))}
          </div>
           {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Unlock the round to award Quaffles)</p>}
        </div>
      </div>
    </div>
  );
}