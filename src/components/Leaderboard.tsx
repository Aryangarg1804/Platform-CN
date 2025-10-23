import React from 'react'

export function LeaderboardCard({ title, items }: { title: string; items: Array<any> }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
      <h3 className="text-2xl text-amber-400 mb-4">{title}</h3>
      <ol className="list-decimal list-inside space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="flex justify-between items-center bg-gray-700 p-2 rounded">
            <div>
              <div className="font-semibold text-amber-100">{it.name || it.house}</div>
              {it.house && <div className="text-sm text-amber-300">{it.house}</div>}
            </div>
            <div className="text-amber-200 font-mono">{it.score ?? it.totalScore ?? it.quaffles}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default LeaderboardCard
