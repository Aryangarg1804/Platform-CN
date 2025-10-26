"use client"
import React, { useEffect, useState, useCallback } from 'react' // Import useCallback
import LeaderboardCard from '@/components/Leaderboard'

// Define a type for team data for better type safety
interface TeamScore {
  _id: string;
  name: string;
  house: string;
  totalPoints: number;
}

export default function TeamLeaderboardPage() {
  const [teams, setTeams] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);

  // --- Define load function outside useEffect, wrapped in useCallback ---
  const load = useCallback(async () => {
    setError(null); // Reset error on load
    setLoading(true); // Set loading true at the start of load
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        // Try to get more specific error from response body if possible
        let errorDetails = res.statusText;
        try {
          const errorData = await res.json();
          errorDetails = errorData.error || errorDetails;
        } catch (_) {
          // Ignore if response is not JSON
        }
        throw new Error(`Failed to fetch leaderboard: ${errorDetails}`);
      }
      const data = await res.json();
      const sortedTeams = (data.teamScores || []).sort((a: TeamScore, b: TeamScore) => b.totalPoints - a.totalPoints);
      setTeams(sortedTeams);
    } catch (err: any) {
      console.error("Failed to load leaderboard data:", err);
      setError(`Failed to load leaderboard. ${err.message}`);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array for useCallback as it doesn't depend on props or state outside its scope

  // --- useEffect now calls the memoized load function ---
  useEffect(() => {
    load();
  }, [load]) // Add load to the dependency array

  // Enhanced Loading State
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0f08] via-[#2d1810] to-[#1a0f08] text-amber-300 text-2xl font-['Cinzel'] animate-pulse">
      Loading Team Standings... ✨
    </div>
  )

  // Enhanced Error State
   if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0f08] via-[#2d1810] to-[#1a0f08] p-8 text-center">
       <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg shadow-lg max-w-md">
         <h2 className="text-2xl font-bold text-red-300 mb-4 font-['Cinzel']">Error Loading Leaderboard</h2>
         <p className="text-red-200">{error}</p>
         <button
            onClick={load} // Call the load function directly now
            className="mt-6 bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Retry
          </button>
       </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120b05] via-[#1b0f07] to-[#2b1a0e] p-8 md:p-12 font-['Cinzel'] text-amber-100">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 md:mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-3 tracking-wider" style={{ textShadow: '0 2px 15px rgba(255, 215, 0, 0.4)' }}>
            Team Championship Standings
          </h1>
          <p className="text-lg md:text-xl text-amber-200/80 italic mt-2 font-serif">
            "Witness the rise of champions across all trials."
          </p>
           <div className="w-48 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-6 opacity-70"></div>
        </header>

        <LeaderboardCard
          title="🏆 Top Teams"
          items={teams.map((t, index) => ({
            rank: index + 1,
            name: t.name,
            house: t.house,
            score: t.totalPoints
          }))}
        />

         <footer className="text-center mt-12 text-amber-600/70 text-sm italic">
           Scores update periodically. Always strive for greatness!
         </footer>

      </div>
    </div>
  )
}