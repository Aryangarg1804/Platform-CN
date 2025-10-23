'use client'

import { useState, useEffect } from 'react'

interface Team {
  _id: string
  name: string
  house: string
  isActive: boolean
  isEliminated?: boolean
  totalPoints?: number
}

export default function Round5() {
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [result, setResult] = useState<any>(null)
  const [message, setMessage] = useState({ text: '', type: 'info' })

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch('/api/admin/teams')
        const data = await res.json()
        setTeams(data)
      } catch (err) {
        setMessage({ text: 'Failed to load teams', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  const startRound5 = async () => {
    if (!confirm('Start Round 5? This will eliminate teams and cannot be fully undone.')) return
    try {
      const res = await fetch('/api/admin/start-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-5' })
      })
      const data = await res.json()
      setResult(data)
      setMessage({ text: 'Round-5 started successfully', type: 'success' })
      // refresh teams
      const tRes = await fetch('/api/admin/teams')
      const tData = await tRes.json()
      setTeams(tData)
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to start round-5', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 5: Knockout Start</h1>
          <p className="text-lg text-amber-200 mb-4">When this round starts, teams will be reduced to top 16. Slytherin house will be enabled.</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={startRound5} className="px-4 py-2 rounded bg-amber-900 hover:bg-amber-800">Start Round 5 (Eliminate & Shuffle)</button>
          </div>
        </header>

        {message.text && (
          <div className={`p-4 mb-6 rounded text-center ${message.type === 'error' ? 'bg-red-900' : 'bg-green-900'}`}>
            {message.text}
          </div>
        )}

        {result && (
          <div className="bg-gray-800 p-4 rounded mb-6">
            <p>Eliminated count: {result.eliminated}</p>
            <p>Survivors: {result.survivors}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-amber-200 mb-2">Award a house quaffle:</p>
          <div className="flex gap-2">
            {['Gryffindor','Hufflepuff','Ravenclaw','Slytherin'].map(h=> (
              <button key={h} onClick={async ()=>{
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                try{ await fetch('/api/admin/award-quaffle',{method:'POST', headers:{'Content-Type':'application/json','Authorization': token? `Bearer ${token}` : ''}, body: JSON.stringify({house:h, round:'round-5'})}); alert('Quaffle awarded to '+h)}catch(e){console.error(e); alert('Failed')}
              }} className="px-3 py-1 bg-amber-600 rounded">Give {h}</button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded p-4">
          <h2 className="text-2xl mb-4">Teams</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-900/30">
                  <th className="p-2">Team</th>
                  <th className="p-2">House</th>
                  <th className="p-2">Points</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t._id} className="border-b hover:bg-gray-700/50">
                    <td className="p-2">{t.name}</td>
                    <td className="p-2">{t.house}</td>
                    <td className="p-2">{t.totalPoints || 0}</td>
                    <td className="p-2">{t.isEliminated ? 'Eliminated' : t.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
