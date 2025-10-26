'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { canAccessRound, getUserFromHeader } from '@/lib/roundHeadAuth'

export default function Round1() {
  const [user, setUser] = useState<any>(null)
  const [roundLocked, setRoundLocked] = useState(true)
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw']
  
  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/auth/login'
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 1)) {
        window.location.href = '/auth/login'
        return
      }
      setUser(payload)
    } catch (e) {
      window.location.href = '/auth/login'
    }
  }, [])

  // Initial blank 24 teams
  const initialTeams = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: '',
    house: '',
    score: 0,
  }))

  const [teams, setTeams] = useState(initialTeams)
  const [saving, setSaving] = useState(false)

  // Fetch teams and round status from DB on mount
  useEffect(() => {
    if (!user) return

    async function fetchData() {
      try {
        // Get round lock status
        const statusRes = await fetch('/api/admin/round-status?round=round-1')
        const statusData = await statusRes.json()
        setRoundLocked(statusData.isLocked)

        // Get teams
        const teamsRes = await fetch('/api/teams')
        const teamsData = await teamsRes.json()
        if (teamsData && teamsData.length) {
          // Fill only first 24 rows
          const filledTeams = initialTeams.map((team, idx) => teamsData[idx] || team)
          setTeams(filledTeams)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [user])

  const handleChange = (id: number, field: string, value: string | number) => {
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, [field]: value } : team))
    )
  }

  // House-wise leaderboard
  const houseScores = houses.map(house => ({
    name: house,
    total: teams
      .filter(t => t.house === house && t.name.trim() !== '')
      .reduce((sum, t) => sum + Number(t.score || 0), 0),
  }))

  // Team-wise leaderboard
  const teamScores = teams
    .filter(t => t.name.trim() !== '')
    .map(t => ({
      name: t.name,
      score: Number(t.score || 0),
      house: t.house,
    }))

  // Save all teams to DB
  const saveTeams = async () => {
    if (roundLocked) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      await Promise.all(
        teams
          .filter(t => t.name.trim() !== '' && t.house.trim() !== '')
          .map(team =>
            fetch('/api/teams', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(team),
            })
          )
      )

      // Save round results
      const results = teams
        .filter(t => t.name.trim() !== '' && t.house.trim() !== '')
        .map((team, idx) => ({
          team: team.id,
          points: Number(team.score) || 0,
          rank: idx + 1,
          time: 0,
        }))

      await fetch('/api/rounds/round-1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ results, approved: true }),
      })

      alert('Scores saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving scores.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 1 Dashboard</h1>
        <p className="text-2xl mb-6">Sorting Hat Ceremony</p>
        <div className={`inline-block px-4 py-2 rounded ${
          roundLocked ? 'bg-red-900' : 'bg-green-900'
        }`}>
          {roundLocked ? '🔒 Round Locked' : '🔓 Round Unlocked'}
        </div>
      </header>

      {/* Team Entry Table */}
      <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg w-full max-w-5xl mb-6 overflow-x-auto border-2 border-amber-900/30">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-900/50 text-amber-400">
            <tr>
              <th className="p-2 border border-amber-900/30">#</th>
              <th className="p-2 border border-amber-900/30">Team Name</th>
              <th className="p-2 border border-amber-900/30">House</th>
              <th className="p-2 border border-amber-900/30">Score</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="border-t border-amber-900/30 hover:bg-gray-700/50">
                <td className="p-2 border border-amber-900/30">{team.id}</td>
                <td className="p-2 border border-amber-900/30">
                  <input
                    type="text"
                    className="w-40 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100"
                    placeholder="Enter team name"
                    value={team.name}
                    onChange={e => handleChange(team.id, 'name', e.target.value)}
                    disabled={roundLocked}
                  />
                </td>
                <td className="p-2 border border-amber-900/30">
                  <select
                    className="bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100"
                    value={team.house}
                    onChange={e => handleChange(team.id, 'house', e.target.value)}
                    disabled={roundLocked}
                  >
                    <option value="">Select</option>
                    {houses.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border border-amber-900/30">
                  <input
                    type="number"
                    className="w-20 bg-gray-700 border border-amber-900/50 rounded p-1 text-amber-100 text-right"
                    value={team.score}
                    onChange={e =>
                      handleChange(team.id, 'score', Number(e.target.value))
                    }
                    disabled={roundLocked}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      {!roundLocked && (
        <button
          onClick={saveTeams}
          disabled={saving || roundLocked}
          className="bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold py-2 px-6 rounded-lg mb-8 border-2 border-amber-400/30 hover:from-amber-800 hover:to-amber-950 transition-all shadow-lg"
        >
          {saving ? 'Saving...' : 'Save All Teams'}
        </button>
      )}

      {/* Award Quaffle (for authorized) */}
      {!roundLocked && user && (user.role === 'admin' || user.role === 'round-head') && (
        <div className="mb-8">
          <p className="mb-2 text-amber-200">Award a house quaffle:</p>
          <div className="flex gap-2 items-center">
            {houses.map(h => (
              <button key={h} onClick={async ()=>{
                const token = localStorage.getItem('token')
                try{ await fetch('/api/admin/award-quaffle',{method:'POST', headers:{'Content-Type':'application/json','Authorization': `Bearer ${token}`}, body: JSON.stringify({house:h, round:'round-1'})}); alert('Quaffle awarded to '+h)}catch(e){console.error(e); alert('Failed')}
              }} className="px-3 py-1 bg-amber-700 rounded">Give {h}</button>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboards */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* House-wise Leaderboard */}
        <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-xl font-semibold mb-4 text-center text-amber-400 font-serif">
            🏠 House-wise Leaderboard
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={houseScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
              <XAxis dataKey="name" stroke="#fcd34d" />
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
              <Bar dataKey="total" fill="#b45309" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team-wise Leaderboard */}
        <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg border-2 border-amber-900/30">
          <h2 className="text-xl font-semibold mb-4 text-center text-amber-400 font-serif">
            👥 Team-wise Leaderboard
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#fcd34d"
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
              <Bar dataKey="score" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}









// "use client";

// import { useState, useEffect } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   CartesianGrid,
// } from "recharts";
// import { canAccessRound } from "@/lib/roundHeadAuth";

// export default function Round1() {
//   const [user, setUser] = useState<any>(null);
//   const [roundLocked, setRoundLocked] = useState(true);
//   const houses = ["Gryffindor", "Hufflepuff", "Ravenclaw"];

//   // Auth check on mount
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       window.location.href = "/auth/login";
//       return;
//     }
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       if (!canAccessRound(payload, 1)) {
//         window.location.href = "/auth/login";
//         return;
//       }
//       setUser(payload);
//     } catch (e) {
//       window.location.href = "/auth/login";
//     }
//   }, []);

//   const initialTeams = Array.from({ length: 24 }, (_, i) => ({
//     id: i + 1,
//     name: "",
//     house: "",
//     score: 0,
//   }));

//   const [teams, setTeams] = useState(initialTeams);
//   const [saving, setSaving] = useState(false);

//   // Fetch teams + round status
//   useEffect(() => {
//     if (!user) return;

//     async function fetchData() {
//       try {
//         const statusRes = await fetch("/api/admin/round-status?round=round-1");
//         const statusData = await statusRes.json();
//         setRoundLocked(statusData.isLocked);

//         const teamsRes = await fetch("/api/teams");
//         const teamsData = await teamsRes.json();

//         if (Array.isArray(teamsData)) {
//           const filled = initialTeams.map((t, i) => teamsData[i] || t);
//           setTeams(filled);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     }

//     fetchData();
//     const interval = setInterval(fetchData, 10000);
//     return () => clearInterval(interval);
//   }, [user]);

//   const handleChange = (id: number, field: string, value: string | number) => {
//     setTeams((prev) =>
//       prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
//     );
//   };

//   const houseScores = houses.map((h) => ({
//     name: h,
//     total: teams
//       .filter((t) => t.house === h && t.name.trim() !== "")
//       .reduce((sum, t) => sum + Number(t.score || 0), 0),
//   }));

//   const teamScores = teams
//     .filter((t) => t.name.trim() !== "")
//     .map((t) => ({
//       name: t.name,
//       score: Number(t.score || 0),
//       house: t.house,
//     }));

//   const saveTeams = async () => {
//     if (roundLocked) return;
//     setSaving(true);
//     try {
//       const token = localStorage.getItem("token");
//       await Promise.all(
//         teams
//           .filter((t) => t.name.trim() && t.house.trim())
//           .map((team) =>
//             fetch("/api/teams", {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token}`,
//               },
//               body: JSON.stringify(team),
//             })
//           )
//       );

//       const results = teams
//         .filter((t) => t.name.trim() && t.house.trim())
//         .map((team, i) => ({
//           team: team.id,
//           points: Number(team.score) || 0,
//           rank: i + 1,
//           time: 0,
//         }));

//       await fetch("/api/rounds/round-1", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ results, approved: true }),
//       });

//       alert("Scores saved successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Error saving scores.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#120b05] via-[#1b0f07] to-[#2b1a0e] text-[#ffd700] p-8 font-[Cinzel] relative overflow-hidden">
//       {/* Floating sparkles */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         {[...Array(18)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
//             style={{
//               top: `${Math.random() * 100}%`,
//               left: `${Math.random() * 100}%`,
//               opacity: Math.random() * 0.6 + 0.3,
//               animationDelay: `${Math.random() * 2}s`,
//             }}
//           ></div>
//         ))}
//       </div>

//       {/* Header */}
//       <header className="text-center mb-10 relative z-10">
//         <h1 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.7)]">
//           ⚡ Round 1 – Sorting Hat Ceremony
//         </h1>
//         <p className="text-lg text-yellow-200/80 italic mt-2">
//           “Let the Sorting Hat decide your fate.”
//         </p>
//         <div
//           className={`mt-4 inline-block px-4 py-2 rounded-md border-2 ${
//             roundLocked
//               ? "bg-red-900/60 border-red-700"
//               : "bg-green-900/60 border-green-700"
//           }`}
//         >
//           {roundLocked ? "🔒 Round Locked" : "🔓 Round Unlocked"}
//         </div>
//       </header>

//       {/* Table */}
//       <div className="relative bg-[#1a0f08]/90 border border-yellow-700 rounded-2xl p-6 w-full max-w-6xl shadow-[0_0_25px_rgba(255,215,0,0.2)] mb-10 z-10 overflow-x-auto">
//         <table className="min-w-full text-center text-sm border-collapse text-yellow-100">
//           <thead className="bg-[#000]/30 text-yellow-400 border-b border-yellow-800/40">
//             <tr>
//               <th className="p-2">#</th>
//               <th className="p-2">Team Name</th>
//               <th className="p-2">House</th>
//               <th className="p-2">Score</th>
//             </tr>
//           </thead>
//           <tbody>
//             {teams.map((team) => (
//               <tr
//                 key={team.id}
//                 className="border-t border-yellow-800/40 hover:bg-[#2a1a0b]/50"
//               >
//                 <td className="p-2">{team.id}</td>
//                 <td className="p-2">
//                   <input
//                     type="text"
//                     className="w-40 bg-[#0a0705] border border-yellow-800/60 rounded p-1 text-yellow-100 focus:ring-2 focus:ring-yellow-500 outline-none"
//                     placeholder="Team Name"
//                     value={team.name}
//                     onChange={(e) =>
//                       handleChange(team.id, "name", e.target.value)
//                     }
//                     disabled={roundLocked}
//                   />
//                 </td>
//                 <td className="p-2">
//                   <select
//                     className="bg-[#0a0705] border border-yellow-800/60 rounded p-1 text-yellow-100"
//                     value={team.house}
//                     onChange={(e) =>
//                       handleChange(team.id, "house", e.target.value)
//                     }
//                     disabled={roundLocked}
//                   >
//                     <option value="">Select</option>
//                     {houses.map((h) => (
//                       <option key={h} value={h}>
//                         {h}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="p-2">
//                   <input
//                     type="number"
//                     className="w-20 bg-[#0a0705] border border-yellow-800/60 rounded p-1 text-yellow-100 text-right"
//                     value={team.score}
//                     onChange={(e) =>
//                       handleChange(team.id, "score", Number(e.target.value))
//                     }
//                     disabled={roundLocked}
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Save button */}
//       {!roundLocked && (
//         <button
//           onClick={saveTeams}
//           disabled={saving}
//           className="bg-gradient-to-r from-red-800 to-yellow-600 text-yellow-100 font-semibold py-3 px-8 rounded-md shadow-[0_0_10px_rgba(255,215,0,0.4)] hover:shadow-[0_0_20px_rgba(255,215,0,0.7)] hover:scale-[1.03] transition-all duration-300 mb-10"
//         >
//           {saving ? "Saving..." : "💾 Save All Scores"}
//         </button>
//       )}

//       {/* Leaderboards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl z-10">
//         {/* House Leaderboard */}
//         <div className="bg-[#1a0f08]/90 border border-yellow-700 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
//           <h2 className="text-xl font-semibold mb-4 text-center text-yellow-400">
//             🏠 House Leaderboard
//           </h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={houseScores}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#78350f" />
//               <XAxis dataKey="name" stroke="#fcd34d" />
//               <YAxis stroke="#fcd34d" />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "#1f2937",
//                   border: "1px solid #78350f",
//                   borderRadius: "4px",
//                   color: "#fcd34d",
//                 }}
//               />
//               <Legend />
//               <Bar dataKey="total" fill="#d97706" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Team Leaderboard */}
//         <div className="bg-[#1a0f08]/90 border border-yellow-700 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
//           <h2 className="text-xl font-semibold mb-4 text-center text-yellow-400">
//             👥 Team Leaderboard
//           </h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={teamScores}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#78350f" />
//               <XAxis
//                 dataKey="name"
//                 interval={0}
//                 angle={-45}
//                 textAnchor="end"
//                 height={80}
//                 stroke="#fcd34d"
//               />
//               <YAxis stroke="#fcd34d" />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "#1f2937",
//                   border: "1px solid #78350f",
//                   borderRadius: "4px",
//                   color: "#fcd34d",
//                 }}
//               />
//               <Bar dataKey="score" fill="#b45309" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// }
