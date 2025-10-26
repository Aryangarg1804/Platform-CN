
'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export default function Round1Page() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw']

  const initialTeams = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: '',
    house: '',
    score: 0,
  }))

  const [teams, setTeams] = useState(initialTeams)
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [savedTeams, setSavedTeams] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch initial data and poll round lock status
  useEffect(() => {
    async function fetchData() {
      try {
        const statusRes = await fetch('/api/admin/round-status')
        const statusData = await statusRes.json()
        setRoundLocked(statusData.isLocked)

        const teamsRes = await fetch('/api/admin/teams')
        const teamsData = await teamsRes.json()
        if (teamsData && teamsData.length) {
          // --- FIX IS HERE ---
          // We must merge the API data INTO our initialTeams array
          // to ensure the stable `id` (1-24) is always present for
          // React keys and the handleChange function.
          const filledTeams = initialTeams.map((team, idx) => {
            if (teamsData[idx]) {
              // Start with the initial team structure (which has the stable id)
              // and spread the data from the API over it.
              // Finally, explicitly re-set the id to be safe.
              return {
                ...team, // Has { id: 1, name: '', ... }
                ...teamsData[idx], // Has { _id: 'abc', name: 'Team 1', ... }
                id: team.id, // Ensures final object has { id: 1, _id: 'abc', ... }
              };
            }
            // No API data for this index, use the default initial team
            return team;
          });
          setTeams(filledTeams)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/round-status')
        const data = await res.json()
        setRoundLocked(data.isLocked)
      } catch (err) {
        console.error(err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, []) // Empty dependency array is correct, runs once on mount

  const handleChange = (
    id: number,
    field: keyof typeof teams[0],
    value: string | number
  ) => {
    if (roundLocked) return
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, [field]: value } : team))
    )
  }

  const toggleLock = async () => {
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !roundLocked }),
      })
      const data = await res.json()
      setRoundLocked(data.isLocked)
    } catch (err) {
      console.error('Error toggling lock:', err)
    }
  }

  const saveTeams = async () => {
    if (roundLocked) {
      console.log('Round-1 is locked. Cannot save teams.')
      return
    }
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teams), // send array of teams
      })
      const data = await res.json()
      if (res.ok && data.teams) {
        // set saved teams with DB ids returned by server
        setSavedTeams(data.teams)
        console.log('Teams saved', data.teams.length)
      } else {
        console.log('Failed to save teams', data.error)
      }
    } catch (err) {
      console.error(err)
      console.log('Error saving teams')
    }
  }

  // Submit round results to round API (round-1)
  const submitRoundResults = async () => {
    try {
      // Prefer using savedTeams (with DB _id) if available
      const source = savedTeams.length ? savedTeams : teams
      const results = source
        .filter((t: any) => t.name && t.name.trim() !== '')
        .map((t: any, idx: number) => ({
          team: t._id || t.id,
          points: Number(t.score || 0),
          time: 0,
          rank: idx + 1,
        }))

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/rounds/round-1', {
        method: 'POST',
        headers,
        body: JSON.stringify({ results, approved: true }),
      })
      const data = await res.json()
      if (data.success) {
        console.log('Round results saved')
      } else {
        console.error('Failed to save round results', data)
      }
    } catch (err) {
      console.error('submitRoundResults error', err)
    }
  }

  const addTeam = (name: string, house: string) => {
    const newId = teams.length ? Math.max(...teams.map(t => t.id)) + 1 : 1
    setTeams(prev => [...prev, { id: newId, name, house, score: 0 }])
  }
  const [showConfirm, setShowConfirm] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  // House-wise leaderboard
  const houseScores = houses.map(house => ({
    name: house,
    total: teams
      .filter(t => t.house === house && t.name.trim() !== '')
      .reduce((sum, t) => sum + Number(t.score || 0), 0),
  }))

  // Team-wise leaderboard
  const teamScores = teams
    .filter(t => t.name.trim() !== '')
    .map(t => ({
      name: t.name,
      score: Number(t.score || 0),
      house: t.house,
    }))


  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0808 25%, #2d1010 50%, #1a0808 75%, #0a0a0a 100%)',
        color: '#ffd700',
        fontFamily: '"Cinzel Decorative", "Palatino Linotype", serif',
        fontSize: '2.5rem',
        fontWeight: 700,
        textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(139, 0, 0, 0.6)',
      }}>
        ⚡ Loading Platform 9¾...
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0808 25%, #2d1010 50%, #1a0808 75%, #0a0a0a 100%)',
      padding: '3rem 2rem',
      overflow: 'hidden',
      fontFamily: '"Cinzel", "Palatino Linotype", serif',
    }}>
      {/* Animated magical particles */}
      {isMounted && [...Array(50)].map((_, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff6b00' : '#fff',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.7,
            boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
          }}
        />
      ))}

      {/* Brick wall texture overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `repeating-linear-gradient(
          90deg,
          rgba(139, 69, 19, 0.1) 0px,
          rgba(139, 69, 19, 0.1) 1px,
          transparent 1px,
          transparent 120px
        ),
        repeating-linear-gradient(
          0deg,
          rgba(139, 69, 19, 0.1) 0px,
          rgba(139, 69, 19, 0.1) 1px,
          transparent 1px,
          transparent 60px
        )`,
        pointerEvents: 'none',
        opacity: 0.3,
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.3;
          }
          25% { 
            transform: translate(10px, -20px) rotate(90deg);
            opacity: 0.8;
          }
          50% { 
            transform: translate(-10px, -40px) rotate(180deg);
            opacity: 0.5;
          }
          75% { 
            transform: translate(15px, -20px) rotate(270deg);
            opacity: 0.9;
          }
        }
        @keyframes shimmer {
          0%, 100% { 
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 
                         0 0 40px rgba(255, 215, 0, 0.4),
                         0 0 60px rgba(139, 0, 0, 0.3);
          }
          50% { 
            text-shadow: 0 0 30px rgba(255, 215, 0, 1), 
                         0 0 60px rgba(255, 215, 0, 0.6),
                         0 0 90px rgba(139, 0, 0, 0.5),
                         0 0 120px rgba(139, 0, 0, 0.3);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.7), 
                        0 0 40px rgba(255, 215, 0, 0.3),
                        inset 0 0 30px rgba(139, 69, 19, 0.2);
          }
          50% { 
            box-shadow: 0 15px 70px rgba(0, 0, 0, 0.9), 
                        0 0 60px rgba(255, 215, 0, 0.5),
                        inset 0 0 40px rgba(139, 69, 19, 0.3);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        /* Style for the table row hover */
        tbody tr:hover {
          background-color: rgba(80, 40, 20, 0.6) !important;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header with Platform 9¾ theme */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          animation: 'fadeIn 1.2s ease-out',
        }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #8b0000, #c41e3a)',
            border: '4px solid #ffd700',
            borderRadius: '999px',
            padding: '0.7rem 2.5rem',
            fontSize: '1rem',
            fontWeight: 800,
            color: '#ffd700',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            boxShadow: '0 10px 30px rgba(139, 0, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.5)',
            marginBottom: '1.5rem',
            fontFamily: '"Cinzel Decorative", serif',
          }}>
            ⚡ Round 1 ⚡
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 6vw, 5rem)',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #ffd700, #ffed4e, #ffd700, #c9a52a)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            letterSpacing: '0.05em',
            animation: 'shimmer 4s infinite',
            lineHeight: 1.1,
            fontFamily: '"Cinzel Decorative", serif',
          }}>
            🎩 The Sorting Hat Ceremony
          </h1>

          <div style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            color: '#d4af37',
            fontStyle: 'italic',
            marginTop: '1rem',
            textShadow: '0 2px 10px rgba(212, 175, 55, 0.5)',
            fontFamily: '"Palatino Linotype", serif',
          }}>
            Platform 9¾ • Hogwarts Express
          </div>

          <div style={{
            width: '250px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #ffd700, #c41e3a, #ffd700, transparent)',
            margin: '2rem auto',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
          }} />
        </div>

        {/* Admin Lock/Unlock Button */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <button
            onClick={toggleLock}
            style={{
              padding: '1.2rem 3.5rem',
              background: roundLocked
                ? 'linear-gradient(135deg, #8b0000, #c41e3a)'
                : 'linear-gradient(135deg, #1a5d1a, #2d8b2d)',
              border: '4px solid #ffd700',
              borderRadius: '15px',
              color: '#ffd700',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: roundLocked
                ? '0 10px 35px rgba(139, 0, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.4)'
                : '0 10px 35px rgba(26, 93, 26, 0.7), 0 0 30px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.4s ease',
              fontFamily: '"Cinzel", serif',
              animation: 'pulse 3s infinite',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.08)'
              e.currentTarget.style.boxShadow = roundLocked
                ? '0 15px 50px rgba(139, 0, 0, 0.9), 0 0 50px rgba(255, 215, 0, 0.6)'
                : '0 15px 50px rgba(26, 93, 26, 0.9), 0 0 50px rgba(255, 215, 0, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = roundLocked
                ? '0 10px 35px rgba(139, 0, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.4)'
                : '0 10px 35px rgba(26, 93, 26, 0.7), 0 0 30px rgba(255, 215, 0, 0.4)'
            }}
          >
            {roundLocked ? '🔒 Round Locked - Click to Unlock' : '🔓 Round Unlocked - Click to Lock'}
          </button>
        </div>

        {/* Lock Warning Message */}
        {roundLocked && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(139, 0, 0, 0.95), rgba(80, 0, 0, 0.95))',
            border: '4px solid #8b0000',
            borderRadius: '25px',
            padding: '2.5rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
            boxShadow: '0 15px 50px rgba(139, 0, 0, 0.7), 0 0 40px rgba(139, 0, 0, 0.4)',
            animation: 'glow 4s infinite',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#ff4444',
              marginBottom: '1.2rem',
              textShadow: '0 0 15px rgba(255, 68, 68, 0.7)',
              letterSpacing: '0.05em',
              fontFamily: '"Cinzel", serif',
            }}>
              The Sorting Ceremony Awaits
            </p>
            <p style={{
              fontSize: '1.1rem',
              color: '#ffaa00',
              fontStyle: 'italic',
              fontFamily: '"Palatino Linotype", serif',
            }}>
              The Great Hall doors are sealed. Teams and scores remain hidden until the enchantment is lifted...
            </p>
          </div>
        )}

        {/* Main Content - Show only when unlocked */}
        {!roundLocked && (
          <>
            {/* Teams Registry Table */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(60, 30, 15, 0.98), rgba(30, 15, 8, 0.98))',
              border: '4px solid #8b4513',
              borderRadius: '25px',
              padding: '2.5rem',
              marginBottom: '2.5rem',
              boxShadow: '0 15px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 50px rgba(139, 69, 19, 0.2)',
              animation: 'fadeIn 1.2s ease-out 0.3s backwards',
              backdropFilter: 'blur(15px)',
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffd700',
                marginBottom: '2rem',
                textAlign: 'center',
                textShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
                letterSpacing: '0.1em',
                fontFamily: '"Cinzel", serif',
              }}>
                📜 Hogwarts Registry of Teams
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0',
                  fontSize: '1rem',
                }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #8b0000, #c41e3a)',
                      color: '#ffd700',
                    }}>
                      <th style={{
                        padding: '1.2rem',
                        border: '2px solid #8b4513',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '1.1rem',
                      }}>#</th>
                      <th style={{
                        padding: '1.2rem',
                        border: '2px solid #8b4513',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '1.1rem',
                      }}>Team Name</th>
                      <th style={{
                        padding: '1.2rem',
                        border: '2px solid #8b4513',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '1.1rem',
                      }}>House</th>
                      <th style={{
                        padding: '1.2rem',
                        border: '2px solid #8b4513',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '1.1rem',
                      }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={team.id} style={{ // key={team.id} is now stable
                        background: 'rgba(20, 10, 5, 0.4)',
                        transition: 'all 0.3s ease',
                      }}>
                        <td style={{
                          padding: '1rem',
                          border: '2px solid #8b4513',
                          textAlign: 'center',
                          color: '#d4af37',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          fontFamily: '"Cinzel", serif',
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '1rem', border: '2px solid #8b4513', textAlign: 'center' }}>
                          <input
                            type="text"
                            placeholder="Enter team name"
                            value={team.name}
                            onChange={e => handleChange(team.id, 'name', e.target.value)}
                            style={{
                              width: '100%',
                              maxWidth: '300px',
                              padding: '0.7rem',
                              background: 'rgba(20, 10, 5, 0.8)',
                              border: '3px solid #8b4513',
                              borderRadius: '10px',
                              color: '#ffd700',
                              fontSize: '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease',
                              fontFamily: '"Palatino Linotype", serif',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#ffd700'
                              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#8b4513'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '1rem', border: '2px solid #8b4513', textAlign: 'center' }}>
                          <select
                            value={team.house}
                            onChange={e => handleChange(team.id, 'house', e.target.value)}
                            style={{
                              padding: '0.7rem 1rem',
                              background: 'rgba(20, 10, 5, 0.8)',
                              border: '3px solid #8b4513',
                              borderRadius: '10px',
                              color: '#ffd700',
                              fontSize: '1rem',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: '"Palatino Linotype", serif',
                              fontWeight: 600,
                            }}
                          >
                            <option value="">Select House</option>
                            {houses.map(h => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '1rem', border: '2px solid #8b4513', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={team.score}
                            onChange={e => handleChange(team.id, 'score', Number(e.target.value))}
                            style={{
                              width: '100px',
                              padding: '0.7rem',
                              background: 'rgba(20, 10, 5, 0.8)',
                              border: '3px solid #8b4513',
                              borderRadius: '10px',
                              color: '#ffd700',
                              fontSize: '1rem',
                              textAlign: 'center',
                              outline: 'none',
                              fontFamily: '"Cinzel", serif',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={async () => {
                      try {
                        setSubmissionStatus('submitting')
                        const res = await fetch('/api/admin/teams', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ teams }),
                        })
                        if (!res.ok) throw new Error('Failed to update teams')
                        setSubmissionStatus('success')
                        setTimeout(() => setSubmissionStatus('idle'), 2000)
                      } catch (err) {
                        console.error(err)
                        setSubmissionStatus('error')
                        setTimeout(() => setSubmissionStatus('idle'), 2000)
                      }
                    }}
                    disabled={submissionStatus === 'submitting'}
                    style={{
                      padding: '1rem 2.5rem',
                      background: 'linear-gradient(135deg, #8b0000, #c41e3a)',
                      border: '3px solid #ffd700',
                      borderRadius: '12px',
                      color: '#ffd700',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      letterSpacing: '0.1em',
                      cursor: submissionStatus === 'submitting' ? 'not-allowed' : 'pointer',
                      opacity: submissionStatus === 'submitting' ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      fontFamily: '"Cinzel", serif',
                    }}
                  >
                    {submissionStatus === 'submitting'
                      ? '🕓 Updating...'
                      : submissionStatus === 'success'
                        ? '✅ Updated!'
                        : submissionStatus === 'error'
                          ? '❌ Error! Try Again'
                          : '💾 Update Table'}
                  </button>
                </div>

              </div>
            </div>
            
            {/* Leaderboards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(550px, 1fr))',
              gap: '2.5rem',
              marginTop: '3rem',
            }}>
              {/* House Championship */}
              <div style={{
                background: 'linear-gradient(145deg, rgba(60, 30, 15, 0.98), rgba(30, 15, 8, 0.98))',
                border: '4px solid #8b4513',
                borderRadius: '25px',
                padding: '2.5rem',
                boxShadow: '0 15px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.3)',
                animation: 'fadeIn 1.2s ease-out 0.5s backwards',
              }}>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: '#ffd700',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  textShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
                  letterSpacing: '0.1em',
                  fontFamily: '"Cinzel", serif',
                }}>
                  🏆 House Championship
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={houseScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8b4513" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      stroke="#d4af37"
                      style={{
                        fontSize: '0.95rem',
                        fontFamily: '"Palatino Linotype", serif',
                        fontWeight: 600,
                      }}
                    />
                    <YAxis
                      stroke="#d4af37"
                      style={{
                        fontSize: '0.9rem',
                        fontFamily: '"Cinzel", serif',
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 15, 8, 0.98)',
                        border: '3px solid #8b4513',
                        borderRadius: '12px',
                        color: '#ffd700',
                        fontFamily: '"Palatino Linotype", serif',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        color: '#ffd700',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '0.95rem',
                      }}
                    />
                    <Bar dataKey="total" fill="#ffd700" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Award Quaffle control (admin only) */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <label style={{ color: '#ffd700', marginRight: '0.6rem' }}>Award Quaffle to:</label>
                <select id="adminAwardHouse" style={{ padding: '0.6rem', borderRadius: '6px', marginRight: '0.6rem', color: 'black' }}>
                  {houses.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <button onClick={async () => {
                  const sel = document.getElementById('adminAwardHouse') as HTMLSelectElement
                  const house = sel?.value
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                  await fetch('/api/admin/award-quaffle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                    body: JSON.stringify({ house, round: 'round-1' })
                  })
                  // Replaced alert with a less intrusive confirmation
                  console.log('Quaffle awarded to ' + house)
                  const awardButton = document.querySelector('#adminAwardHouse + button') as HTMLButtonElement
                  if (awardButton) {
                    const originalText = awardButton.innerText
                    awardButton.innerText = 'Awarded! ✓'
                    awardButton.disabled = true
                    setTimeout(() => {
                      awardButton.innerText = originalText
                      awardButton.disabled = false
                    }, 2000)
                  }
                }} style={{ padding: '0.8rem 1.2rem', borderRadius: '8px', background: '#ffd700' }}>Award</button>
              </div>

              {/* Team Rankings */}
              <div style={{
                background: 'linear-gradient(145deg, rgba(60, 30, 15, 0.98), rgba(30, 15, 8, 0.98))',
                border: '4px solid #8b4513',
                borderRadius: '25px',
                padding: '2.5rem',
                boxShadow: '0 15px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.3)',
                animation: 'fadeIn 1.2s ease-out 0.7s backwards',
              }}>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: '#ffd700',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  textShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
                  letterSpacing: '0.1em',
                  fontFamily: '"Cinzel", serif',
                }}>
                  ⚡ Team Rankings
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={teamScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8b4513" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      stroke="#d4af37"
                      style={{
                        fontSize: '0.8rem',
                        fontFamily: '"Palatino Linotype", serif',
                        fontWeight: 600,
                      }}
                    />
                    <YAxis
                      stroke="#d4af37"
                      style={{
                        fontSize: '0.9rem',
                        fontFamily: '"Cinzel", serif',
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 15, 8, 0.98)',
                        border: '3px solid #8b4513',
                        borderRadius: '12px',
                        color: '#ffd700',
                        fontFamily: '"Palatino Linotype", serif',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="score" fill="#c9a52a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Footer - Platform 9¾ signature */}
        <div style={{
          textAlign: 'center',
          marginTop: '4rem',
          padding: '2rem',
          borderTop: '2px solid rgba(255, 215, 0, 0.3)',
        }}>
          <p style={{
            color: '#d4af37',
            fontSize: '1.1rem',
            fontStyle: 'italic',
            fontFamily: '"Palatino Linotype", serif',
            textShadow: '0 2px 10px rgba(212, 175, 55, 0.4)',
          }}>
            "It is our choices, Harry, that show what we truly are, far more than our abilities."
          </p>
          <p style={{
            color: '#8b7355',
            fontSize: '0.9rem',
            marginTop: '1rem',
            fontFamily: '"Cinzel", serif',
            letterSpacing: '0.1em',
          }}>
            — Albus Dumbledore
          </p>
        </div>
      </div>
    </div>
  )
}
