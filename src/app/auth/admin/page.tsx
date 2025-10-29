'use client'

import React, { useState, useEffect } from 'react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const link = document.createElement('link')
    link.href = 'https://fonts.cdnfonts.com/css/harry-p'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setIsTransitioning(false)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed! The barrier remains sealed.')
      } else {
        if (data.user?.role === 'admin') {
          localStorage.setItem('token', data.token)
          setIsTransitioning(true)
          setTimeout(() => {
            window.location.href = '/admin/panel'
          }, 2000)
        } else {
          setError('Access denied! Only administrators may pass.')
          localStorage.removeItem('token')
        }
      }
    } catch (err) {
      console.error("Login API call failed:", err)
      setError('A magical interference occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #0E1A40 0%, #1a2850 50%, #0E1A40 100%)',
      fontFamily: '"Harry P", serif',
      padding: '2rem',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(236, 185, 57, 0.08) 35px, rgba(236, 185, 57, 0.08) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 70px, rgba(236, 185, 57, 0.08) 70px, rgba(236, 185, 57, 0.08) 75px)
        `,
        opacity: 0.4,
      }} />

      {isMounted && [...Array(25)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: i % 5 === 0 ? '4px' : '2px',
            height: i % 5 === 0 ? '4px' : '2px',
            background: i % 2 === 0 ? '#ECB939' : '#D3A625',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-${i % 3} ${6 + Math.random() * 8}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 4}s`,
            boxShadow: `0 0 ${i % 5 === 0 ? '15px' : '8px'} ${i % 2 === 0 ? '#ECB939' : '#D3A625'}`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      <style>{`
       
        @keyframes float-0 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(15px, -25px) scale(1.3); opacity: 0.8; }
          50% { transform: translate(-10px, -50px) scale(1); opacity: 0.5; }
          75% { transform: translate(25px, -30px) scale(1.2); opacity: 0.7; }
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(-20px, -40px) scale(1.2); opacity: 0.9; }
          66% { transform: translate(15px, -28px) scale(1.1); opacity: 0.6; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(12px, -35px) scale(1.4); opacity: 0.8; }
        }
        @keyframes shimmer {
          0%, 100% { 
            text-shadow: 0 0 15px rgba(236, 185, 57, 0.6), 
                         0 0 30px rgba(211, 166, 37, 0.4),
                         0 2px 4px rgba(0, 0, 0, 0.8); 
          }
          50% { 
            text-shadow: 0 0 25px rgba(236, 185, 57, 0.9), 
                         0 0 45px rgba(211, 166, 37, 0.6),
                         0 0 60px rgba(65, 105, 225, 0.3),
                         0 2px 4px rgba(0, 0, 0, 0.8); 
          }
        }
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8), 
                        0 0 50px rgba(65, 105, 225, 0.2), 
                        inset 0 0 60px rgba(14, 26, 64, 0.4),
                        0 0 100px rgba(236, 185, 57, 0.1); 
          }
          50% { 
            box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9), 
                        0 0 70px rgba(65, 105, 225, 0.35), 
                        inset 0 0 80px rgba(14, 26, 64, 0.5),
                        0 0 120px rgba(236, 185, 57, 0.15); 
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes brickTransition {
          0% { 
            opacity: 1; 
            transform: scale(1); 
            filter: blur(0px);
          }
          50% { 
            opacity: 0.3; 
            transform: scale(1.15) rotateY(45deg); 
            filter: blur(3px);
          }
          100% { 
            opacity: 0; 
            transform: scale(1.4) rotateY(90deg); 
            filter: blur(8px);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {isTransitioning && (
        <>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 0%, #0E1A40 100%)',
            animation: 'brickTransition 2s ease-in-out forwards',
            zIndex: 1000,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '3rem',
            fontFamily: '"Harry P", cursive',
            color: '#ECB939',
            animation: 'pulse 1s ease-in-out infinite',
            zIndex: 1001,
            textShadow: '0 0 30px rgba(236, 185, 57, 0.8)',
          }}>
            Platform 9¾
          </div>
        </>
      )}

      <div style={{
        position: 'relative',
        background: 'linear-gradient(145deg, rgba(14, 26, 64, 0.92), rgba(20, 35, 75, 0.88))',
        border: '3px solid #ECB939',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '460px',
        animation: 'fadeIn 1.2s ease-out 0.2s backwards, glow 5s infinite',
        backdropFilter: 'blur(12px)',
        zIndex: 1,
        boxShadow: '0 0 80px rgba(65, 105, 225, 0.15)',
      }}>
        {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: '35px',
              height: '35px',
              border: '3px solid #ECB939',
              ...(corner === 'topLeft' && { top: '-3px', left: '-3px', borderRight: 'none', borderBottom: 'none' }),
              ...(corner === 'topRight' && { top: '-3px', right: '-3px', borderLeft: 'none', borderBottom: 'none' }),
              ...(corner === 'bottomLeft' && { bottom: '-3px', left: '-3px', borderRight: 'none', borderTop: 'none' }),
              ...(corner === 'bottomRight' && { bottom: '-3px', right: '-3px', borderLeft: 'none', borderTop: 'none' }),
              opacity: 0.8,
            }}
          />
        ))}

        <div style={{
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            fontFamily: '"Harry P", cursive',
            fontSize: '3.2rem',
            fontWeight: 400,
            background: 'linear-gradient(135deg, #ECB939 0%, #D3A625 50%, #ECB939 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s infinite',
            letterSpacing: '0.08em',
            marginBottom: '0.3rem',
          }}>
            Platform 9¾
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: '#AAAAAA',
            fontFamily: '"Harry P", serif',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Admin Portal
          </div>
        </div>

        <p style={{
          fontSize: '0.95rem',
          color: '#D3A625',
          textAlign: 'center',
          marginBottom: '2.5rem',
          fontStyle: 'italic',
          opacity: 0.95,
          fontFamily: '"Harry P", serif',
          letterSpacing: '0.03em',
        }}>
          Between platforms nine and ten, magic begins
        </p>

        <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.8rem',
        }}>
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.6rem',
              color: '#ECB939',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Wizarding Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '1.1rem 1.2rem',
                borderRadius: '10px',
                border: '2px solid #5D5D5D',
                background: 'rgba(14, 26, 64, 0.4)',
                color: '#ECB939',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.4s ease',
                boxShadow: 'inset 0 3px 12px rgba(0, 0, 0, 0.6)',
                boxSizing: 'border-box',
                fontFamily: '"Harry P", serif',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ECB939'
                e.currentTarget.style.background = 'rgba(14, 26, 64, 0.6)'
                e.currentTarget.style.boxShadow = '0 0 25px rgba(236, 185, 57, 0.25), inset 0 3px 12px rgba(0, 0, 0, 0.6)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#5D5D5D'
                e.currentTarget.style.background = 'rgba(14, 26, 64, 0.4)'
                e.currentTarget.style.boxShadow = 'inset 0 3px 12px rgba(0, 0, 0, 0.6)'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.6rem',
              color: '#ECB939',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Secret Passage Code
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '1.1rem 1.2rem',
                borderRadius: '10px',
                border: '2px solid #5D5D5D',
                background: 'rgba(14, 26, 64, 0.4)',
                color: '#ECB939',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.4s ease',
                boxShadow: 'inset 0 3px 12px rgba(0, 0, 0, 0.6)',
                boxSizing: 'border-box',
                fontFamily: '"Harry P", serif',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ECB939'
                e.currentTarget.style.background = 'rgba(14, 26, 64, 0.6)'
                e.currentTarget.style.boxShadow = '0 0 25px rgba(236, 185, 57, 0.25), inset 0 3px 12px rgba(0, 0, 0, 0.6)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#5D5D5D'
                e.currentTarget.style.background = 'rgba(14, 26, 64, 0.4)'
                e.currentTarget.style.boxShadow = 'inset 0 3px 12px rgba(0, 0, 0, 0.6)'
              }}
            />
          </div>

          {error && (
            <div style={{
              color: '#ff6b6b',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '1rem 1.2rem',
              background: 'rgba(139, 0, 0, 0.25)',
              border: '2px solid #8b0000',
              borderRadius: '10px',
              fontStyle: 'italic',
              boxShadow: '0 4px 15px rgba(139, 0, 0, 0.3)',
              fontFamily: '"Harry P", serif',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isTransitioning}
            style={{
              width: '100%',
              padding: '1.2rem 2rem',
              borderRadius: '12px',
              background: loading || isTransitioning 
                ? 'linear-gradient(135deg, #5D5D5D 0%, #4a4a4a 100%)'
                : 'linear-gradient(135deg, #4169E1 0%, #5a7ef5 50%, #4169E1 100%)',
              border: '2px solid #ECB939',
              color: '#ECB939',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: (loading || isTransitioning) ? 'not-allowed' : 'pointer',
              transition: 'all 0.4s ease',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              boxShadow: loading || isTransitioning
                ? '0 8px 20px rgba(0, 0, 0, 0.4)'
                : '0 12px 35px rgba(65, 105, 225, 0.4), 0 0 25px rgba(236, 185, 57, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              opacity: (loading || isTransitioning) ? 0.6 : 1,
              fontFamily: '"Harry P", serif',
            }}
            onMouseEnter={(e) => {
              if (!loading && !isTransitioning) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 16px 45px rgba(65, 105, 225, 0.6), 0 0 40px rgba(236, 185, 57, 0.35)'
                e.currentTarget.style.background = 'linear-gradient(135deg, #5a7ef5 0%, #6a8ff8 50%, #5a7ef5 100%)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(65, 105, 225, 0.4), 0 0 25px rgba(236, 185, 57, 0.2)'
              e.currentTarget.style.background = 'linear-gradient(135deg, #4169E1 0%, #5a7ef5 50%, #4169E1 100%)'
            }}
          >
            {loading ? 'Authenticating...' : isTransitioning ? 'Entering Platform...' : 'Pass Through The Barrier'}
          </button>
        </form>

        <div style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
        }}>
          <p style={{
            fontSize: '0.85rem',
            color: '#AAAAAA',
            fontStyle: 'italic',
            fontFamily: '"Harry P", serif',
            letterSpacing: '0.02em',
          }}>
            "To the well-organized mind, death is but the next great adventure"
          </p>
          <div style={{
            fontSize: '0.75rem',
            color: '#5D5D5D',
            fontFamily: '"Harry P", serif',
            letterSpacing: '0.05em',
          }}>
            King's Cross Station • London
          </div>
        </div>
      </div>
    </div>
  )
}
