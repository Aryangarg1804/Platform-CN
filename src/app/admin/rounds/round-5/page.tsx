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
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

  const [teams, setTeams] = useState<Team[]>([]);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(''); // For general messages

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data (lock status, teams)
  const fetchData = useCallback(async () => {
    // Only set loading on initial fetch or if already loading
    if (loading || !teams.length) {
       setLoading(true);
    }
    try {
      // Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-5'); //
      const statusData = await statusRes.json();
      setRoundLocked(statusData.isLocked);

      // Fetch teams
      const teamsRes = await fetch('/api/admin/teams'); //
      const teamsData = await teamsRes.json();

      if (teamsData && Array.isArray(teamsData)) {
        const fetchedTeams = teamsData
          .filter((t: any) => t.isActive !== false && t.isEliminated !== true) // Filter for active, non-eliminated
          .map((dbTeam: any, index: number) => ({
            id: index + 1,
            _id: dbTeam._id,
            name: dbTeam.name,
            house: dbTeam.house,
            totalPoints: dbTeam.totalPoints || 0,
            isActive: dbTeam.isActive !== false,
            isEliminated: dbTeam.isEliminated === true,
          }));
        // Sort for consistent display
        fetchedTeams.sort((a,b)=> a.name.localeCompare(b.name));
        setTeams(fetchedTeams);
      } else {
        setTeams([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Error loading round data.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      // Set loading false only after initial fetch
      if (loading || !teams.length) {
        setLoading(false);
      }
    }
  }, [loading, teams.length]); // Depend on loading and teams.length


  // Fetch data on mount and poll lock status
  useEffect(() => {
    fetchData(); // Initial full fetch

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/round-status?round=round-5'); //
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setRoundLocked(data.isLocked);
        }
      } catch (err) {
        console.error('Error polling lock status:', err);
      }
    }, 7000);

    return () => {
      setIsMounted(false);
      clearInterval(interval);
    };
  }, [fetchData, isMounted]);


  const handleHouseChange = ( teamId: string, newHouse: string ) => {
    if (roundLocked) return;
    setTeams(prev =>
      prev.map(team =>
        team._id === teamId ? { ...team, house: newHouse } : team
      )
    );
    setMessage('');
  };

  const toggleLock = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/admin/round-status', { //
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
      const res = await fetch('/api/admin/teams', { //
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Add Auth header if needed
        body: JSON.stringify(teamsToUpdate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save team changes');
      }

       const data = await res.json();
       if (data.teams && Array.isArray(data.teams)) {
          let updatedTeamsFromApi = data.teams // Use let to allow modification
             .filter((dbTeam: any) => dbTeam.isActive !== false && dbTeam.isEliminated !== true) // Ensure we only show active ones
             .map((dbTeam: any, index: number): Team => ({ // Explicit return type here helps
                id: index + 1, // Re-assign sequential ID after filtering
                _id: dbTeam._id,
                name: dbTeam.name,
                house: dbTeam.house,
                totalPoints: dbTeam.totalPoints || 0,
                isActive: dbTeam.isActive !== false,
                isEliminated: dbTeam.isEliminated === true,
            }));

            // FIX: Add explicit types for sort parameters
            updatedTeamsFromApi.sort((a: Team, b: Team) => a.name.localeCompare(b.name));

          setTeams(updatedTeamsFromApi); // Set the sorted array
      } else {
        console.warn("Unexpected API response structure for team update.");
        await fetchData(); // Refetch data as a fallback
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

  // Finalize Round 5 Setup Function (Creates Round Document)
  const finalizeRound5Setup = async () => {
    if (roundLocked) {
      setMessage('Round must be unlocked to finalize setup.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (!confirm('Are you sure you want to finalize Round 5 setup? This will create the round entry for the public leaderboard.')) {
        return;
    }
    setSubmissionStatus('submitting');
    setMessage('Finalizing Round 5 setup...');

    try {
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Prepare a minimal results payload (just team IDs, points=0)
        const resultsPayload = teams.map(team => ({
            team: team._id, // Reference to the Team document
            points: 0, // No points awarded in this round via this page
            time: 0,
            rank: 0, // Rank might not be relevant here but schema expects it
        }));

        // POST to the specific round API endpoint
        const res = await fetch('/api/rounds/round-5', { // Target round-5 API/route.ts]
            method: 'POST',
            headers,
            body: JSON.stringify({
                results: resultsPayload,
                approved: true // Optionally lock the round automatically upon finalization
            }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to finalize Round 5 setup.');
        }

        setSubmissionStatus('success');
        setMessage('Round 5 setup finalized successfully! Leaderboard structure created.');
         if(data.round?.isLocked) {
            setRoundLocked(true); // Update lock status if API locked it
         }

    } catch (err: any) {
        console.error('Error finalizing Round 5:', err);
        setMessage(`Error: ${err.message}`);
        setSubmissionStatus('error');
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000);
        setTimeout(() => setMessage(''), 5000); // Keep message a bit longer
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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 5: House Management</h1>
          <p className="text-lg text-amber-200 mb-4">Manage round lock status and adjust team houses. Finalize setup to create the leaderboard entry.</p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
              <button
                onClick={toggleLock}
                className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 ${
                  roundLocked
                    ? 'bg-red-800 hover:bg-red-700 border border-red-500'
                    : 'bg-green-800 hover:bg-green-700 border border-green-500'
                } text-white shadow-lg`}
              >
                {roundLocked ? '🔓 Unlock Round' : '🔒 Lock Round'}
              </button>
               {!roundLocked && (
                  <button
                    onClick={finalizeRound5Setup}
                    disabled={submissionStatus === 'submitting'}
                    className="px-6 py-3 rounded-lg text-lg font-semibold bg-purple-700 hover:bg-purple-600 border border-purple-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                     {submissionStatus === 'submitting' ? 'Finalizing...' : '✅ Finalize Round 5 Setup'}
                  </button>
               )}
          </div>
          {message && (
            <p className={`mt-5 text-center font-semibold text-lg ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
        </header>

        {!loading && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 border border-amber-800/50 mb-8">
            <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Manage Team Houses</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-amber-900/30 text-amber-400">
                    <th className="p-3">Team Name</th>
                    <th className="p-3">House</th>
                    <th className="p-3">Total Points</th>
                    <th className="p-3">Status</th>
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
                    </tr>
                  ))}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-amber-200/70 italic">
                        No active, non-eliminated teams found for Round 5.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!roundLocked && (
              <div className="text-center mt-6 flex justify-center gap-4 flex-wrap">
                <button
                  onClick={saveTeamChanges}
                  disabled={submissionStatus === 'submitting' || roundLocked}
                  className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submissionStatus === 'submitting' ? 'Saving...' : '💾 Save House Changes'}
                </button>
              </div>
            )}
             {roundLocked && <p className="text-red-400 text-sm mt-4 italic text-center">(Unlock the round to change houses)</p>}
          </div>
        )}

      </div>
    </div>
  );
}