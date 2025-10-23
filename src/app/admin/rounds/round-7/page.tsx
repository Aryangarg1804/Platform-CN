'use client'

import { useEffect, useState } from 'react'

export default function Round7(){
  const [teams,setTeams]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const houses = ['Gryffindor','Hufflepuff','Ravenclaw','Slytherin']

  useEffect(()=>{
    async function load(){
      try{ const res = await fetch('/api/admin/teams'); setTeams(await res.json()) }catch(e){console.error(e)}finally{setLoading(false)}
    }
    load()
  },[])

  async function awardQua(house:string){
    try{
      const res = await fetch('/api/admin/award-quaffle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({house,round:7})})
      if(!res.ok) throw new Error('Failed')
      alert('Awarded quaffle to '+house)
    }catch(e){console.error(e); alert('Failed to award quaffle')}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-yellow-300">Round 7 — Finals</h1>
        <p className="mb-4">The Horcrux Hunt — use the buttons below to award house quaffles.</p>

        <div className="mb-6">
          <div className="flex gap-2">
            {houses.map(h=> <button key={h} onClick={()=>awardQua(h)} className="px-3 py-1 bg-amber-600 rounded">Give {h} Quaffle</button>)}
          </div>
        </div>

        {loading ? <div>Loading teams...</div> : (
          <div className="bg-gray-900 p-4 rounded">
            <table className="w-full">
              <thead><tr><th>Team</th><th>House</th><th>Points</th></tr></thead>
              <tbody>
                {teams.map(t=> <tr key={t._id} className="border-t"><td className="p-2">{t.name}</td><td className="p-2">{t.house}</td><td className="p-2">{t.totalPoints}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
