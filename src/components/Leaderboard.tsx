// import React from 'react'

// export function LeaderboardCard({ title, items }: { title: string; items: Array<any> }) {
//   return (
//     <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
//       <h3 className="text-2xl text-amber-400 mb-4">{title}</h3>
//       <ol className="list-decimal list-inside space-y-2">
//         {items.map((it, idx) => (
//           <li key={idx} className="flex justify-between items-center bg-gray-700 p-2 rounded">
//             <div>
//               <div className="font-semibold text-amber-100">{it.name || it.house}</div>
//               {it.house && <div className="text-sm text-amber-300">{it.house}</div>}
//             </div>
//             <div className="text-amber-200 font-mono">{it.score ?? it.totalScore ?? it.quaffles}</div>
//           </li>
//         ))}
//       </ol>
//     </div>
//   )
// }

// export default LeaderboardCard




import React from 'react'

// Define the expected shape of items
interface LeaderboardItem {
  rank?: number; // Optional rank
  name?: string;
  house?: string;
  score?: number | string; // Score can be number or string like quaffles
  totalScore?: number; // Alternative score field
  quaffles?: number; // Alternative score field
}

// Define props for the component
interface LeaderboardCardProps {
  title: string;
  items: LeaderboardItem[];
}

// Helper to get house color class
const getHouseColorClass = (house?: string): string => {
  switch (house?.toLowerCase()) {
    case 'gryffindor': return 'text-red-400 border-red-600';
    case 'hufflepuff': return 'text-yellow-400 border-yellow-600';
    case 'ravenclaw': return 'text-blue-400 border-blue-600';
    case 'slytherin': return 'text-green-400 border-green-600';
    default: return 'text-gray-400 border-gray-600';
  }
};

export function LeaderboardCard({ title, items }: LeaderboardCardProps) {
  return (
    // Enhanced card styling
    <div className="bg-[#1a0f08]/80 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(255,215,0,0.15)] border-2 border-amber-800/60 backdrop-blur-sm">
      <h3 className="text-2xl md:text-3xl font-bold text-amber-400 mb-6 text-center tracking-wide" style={{ textShadow: '0 1px 10px rgba(255, 215, 0, 0.3)' }}>
        {title}
      </h3>
      {/* Use ordered list for ranking */}
      <ol className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={item.name || item.house || idx} // Use a more reliable key if available
            className="flex items-center justify-between bg-gradient-to-r from-amber-900/20 via-amber-800/10 to-transparent p-3 rounded-lg border border-amber-900/30 transition-all duration-300 hover:bg-amber-800/20 hover:border-amber-700/50"
          >
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <span className="text-lg font-bold text-amber-500 w-8 text-center">{item.rank ?? idx + 1}.</span>
              {/* Name and House */}
              <div>
                <div className={`font-semibold text-lg ${item.house ? getHouseColorClass(item.house).split(' ')[0] : 'text-amber-100'}`}>
                  {item.name || item.house}
                </div>
                {item.house && item.name && ( // Show house only if name also exists
                  <div className={`text-sm opacity-80 ${getHouseColorClass(item.house).split(' ')[0]}`}>{item.house}</div>
                )}
              </div>
            </div>
            {/* Score */}
            <div className="text-xl font-mono font-bold text-amber-300 tracking-wider">
              {/* Display the correct score field */}
              {item.score ?? item.totalScore ?? item.quaffles ?? 0}
            </div>
          </li>
        ))}
      </ol>
       {/* Message if no items */}
       {items.length === 0 && (
          <p className="text-center text-amber-500/70 italic mt-6">No rankings available yet.</p>
       )}
    </div>
  )
}

export default LeaderboardCard