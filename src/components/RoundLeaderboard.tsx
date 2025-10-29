'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

// Configuration for each round's display
const roundConfigs: { [key: number]: { title: string, scoreLabel: string, subScoreLabel?: string, icon: string, color: string, type: 'team' | 'quaffle' } } = {
  1: { title: 'Sorting Hat Ceremony', scoreLabel: 'Initial Score', icon: 'SORTING', color: '#ECB939', type: 'team' },
  2: { title: 'Potion Brewing', scoreLabel: 'Accuracy', subScoreLabel: 'Time (min)', icon: 'POTIONS', color: '#4169E1', type: 'team' },
  3: { title: 'Escape Loop', scoreLabel: 'Points Earned', icon: 'CHARMS', color: '#ECB939', type: 'team' },
  4: { title: 'Triwizard Tournament', scoreLabel: 'Round Winner', icon: 'TOURNAMENT', color: '#D3A625', type: 'quaffle' }, 
  5: { title: 'Emergency Discussion', scoreLabel: 'Points Earned', icon: 'DEFENSE', color: '#4169E1', type: 'team' },
  6: { title: 'Magical Creatures', scoreLabel: 'Points Earned', icon: 'CREATURES', color: '#ECB939', type: 'team' },
  7: { title: 'The Horcrux Hunt (Finals)', scoreLabel: 'Points Earned', icon: 'FINALS', color: '#D3A625', type: 'team' },
}

interface TeamResult {
    rank: number;
    teamName: string;
    house: string;
    score: number;
    subScore?: number; 
}

interface HouseScore {
    house: string;
    quaffles: number;
    score?: number; 
}

interface LeaderboardItem {
  rank: number;
  name: string;
  house: string;
  score: number;
}

interface RoundLeaderboardProps {
    roundNumber: number;
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
          <p className="text-center text-[#AAAAAA] text-lg italic cinzel-font py-8">
            No teams registered yet
          </p>
        ) : (
          items.map((item) => {
            const houseColor = getHouseColor(item.house);
            const isTopThree = item.rank <= 3;
            
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
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2 cinzel-font ${
                    isTopThree ? 'bg-gradient-to-br from-[#ECB939] to-[#D3A625] text-[#0E1A40] border-[#ECB939]' : 'bg-[#0E1A40] text-[#AAAAAA] border-[#5D5D5D]'
                  }`} style={{ boxShadow: isTopThree ? `0 0 20px ${houseColor}` : 'none' }}>
                    {item.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold truncate cinzel-font tracking-wide" style={{ color: houseColor, textShadow: `0 0 10px ${houseColor}40` }}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-[#AAAAAA] italic cinzel-font">{item.house}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className={`text-2xl md:text-3xl font-bold cinzel-font ${
                      isTopThree ? 'text-[#ECB939]' : 'text-[#AAAAAA]'
                    }`} style={{ textShadow: isTopThree ? '0 0 15px #ECB939' : 'none' }}>
                      {item.score}
                    </div>
                    <div className="text-xs text-[#5D5D5D] uppercase tracking-wider cinzel-font">Points</div>
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

export default function RoundLeaderboard({ roundNumber }: RoundLeaderboardProps) {
  const [teams, setTeams] = useState<TeamResult[]>([])
  const [houseQuaffles, setHouseQuaffles] = useState<HouseScore[]>([])
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const config = roundConfigs[roundNumber] || { title: `Round ${roundNumber}`, scoreLabel: 'Score', icon: 'TRIAL', color: '#AAAAAA', type: 'team' }
  const roundId = `round-${roundNumber}`

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const statusRes = await fetch(`/api/admin/round-status?round=${roundId}`);
      const statusData = await statusRes.json();
      
      if (statusData.isLocked) {
          throw new Error('This round has not been made public yet. Please check back later.');
      }
      
      const houseRes = await fetch('/api/leaderboard');
      if (!houseRes.ok) throw new Error('Failed to fetch house leaderboard data.');
      const houseData = await houseRes.json();
      
      const quaffles = (houseData.houseScores || []).map((h: any) => ({
            house: h.house,
            quaffles: h.quaffles || 0,
            score: h.quaffles || 0,
          })).sort((a: any, b: any) => b.quaffles - a.quaffles);
        
      setHouseQuaffles(quaffles);
      
      const res = await fetch(`/api/rounds/${roundId}`);
      
      if (!res.ok) {
          console.warn(`Could not fetch team data for ${roundId}`);
          setTeams([]);
      } else {
          const data = await res.json();

          setRoundWinner(data.round?.quaffleWinnerHouse || null);
          
          if (config.type === 'team' && data.round?.results) {
              // Process team results for scoring rounds
              const sortedResults = data.round.results.sort((a: any, b: any) => b.points - a.points);
              
              const mappedTeams: TeamResult[] = sortedResults.map((r: any, index: number) => ({
                rank: index + 1,
                teamName: r.team?.name || 'Unknown Team',
                house: r.team?.house || 'Unknown House',
                score: r.points || 0,
                subScore: r.time || r.strategy || r.defense || r.knowledge || 0,
              }));
              
              setTeams(mappedTeams);
          } else {
              setTeams([]); 
          }
      }

    } catch (err: any) {
      console.error('Round Leaderboard Error:', err);
      setError(err.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [roundId, config.type]) 

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const chartData = teams.map(t => ({
      name: t.teamName,
      [config.scoreLabel]: t.score,
      ...(config.subScoreLabel && { [config.subScoreLabel]: t.subScore })
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0E1A40] via-[#1a2850] to-[#0E1A40] text-[#ECB939]">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.cdnfonts.com/css/harry-p');
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap');
          .harry-font { font-family: 'Harry P', serif; }
          .cinzel-font { font-family: 'Cinzel', serif; }
          @keyframes shimmer {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          .shimmer-anim { animation: shimmer 2s ease-in-out infinite; }
        `}} />
        <div className="text-center">
          <div className="text-5xl harry-font text-[#ECB939] mb-6 shimmer-anim" style={{ textShadow: '0 0 30px #ECB939' }}>
            {config.icon}
          </div>
          <p className="text-2xl cinzel-font font-semibold tracking-wider shimmer-anim" style={{ textShadow: '0 0 20px #ECB939' }}>
            Loading {config.title} Results
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0E1A40] via-[#1a2850] to-[#0E1A40] p-8">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.cdnfonts.com/css/harry-p');
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap');
          .harry-font { font-family: 'Harry P', serif; }
          .cinzel-font { font-family: 'Cinzel', serif; }
        `}} />
        <div className="bg-[#0E1A40]/80 border-4 border-[#4169E1] p-8 rounded-2xl shadow-2xl max-w-md text-center backdrop-blur-sm" style={{ boxShadow: '0 0 50px rgba(65, 105, 225, 0.3)' }}>
          <h2 className="text-3xl font-bold text-[#ECB939] mb-4 harry-font tracking-wider" style={{ textShadow: '0 0 15px #ECB939' }}>
            Round {roundNumber} Sealed
          </h2>
          <p className="text-[#AAAAAA] mb-6 text-lg cinzel-font">{error}</p>
          <button 
            onClick={() => window.location.href = '/public'}
            className="bg-gradient-to-r from-[#ECB939] to-[#D3A625] hover:from-[#D3A625] hover:to-[#ECB939] text-[#0E1A40] font-bold py-3 px-8 rounded-xl transition-all duration-300 cinzel-font text-lg tracking-wide"
            style={{ boxShadow: '0 0 20px rgba(236, 185, 57, 0.5)' }}
          >
            Return to Trials
          </button>
        </div>
      </div>
    );
  }
  
  const participatingHouses = Array.from(new Set(teams.map(t => t.house)))
  
  const houseLeaderboards = participatingHouses.map(house => {
      const filteredTeams = teams.filter(t => t.house === house);
      filteredTeams.sort((a, b) => b.score - a.score); 
      
      const items = filteredTeams.map((t, index) => ({
          rank: index + 1,
          name: t.teamName,
          house: t.house,
          score: t.score,
      }));
      
      return { house, items };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1A40] via-[#1a2850] to-[#0E1A40] p-6 md:p-12 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.cdnfonts.com/css/harry-p');
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap');
        .harry-font { font-family: 'Harry P', serif; }
        .cinzel-font { font-family: 'Cinzel', serif; }
        
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
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px #ECB939, 0 0 30px #ECB939; }
          50% { text-shadow: 0 0 30px #ECB939, 0 0 50px #ECB939, 0 0 70px #D3A625; }
        }
        
        .glow-text {
          animation: glow 3s ease-in-out infinite;
        }
      `}} />

      <div className="brick-pattern absolute inset-0 opacity-40 pointer-events-none"></div>

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
        <header className="mb-10 md:mb-16 text-center">
  <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wider text-[#ECB939] harry-font glow-text">
    {config.title}
  </h1>
  
  <p className="text-lg md:text-2xl text-[#AAAAAA] italic mt-4 cinzel-font tracking-wide">
    Final Results for Round {roundNumber}
  </p>

  <div className="flex items-center justify-center mt-8 gap-4">
    <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#ECB939] to-[#D3A625]"></div>
    <div className="w-3 h-3 bg-[#ECB939] rotate-45" style={{ boxShadow: '0 0 15px #ECB939' }}></div>
    <div className="w-20 h-0.5 bg-gradient-to-l from-transparent via-[#ECB939] to-[#D3A625]"></div>
  </div>
</header>

        
        <div className="text-center mb-12 p-8 rounded-2xl border-4 border-[#ECB939] bg-gradient-to-br from-[#0E1A40]/90 to-[#1a2850]/90 backdrop-blur-sm relative overflow-hidden" style={{ boxShadow: '0 0 60px rgba(236, 185, 57, 0.4), inset 0 0 40px rgba(236, 185, 57, 0.1)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#ECB939]/5 via-transparent to-[#ECB939]/5"></div>
          {roundWinner ? (
            <>
              <h2 className="text-4xl md:text-5xl font-bold text-[#ECB939] harry-font mb-3 relative z-10 glow-text">
                Quaffle Champion
              </h2>
              <p className="text-3xl md:text-4xl font-bold cinzel-font relative z-10" style={{ color: '#ECB939', textShadow: '0 0 25px #ECB939' }}>
                {roundWinner}
              </p>
              <p className="text-sm mt-4 text-[#AAAAAA] cinzel-font relative z-10 italic">
                Victor of Round {roundNumber} Quaffle Competition
              </p>
            </>
          ) : (
            <h2 className="text-3xl font-bold text-[#AAAAAA] cinzel-font relative z-10">
              Quaffle Champion Awaiting Declaration
            </h2>
          )}
        </div>

        {config.type === 'quaffle' ? (
          <div className="max-w-md mx-auto mb-12">
            <LeaderboardCard
              title="Overall House Quaffles"
              items={houseQuaffles.map((h, idx) => ({
                rank: idx + 1,
                name: h.house,
                house: h.house,
                score: h.quaffles
              }))}
            />
            <p className="text-center text-[#5D5D5D] italic mt-6 text-sm cinzel-font">
              This round contributes only to the Quaffle tally. Team scores are not displayed.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-bold text-[#ECB939] mb-8 text-center harry-font" style={{ textShadow: '0 0 20px #ECB939' }}>
              Team Rankings by House
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {houseLeaderboards.map(({ house, items }) => (
                <LeaderboardCard
                  key={house}
                  title={`${house} Standings`} 
                  items={items}
                />
              ))}
            </div>
            
            <div className="mt-12 bg-gradient-to-br from-[#0E1A40]/90 to-[#1a2850]/90 rounded-2xl p-6 md:p-8 border-4 border-[#4169E1] backdrop-blur-sm" style={{ boxShadow: '0 0 40px rgba(65, 105, 225, 0.3)' }}>
              <h2 className="text-2xl md:text-3xl cinzel-font font-bold text-[#ECB939] mb-6 text-center" style={{ textShadow: '0 0 15px #ECB939' }}>
                Overall Score Distribution
              </h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4169E1" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      stroke="#ECB939" 
                      style={{ fontSize: '12px', fontFamily: 'Cinzel, serif' }}
                    />
                    <YAxis stroke="#ECB939" style={{ fontFamily: 'Cinzel, serif' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0E1A40',
                        border: '2px solid #ECB939',
                        borderRadius: '8px',
                        color: '#ECB939',
                        fontFamily: 'Cinzel, serif'
                      }}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'Cinzel, serif' }} />
                    <Bar dataKey={config.scoreLabel} fill={config.color} name={config.scoreLabel} />
                    {config.subScoreLabel && (
                      <Bar dataKey={config.subScoreLabel} fill="#4169E1" name={config.subScoreLabel} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        <footer className="text-center mt-12 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#5D5D5D]"></div>
            <div className="w-2 h-2 bg-[#5D5D5D] rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-[#5D5D5D]"></div>
          </div>
          <p className="text-[#5D5D5D] text-sm italic cinzel-font tracking-wide">
            May the best house prevail in the trials ahead
          </p>
        </footer>
      </div>
    </div>
  )
}
