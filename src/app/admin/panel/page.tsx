'use client'
import React, { useState, useEffect } from 'react';

const rounds = [
  { name: 'Sorting Hat Ceremony', icon: '🎩', color: 'from-purple-900 to-indigo-800', path: '/admin/rounds/round-1' },
  { name: 'Potion Brewing', icon: '🧪', color: 'from-green-900 to-emerald-800', path: '/admin/rounds/round-2' },
  { name: 'Escape Loop', icon: '🔮', color: 'from-blue-900 to-cyan-800', path: '/admin/rounds/round-3' },
  { name: 'Task Around Us', icon: '📜', color: 'from-amber-900 to-yellow-800', path: '/admin/rounds/round-4' },
  { name: 'Emergency Discussion', icon: '⚡', color: 'from-red-900 to-orange-800', path: '/admin/rounds/round-5' },
  { name: 'Flash Videos', icon: '🎬', color: 'from-pink-900 to-rose-800', path: '/admin/rounds/round-6' },
  { name: 'The Horcrux Hunt', icon: '💀', color: 'from-gray-900 to-slate-800', path: '/admin/rounds/round-7' },
];

export default function AdminPanel() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCardClick = (path: string) => {
    window.location.href = path;
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0f0a 25%, #2d1810 50%, #1a0f0a 75%, #0a0a0a 100%)',
      padding: '4rem 2rem',
      overflow: 'hidden',
      fontFamily: '"Cinzel", "Garamond", serif',
    }}>
      {/* Animated background stars/sparkles */}
      {isMounted && [...Array(50)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffd700' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6b00' : '#fff'
            } 0%, transparent 70%)`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${3 + Math.random() * 4}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Floating magical elements */}
      {isMounted && [...Array(15)].map((_, i) => (
        <div
          key={`float-${i}`}
          style={{
            position: 'absolute',
            fontSize: '2rem',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-magic ${10 + Math.random() * 10}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        >
          {['✨', '🌟', '⚡', '🔮', '🪄'][i % 5]}
        </div>
      ))}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes float-magic {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.1; }
          25% { transform: translate(30px, -40px) rotate(90deg); opacity: 0.2; }
          50% { transform: translate(-20px, -80px) rotate(180deg); opacity: 0.15; }
          75% { transform: translate(40px, -60px) rotate(270deg); opacity: 0.2; }
        }
        @keyframes shimmer {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3); }
          50% { text-shadow: 0 0 30px rgba(255, 215, 0, 0.9), 0 0 60px rgba(255, 215, 0, 0.5), 0 0 80px rgba(139, 69, 19, 0.3); }
        }
        @keyframes glow-card {
          0%, 100% { box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.2), inset 0 0 20px rgba(255, 215, 0, 0.05); }
          50% { box-shadow: 0 15px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(255, 215, 0, 0.1); }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(50px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-corner {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: '1600px', 
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '5rem',
          animation: 'float-in 1s ease-out',
        }}>
          <div style={{
            fontSize: '0.95rem',
            color: '#d4af37',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            fontWeight: 600,
          }}>
            Ministry of Magic
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #ffd700, #ffed4e, #ffd700, #c9a52a)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
            animation: 'shimmer 3s infinite',
            lineHeight: 1.2,
          }}>
            Event Rounds
          </h1>
          <div style={{
            width: '200px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
            margin: '0 auto 1.5rem',
          }} />
          <p style={{
            fontSize: '1.05rem',
            color: '#8b7355',
            fontStyle: 'italic',
            fontFamily: '"Georgia", serif',
            letterSpacing: '0.02em',
          }}>
            "Seven trials await the worthy"
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          padding: '2rem 1rem 0',
          justifyItems: 'center',
          alignItems: 'stretch',
        }}>
          {rounds.map((round, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(round.path)}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                background: `linear-gradient(145deg, rgba(40, 20, 10, 0.9), rgba(20, 10, 5, 0.9))`,
                border: '3px solid #8b4513',
                borderRadius: '20px',
                padding: '3.5rem 2rem 2.5rem',
                textAlign: 'center',
                animation: `float-in ${0.6 + idx * 0.1}s ease-out ${idx * 0.1}s backwards, glow-card 4s infinite ${idx * 0.3}s`,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === idx ? 'translateY(-10px) scale(1.03)' : 'translateY(0) scale(1)',
                backdropFilter: 'blur(10px)',
                overflow: 'visible',
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              {/* Decorative corners */}
              {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner, i) => (
                <div
                  key={corner}
                  style={{
                    position: 'absolute',
                    width: '25px',
                    height: '25px',
                    border: '2px solid #ffd700',
                    animation: `pulse-corner 2s infinite ${i * 0.2}s`,
                    ...(corner === 'topLeft' && { top: '8px', left: '8px', borderRight: 'none', borderBottom: 'none' }),
                    ...(corner === 'topRight' && { top: '8px', right: '8px', borderLeft: 'none', borderBottom: 'none' }),
                    ...(corner === 'bottomLeft' && { bottom: '8px', left: '8px', borderRight: 'none', borderTop: 'none' }),
                    ...(corner === 'bottomRight' && { bottom: '8px', right: '8px', borderLeft: 'none', borderTop: 'none' }),
                  }}
                />
              ))}

              {/* Hover glow effect */}
              {hoveredCard === idx && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Round number badge */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #8b0000, #c41e3a)',
                border: '3px solid #ffd700',
                borderRadius: '999px',
                padding: '0.65rem 2rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#ffd700',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                boxShadow: '0 8px 25px rgba(139, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)',
                whiteSpace: 'nowrap',
                zIndex: 10,
              }}>
                Round {idx + 1}
              </div>

              {/* Icon */}
              <div style={{
                fontSize: '5rem',
                marginBottom: '1.5rem',
                marginTop: '0.5rem',
                filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.5))',
                transition: 'transform 0.3s ease',
                transform: hoveredCard === idx ? 'scale(1.2) rotate(5deg)' : 'scale(1) rotate(0deg)',
                lineHeight: 1,
              }}>
                {round.icon}
              </div>

              {/* Round name */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffd700',
                marginBottom: '1rem',
                letterSpacing: '0.05em',
                textShadow: '0 2px 15px rgba(255, 215, 0, 0.4)',
                lineHeight: 1.3,
                minHeight: '3.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {round.name}
              </h3>

              {/* Decorative line */}
              <div style={{
                width: '60%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #8b4513, transparent)',
                margin: '0 auto 1.5rem',
              }} />

              {/* Status badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1.2rem',
                background: 'rgba(10, 5, 2, 0.5)',
                border: '1px solid #8b4513',
                borderRadius: '999px',
                fontSize: '0.85rem',
                color: '#d4af37',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}>
                ⚡ Awaiting Champions
              </div>

              {/* Magical sparkles on hover */}
              {hoveredCard === idx && isMounted && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`sparkle-${i}`}
                      style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        background: '#ffd700',
                        borderRadius: '50%',
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                        animation: `twinkle ${1 + Math.random()}s infinite`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        boxShadow: '0 0 10px #ffd700',
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer magical quote */}
        <div style={{
          textAlign: 'center',
          marginTop: '5rem',
          padding: '2rem',
          animation: 'float-in 1s ease-out 1s backwards',
        }}>
          <p style={{
            fontSize: '1.15rem',
            color: '#8b7355',
            fontStyle: 'italic',
            fontFamily: '"Georgia", serif',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.8,
            letterSpacing: '0.01em',
          }}>
            "It matters not what someone is born, but what they grow to be."
          </p>
          <div style={{
            marginTop: '1.2rem',
            fontSize: '0.9rem',
            color: '#d4af37',
            letterSpacing: '0.25em',
            fontWeight: 500,
          }}>
            — Albus Dumbledore
          </div>
        </div>
      </div>
    </div>
  );
}