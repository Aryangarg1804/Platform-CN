'use client';

import { useState, useEffect, useCallback } from 'react';

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
  // Now include Slytherin
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

  const [teams, setTeams] = useState<Team[]>([]);
  // NEW: State to hold scores for just this round
  const [round5Scores, setRound5Scores] = useState<{ [teamId: string]: number | string }>({});
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(''); // For general messages
  const [startRoundResult, setStartRoundResult] = useState<any>(null); // To store result of starting round 5

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data (lock status, teams, and round scores)
  const fetchData = useCallback(async () => {
    // Only set loading on initial fetch
    if (loading) {
      setLoading(true);
    }
    try {
      // Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-5');
      const statusData = await statusRes.json();
      setRoundLocked(statusData.isLocked);

      // Fetch teams
      const teamsRes = await fetch('/api/admin/teams');
      const teamsData = await teamsRes.json();

      if (teamsData && Array.isArray(teamsData)) {
        // Map API data to the Team interface
        const fetchedTeams = teamsData.map((dbTeam: any, index: number) => ({
          id: index + 1, // Assign sequential ID for stable key
          _id: dbTeam._id,
          name: dbTeam.name,
          house: dbTeam.house,
          totalPoints: dbTeam.totalPoints || 0,
          isActive: dbTeam.isActive !== false,
          isEliminated: dbTeam.isEliminated === true,
        }));
        setTeams(fetchedTeams);
      } else {
        setTeams([]);
      }

      // NEW: Fetch existing round 5 scores
      const scoresRes = await fetch('/api/admin/scores?round=round-5');
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        // Assuming scoresData is an array like [{ teamId: '...', score: 10 }]
        if (scoresData && Array.isArray(scoresData.scores)) {
            const scoresMap = scoresData.scores.reduce((acc: any, item: any) => {
              // Use the database _id (item.teamId) as the key
              acc[item.teamId] = item.score || 0;
              return acc;
            }, {});
            setRound5Scores(scoresMap);
        }
      } else {
         console.warn('Could not fetch existing round 5 scores.');
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Error loading round data.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      // Only set loading to false on initial fetch completion
      if (loading) {
        setLoading(false);
      }
    }
  }, [loading]); // Include loading in dependencies for initial fetch logic


  // Fetch data on mount and set up polling for lock status
  useEffect(() => {
    fetchData(); // Initial fetch

    // Polling for lock status only
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/round-status?round=round-5');
        if (!res.ok) return; // Don't update if poll fails
        const data = await res.json();
        // Check if component is still mounted before setting state
        if (isMounted) {
          setRoundLocked(data.isLocked);
        }
      } catch (err) {
        console.error('Error polling lock status:', err);
      }
    }, 7000); // Poll every 7 seconds

    // Cleanup function
    return () => {
      setIsMounted(false); // Update mount status on cleanup
      clearInterval(interval);
    };
    // isMounted dependency ensures interval is reset if component remounts
  }, [fetchData, isMounted]);


  // Handle house changes in the dropdown
  const handleHouseChange = (
    teamId: string, // Use database _id for updates
    newHouse: string
  ) => {
    if (roundLocked) return;
    setTeams(prev =>
      prev.map(team =>
        team._id === teamId ? { ...team, house: newHouse } : team
      )
    );
    setMessage(''); // Clear previous messages on edit
  };

  // NEW: Handle score changes in the input
  const handleScoreChange = (
    teamId: string, // Use database _id
    score: string
  ) => {
    if (roundLocked) return;
    setRound5Scores(prev => ({
      ...prev,
      [teamId]: score, // Store as string from input, will parse on save
    }));
    setMessage(''); // Clear previous messages on edit
  };

  // Toggle round lock status
  const toggleLock = async () => {
    setMessage(''); // Clear message
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-5', isLocked: !roundLocked }),
      });
      if (!res.ok) throw new Error('Failed to update lock status');
      const data = await res.json();
      setRoundLocked(data.isLocked);
      setMessage(`Round ${data.isLocked ? 'locked' : 'unlocked'}.`);
    } catch (err: any) {
      console.error('Error toggling lock:', err);
      setMessage(`Error: ${err.message}`);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  // Save changes made to team houses
  const saveTeamChanges = async () => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot save changes.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSubmissionStatus('submitting');
    setMessage('Saving team changes...');
    
    const teamsToUpdate = teams
      .filter(t => t._id)
      .map(t => ({
        _id: t._id,
        name: t.name,
        house: t.house,
        isActive: t.isActive,
      }));

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsToUpdate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save team changes');
      }

      const data = await res.json();
      // Update local state based on potentially modified data from API response
      if (data.teams && Array.isArray(data.teams)) {
          const updatedTeamsFromApi = data.teams.map((dbTeam: any, index: number) => ({
              id: index + 1, // Re-assign sequential ID
              _id: dbTeam._id,
              name: dbTeam.name,
              house: dbTeam.house,
              totalPoints: dbTeam.totalPoints || 0,
              isActive: dbTeam.isActive !== false,
              isEliminated: dbTeam.isEliminated === true,
          }));
          setTeams(updatedTeamsFromApi);
      }

      setSubmissionStatus('success');
      setMessage('Team changes saved successfully!');

    } catch (err: any) {
      console.error('Error saving team changes:', err);
      setMessage(`Error: ${err.message}`);
      setSubmissionStatus('error');
    } finally {
      setTimeout(() => setSubmissionStatus('idle'), 2000);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // NEW: Save changes made to Round 5 scores
  const saveRound5Scores = async () => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot save scores.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSubmissionStatus('submitting');
    setMessage('Saving Round 5 scores...');

    // Prepare data: array of { teamId: string, score: number }
    const scoresToSave = Object.entries(round5Scores)
      .map(([teamId, score]) => ({
        teamId, // This should be the database _id
        score: Number(score) || 0, // Ensure it's a number
      }));
      
    // Payload includes the round identifier
    const payload = {
      round: 'round-5',
      scores: scoresToSave,
    };

    try {
      // POST to the /api/admin/scores endpoint
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save scores');
      }
      
      setSubmissionStatus('success');
      setMessage('Round 5 scores saved successfully!');

      // IMPORTANT: After saving scores, refetch all data.
      // This will update the 'totalPoints' column and ensure scores are persistent.
      fetchData(); 

    } catch (err: any) {
      console.error('Error saving scores:', err);
      setMessage(`Error: ${err.message}`);
      setSubmissionStatus('error');
    } finally {
      setTimeout(() => setSubmissionStatus('idle'), 2000);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Function to remove (mark inactive) a team
  const removeTeam = async (teamId: string) => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot remove team.');
        setTimeout(() => setMessage(''), 3000);
      return;
      }
    if (!confirm('Are you sure you want to remove (mark inactive) this team?')) return;

    setMessage('Removing team...');
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: teamId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove team');
      }

      // Update UI state
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, isActive: false } : t));
      setMessage('Team marked as inactive.');

    } catch (err: any) {
      console.error('Error removing team:', err);
      setMessage(`Error: ${err.message}`);
    }
      setTimeout(() => setMessage(''), 3000);
  };


  // Function to start Round 5 (Elimination/Shuffle)
  const startRound5Action = async () => {
    if (!confirm('Start Round 5? This will eliminate teams based on scores and cannot be fully undone.')) return;
    setMessage('Starting Round 5...');
    setSubmissionStatus('submitting');
    setStartRoundResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/start-round', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          },
        body: JSON.stringify({ round: 'round-5' })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setStartRoundResult(data);
      setMessage(data.message || `Round 5 started! Eliminated: ${data.eliminated}, Survivors: ${data.survivors}.`);
      setSubmissionStatus('success');
      // Refresh team data after starting the round
      fetchData(); // Call fetchData to get updated team statuses (isEliminated)

    } catch (err: any) {
      console.error('Error starting Round 5:', err);
      setMessage(`Error starting Round 5: ${err.message}`);
      setSubmissionStatus('error');
    } finally {
      setTimeout(() => setSubmissionStatus('idle'), 3000);
      setTimeout(() => setMessage(''), 6000);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl">
        Loading Round 5 Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 5: Knockout & House Management</h1>
          <p className="text-lg text-amber-200 mb-4">Enter scores, start the round to eliminate teams, and adjust houses if needed.</p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
              <button
                onClick={toggleLock}
                className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 ${
                  roundLocked
                    ? 'bg-red-800 hover:bg-red-700 border border-red-500'
                    : 'bg-green-800 hover:bg-green-700 border border-green-500'
                } text-white shadow-lg`}
              >
                {roundLocked ? '🔒 Round Locked - Unlock' : '🔓 Round Unlocked - Lock'}
              </button>
              {/* Button to Trigger Start Round 5 API */}
              <button
                onClick={startRound5Action}
                disabled={submissionStatus === 'submitting'}
                className="px-6 py-3 rounded-lg text-lg font-semibold bg-yellow-700 hover:bg-yellow-600 border border-yellow-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
              >
                {submissionStatus === 'submitting' ? 'Processing...' : '🚀 Start Round 5 (Eliminate Teams)'}
              </button>
          </div>
          {message && (
            <p className={`mt-5 text-center font-semibold text-lg ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
          {startRoundResult && (
            <div className="mt-4 text-center text-amber-200 bg-gray-700/50 p-3 rounded-md max-w-md mx-auto">
              <p>Round Start Result:</p>
              {startRoundResult.message ? <p>{startRoundResult.message}</p> : (
                <>
                  {typeof startRoundResult.eliminated === 'number' && <p>Eliminated: {startRoundResult.eliminated}</p>}
                  {typeof startRoundResult.survivors === 'number' && <p>Survivors: {startRoundResult.survivors}</p>}
                </>
              )}
            </div>
          )}
        </header>

        {/* Team Management Table */}
        {!loading && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50 mb-8">
            <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Manage Teams for Round 5</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left"> {/* Increased min-width */}
                <thead>
                  <tr className="border-b border-amber-900/30 text-amber-400">
                    <th className="p-3">Team Name</th>
                    <th className="p-3">House</th>
                    {/* NEW: Score Column */}
                    <th className="p-3">Round 5 Score</th>
                    <th className="p-3">Total Points</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id} className={`border-t border-amber-900/20 hover:bg-gray-700/50 transition-colors ${team.isEliminated ? 'opacity-50 bg-red-900/20' : ''} ${!team.isActive && !team.isEliminated ? 'opacity-50 bg-gray-600/20' : ''}`}>
                      <td className="p-3 font-medium">{team.name}</td>
                      <td className="p-2">
                        <select
                          value={team.house}
                          onChange={(e) => handleHouseChange(team._id, e.target.value)}
                          disabled={roundLocked || !team.isActive || team.isEliminated}
                          className={`bg-gray-700 border ${roundLocked || !team.isActive || team.isEliminated ? 'border-gray-600' : 'border-amber-900/50'} rounded p-1 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          <option value="">Select</option>
                          {houses.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                      {/* NEW: Score Input Cell */}
                      <td className="p-2">
                        <input
                          type="number"
                          value={round5Scores[team._id] || ''}
                          onChange={(e) => handleScoreChange(team._id, e.target.value)}
                          disabled={roundLocked || !team.isActive || team.isEliminated}
                          className="w-24 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-3 text-amber-300">{team.totalPoints}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          team.isEliminated ? 'bg-red-900/70 text-red-200' :
                          team.isActive ? 'bg-green-900/50 text-green-300' :
                          'bg-gray-600/50 text-gray-300'
                        }`}>
                          {team.isEliminated ? 'Eliminated' : team.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                          <button
                            onClick={() => removeTeam(team._id)}
                            disabled={roundLocked || !team.isActive || team.isEliminated}
                            className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Remove
                          </button>
                      </td>
                    </tr>
                  ))}
                  {/* Add a row if no teams are loaded */}
                  {teams.length === 0 && (
                    <tr>
                      {/* NEW: Updated colSpan to 6 */}
                      <td colSpan={6} className="p-4 text-center text-amber-200/70 italic">
                        No teams loaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Save Changes Buttons */}
            {!roundLocked && (
              // NEW: Added flex container for multiple buttons
              <div className="text-center mt-6 flex justify-center gap-4 flex-wrap">
                <button
                  onClick={saveTeamChanges}
                  disabled={submissionStatus === 'submitting' || roundLocked}
                  className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submissionStatus === 'submitting' ? 'Saving...' : 'Save House Changes'}
                </button>
                {/* NEW: Save Scores Button */}
                <button
                  onClick={saveRound5Scores}
                  disabled={submissionStatus === 'submitting' || roundLocked}
                  className="bg-gradient-to-r from-green-700 to-green-900 text-green-100 font-bold py-2 px-6 rounded-lg border border-green-400/30 hover:from-green-800 hover:to-green-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submissionStatus === 'submitting' ? 'Saving...' : 'Save Round 5 Scores'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Award Quaffle */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 border border-amber-800/50">
          <p className="text-amber-200 mb-4 text-xl">Award Round 5 Winner Quaffle:</p>
          <div className="flex justify-center flex-wrap gap-4">
            {houses.map(h => (
              <button
                key={h}
                disabled={roundLocked}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  try {
                    const res = await fetch('/api/admin/award-quaffle', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                      },
                      body: JSON.stringify({ house: h, round: 'round-5' }),
                    });
                    if (!res.ok) throw new Error('Failed to award');
                    setMessage(`Quaffle awarded to ${h}!`);
                  } catch (e) {
                    console.error(e);
                    setMessage('Failed to award quaffle.');
                  }
                  setTimeout(() => setMessage(''), 3000);
                }}
                className={`px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Award {h}
              </button>
            ))}
          </div>
          {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Unlock the round to change scores, houses, remove teams, or award Quaffles)</p>}
        </div>
      </div>
    </div>
  );
}