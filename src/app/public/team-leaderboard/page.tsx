"use client"
import React, { useEffect, useState, useCallback } from 'react' // Import useCallback

interface TeamScore {
  _id: string;
  name: string;
  house: string;
  totalPoints: number;
}

interface LeaderboardItem {
  rank: number;
  name: string;
  house: string;
  score: number;
}

// LeaderboardCard Component
function LeaderboardCard({ title, items }: { title: string; items: LeaderboardItem[] }) {
  const getHouseColor = (house: string) => {
    const houseLower = house.toLowerCase();
    if (houseLower.includes('gryffindor')) return '#ECB939';
    if (houseLower.includes('slytherin')) return '#4169E1';
    if (houseLower.includes('ravenclaw')) return '#4169E1';
    if (houseLower.includes('hufflepuff')) return '#ECB939';
    return '#AAAAAA';
  };

  return (
    <div className="bg-gradient-to-br from-[#0E1A40]/90 to-[#1a2850]/90 rounded-2xl border-4 border-[#ECB939] p-6 md:p-8 backdrop-blur-sm" style={{ boxShadow: '0 0 50px rgba(236, 185, 57, 0.3), inset 0 0 30px rgba(236, 185, 57, 0.05)' }}>
      <h2 className="text-3xl md:text-4xl font-bold text-[#ECB939] mb-8 text-center harry-font tracking-wider" style={{ textShadow: '0 0 20px #ECB939' }}>
        {title}
      </h2>
      
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-center text-[#AAAAAA] text-lg italic harry-font py-8">
            No teams registered yet
          </p>
        ) : (
          items.map((item) => {
            const houseColor = getHouseColor(item.house);
            const isTopThree = item.rank <= 3;
            const medalEmoji = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '';
            
            return (
              <div
                key={`${item.rank}-${item.name}`}
                className={`bg-gradient-to-r from-[#0E1A40]/80 to-[#1a2850]/80 rounded-xl p-4 md:p-5 border-2 transition-all duration-300 hover:scale-[1.02] ${
                  isTopThree ? 'border-[#ECB939]' : 'border-[#4169E1]/40'
                }`}
                style={{
                  boxShadow: isTopThree 
                    ? `0 0 25px ${houseColor}40, inset 0 0 15px rgba(236, 185, 57, 0.1)` 
                    : '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2 ${
                    isTopThree ? 'bg-gradient-to-br from-[#ECB939] to-[#D3A625] text-[#0E1A40] border-[#ECB939]' : 'bg-[#0E1A40] text-[#AAAAAA] border-[#5D5D5D]'
                  }`} style={{ boxShadow: isTopThree ? `0 0 20px ${houseColor}` : 'none' }}>
                    {item.rank}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold truncate harry-font tracking-wide" style={{ color: houseColor, textShadow: `0 0 10px ${houseColor}40` }}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-[#AAAAAA] italic">{item.house}</p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-2xl md:text-3xl font-bold harry-font ${
                      isTopThree ? 'text-[#ECB939]' : 'text-[#AAAAAA]'
                    }`} style={{ textShadow: isTopThree ? '0 0 15px #ECB939' : 'none' }}>
                      {item.score}
                    </div>
                    <div className="text-xs text-[#5D5D5D] uppercase tracking-wider">Points</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function TeamLeaderboardPage() {
  const [teams, setTeams] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
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
  }, []);

  useEffect(() => {
    load();
  }, [load])

  // Enhanced Loading State with Platform 9¾ theme
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0E1A40] via-[#1a2850] to-[#0E1A40] text-[#ECB939]">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .float-anim { animation: float 3s ease-in-out infinite; }
        .shimmer-anim { animation: shimmer 2s ease-in-out infinite; }
      `}</style>
      <div className="text-center">
        <div className="relative mb-8">
          <div className="text-7xl harry-font text-[#ECB939] float-anim" style={{ textShadow: '0 0 30px #ECB939, 0 0 50px #ECB939' }}>
            9¾
          </div>
          <div className="absolute -inset-4 border-4 border-[#ECB939] rounded-full opacity-30 shimmer-anim"></div>
        </div>
        <p className="text-2xl harry-font tracking-wider shimmer-anim" style={{ textShadow: '0 0 20px #ECB939' }}>
          Loading Magical Standings
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <div className="w-3 h-3 bg-[#ECB939] rounded-full shimmer-anim" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-[#ECB939] rounded-full shimmer-anim" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-[#ECB939] rounded-full shimmer-anim" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )

  // Enhanced Error State
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0E1A40] via-[#1a2850] to-[#0E1A40] p-8">
      <div className="bg-[#0E1A40]/80 border-4 border-[#4169E1] p-8 rounded-2xl shadow-2xl max-w-md text-center backdrop-blur-sm" style={{ boxShadow: '0 0 50px rgba(65, 105, 225, 0.3)' }}>
        <div className="text-6xl mb-6 text-[#4169E1]" style={{ textShadow: '0 0 20px #4169E1' }}>⚠</div>
        <h2 className="text-3xl font-bold text-[#ECB939] mb-4 harry-font tracking-wider" style={{ textShadow: '0 0 15px #ECB939' }}>
          Connection Failed
        </h2>
        <p className="text-[#AAAAAA] mb-6 text-lg">{error}</p>
        <button
          onClick={load}
          className="bg-gradient-to-r from-[#ECB939] to-[#D3A625] hover:from-[#D3A625] hover:to-[#ECB939] text-[#0E1A40] font-bold py-3 px-8 rounded-xl transition-all duration-300 harry-font text-lg tracking-wide"
          style={{ boxShadow: '0 0 20px rgba(236, 185, 57, 0.5)' }}
        >
          Retry Connection
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1A40] via-[#1a2850] to-[#0E1A40] p-6 md:p-12 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
        .clean-font {
  font-family: 'Cinzel', serif;
}

        @import url('https://fonts.cdnfonts.com/css/harry-p');
        .harry-font { font-family: 'Harry P', sans-serif; }
        
        /* Brick wall pattern */
        .brick-pattern {
          background-image: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              rgba(236, 185, 57, 0.03) 40px,
              rgba(236, 185, 57, 0.03) 42px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 60px,
              rgba(236, 185, 57, 0.03) 60px,
              rgba(236, 185, 57, 0.03) 62px
            );
        }
        
        /* Floating particles */
        @keyframes float-particle {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
        }
        
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #ECB939;
          border-radius: 50%;
          box-shadow: 0 0 10px #ECB939;
          animation: float-particle linear infinite;
        }
        
        /* Glow text animation */
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px #ECB939, 0 0 30px #ECB939, 0 2px 5px rgba(0,0,0,0.5); }
          50% { text-shadow: 0 0 30px #ECB939, 0 0 50px #ECB939, 0 0 70px #D3A625, 0 2px 5px rgba(0,0,0,0.5); }
        }
        
        .glow-text {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Brick wall pattern overlay */}
      <div className="brick-pattern absolute inset-0 opacity-40 pointer-events-none"></div>

      {/* Floating magical particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 6}s`,
            animationDelay: `${i * 1.5}s`
          }}
        />
      ))}

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="mb-12 md:mb-16 text-center">
          {/* Platform 9¾ Logo */}
          <div className="mb-8 inline-block">
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-[#ECB939] bg-gradient-to-br from-[#0E1A40] to-[#1a2850] flex items-center justify-center relative" style={{ boxShadow: '0 0 50px rgba(236, 185, 57, 0.3), inset 0 0 30px rgba(236, 185, 57, 0.1)' }}>
                <span className="text-5xl font-bold text-[#ECB939] harry-font glow-text">9¾</span>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#4169E1] opacity-30 animate-spin" style={{ animationDuration: '20s' }}></div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#ECB939] mb-4 tracking-wider harry-font glow-text">
            Championship Standings
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-[#AAAAAA] italic mt-4 harry-font tracking-wide" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Witness the Rise of Champions
          </p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center mt-8 gap-4">
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#ECB939] to-[#D3A625]"></div>
            <div className="w-3 h-3 bg-[#ECB939] rotate-45" style={{ boxShadow: '0 0 15px #ECB939' }}></div>
            <div className="w-20 h-0.5 bg-gradient-to-l from-transparent via-[#ECB939] to-[#D3A625]"></div>
          </div>

          {/* Platform sign banner */}
          <div className="mt-8 inline-block bg-gradient-to-r from-[#ECB939] to-[#D3A625] px-8 py-3 rounded-full border-2 border-[#ECB939]" style={{ boxShadow: '0 0 30px rgba(236, 185, 57, 0.4)' }}>
            <span className="text-[#0E1A40] font-bold text-sm tracking-widest harry-font">PLATFORM NINE AND THREE QUARTERS</span>
          </div>
        </header>

        {/* Leaderboard Card */}
        <div className="relative">
          {/* Magical glow effect behind card */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#4169E1]/20 via-[#ECB939]/20 to-[#4169E1]/20 rounded-3xl blur-xl"></div>
          
          <div className="relative">
            <LeaderboardCard
              title="Top Teams"
              items={teams.map((t, index) => ({
                rank: index + 1,
                name: t.name,
                house: t.house,
                score: t.totalPoints
              }))}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#5D5D5D]"></div>
            <div className="w-2 h-2 bg-[#5D5D5D] rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-[#5D5D5D]"></div>
          </div>
          <p className="text-[#5D5D5D] text-sm italic harry-font tracking-wide">
            Scores update periodically. Always strive for greatness.
          </p>
          <p className="text-[#5D5D5D] text-xs harry-font tracking-widest">
            KING'S CROSS STATION - LONDON
          </p>
        </footer>
      </div>
    </div>
  )
}