'use client'

import { useState, useEffect, useCallback } from 'react';
import { canAccessRound } from '@/lib/roundHeadAuth'; // Assuming this utility exists

export default function Round4() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw'];

  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // State for current winner

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data (lock status and current winner)
  const fetchData = useCallback(async () => {
    // Keep local message unless specifically cleared
    // setMessage('');
    try {
      // 1. Fetch round lock status
      const statusRes = await fetch('/api/admin/round-status?round=round-4');
      const statusData = await statusRes.json();
      setRoundLocked(statusData.isLocked);

      // 2. Fetch current round winner status
      const roundDetailsRes = await fetch('/api/rounds/round-4'); // Fetch round details
      const roundDetailsData = await roundDetailsRes.json();
      if (roundDetailsRes.ok && roundDetailsData.round) {
        setRoundWinner(roundDetailsData.round.quaffleWinnerHouse || null); // Update winner state
      } else {
         console.warn('Could not fetch round details or winner.');
         setRoundWinner(null);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Error loading round data.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array, fetch is self-contained

  // Fetch data on mount and set up polling for lock status
  useEffect(() => {
    let isSubscribed = true;
    fetchData(); // Initial fetch

    // Polling for lock status (and winner, in case another admin changes it)
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch('/api/admin/round-status?round=round-4');
        const roundDetailsRes = await fetch('/api/rounds/round-4');

        if (!statusRes.ok || !roundDetailsRes.ok) return;

        const statusData = await statusRes.json();
        const roundDetailsData = await roundDetailsRes.json();

        if (isSubscribed) {
          setRoundLocked(statusData.isLocked);
          setRoundWinner(roundDetailsData.round?.quaffleWinnerHouse || null);
        }
      } catch (err) {
        console.error('Error polling data:', err);
      }
    }, 7000); // Poll every 7 seconds

    return () => {
       isSubscribed = false;
       clearInterval(interval);
    };
  }, [fetchData]); // Re-run if fetchData changes (it won't due to useCallback)

  // Toggle round lock status
  const toggleLock = async () => {
     setMessage(''); // Clear message
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-4', isLocked: !roundLocked }),
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

  // Helper to award quaffle
  async function awardQua(house: string, roundId = 'round-4'){
    if (roundLocked) {
        setMessage('Round is locked. Cannot award quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    // Prevent awarding if someone already won
    if (roundWinner) {
        setMessage(`Cannot award: ${roundWinner} has already won the quaffle for this round. Revert first if needed.`);
        setTimeout(() => setMessage(''), 4000);
        return;
    }

    setMessage(`Awarding quaffle to ${house}...`);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/award-quaffle',{
          method:'POST',
          headers:{'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : ''},
          body:JSON.stringify({house, round:roundId})
      })
      if(!res.ok) throw new Error('Failed to award quaffle');

      setRoundWinner(house); // Optimistic UI update
      setMessage('Quaffle awarded to '+house + '!');

    }catch(e: any){
        console.error(e);
        setMessage(`Failed to award quaffle: ${e.message}`);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  // **NEW**: Helper to revert quaffle
  const revertQua = async (house: string, roundId = 'round-4') => {
      if (roundLocked) {
        setMessage('Round is locked. Cannot revert quaffle.');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      if (!confirm(`WARNING: Are you sure you want to REVERT the Quaffle from ${house} for Round 4? This will decrement their quaffle count.`)) {
          return;
      }

      setMessage(`Reverting Quaffle from ${house}...`);

      try {
        const token = localStorage.getItem('token');
        // Calls the revert API route
        const res = await fetch('/api/admin/revert-quaffle', {
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
        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl">
        Loading Round 4 Status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 4: Task Around Us</h1>
          <p className="text-lg text-amber-200 mb-6">Manage round lock status and award/revert the Quaffle.</p>
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
           {message && (
             <p className={`mt-5 text-center font-semibold text-lg ${message.startsWith('Error') || message.startsWith('Failed') || message.startsWith('Cannot award') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
        </header>

        {/* Award/Revert Quaffle Section */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 border border-amber-800/50">
          <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Manage Round 4 Quaffle</h2>

          {roundWinner ? (
            // **NEW**: Show current winner and Revert button
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400 mb-4">🏆 Current Winner: {roundWinner} 🏆</p>
              <button
                onClick={() => revertQua(roundWinner)}
                disabled={roundLocked}
                className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white font-semibold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revert Quaffle from {roundWinner}
              </button>
            </div>
          ) : (
            // Original Award buttons
            <>
              <p className="text-amber-200 mb-4 text-xl">Award Round 4 Winner Quaffle:</p>
              <div className="flex justify-center gap-4">
                {houses.map(h => (
                  <button
                    key={h}
                    disabled={roundLocked || !!roundWinner} // Also disable if winner exists
                    onClick={() => awardQua(h)}
                    className={`px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
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