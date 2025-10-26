// 'use client'
// import React, { useState, useEffect } from 'react'

// export default function AdminLoginPage() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [isTransitioning, setIsTransitioning] = useState(false)
//   const [isMounted, setIsMounted] = useState(false)

//   useEffect(() => {
//     setIsMounted(true)
//   }, [])



//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (email === 'khushboo@admin.com' && password === 'khushboo') {
//       setIsTransitioning(true)
//       setTimeout(() => {
//         window.location.href = '/admin/panel'
//       }, 2000)
//     } else {
//       setError('Invalid credentials! The barrier remains sealed.')
//     }
//   }

//   return (
//     <div style={{
//       position: 'relative',
//       minHeight: '100vh',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       overflow: 'hidden',
//       background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1810 50%, #1a0a0a 100%)',
//       fontFamily: '"Cinzel", "Garamond", serif',
//       padding: '2rem',
//     }}>
//       {/* Animated brick wall background */}
//       <div style={{
//         position: 'absolute',
//         inset: 0,
//         backgroundImage: `
//           repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(139, 69, 19, 0.1) 35px, rgba(139, 69, 19, 0.1) 40px),
//           repeating-linear-gradient(90deg, transparent, transparent 70px, rgba(139, 69, 19, 0.1) 70px, rgba(139, 69, 19, 0.1) 75px)
//         `,
//         opacity: 0.3,
//       }} />

//       {/* Floating magical particles */}
//       {isMounted && [...Array(30)].map((_, i) => (
//         <div
//           key={i}
//           style={{
//             position: 'absolute',
//             width: '3px',
//             height: '3px',
//             background: `radial-gradient(circle, ${i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ffaa00' : '#ff6b00'} 0%, transparent 70%)`,
//             borderRadius: '50%',
//             left: `${Math.random() * 100}%`,
//             top: `${Math.random() * 100}%`,
//             animation: `float-${i % 3} ${5 + Math.random() * 10}s infinite ease-in-out`,
//             animationDelay: `${Math.random() * 5}s`,
//             boxShadow: `0 0 10px ${i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ffaa00' : '#ff6b00'}`,
//           }}
//         />
//       ))}

//       <style>{`
//         @keyframes float-0 {
//           0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
//           25% { transform: translate(20px, -30px) scale(1.5); opacity: 1; }
//           50% { transform: translate(-15px, -60px) scale(1); opacity: 0.7; }
//           75% { transform: translate(30px, -40px) scale(1.3); opacity: 0.9; }
//         }
//         @keyframes float-1 {
//           0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
//           33% { transform: translate(-25px, -50px) scale(1.4); opacity: 1; }
//           66% { transform: translate(20px, -35px) scale(1.1); opacity: 0.8; }
//         }
//         @keyframes float-2 {
//           0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
//           50% { transform: translate(15px, -45px) scale(1.6); opacity: 1; }
//         }
//         @keyframes shimmer {
//           0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4); }
//           50% { text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.6), 0 0 80px rgba(139, 69, 19, 0.4); }
//         }
//         @keyframes glow {
//           0%, 100% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(255, 215, 0, 0.05); }
//           50% { box-shadow: 0 20px 80px rgba(0, 0, 0, 0.95), 0 0 60px rgba(139, 69, 19, 0.5), inset 0 0 50px rgba(255, 215, 0, 0.08); }
//         }
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(30px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes brickTransition {
//           0% { opacity: 1; transform: scale(1); }
//           50% { opacity: 0.5; transform: scale(1.2) rotateY(90deg); }
//           100% { opacity: 0; transform: scale(1.5) rotateY(180deg); }
//         }
//       `}</style>

//       {/* Transition effect */}
//       {isTransitioning && (
//         <div style={{
//           position: 'fixed',
//           inset: 0,
//           background: 'radial-gradient(circle at center, transparent 0%, #1a0a0a 100%)',
//           animation: 'brickTransition 2s ease-in-out forwards',
//           zIndex: 1000,
//           pointerEvents: 'none',
//         }} />
//       )}

//       {/* Main login container */}
//       <div style={{
//         position: 'relative',
//         background: 'linear-gradient(145deg, rgba(40, 20, 10, 0.95), rgba(20, 10, 5, 0.95))',
//         border: '3px solid #8b4513',
//         borderRadius: '20px',
//         padding: '3rem 2.5rem',
//         width: '100%',
//         maxWidth: '440px',
//         animation: 'fadeIn 1s ease-out 0.3s backwards, glow 4s infinite',
//         backdropFilter: 'blur(10px)',
//         zIndex: 1,
//       }}>
//         {/* Decorative corners */}
//         {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
//           <div
//             key={corner}
//             style={{
//               position: 'absolute',
//               width: '30px',
//               height: '30px',
//               border: '3px solid #ffd700',
//               ...(corner === 'topLeft' && { top: '-3px', left: '-3px', borderRight: 'none', borderBottom: 'none' }),
//               ...(corner === 'topRight' && { top: '-3px', right: '-3px', borderLeft: 'none', borderBottom: 'none' }),
//               ...(corner === 'bottomLeft' && { bottom: '-3px', left: '-3px', borderRight: 'none', borderTop: 'none' }),
//               ...(corner === 'bottomRight' && { bottom: '-3px', right: '-3px', borderLeft: 'none', borderTop: 'none' }),
//             }}
//           />
//         ))}

//         <h1 style={{
//           fontSize: '2rem',
//           fontWeight: 700,
//           marginBottom: '0.5rem',
//           textAlign: 'center',
//           background: 'linear-gradient(90deg, #ffd700, #ffed4e, #ffd700)',
//           backgroundClip: 'text',
//           WebkitBackgroundClip: 'text',
//           WebkitTextFillColor: 'transparent',
//           textShadow: '0 2px 20px rgba(255, 215, 0, 0.5)',
//           letterSpacing: '0.05em',
//         }}>
//           Admin Passage
//         </h1>
        
//         <p style={{
//           fontSize: '0.95rem',
//           color: '#d4af37',
//           textAlign: 'center',
//           marginBottom: '2rem',
//           fontStyle: 'italic',
//           opacity: 0.9,
//           fontFamily: '"Georgia", serif',
//         }}>
//           Only authorized wizards may pass through
//         </p>

//         <div style={{
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '1.5rem',
//         }}>
//           <div style={{ position: 'relative' }}>
//             <label style={{
//               display: 'block',
//               marginBottom: '0.5rem',
//               color: '#d4af37',
//               fontSize: '0.9rem',
//               fontWeight: 600,
//               letterSpacing: '0.05em',
//             }}>
//               Enchanted Email
//             </label>
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               style={{
//                 width: '100%',
//                 padding: '1rem',
//                 borderRadius: '10px',
//                 border: '2px solid #8b4513',
//                 background: 'rgba(10, 5, 2, 0.6)',
//                 color: '#ffd700',
//                 fontSize: '1rem',
//                 outline: 'none',
//                 transition: 'all 0.3s ease',
//                 boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
//                 boxSizing: 'border-box',
//               }}
//               onFocus={(e) => {
//                 e.currentTarget.style.borderColor = '#ffd700'
//                 e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3), inset 0 2px 10px rgba(0, 0, 0, 0.5)'
//               }}
//               onBlur={(e) => {
//                 e.currentTarget.style.borderColor = '#8b4513'
//                 e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
//               }}
//             />
//           </div>

//           <div style={{ position: 'relative' }}>
//             <label style={{
//               display: 'block',
//               marginBottom: '0.5rem',
//               color: '#d4af37',
//               fontSize: '0.9rem',
//               fontWeight: 600,
//               letterSpacing: '0.05em',
//             }}>
//               Magical Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//               style={{
//                 width: '100%',
//                 padding: '1rem',
//                 borderRadius: '10px',
//                 border: '2px solid #8b4513',
//                 background: 'rgba(10, 5, 2, 0.6)',
//                 color: '#ffd700',
//                 fontSize: '1rem',
//                 outline: 'none',
//                 transition: 'all 0.3s ease',
//                 boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
//                 boxSizing: 'border-box',
//               }}
//               onFocus={(e) => {
//                 e.currentTarget.style.borderColor = '#ffd700'
//                 e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3), inset 0 2px 10px rgba(0, 0, 0, 0.5)'
//               }}
//               onBlur={(e) => {
//                 e.currentTarget.style.borderColor = '#8b4513'
//                 e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
//               }}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') {
//                   handleLogin(e)
//                 }
//               }}
//             />
//           </div>

//           {error && (
//             <div style={{
//               color: '#ff4444',
//               fontSize: '0.9rem',
//               textAlign: 'center',
//               padding: '0.75rem',
//               background: 'rgba(139, 0, 0, 0.2)',
//               border: '1px solid #8b0000',
//               borderRadius: '8px',
//               fontStyle: 'italic',
//             }}>
//               ⚡ {error}
//             </div>
//           )}

//           <button
//             onClick={handleLogin}
//             disabled={isTransitioning}
//             style={{
//               width: '100%',
//               padding: '1rem 2rem',
//               borderRadius: '12px',
//               background: 'linear-gradient(135deg, #8b0000 0%, #c41e3a 50%, #8b0000 100%)',
//               border: '2px solid #ffd700',
//               color: '#ffd700',
//               fontSize: '1.1rem',
//               fontWeight: 700,
//               cursor: isTransitioning ? 'not-allowed' : 'pointer',
//               transition: 'all 0.3s ease',
//               letterSpacing: '0.1em',
//               textTransform: 'uppercase',
//               boxShadow: '0 10px 30px rgba(139, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)',
//               position: 'relative',
//               overflow: 'hidden',
//               opacity: isTransitioning ? 0.6 : 1,
//             }}
//             onMouseEnter={(e) => {
//               if (!isTransitioning) {
//                 e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
//                 e.currentTarget.style.boxShadow = '0 15px 40px rgba(139, 0, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.4)'
//                 e.currentTarget.style.background = 'linear-gradient(135deg, #a00000 0%, #e02040 50%, #a00000 100%)'
//               }
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.transform = 'translateY(0) scale(1)'
//               e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)'
//               e.currentTarget.style.background = 'linear-gradient(135deg, #8b0000 0%, #c41e3a 50%, #8b0000 100%)'
//             }}
//           >
//             {isTransitioning ? '✨ Passing Through the Barrier...' : '🔮 Enter Platform 9¾'}
//           </button>
//         </div>

//         <p style={{
//           marginTop: '2rem',
//           textAlign: 'center',
//           fontSize: '0.85rem',
//           color: '#8b7355',
//           fontStyle: 'italic',
//           fontFamily: '"Georgia", serif',
//         }}>
//           "Muggles can't see it, only true wizards can pass"
//         </p>
//       </div>
//     </div>
//   )
// }




'use client'
import React, { useState, useEffect } from 'react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) // Added loading state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Updated handleLogin function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setIsTransitioning(false) // Ensure transition doesn't start prematurely

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
        // Check if the authenticated user is actually an admin
        if (data.user?.role === 'admin') {
          localStorage.setItem('token', data.token) // Store the token
          setIsTransitioning(true) // Start visual transition
          setTimeout(() => {
            window.location.href = '/admin/panel' // Redirect after transition
          }, 2000) // Keep the delay for the visual effect
        } else {
          setError('Access denied! Only administrators may pass.')
          // Optionally clear the token if stored incorrectly by another login page
          localStorage.removeItem('token');
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
      background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1810 50%, #1a0a0a 100%)',
      fontFamily: '"Cinzel", "Garamond", serif',
      padding: '2rem',
    }}>
      {/* Animated brick wall background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(139, 69, 19, 0.1) 35px, rgba(139, 69, 19, 0.1) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 70px, rgba(139, 69, 19, 0.1) 70px, rgba(139, 69, 19, 0.1) 75px)
        `,
        opacity: 0.3,
      }} />

      {/* Floating magical particles */}
      {isMounted && [...Array(30)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            background: `radial-gradient(circle, ${i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ffaa00' : '#ff6b00'} 0%, transparent 70%)`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-${i % 3} ${5 + Math.random() * 10}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 5}s`,
            boxShadow: `0 0 10px ${i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ffaa00' : '#ff6b00'}`,
          }}
        />
      ))}

      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          25% { transform: translate(20px, -30px) scale(1.5); opacity: 1; }
          50% { transform: translate(-15px, -60px) scale(1); opacity: 0.7; }
          75% { transform: translate(30px, -40px) scale(1.3); opacity: 0.9; }
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(-25px, -50px) scale(1.4); opacity: 1; }
          66% { transform: translate(20px, -35px) scale(1.1); opacity: 0.8; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(15px, -45px) scale(1.6); opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4); }
          50% { text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.6), 0 0 80px rgba(139, 69, 19, 0.4); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(255, 215, 0, 0.05); }
          50% { box-shadow: 0 20px 80px rgba(0, 0, 0, 0.95), 0 0 60px rgba(139, 69, 19, 0.5), inset 0 0 50px rgba(255, 215, 0, 0.08); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes brickTransition {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2) rotateY(90deg); }
          100% { opacity: 0; transform: scale(1.5) rotateY(180deg); }
        }
      `}</style>

      {/* Transition effect */}
      {isTransitioning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, #1a0a0a 100%)',
          animation: 'brickTransition 2s ease-in-out forwards',
          zIndex: 1000,
          pointerEvents: 'none',
        }} />
      )}

      {/* Main login container */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(145deg, rgba(40, 20, 10, 0.95), rgba(20, 10, 5, 0.95))',
        border: '3px solid #8b4513',
        borderRadius: '20px',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '440px',
        animation: 'fadeIn 1s ease-out 0.3s backwards, glow 4s infinite',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
      }}>
        {/* Decorative corners */}
        {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              border: '3px solid #ffd700',
              ...(corner === 'topLeft' && { top: '-3px', left: '-3px', borderRight: 'none', borderBottom: 'none' }),
              ...(corner === 'topRight' && { top: '-3px', right: '-3px', borderLeft: 'none', borderBottom: 'none' }),
              ...(corner === 'bottomLeft' && { bottom: '-3px', left: '-3px', borderRight: 'none', borderTop: 'none' }),
              ...(corner === 'bottomRight' && { bottom: '-3px', right: '-3px', borderLeft: 'none', borderTop: 'none' }),
            }}
          />
        ))}

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #ffd700, #ffed4e, #ffd700)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 20px rgba(255, 215, 0, 0.5)',
          letterSpacing: '0.05em',
        }}>
          Admin Passage
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#d4af37',
          textAlign: 'center',
          marginBottom: '2rem',
          fontStyle: 'italic',
          opacity: 0.9,
          fontFamily: '"Georgia", serif',
        }}>
          Only authorized wizards may pass through
        </p>

        {/* Use form element for better accessibility and native submit handling */}
        <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#d4af37',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              Enchanted Email
            </label>
            <input
              type="email"
              required // Added required attribute
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid #8b4513',
                background: 'rgba(10, 5, 2, 0.6)',
                color: '#ffd700',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ffd700'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3), inset 0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#8b4513'
                e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#d4af37',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              Magical Password
            </label>
            <input
              type="password"
              required // Added required attribute
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid #8b4513',
                background: 'rgba(10, 5, 2, 0.6)',
                color: '#ffd700',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ffd700'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3), inset 0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#8b4513'
                e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>

          {error && (
            <div style={{
              color: '#ff4444',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '0.75rem',
              background: 'rgba(139, 0, 0, 0.2)',
              border: '1px solid #8b0000',
              borderRadius: '8px',
              fontStyle: 'italic',
            }}>
              ⚡ {error}
            </div>
          )}

          <button
            type="submit" // Changed from onClick to type="submit"
            disabled={loading || isTransitioning} // Disable during loading OR transition
            style={{
              width: '100%',
              padding: '1rem 2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b0000 0%, #c41e3a 50%, #8b0000 100%)',
              border: '2px solid #ffd700',
              color: '#ffd700',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: (loading || isTransitioning) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '0 10px 30px rgba(139, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              opacity: (loading || isTransitioning) ? 0.6 : 1, // Dim if loading OR transitioning
            }}
            onMouseEnter={(e) => {
              // Added check for loading state as well
              if (!loading && !isTransitioning) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(139, 0, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.4)'
                e.currentTarget.style.background = 'linear-gradient(135deg, #a00000 0%, #e02040 50%, #a00000 100%)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)'
              e.currentTarget.style.background = 'linear-gradient(135deg, #8b0000 0%, #c41e3a 50%, #8b0000 100%)'
            }}
          >
            {/* Conditional button text */}
            {loading ? 'Verifying...' : isTransitioning ? '✨ Passing Through...' : '🔮 Enter Platform 9¾'}
          </button>
        </form> {/* Closed form element */}

        <p style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#8b7355',
          fontStyle: 'italic',
          fontFamily: '"Georgia", serif',
        }}>
          "Muggles can't see it, only true wizards can pass"
        </p>
      </div>
    </div>
  )
}