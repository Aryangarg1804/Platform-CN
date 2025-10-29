'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

// ============================================================
// 🔸 LEADERBOARD CARD COMPONENT
// ============================================================

interface LeaderboardItem {
  rank?: number;
  name?: string;
  house?: string;
  score?: number | string;
  totalScore?: number;
  quaffles?: number;
  potionName?: string | null;
}

interface LeaderboardCardProps {
  title: string;
  items: LeaderboardItem[];
}

const getHouseColorClass = (house?: string): string => {
  switch (house?.toLowerCase()) {
    case 'gryffindor': return 'text-red-400 border-red-600';
    case 'hufflepuff': return 'text-yellow-400 border-yellow-600';
    case 'ravenclaw': return 'text-blue-400 border-blue-600';
    case 'slytherin': return 'text-green-400 border-green-600';
    default: return 'text-gray-400 border-gray-600';
  }
};

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ title, items }) => {
  return (
    <div className="bg-[#1a0f08]/80 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(255,215,0,0.15)] border-2 border-amber-800/60 backdrop-blur-sm">
      <h3 className="text-2xl md:text-3xl font-bold text-amber-400 mb-6 text-center tracking-wide"
        style={{ textShadow: '0 1px 10px rgba(255, 215, 0, 0.3)' }}>
        {title}
      </h3>
      <ol className="space-y-3">
        {items.map((item, idx) => (
          <li key={item.name || item.house || idx}
            className="flex items-center justify-between bg-gradient-to-r from-amber-900/20 via-amber-800/10 to-transparent p-3 rounded-lg border border-amber-900/30 transition-all duration-300 hover:bg-amber-800/20 hover:border-amber-700/50">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold text-amber-500 w-8 text-center">{item.rank ?? idx + 1}.</span>
              <div>
                <div className={`font-semibold text-lg ${item.house ? getHouseColorClass(item.house).split(' ')[0] : 'text-amber-100'}`}>
                  {item.name}
                </div>
                {item.potionName && (
                  <div className="text-sm opacity-80 text-amber-300 italic">
                    {item.potionName}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-amber-300 tracking-wider">
              {item.score ?? item.totalScore ?? item.quaffles ?? 0}
            </div>
          </li>
        ))}
      </ol>
      {items.length === 0 && (
        <p className="text-center text-amber-500/70 italic mt-6">No rankings available yet.</p>
      )}
    </div>
  );
};

// ============================================================
// 🔸 ROUND 2 LEADERBOARD PAGE COMPONENT
// ============================================================

interface TeamResult {
  rank: number;
  teamName: string;
  house: string;
  score: number;
  potionName?: string | null;
}

interface HouseScore {
  house: string;
  quaffles: number;
  score?: number;
}

const roundNumber = 2;
const config = {
  title: 'Potion Brewing',
  scoreLabel: 'Total Points',
  icon: '🧪',
  color: '#10b981',
  type: 'team',
  subScoreLabel: 'Time (min)',
};
const roundId = `round-${roundNumber}`;
const ALL_HOUSES = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

export default function Round2LeaderboardPage() {
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [houseQuaffles, setHouseQuaffles] = useState<HouseScore[]>([]);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      if (houseRes.ok) {
        const houseData = await houseRes.json();
        const quaffles = (houseData.houseScores || [])
          .map((h: any) => ({
            house: h.house,
            quaffles: h.quaffles || 0,
            score: h.quaffles || 0,
          }))
          .sort((a: any, b: any) => b.quaffles - a.quaffles);
        setHouseQuaffles(quaffles);
      }

      const res = await fetch(`/api/rounds/${roundId}`);
      if (!res.ok) throw new Error('Failed to fetch round 2 data.');
      const data = await res.json();

      setRoundWinner(data.round?.quaffleWinnerHouse || null);

      if (config.type === 'team' && data.round?.results) {
        const teamMap = new Map<string, { teamName: string; house: string; score: number; potionName: string | null }>();

        data.round.results.forEach((result: any) => {
          result.teams?.forEach((team: any) => {
            if (team && team._id) {
              if (!teamMap.has(team._id.toString())) {
                teamMap.set(team._id.toString(), {
                  teamName: team.name,
                  house: team.house,
                  score: 0,
                  potionName: null,
                });
              }
            }
          });
        });

        const allTeamsRes = await fetch('/api/teams');
        if (!allTeamsRes.ok) throw new Error('Failed to fetch full team data for total points.');
        const allTeamsData = await allTeamsRes.json();

        // 🔹 Fetch potion name for each team and keep original house
        const updatedTeams = await Promise.all(
          allTeamsData.teams.map(async (team: any) => {
            let potionName = null;
            if (team.potionCreatedRound2) {
              const potionRes = await fetch(`/api/potions/${team.potionCreatedRound2}`);
              if (potionRes.ok) {
                const potionData = await potionRes.json();
                potionName = potionData.name || null;
              }
            }
            return { ...team, potionName };
          })
        );

        updatedTeams.forEach((dbTeam: any) => {
          const teamId = dbTeam._id.toString();
          if (teamMap.has(teamId)) {
            const entry = teamMap.get(teamId);
            if (entry) {
              entry.score = dbTeam.totalPoints || 0;
              entry.potionName = dbTeam.potionName || null;
            }
          }
        });

        const sortedTeams: TeamResult[] = Array.from(teamMap.values())
          .sort((a, b) => b.score - a.score)
          .map((team, index) => ({
            ...team,
            rank: index + 1,
          }));

        setTeams(sortedTeams);
      } else setTeams([]);

    } catch (err: any) {
      console.error('Round Leaderboard Error:', err);
      setError(err.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = teams.map(t => ({
    name: t.teamName,
    [config.scoreLabel]: t.score,
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
            onClick={() => router.push('/public')}
            className="mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded text-white font-semibold transition-colors"
          >
            Back to Trials
          </button>
        </div>
      </div>
    );
  }

  const participatingHouses = Array.from(new Set(teams.map(t => t.house)))
    .filter(h => ALL_HOUSES.includes(h));

  const houseLeaderboards = participatingHouses.map(house => {
    const filteredTeams = teams.filter(t => t.house === house);
    filteredTeams.sort((a, b) => b.score - a.score);
    const items = filteredTeams.map((t, index) => ({
      rank: index + 1,
      name: t.teamName,
      house: t.house,
      score: t.score,
      potionName: t.potionName,
    }));
    return { house, items };
  }).sort((a, b) => a.house.localeCompare(b.house));

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

        <h2 className="text-3xl font-bold text-amber-400 mb-6 text-center">
          Team Rankings by House ({config.scoreLabel})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {houseLeaderboards.map(({ house, items }) => (
            <LeaderboardCard key={house} title={`${house} Standings`} items={items} />
          ))}
          {houseLeaderboards.length === 0 && (
            <p className="text-center text-amber-500/70 italic md:col-span-3">
              No team rankings available for this round yet.
            </p>
          )}
        </div>

        <div className="mt-12 bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center">
            Overall Score Distribution ({config.scoreLabel})
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
                    color: '#fcd34d',
                  }}
                />
                <Legend />
                <Bar dataKey={config.scoreLabel} fill={config.color} name={config.scoreLabel} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
