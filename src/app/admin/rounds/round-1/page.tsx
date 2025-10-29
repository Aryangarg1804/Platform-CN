'use client'

import { useState, useEffect } from 'react'

// Interface simplified to remove score fields
interface Team {
  _id: string
  id: number
  name: string
  house: string
  isActive: boolean
}

// Interface for new team state
interface NewTeam {
    name: string;
    house: string;
}

export default function Round1Page() {
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw']

  // Initial teams structure is only used for shape, data is populated from API
  const initialTeams: Team[] = []

  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [roundLocked, setRoundLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // NEW STATE FOR ADD TEAM FUNCTIONALITY
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeam, setNewTeam] = useState<NewTeam>({
    name: '',
    house: '',
  })
  // END NEW STATE

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch initial data (full teams and lock status)
  const fetchData = async () => {
    try {
        // 1. Get lock status
        const statusRes = await fetch('/api/admin/round-status?round=round-1')
        const statusData = await statusRes.json()
        setRoundLocked(statusData.isLocked)

        // 2. Get teams (gets ALL teams, including inactive/eliminated, to allow editing/re-activating)
        const teamsRes = await fetch('/api/admin/teams')
        const teamsData = await teamsRes.json()
        
        // Map ALL fetched teams into local Team array structure
        let localIdCounter = 1;
        const mappedTeams: Team[] = teamsData.map((dbTeam: any) => ({
            _id: dbTeam._id,
            id: localIdCounter++, // Assign continuous IDs for keys/display
            name: dbTeam.name, 
            house: dbTeam.house,
            isActive: dbTeam.isActive !== false, 
        }))
        
        // Sort active teams first for better visibility
        mappedTeams.sort((a, b) => (b.isActive as any) - (a.isActive as any) || a.name.localeCompare(b.name));
        
        setTeams(mappedTeams)
    } catch (err) {
        console.error(err)
        setMessage('Error loading initial data.')
    } finally {
        setLoading(false)
    }
  }

  // NEW: Lightweight function to poll ONLY the lock status
  const pollLockStatus = async () => {
      try {
        const res = await fetch('/api/admin/round-status?round=round-1')
        const data = await res.json()
        setRoundLocked(data.isLocked)
      } catch (err) {
        console.error('Error polling lock status:', err)
      }
  }


  useEffect(() => {
    fetchData() // 1. Initial full fetch of data and lock status

    // 2. Set up interval for light polling (only lock status)
    const interval = setInterval(() => {
        if (isMounted) {
            pollLockStatus(); 
        }
    }, 5000) // Poll lock status every 5 seconds

    return () => clearInterval(interval)
  }, [isMounted]) 

  const handleChange = (
    id: number,
    field: 'name' | 'house',
    value: string
  ) => {
    if (roundLocked) return
    setTeams(prev =>
      prev.map(team => (team.id === id ? { ...team, [field]: value } : team))
    )
  }

  const toggleLock = async () => {
    setMessage('')
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-1', isLocked: !roundLocked }),
      })
      const data = await res.json()
      setRoundLocked(data.isLocked)
      setMessage(`Round ${data.isLocked ? 'locked' : 'unlocked'} successfully.`)
    } catch (err) {
      console.error('Error toggling lock:', err)
      setMessage('Error updating lock status.')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.house) {
      setMessage('Please fill all fields for the new team.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (roundLocked) {
        setMessage('Round is locked. Cannot add new teams.')
        setTimeout(() => setMessage(''), 3000)
        return
    }
    
    setSubmissionStatus('submitting')
    setMessage('Adding new team...')

    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

        const res = await fetch('/api/admin/teams', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify([ 
                {
                    name: newTeam.name,
                    house: newTeam.house,
                    roundsParticipating: [1], 
                    isActive: true
                }
            ])
        })

        if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Failed to add team.')
        }

        setMessage('Team added successfully!')
        setNewTeam({ name: '', house: '' })
        setShowAddTeam(false)
        setSubmissionStatus('success')

        // IMPORTANT: Refresh data to show the newly added team in the table
        await fetchData()

    } catch (err: any) {
        console.error('Error adding team:', err)
        setMessage('Error adding team: ' + err.message)
        setSubmissionStatus('error')
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000)
    }
  }

  // Function to remove (mark inactive) a team
  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (roundLocked) {
        setMessage('Round is locked. Cannot remove teams.')
        setTimeout(() => setMessage(''), 3000)
        return
    }
    if (!confirm(`Are you sure you want to remove (mark inactive) the team "${teamName}"?`)) return;

    setSubmissionStatus('submitting')
    setMessage(`Removing team ${teamName}...`)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const res = await fetch('/api/admin/teams', {
        method: 'DELETE',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }), // Calls DELETE endpoint to set isActive: false
      })

      if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to remove team.')
      }

      setMessage(`Team ${teamName} removed (set to Inactive).`)
      setSubmissionStatus('success')

      // Update local state immediately to reflect removal/inactivity status
      setTeams(prevTeams => prevTeams.map(t => 
        t._id === teamId ? { ...t, isActive: false } : t
      ))
      
    } catch (err: any) {
        console.error('Error removing team:', err)
        setMessage('Error removing team: ' + err.message)
        setSubmissionStatus('error')
    } finally {
        setTimeout(() => setSubmissionStatus('idle'), 3000)
    }
  }

  // NEW: Function to activate a team (set isActive: true)
  const handleActivateTeam = async (teamId: string, teamName: string) => {
      if (roundLocked) {
        setMessage('Round is locked. Cannot activate teams.')
        setTimeout(() => setMessage(''), 3000)
        return
      }

      setSubmissionStatus('submitting')
      setMessage(`Activating team ${teamName}...`)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

        // Reusing the POST endpoint to update isActive status
        const res = await fetch('/api/admin/teams', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          },
          // Send only the necessary fields: _id, name, house, and isActive: true
          body: JSON.stringify([
              { 
                _id: teamId, 
                name: teamName, // Required by POST endpoint
                house: teams.find(t => t._id === teamId)?.house || 'Gryffindor', // Use current house
                isActive: true,
              }
          ]),
        })

        if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Failed to activate team.')
        }

        setMessage(`Team ${teamName} activated.`)
        setSubmissionStatus('success')

        // Update local state immediately
        setTeams(prevTeams => prevTeams.map(t => 
          t._id === teamId ? { ...t, isActive: true } : t
        ))

      } catch (err: any) {
          console.error('Error activating team:', err)
          setMessage('Error activating team: ' + err.message)
          setSubmissionStatus('error')
      } finally {
          setTimeout(() => setSubmissionStatus('idle'), 3000)
      }
  }

  // Consolidated Save function: Updates Team model + updates Round model.
  const saveAndSubmitTeams = async () => {
    if (roundLocked) {
      setMessage('Round is locked. Cannot save or submit.')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    setSubmissionStatus('submitting')
    setMessage('Saving teams and finalizing Round 1 setup...')

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      // 1. Prepare data for POST /api/admin/teams (Update Name/House)
      // Only process currently ACTIVE teams for saving/submitting
      const teamsToUpdate = teams
        .filter(t => t.name.trim() !== '' && t.isActive) 
        .map(team => ({
          ...(team._id && { _id: team._id }), 
          name: team.name, 
          house: team.house,
          roundsParticipating: [1, 2, 3, 4], 
          score: 0, 
        }))

      if (teamsToUpdate.length === 0) {
        throw new Error('No ACTIVE team names entered to save. Please add/re-activate at least one team.')
      }
        
      const teamSaveRes = await fetch('/api/admin/teams', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(teamsToUpdate),
      })
      
      const teamSaveData = await teamSaveRes.json()

      if (!teamSaveRes.ok) {
          throw new Error(teamSaveData.error || 'Failed to save teams data.')
      }

      // 2. Prepare data for POST /api/rounds/round-1 (Log Final Round Results)
      const savedTeams = teamSaveData.teams.filter((t: any) => t.name.trim() !== '' && t.isActive !== false)
      
      const results = savedTeams
        .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0)) 
        .map((team: any, idx: number) => ({
          team: team._id,
          points: 0, 
          time: 0,
          rank: idx + 1,
      }))

      await fetch('/api/rounds/round-1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ results, approved: true }),
      })

      setSubmissionStatus('success')
      setMessage('Teams updated and Round 1 setup finalized! (Scores are set to 0)')
      await fetchData() 
    } catch (err: any) {
      console.error(err)
      setMessage('Error saving/submitting: ' + err.message)
      setSubmissionStatus('error')
    } finally {
      setTimeout(() => setSubmissionStatus('idle'), 3000)
    }
  }


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
      {/* Animated magical particles - KEPT FOR THEME */}
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
            zIndex: 0,
          }}
        />
      ))}

      {/* Styles for animations, copied from original */}
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
        tbody tr:hover {
          background-color: rgba(80, 40, 20, 0.6) !important;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
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
            🎩 The Sorting Hat Ceremony Setup
          </h1>

          <div style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            color: '#d4af37',
            fontStyle: 'italic',
            marginTop: '1rem',
            textShadow: '0 2px 10px rgba(212, 175, 55, 0.5)',
            fontFamily: '"Palatino Linotype", serif',
          }}>
            Set up teams and houses for the entire tournament.
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

        {/* Message Display */}
        {message && (
             <div style={{
                 background: submissionStatus === 'error' ? 'rgba(139, 0, 0, 0.5)' : 'rgba(26, 93, 26, 0.5)',
                 border: `2px solid ${submissionStatus === 'error' ? '#8b0000' : '#1a5d1a'}`,
                 color: submissionStatus === 'error' ? '#ff4444' : '#90ee90',
                 padding: '1rem',
                 borderRadius: '10px',
                 textAlign: 'center',
                 marginBottom: '2.5rem',
                 fontWeight: 700,
             }}>
                 {message}
             </div>
        )}

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
              The Great Hall doors are sealed. Team updates are disabled until the enchantment is lifted...
            </p>
          </div>
        )}

        {/* Main Content - Show only when unlocked */}
        {!roundLocked && (
          <>
            {/* NEW: Add Team Section */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(60, 30, 15, 0.9), rgba(30, 15, 8, 0.9))',
                border: '3px solid #8b4513',
                borderRadius: '15px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.2)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#ffd700', fontFamily: '"Cinzel", serif' }}>Manage Teams</h2>
                    <button
                        onClick={() => setShowAddTeam(!showAddTeam)}
                        style={{ padding: '0.5rem 1.5rem', background: '#c41e3a', color: '#ffd700', border: '2px solid #ffd700', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {showAddTeam ? 'Cancel' : '+ Add New Team'}
                    </button>
                </div>

                {showAddTeam && (
                    <div style={{ background: 'rgba(20, 10, 5, 0.8)', padding: '1.5rem', borderRadius: '10px', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Team Name"
                                value={newTeam.name}
                                onChange={e => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                                style={{ flex: '1', minWidth: '150px', padding: '0.7rem', background: '#0a0705', border: '1px solid #8b4513', borderRadius: '8px', color: '#ffd700' }}
                                disabled={submissionStatus === 'submitting'}
                            />
                            <select
                                value={newTeam.house}
                                onChange={e => setNewTeam(prev => ({ ...prev, house: e.target.value }))}
                                style={{ flex: '1', minWidth: '150px', padding: '0.7rem', background: '#0a0705', border: '1px solid #8b4513', borderRadius: '8px', color: '#ffd700' }}
                                disabled={submissionStatus === 'submitting'}
                            >
                                <option value="">Select House</option>
                                {houses.map(house => (
                                    <option key={house} value={house} style={{ background: '#0a0705' }}>{house}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddTeam}
                                disabled={submissionStatus === 'submitting' || !newTeam.name || !newTeam.house}
                                style={{ padding: '0.7rem 1.5rem', background: '#1a5d1a', color: '#fff', border: '1px solid #1a5d1a', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: (submissionStatus === 'submitting' || !newTeam.name || !newTeam.house) ? 0.6 : 1 }}
                            >
                                {submissionStatus === 'submitting' ? 'Adding...' : 'Add Team'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* END NEW: Add Team Section */}


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
                      }}>Status</th>
                      <th style={{
                        padding: '1.2rem',
                        border: '2px solid #8b4513',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        fontFamily: '"Cinzel", serif',
                        fontSize: '1.1rem',
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={team.id} style={{
                        background: team.isActive ? 'rgba(20, 10, 5, 0.4)' : 'rgba(139, 0, 0, 0.2)', // Highlight inactive
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
                            disabled={roundLocked || !team.isActive} // Disable if inactive
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
                            disabled={roundLocked || !team.isActive} // Disable if inactive
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
                          <span style={{
                             padding: '0.4rem 1rem',
                             borderRadius: '999px',
                             background: team.isActive ? 'rgba(26, 93, 26, 0.7)' : 'rgba(139, 0, 0, 0.7)',
                             color: team.isActive ? '#90ee90' : '#ff4444',
                             fontWeight: 700,
                          }}>
                              {team.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', border: '2px solid #8b4513', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {team.isActive ? (
                            <button
                              onClick={() => handleRemoveTeam(team._id, team.name)}
                              disabled={roundLocked || !team._id}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                background: '#c41e3a', 
                                color: '#ffd700', 
                                border: '1px solid #ffd700', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                fontWeight: 600,
                                opacity: roundLocked ? 0.5 : 1
                              }}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateTeam(team._id, team.name)}
                              disabled={roundLocked || !team._id}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                background: '#1a5d1a', 
                                color: '#90ee90', 
                                border: '1px solid #90ee90', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                fontWeight: 600,
                                opacity: roundLocked ? 0.5 : 1
                              }}
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Show a placeholder row if no teams exist */}
                    {teams.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '1rem', border: '2px solid #8b4513', textAlign: 'center', color: '#d4af3780', fontStyle: 'italic' }}>
                            No teams registered yet. Use the 'Add New Team' button above!
                          </td>
                        </tr>
                    )}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={saveAndSubmitTeams}
                    disabled={submissionStatus === 'submitting' || roundLocked}
                    style={{
                      padding: '1rem 2.5rem',
                      background: 'linear-gradient(135deg, #c41e3a, #8b0000)',
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
                      ? '🕓 Updating & Finalizing...'
                      : submissionStatus === 'success'
                        ? '✅ Updated & Finalized!'
                        : submissionStatus === 'error'
                          ? '❌ Error! Try Again'
                          : '💾 Save Teams & Finalize Round 1 Setup'}
                  </button>
                </div>

              </div>
            </div>
            
            {/* Informational Note for the user */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(30, 15, 8, 0.5), rgba(15, 7, 4, 0.5))',
                border: '2px dashed #8b4513',
                borderRadius: '15px',
                padding: '2rem',
                marginTop: '2rem',
                textAlign: 'center',
            }}>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#d4af37',
                    fontStyle: 'italic',
                }}>
                    Note: This round (Sorting Hat Ceremony) is for **Team and House Setup** only. Score entry, Quaffle awarding, and detailed visualizations are **disabled** here as requested. All **active** teams will be registered with 0 points for the start of the tournament.
                </p>
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