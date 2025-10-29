'use client'
import React, { useState, useEffect } from 'react';

const rounds = [
  { name: 'Sorting Hat Ceremony', color: 'from-purple-900 to-indigo-800', path: '/admin/rounds/round-1' },
  { name: 'Potion Brewing', color: 'from-green-900 to-emerald-800', path: '/admin/rounds/round-2' },
  { name: 'Escape Loop', color: 'from-blue-900 to-cyan-800', path: '/admin/rounds/round-3' },
  { name: 'Task Around Us', color: 'from-amber-900 to-yellow-800', path: '/admin/rounds/round-4' },
  { name: 'Emergency Discussion', color: 'from-red-900 to-orange-800', path: '/admin/rounds/round-5' },
  { name: 'Flash Videos', color: 'from-pink-900 to-rose-800', path: '/admin/rounds/round-6' },
  { name: 'The Horcrux Hunt', color: 'from-gray-900 to-slate-800', path: '/admin/rounds/round-7' },
];

export default function AdminPanel() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Add font and styles dynamically
    if (typeof document !== 'undefined') {
      const styleId = 'harry-potter-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @import url('https://fonts.cdnfonts.com/css/harry-p');
          
          @keyframes float-steam {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.03; }
            25% { transform: translate(40px, -60px) scale(1.2); opacity: 0.08; }
            50% { transform: translate(-30px, -120px) scale(1.1); opacity: 0.06; }
            75% { transform: translate(50px, -90px) scale(1.15); opacity: 0.07; }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.8); }
          }
          @keyframes glow-pulse {
            0%, 100% { 
              box-shadow: 0 8px 32px rgba(236, 185, 57, 0.15),
                          0 0 0 1px rgba(236, 185, 57, 0.2),
                          inset 0 1px 0 rgba(236, 185, 57, 0.1);
            }
            50% { 
              box-shadow: 0 12px 48px rgba(236, 185, 57, 0.25),
                          0 0 0 2px rgba(236, 185, 57, 0.35),
                          inset 0 1px 0 rgba(236, 185, 57, 0.2);
            }
          }
          @keyframes slide-in {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes train-smoke {
            0% { opacity: 0; transform: translateX(0) scale(0.8); }
            50% { opacity: 0.6; transform: translateX(100px) scale(1.2); }
            100% { opacity: 0; transform: translateX(200px) scale(1.5); }
          }
          @keyframes platform-glow {
            0%, 100% { text-shadow: 0 0 30px rgba(236, 185, 57, 0.5), 0 0 60px rgba(236, 185, 57, 0.3); }
            50% { text-shadow: 0 0 40px rgba(236, 185, 57, 0.7), 0 0 80px rgba(236, 185, 57, 0.5), 0 0 120px rgba(65, 105, 225, 0.3); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const handleCardClick = (path: string) => {
    window.location.href = path;
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#0E1A40',
      padding: '4rem 2rem',
      overflow: 'hidden',
      fontFamily: '"Harry P"',
    }}>
      {/* Brick wall texture overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 35px,
            rgba(65, 105, 225, 0.03) 35px,
            rgba(65, 105, 225, 0.03) 37px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 70px,
            rgba(65, 105, 225, 0.03) 70px,
            rgba(65, 105, 225, 0.03) 72px
          )
        `,
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* Floating steam/mist particles */}
      {isMounted && [...Array(30)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 120 + 60}px`,
            height: `${Math.random() * 120 + 60}px`,
            background: `radial-gradient(circle, rgba(236, 185, 57, ${0.05 + Math.random() * 0.08}) 0%, transparent 70%)`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-steam ${15 + Math.random() * 20}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 10}s`,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Magical sparkles */}
      {isMounted && [...Array(40)].map((_, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            background: i % 3 === 0 ? '#ECB939' : i % 3 === 1 ? '#D3A625' : '#4169E1',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 ${4 + Math.random() * 6}px currentColor`,
            animation: `twinkle ${2 + Math.random() * 3}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.7,
          }}
        />
      ))}

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: '1600px', 
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Platform Sign Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem',
          animation: 'slide-in 0.8s ease-out',
        }}>
          {/* Platform 9¾ Sign */}
          <div style={{
            display: 'inline-block',
            position: 'relative',
            padding: '2rem 4rem',
            background: 'linear-gradient(135deg, rgba(236, 185, 57, 0.1) 0%, rgba(211, 166, 37, 0.1) 100%)',
            border: '3px solid #ECB939',
            borderRadius: '8px',
            marginBottom: '2rem',
            boxShadow: '0 10px 40px rgba(236, 185, 57, 0.2), inset 0 0 30px rgba(236, 185, 57, 0.05)',
          }}>
            {/* Decorative bolts */}
            {[
              { top: '12px', left: '12px' },
              { top: '12px', right: '12px' },
              { bottom: '12px', left: '12px' },
              { bottom: '12px', right: '12px' },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  background: '#5D5D5D',
                  borderRadius: '50%',
                  border: '2px solid #AAAAAA',
                  ...pos,
                }}
              />
            ))}
            
            <div style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
              color: '#D3A625',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontFamily: '"Harry P", serif',
            }}>
              Kings Cross Station
            </div>
            <h1 style={{
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              fontWeight: 400,
              color: '#ECB939',
              margin: 0,
              letterSpacing: '0.05em',
              animation: 'platform-glow 4s infinite',
              lineHeight: 1,
              fontFamily: '"Harry P", serif',
            }}>
              Platform 9¾
            </h1>
          </div>

          <div style={{
            fontSize: '1.3rem',
            color: '#AAAAAA',
            fontStyle: 'italic',
            fontFamily: '"Harry P", serif',
            letterSpacing: '0.05em',
            marginTop: '1rem',
          }}>
            Event Rounds Portal
          </div>
        </div>

        {/* Steam effects */}
        {isMounted && [...Array(5)].map((_, i) => (
          <div
            key={`steam-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: `${10 + i * 20}%`,
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(170, 170, 170, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: `train-smoke ${4 + i}s infinite ease-out`,
              animationDelay: `${i * 1.5}s`,
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          padding: '0 1rem',
        }}>
          {rounds.map((round, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(round.path)}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                background: 'linear-gradient(145deg, rgba(14, 26, 64, 0.6), rgba(20, 35, 75, 0.6))',
                border: hoveredCard === idx ? '2px solid #ECB939' : '2px solid rgba(236, 185, 57, 0.3)',
                borderRadius: '12px',
                padding: '2.5rem 2rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === idx ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                backdropFilter: 'blur(10px)',
                animation: `slide-in ${0.5 + idx * 0.1}s ease-out ${idx * 0.08}s backwards`,
                boxShadow: hoveredCard === idx 
                  ? '0 16px 48px rgba(236, 185, 57, 0.3), 0 0 60px rgba(65, 105, 225, 0.2)'
                  : '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Ticket punch holes effect */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '0',
                right: '0',
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(236, 185, 57, 0.3) 50%, transparent 100%)',
              }} />
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: `${8 + i * 8.3}%`,
                    width: '6px',
                    height: '6px',
                    background: '#0E1A40',
                    border: '1px solid rgba(236, 185, 57, 0.4)',
                    borderRadius: '50%',
                  }}
                />
              ))}

              {/* Round number badge */}
              <div style={{
                position: 'absolute',
                top: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #4169E1, #3557b8)',
                border: '2px solid #ECB939',
                borderRadius: '8px',
                padding: '0.5rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ECB939',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                boxShadow: '0 6px 20px rgba(65, 105, 225, 0.4)',
                fontFamily: '"Harry P", serif',
              }}>
                Round {idx + 1}
              </div>

              {/* Magical line decoration */}
              <div style={{
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(236, 185, 57, 0.5), transparent)',
                marginBottom: '1.5rem',
              }} />

              {/* Round name */}
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 400,
                color: hoveredCard === idx ? '#ECB939' : '#D3A625',
                marginBottom: '1.5rem',
                letterSpacing: '0.08em',
                textShadow: hoveredCard === idx 
                  ? '0 0 20px rgba(236, 185, 57, 0.6)' 
                  : '0 2px 10px rgba(236, 185, 57, 0.3)',
                lineHeight: 1.3,
                minHeight: '4.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Harry P", serif',
                transition: 'all 0.3s ease',
              }}>
                {round.name}
              </h3>

              {/* Track decoration */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1.5rem',
              }}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === 2 ? '24px' : '16px',
                      height: '2px',
                      background: i === 2 ? '#ECB939' : 'rgba(170, 170, 170, 0.5)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>

              {/* Status badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.65rem 1.5rem',
                background: 'rgba(65, 105, 225, 0.15)',
                border: '1px solid rgba(65, 105, 225, 0.4)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#AAAAAA',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: '"Harry P", serif',
                transition: 'all 0.3s ease',
              }}>
                Awaiting Journey
              </div>

              {/* Hover glow effect */}
              {hoveredCard === idx && (
                <div style={{
                  position: 'absolute',
                  inset: '-2px',
                  background: 'linear-gradient(45deg, transparent 30%, rgba(236, 185, 57, 0.1) 50%, transparent 70%)',
                  borderRadius: '12px',
                  pointerEvents: 'none',
                  animation: 'glow-pulse 2s infinite',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer Quote */}
        <div style={{
          textAlign: 'center',
          marginTop: '5rem',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, rgba(236, 185, 57, 0.05) 0%, rgba(65, 105, 225, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(236, 185, 57, 0.2)',
          animation: 'slide-in 1s ease-out 0.8s backwards',
          backdropFilter: 'blur(10px)',
        }}>
          <p style={{
            fontSize: '1.4rem',
            color: '#D3A625',
            fontStyle: 'italic',
            fontFamily: '"Harry P", serif',
            maxWidth: '700px',
            margin: '0 auto 1rem',
            lineHeight: 1.6,
            letterSpacing: '0.03em',
          }}>
            "The train is waiting... Your adventure begins here"
          </p>
          <div style={{
            width: '120px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ECB939, transparent)',
            margin: '1.5rem auto',
          }} />
          <div style={{
            fontSize: '0.9rem',
            color: '#AAAAAA',
            letterSpacing: '0.15em',
            fontWeight: 500,
            fontFamily: '"Harry P", serif',
          }}>
            Hogwarts Express • Platform 9¾
          </div>
        </div>
      </div>
    </div>
  );
}
