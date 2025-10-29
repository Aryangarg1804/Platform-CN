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
import LeaderboardCard from '@/components/Leaderboard'

// Configuration for each round's display (Title and Score Labels)
const roundConfigs: { [key: number]: { title: string, scoreLabel: string, subScoreLabel?: string, icon: string, color: string, type: 'team' | 'quaffle' } } = {
  1: { title: 'Sorting Hat Ceremony', scoreLabel: 'Initial Score', icon: '🎩', color: '#ffd700', type: 'team' },
  2: { title: 'Potion Brewing', scoreLabel: 'Accuracy', subScoreLabel: 'Time (min)', icon: '🧪', color: '#10b981', type: 'team' },
  3: { title: 'Escape Loop', scoreLabel: 'Points Earned', icon: '🔮', color: '#3b82f6', type: 'team' },
  4: { title: 'Triwizard Tournament', scoreLabel: 'Round Winner', icon: '🐉', color: '#f59e0b', type: 'quaffle' }, 
  5: { title: 'Emergency Discussion', scoreLabel: 'Points Earned', icon: '⚡', color: '#ef4444', type: 'team' },
  6: { title: 'Magical Creatures', scoreLabel: 'Points Earned', icon: '🐾', color: '#a855f7', type: 'team' },
  7: { title: 'The Horcrux Hunt (Finals)', scoreLabel: 'Points Earned', icon: '💀', color: '#94a3b8', type: 'team' },
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

interface RoundLeaderboardProps {
    roundNumber: number;
}

// List of all houses for filtering and display
const ALL_HOUSES = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];


export default function RoundLeaderboard({ roundNumber }: RoundLeaderboardProps) {
  const [teams, setTeams] = useState<TeamResult[]>([])
  const [houseQuaffles, setHouseQuaffles] = useState<HouseScore[]>([])
  const [roundWinner, setRoundWinner] = useState<string | null>(null); // <<< STATE FOR SPECIFIC ROUND WINNER
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const config = roundConfigs[roundNumber] || { title: `Round ${roundNumber}`, scoreLabel: 'Score', icon: '❓', color: '#94a3b8', type: 'team' }
  const roundId = `round-${roundNumber}`

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // 1. Check lock status
      const statusRes = await fetch(`/api/admin/round-status?round=${roundId}`);
      const statusData = await statusRes.json();
      
      if (statusData.isLocked) {
          throw new Error('This round has not been made public yet. Please check back later.');
      }
      
      // 2. Fetch ALL House Quaffle Data (for the overall tally box)
      const houseRes = await fetch('/api/leaderboard');
      if (!houseRes.ok) throw new Error('Failed to fetch house leaderboard data.');
      const houseData = await houseRes.json();
      
      const quaffles = (houseData.houseScores || []).map((h: any) => ({
            house: h.house,
            quaffles: h.quaffles || 0,
            score: h.quaffles || 0,
          })).sort((a: any, b: any) => b.quaffles - a.quaffles);
        
      setHouseQuaffles(quaffles);
      
      // 3. Fetch Team Results and SPECIFIC Round Winner
      const res = await fetch(`/api/rounds/${roundId}`);
      
      if (!res.ok) {
          console.warn(`Could not fetch team data for ${roundId}`);
          setTeams([]);
      } else {
          const data = await res.json();

          // >>> NEW: Capture the specific round winner house <<<
          setRoundWinner(data.round?.quaffleWinnerHouse || null);
          
          if (config.type === 'team' && data.round?.results) {
              if (roundNumber === 2) {
                  // Special handling for Round 2's pair-based results
                  const teamScores = new Map<string, { score: number, time: number, house: string, name: string }>();
                  
                  // Process pair results
                  data.round.results.forEach((r: any) => {
                      // Each result has two teams that get the same points
                      r.teams?.forEach((team: any) => {
                          if (!team) return;
                          const currentScore = teamScores.get(team._id) || { score: 0, time: 0, house: team.house, name: team.name };
                          teamScores.set(team._id, {
                              score: currentScore.score + (r.points || 0),
                              time: currentScore.time + (r.time || 0),
                              house: team.house,
                              name: team.name
                          });
                      });
                  });

                  // Convert Map to array and sort by score
                  const sortedTeams = Array.from(teamScores.entries())
                      .map(([id, data]) => ({
                          teamName: data.name,
                          house: data.house,
                          score: data.score,
                          subScore: data.time
                      }))
                      .sort((a, b) => b.score - a.score)
                      .map((team, index) => ({ ...team, rank: index + 1 }));

                  setTeams(sortedTeams);
              } else {
                  // Process team results for other rounds
                  const sortedResults = data.round.results.sort((a: any, b: any) => b.points - a.points);
                  
                  const mappedTeams: TeamResult[] = sortedResults.map((r: any, index: number) => ({
                      rank: index + 1,
                      teamName: r.team?.name || 'Unknown Team',
                      house: r.team?.house || 'Unknown House',
                      score: r.points || 0,
                      subScore: r.time || r.strategy || r.defense || r.knowledge || 0,
                  }));
                  
                  setTeams(mappedTeams);
              }
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
  
  // Chart Data calculation
  const chartData = teams.map(t => ({
      name: t.teamName,
      [config.scoreLabel]: t.score,
      ...(config.subScoreLabel && { [config.subScoreLabel]: t.subScore })
  }));


  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-amber-400 text-2xl font-['Cinzel'] animate-pulse">
            {config.icon} Loading {config.title} Leaderboard...
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400 p-8 text-center font-['Cinzel']">
          <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Round {roundNumber} Not Public</h2>
              <p>{error}</p>
              <button 
                  onClick={() => window.location.href = '/public'}
                  className="mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded text-white font-semibold transition-colors"
              >
                  Back to Trials
              </button>
          </div>
      </div>
    );
  }
  
  // Only include houses that have participating teams in this round
  const participatingHouses = Array.from(new Set(teams.map(t => t.house)))
  
  // Filter teams by house and prepare leaderboard data for each house
  const houseLeaderboards = participatingHouses.map(house => {
      const filteredTeams = teams.filter(t => t.house === house);
      // Sort within the house by score (descending)
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
    <div className="min-h-screen bg-gradient-to-br from-[#120b05] via-[#1b0f07] to-[#2b1a0e] p-8 md:p-12 font-['Cinzel'] text-amber-100">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 md:mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-wider text-amber-400 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
            {config.icon} {config.title} Leaderboard
          </h1>
          <p className="text-lg md:text-xl text-amber-200/80 italic mt-2 font-serif">
            Final results for Round {roundNumber} are displayed below.
          </p>
        </header>
        
        {/* Quaffle Winner Display (Now shows the specific winner for this round) */}
        <div className="text-center mb-12 p-6 rounded-xl border-4 border-yellow-500 bg-yellow-900/20 shadow-2xl">
            {roundWinner ? (
                <>
                    <h2 className="text-3xl font-bold text-yellow-400">
                        🏆 Quaffle Winner: {roundWinner} 🏆
                    </h2>
                    <p className="text-sm mt-2 text-amber-300">
                        (This house won the Quaffle for Round {roundNumber}!)
                    </p>
                </>
            ) : (
                <h2 className="text-3xl font-bold text-yellow-400">
                    Quaffle Winner Awaiting Declaration
                </h2>
            )}
        </div>


        {/* Conditional Leaderboard Display */}
        {config.type === 'quaffle' ? (
             <div className="max-w-md mx-auto mb-12">
                <LeaderboardCard
                    title={`🏅 Overall House Quaffles`}
                    items={houseQuaffles}
                />
                 <p className="text-center text-amber-600/80 italic mt-4 text-sm">
                    This round contributes only to the Quaffle tally. Team scores are not displayed.
                 </p>
             </div>
        ) : (
             <>
                <h2 className="text-3xl font-bold text-amber-400 mb-6 text-center">
                    Team Rankings by House ({config.scoreLabel})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {houseLeaderboards.map(({ house, items }) => (
                         <LeaderboardCard
                            key={house}
                            // Using the house name for the title
                            title={`🦁 ${house} Standings`} 
                            items={items}
                        />
                    ))}
                </div>
                
                 {/* Combined Visualization (Optional: Shows all teams together) */}
                <div className="mt-12 bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
                    <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
                    Overall {config.title} Score Distribution
                    </h2>
                    <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                            <XAxis 
                                dataKey="name" 
                                interval={0} 
                                angle={-45} 
                                textAnchor="end" 
                                height={80} 
                                stroke="#fcd34d" 
                                style={{ fontSize: '12px', fontFamily: 'serif' }}
                            />
                            <YAxis stroke="#fcd34d" />
                            <Tooltip
                                contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #78350f',
                                borderRadius: '4px',
                                color: '#fcd34d'
                                }}
                            />
                            <Legend />
                            {/* Primary Score */}
                            <Bar dataKey={config.scoreLabel} fill={config.color} name={config.scoreLabel} />
                            {/* Secondary Score (if defined) */}
                            {config.subScoreLabel && (
                                <Bar dataKey={config.subScoreLabel} fill="#7c3aed" name={config.subScoreLabel} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  )
}
