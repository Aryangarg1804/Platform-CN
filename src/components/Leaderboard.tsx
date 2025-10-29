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

// Helper to get house color class - Platform 9¾ themed
const getHouseColorClass = (house?: string): string => {
  switch (house?.toLowerCase()) {
    case 'gryffindor': return 'text-[#D3A625] border-[#D3A625]';
    case 'hufflepuff': return 'text-[#ECB939] border-[#ECB939]';
    case 'ravenclaw': return 'text-[#4169E1] border-[#4169E1]';
    case 'slytherin': return 'text-[#AAAAAA] border-[#5D5D5D]';
    default: return 'text-[#AAAAAA] border-[#5D5D5D]';
  }
};

export function LeaderboardCard({ title, items }: LeaderboardCardProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        
        @font-face {
          font-family: 'Harry P';
          src: url('https://cdn.jsdelivr.net/gh/wizardamigos/harry-potter-font@master/HarryP-MVZ6w.ttf') format('truetype');
        }
        
        .harry-font {
          font-family: 'Harry P', 'Cinzel', serif;
        }
        
        .cinzel-font {
          font-family: 'Cinzel', serif;
        }
        
        @keyframes rank-glow {
          0%, 100% { text-shadow: 0 0 5px rgba(236, 185, 57, 0.5); }
          50% { text-shadow: 0 0 10px rgba(236, 185, 57, 0.8), 0 0 20px rgba(236, 185, 57, 0.4); }
        }
        
        .rank-number {
          animation: rank-glow 2s ease-in-out infinite;
        }
      `}} />

      <div 
        className="relative bg-gradient-to-b from-[#0E1A40]/95 to-[#1a2654]/95 border-4 border-[#D3A625] rounded-xl p-6 md:p-8 shadow-2xl backdrop-blur-sm cinzel-font"
        style={{
          boxShadow: '0 0 40px rgba(236, 185, 57, 0.3), inset 0 0 60px rgba(14, 26, 64, 0.5)',
        }}
      >
        {/* Decorative corner pieces */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[#ECB939]"></div>
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[#ECB939]"></div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[#ECB939]"></div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[#ECB939]"></div>

        {/* Title */}
        <h3 
          className="text-2xl md:text-3xl font-bold text-[#ECB939] mb-4 text-center tracking-wide"
          style={{ textShadow: '0 0 10px rgba(236, 185, 57, 0.5), 0 0 20px rgba(236, 185, 57, 0.3)' }}
        >
          {title}
        </h3>
        
        {/* Decorative divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D3A625] to-transparent mx-auto mb-6"></div>

        {/* Leaderboard list */}
        <ol className="space-y-3">
          {items && items.length > 0 && items.map((item, idx) => (
            <li
              key={item.name || item.house || idx}
              className="flex items-center justify-between bg-[#0E1A40]/60 border-2 border-[#5D5D5D] rounded-lg p-4 transition-all duration-300 hover:border-[#4169E1] hover:shadow-[0_0_15px_rgba(65,105,225,0.4)] hover:bg-[#0E1A40]/80"
            >
              <div className="flex items-center space-x-4">
                {/* Rank number */}
                <span className="text-xl font-bold text-[#ECB939] w-10 text-center rank-number">
                  #{item.rank ?? idx + 1}
                </span>
                
                {/* Name and House */}
                <div>
                  <div className={`font-semibold text-lg ${item.house ? getHouseColorClass(item.house).split(' ')[0] : 'text-[#AAAAAA]'}`}>
                    {item.name || item.house}
                  </div>
                  {item.house && item.name && (
                    <div className={`text-sm opacity-80 ${getHouseColorClass(item.house).split(' ')[0]}`}>
                      {item.house}
                    </div>
                  )}
                </div>
              </div>

              {/* Score */}
              <div 
                className="text-xl font-bold text-[#4169E1] tracking-wider px-4 py-1 bg-[#0E1A40]/80 rounded-md border border-[#4169E1]/30"
                style={{ textShadow: '0 0 8px rgba(65, 105, 225, 0.4)' }}
              >
                {item.score ?? item.totalScore ?? item.quaffles ?? 0}
              </div>
            </li>
          ))}
        </ol>

        {/* Message if no items */}
        {(!items || items.length === 0) && (
          <div className="text-center mt-8 p-6 bg-[#0E1A40]/40 border-2 border-[#5D5D5D] rounded-lg">
            <p className="text-[#AAAAAA] italic text-lg">
              The magical rankings shall appear soon...
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default LeaderboardCard