'use client'

import { useState, useEffect } from 'react';

// Define the Team interface based on expected data
interface Team {
  _id: string; // Database ID
  id: number; // Sequential ID (1-24 or more) for stable key
  name: string;
  house: string;
  totalPoints: number; // Overall points from DB
  score: number;      // Points to ADD in this round
  isActive: boolean;
}

export default function Round3() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw'];

  // Initialize with placeholder teams (adjust length if needed)
  const initialTeams: Team[] = Array.from({ length: 24 }, (_, i) => ({
    _id: '',
    id: i + 1,
    name: '',
    house: '',
    totalPoints: 0,
    score: 0, // Initialize round score to 0
    isActive: true,
  }));

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(''); // For general messages

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data and poll round lock status
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch round lock status
        const statusRes = await fetch('/api/admin/round-status?round=round-3');
        const statusData = await statusRes.json();
        setRoundLocked(statusData.isLocked);

        // Fetch all teams data
        const teamsRes = await fetch('/api/admin/teams'); // Fetch all teams
        const teamsData = await teamsRes.json();

        if (teamsData && teamsData.length) {
          // Merge API data into initialTeams structure
          const filledTeams = initialTeams.map((placeholderTeam, idx) => {
            const dbTeam = teamsData[idx];
            if (dbTeam) {
              return {
                ...placeholderTeam, // Keep the stable `id`
                _id: dbTeam._id,
                name: dbTeam.name,
                house: dbTeam.house,
                totalPoints: dbTeam.totalPoints || 0,
                isActive: dbTeam.isActive !== false,
                score: 0, // Reset round score input on fetch
              };
            }
            return placeholderTeam;
          });
          setTeams(filledTeams);
        } else {
          // If no teams from API, ensure state reflects initialTeams
          setTeams(initialTeams);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage('Error loading round data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData(); // Initial fetch

    // Polling for lock status
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/round-status?round=round-3');
        const data = await res.json();
        setRoundLocked(data.isLocked);
      } catch (err) {
        console.error('Error polling lock status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []); // Run once on mount

  // Handle changes in the score input
  const handleChange = (
    id: number, // Use the stable `id` for identification
    field: keyof Team,
    value: string | number | boolean
  ) => {
    if (roundLocked) return;
    setTeams(prev =>
      prev.map(team =>
        team.id === id ? { ...team, [field]: value } : team
      )
    );
  };

  // Toggle round lock status
  const toggleLock = async () => {
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

  // Save the scores entered in this round
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
          name: t.name, // Include name for safety, though API uses _id primarily
          house: t.house, // Include house for safety
          score: t.score, // Send only the score TO ADD for this round
          // Do NOT send totalPoints here, API increments it
        }));

      if (teamsToUpdate.length === 0) {
        setMessage('No new scores entered to save.');
        setSubmissionStatus('idle');
         setTimeout(() => setMessage(''), 3000);
        return;
      }

      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
         // Send the filtered array directly
        body: JSON.stringify(teamsToUpdate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save scores');
      }

      const data = await res.json();
      console.log('Scores saved response:', data);

      // --- Success: Update UI state with new totalPoints and reset round scores ---
       setTeams(prevTeams => prevTeams.map(team => {
         // Find the corresponding updated team from the response (if any)
         const updatedTeam = data.teams?.find((ut: any) => ut._id === team._id);
         return {
          ...team,
           // Update totalPoints if the team was part of the update
           totalPoints: updatedTeam ? updatedTeam.totalPoints : team.totalPoints,
           score: 0, // Reset round score input field
         };
       }));


      setSubmissionStatus('success');
      setMessage('Scores added successfully!');
      // Optionally re-fetch data after saving? Depends on desired flow.

    } catch (err: any) {
      console.error('Error saving scores:', err);
      setMessage(`Error: ${err.message || 'Could not save scores.'}`);
      setSubmissionStatus('error');
    } finally {
      // Reset status after a delay
      setTimeout(() => setSubmissionStatus('idle'), 2000);
      setTimeout(() => setMessage(''), 3000); // Clear message after 3s
    }
  };

  // --- Submit Round Results (similar to Round 1, adjust API endpoint) ---
   const submitRoundResults = async () => {
    if (roundLocked) {
        setMessage("Round is locked. Cannot submit results.");
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    if (!confirm('Are you sure you want to finalize and submit these scores for Round 3? This might affect overall standings.')) {
        return;
    }
    setSubmissionStatus('submitting'); // Reuse submissionStatus for feedback
    try {
        // Prepare results based on the current state of teams
        // Ensure to use the correct data (points added in this round, if applicable)
        // Or if the API expects total points up to this round, adjust accordingly.
        // Assuming API wants points FOR THIS ROUND:
        const results = teams
            .filter((t: any) => t._id && t.name && t.name.trim() !== '') // Filter valid teams with DB ID
            .map((t: any, idx: number) => ({
                team: t._id, // Use the database ID
                points: Number(t.score || 0), // Use the score entered/saved in THIS round's UI
                time: 0, // Add time if relevant for this round
                rank: idx + 1, // Simple rank based on current view/sort order - adjust if needed
            }));

        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/rounds/round-3', { // <-- Endpoint for Round 3 results
            method: 'POST',
            headers,
            body: JSON.stringify({ results, approved: true }), // Assuming approval structure
        });

        const data = await res.json();
        if (data.success) {
            setMessage('Round 3 results submitted successfully!');
            setSubmissionStatus('success');
            // Maybe lock the round automatically after submission?
            // toggleLock(); // Uncomment if you want to auto-lock
        } else {
            throw new Error(data.error || 'Failed to submit round results');
        }
    } catch (err: any) {
        console.error('submitRoundResults error:', err);
        setMessage(`Error submitting results: ${err.message}`);
        setSubmissionStatus('error');
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000); // Reset status feedback
        setTimeout(() => setMessage(''), 5000); // Clear message after 5s
    }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl">
        Loading Round 3 Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 3: Escape Loop</h1>
          <p className="text-lg text-amber-200 mb-4">Add points earned by teams in this round.</p>
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
             <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Enter Round 3 Points</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-amber-900/30 text-amber-400">
                    <th className="p-3">Team Name</th>
                    <th className="p-3">House</th>
                    <th className="p-3">Current Total Points</th>
                    <th className="p-3">Points to Add (Round 3)</th>
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
                          onChange={e => handleChange(team.id, 'score', Number(e.target.value))}
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
                 {/* Optional Submit Button */}
                 <button
                    onClick={submitRoundResults}
                    disabled={submissionStatus === 'submitting' || roundLocked}
                    className="ml-4 bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit Final Round 3 Scores'}
                 </button>
              </div>
            )}
          </div>
        )}


        {/* Award Quaffle */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50">
          <p className="text-amber-200 mb-3 text-lg">Award Round 3 Winner Quaffle:</p>
          <div className="flex justify-center gap-4">
            {houses.map(h => (
              <button
                key={h}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  try {
                    const res = await fetch('/api/admin/award-quaffle', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                      },
                      body: JSON.stringify({ house: h, round: 'round-3' }), // Specify round
                    });
                     if (!res.ok) throw new Error('Failed to award');
                    setMessage(`Quaffle awarded to ${h}!`);
                  } catch (e) {
                    console.error(e);
                    setMessage('Failed to award quaffle.');
                  }
                  setTimeout(() => setMessage(''), 3000);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow"
              >
                Award {h}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}