'use client'

import { useState, useEffect } from 'react';

// Team interface might still be needed if other logic depends on it,
// but it's not strictly necessary for just awarding quaffles.
// Kept for potential future use or context.
interface Team {
  _id: string;
  id: number;
  name: string;
  house: string;
  totalPoints: number;
  isActive: boolean;
}

export default function Round4() {
  // Houses defined for Round 4
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw'];

  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true); // Still useful to show loading state initially
  const [isMounted, setIsMounted] = useState(false);
  const [message, setMessage] = useState(''); // For general messages like lock/unlock/award

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data (only lock status is strictly needed now)
  // and poll round lock status
  useEffect(() => {
    let isSubscribed = true; // Flag to prevent state updates on unmounted component

    async function fetchData() {
      setLoading(true); // Start loading
      try {
        // Fetch round lock status for round-4
        const statusRes = await fetch('/api/admin/round-status?round=round-4');
        if (!isSubscribed) return; // Check before setting state
        const statusData = await statusRes.json();
        setRoundLocked(statusData.isLocked);

        // NOTE: Fetching all teams data is removed as the table is gone.
        // If you need team data for *any other reason* later, add the fetch back here.

      } catch (err) {
        console.error('Error fetching data:', err);
         if (isSubscribed) setMessage('Error loading round status.');
      } finally {
         if (isSubscribed) setLoading(false);
      }
    }

    fetchData(); // Initial fetch

    // Polling for lock status
    const interval = setInterval(async () => {
      try {
        // Fetch round lock status for round-4
        const res = await fetch('/api/admin/round-status?round=round-4');
        const data = await res.json();
         // Check subscription status before setting state in interval
         if (isSubscribed) {
            setRoundLocked(data.isLocked);
         }
      } catch (err) {
        console.error('Error polling lock status:', err);
      }
    // Poll every 5 seconds
    }, 5000);

    // Cleanup function
    return () => {
      isSubscribed = false; // Set flag on unmount
      // Cleanup interval on unmount
      clearInterval(interval);
    };
  // Run once on mount
  }, []);

  // Toggle round lock status
  const toggleLock = async () => {
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Specify round-4
        body: JSON.stringify({ round: 'round-4', isLocked: !roundLocked }),
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl">
        Loading Round 4 Status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-[Cinzel]">
      <div className="max-w-4xl mx-auto"> {/* Adjusted max-width as content is less */}
        {/* Header */}
        <header className="text-center mb-12"> {/* Increased bottom margin */}
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 4: Task Around Us</h1>
          {/* Updated description */}
          <p className="text-lg text-amber-200 mb-6">Manage round lock status and award the Quaffle.</p>
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
             // Adjusted message styling slightly
             <p className={`mt-5 text-center font-semibold text-lg ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
        </header>

         {/* Team Scoring Table REMOVED */}

        {/* Award Quaffle */}
        {/* */}
        <div className="mt-8 text-center bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 border border-amber-800/50">
          <p className="text-amber-200 mb-4 text-xl">Award Round 4 Winner Quaffle:</p>
          <div className="flex justify-center gap-4">
            {/* */}
            {houses.map(h => (
              <button
                key={h}
                // Disable button if round is locked
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
                      // Specify round-4
                      body: JSON.stringify({ house: h, round: 'round-4' }),
                    });
                     if (!res.ok) throw new Error('Failed to award');
                     setMessage(`Quaffle awarded to ${h}!`);
                  } catch (e) {
                    console.error(e);
                     setMessage('Failed to award quaffle.');
                  }
                   // Clear message after 3 seconds
                   setTimeout(() => setMessage(''), 3000);
                }}
                 // Add disabled styles
                 className={`px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Award {h}
              </button>
            ))}
          </div>
            {/* Inform user if awarding is disabled due to lock */}
           {roundLocked && <p className="text-red-400 text-sm mt-4 italic">(Unlock the round to award Quaffles)</p>}
        </div>
      </div>
    </div>
  );
}