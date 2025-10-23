'use client'

import { useState, useEffect } from 'react'

export default function Round3() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roundLocked, setRoundLocked] = useState(true)
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw']

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/teams')
        setTeams(await res.json())
        const statusRes = await fetch('/api/admin/round-status?round=round-3')
        const status = await statusRes.json()
        setRoundLocked(status.isLocked)
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 3: Escape Loop</h1>
          <p className="text-lg">Traditional scoring — add points to teams</p>
        </header>

        {loading ? <div>Loading...</div> : (
          <div className="bg-gray-800 rounded p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-900/30"><th>Team</th><th>House</th><th>Points</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {teams.map(t => (
                    <tr key={t._id} className="border-t hover:bg-gray-700/50"><td className="p-2">{t.name}</td><td className="p-2">{t.house}</td><td className="p-2">{t.totalPoints}</td><td className="p-2">{t.isActive? 'Active': 'Inactive'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-amber-200 mb-2">Award a house quaffle:</p>
          <div className="flex justify-center gap-2">
            {['Gryffindor','Hufflepuff','Ravenclaw'].map(h=> (
              <button key={h} onClick={async ()=>{
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                try{ await fetch('/api/admin/award-quaffle',{method:'POST', headers:{'Content-Type':'application/json','Authorization': token? `Bearer ${token}` : ''}, body: JSON.stringify({house:h, round:'round-3'})}); alert('Quaffle awarded to '+h)}catch(e){console.error(e); alert('Failed')}
              }} className="px-3 py-1 bg-amber-600 rounded">Give {h}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
