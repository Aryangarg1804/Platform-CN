'use client'

import { useState, useEffect, useCallback } from 'react'
import { canAccessRound } from '@/lib/roundHeadAuth'

// Interface simplified to remove score fields
interface Team {
    _id: string; // Database ID
    id: number; // Sequential ID (for stable key)
    name: string;
    house: string;
    isActive: boolean;
}

// Interface for new team state
interface NewTeam {
    name: string;
    house: string;
}

export default function Round1() {
  const [user, setUser] = useState<any>(null)
  const [roundLocked, setRoundLocked] = useState(true)
  const houses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw'] 

  const initialTeams: Team[] = []

  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // STATE FOR ADD TEAM FUNCTIONALITY
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeam, setNewTeam] = useState<NewTeam>({
    name: '',
    house: '',
  })
  
  useEffect(() => {
    setIsMounted(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      window.location.href = '/auth/login'
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!canAccessRound(payload, 1)) { // Auth check
        window.location.href = '/auth/login'
        return
      }
      setUser(payload)
    } catch (e) {
      console.error('Authentication error:', e)
      window.location.href = '/auth/login'
    }
  }, [])

  // Fetch initial data (full teams and lock status)
  const fetchData = useCallback(async () => {
    if (!user) return; // Wait for user authentication
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
  }, [user])

  // NEW: Lightweight function to poll ONLY the lock status
  const pollLockStatus = useCallback(async () => {
      try {
        const res = await fetch('/api/admin/round-status?round=round-1')
        const data = await res.json()
        // This sets the lock state without touching the 'teams' array, preserving user's unsaved input.
        setRoundLocked(data.isLocked)
      } catch (err) {
        console.error('Error polling lock status:', err)
      }
  }, [])


  useEffect(() => {
    if (!user) return;
    fetchData() // 1. Initial full fetch of data and lock status

    // 2. Set up interval for light polling (only lock status)
    const interval = setInterval(() => {
        if (isMounted) {
            pollLockStatus(); 
        }
    }, 5000) // Poll lock status every 5 seconds

    return () => clearInterval(interval)
  }, [user, fetchData, isMounted, pollLockStatus]) 

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

  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.house) {
      setMessage('Please fill all fields for the new team.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (roundLocked) {
        setMessage('Round is locked by Admin. Cannot add new teams.')
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
        setMessage('Round is locked by Admin. Cannot remove teams.')
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

  // Function to activate a team (set isActive: true)
  const handleActivateTeam = async (teamId: string, teamName: string) => {
      if (roundLocked) {
        setMessage('Round is locked by Admin. Cannot activate teams.')
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
                name: teamName, 
                house: teams.find(t => t._id === teamId)?.house || 'Gryffindor', 
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
      setMessage('Round is locked by Admin. Cannot save or submit.')
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel']">
        Loading Round 1 Dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-amber-400">Round 1 Dashboard (Round Head)</h1>
        <p className="text-2xl mb-6">Sorting Hat Ceremony Setup</p>
        
        {/* Read-Only Lock Status Display */}
        <div className={`inline-block px-4 py-2 rounded font-semibold ${
          roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
        }`}>
          {roundLocked ? '🔒 Locked by Admin - View Only' : '🔓 Unlocked - Ready for Setup'}
        </div>
      </header>
      
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
                 maxWidth: '600px',
                 margin: '1rem auto'
             }}>
                 {message}
             </div>
        )}

      {/* Warning/Info message */}
      {roundLocked && (
         <div className="p-4 mb-6 rounded text-center bg-red-900/50 border border-red-700 text-red-300 w-full max-w-5xl">
             The round is currently locked by the Admin. Editing, adding, or removing teams is disabled.
         </div>
      )}

      {/* Add Team Section */}
      <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg w-full max-w-5xl mb-6 overflow-x-auto border-2 border-amber-900/30">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#ffd700', fontFamily: 'Cinzel, serif' }}>Manage Teams</h2>
              {!roundLocked && (
                <button
                    onClick={() => setShowAddTeam(!showAddTeam)}
                    style={{ padding: '0.5rem 1.5rem', background: '#c41e3a', color: '#ffd700', border: '2px solid #ffd700', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                    {showAddTeam ? 'Cancel' : '+ Add New Team'}
                </button>
              )}
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

      {/* Team Management Table */}
      <div className="bg-gray-800 text-amber-100 rounded-2xl p-4 shadow-lg w-full max-w-5xl mb-6 overflow-x-auto border-2 border-amber-900/30">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-900/50 text-amber-400">
            <tr>
              <th className="p-2 border border-amber-900/30">#</th>
              <th className="p-2 border border-amber-900/30">Team Name</th>
              <th className="p-2 border border-amber-900/30">House</th>
              <th className="p-2 border border-amber-900/30">Status</th>
              <th className="p-2 border border-amber-900/30">Actions</th>
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
                  fontFamily: 'Cinzel, serif',
                }}>
                  {index + 1}
                </td>
                <td style={{ padding: '1rem', border: '2px solid #8b4513', textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter team name"
                    value={team.name}
                    onChange={e => handleChange(team.id, 'name', e.target.value)}
                    disabled={roundLocked || !team.isActive} // Disabled by lock or if inactive
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
                      fontFamily: 'Palatino Linotype, serif',
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
                    disabled={roundLocked || !team.isActive} // Disabled by lock or if inactive
                    style={{
                      padding: '0.7rem 1rem',
                      background: 'rgba(20, 10, 5, 0.8)',
                      border: '3px solid #8b4513',
                      borderRadius: '10px',
                      color: '#ffd700',
                      fontSize: '1rem',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Palatino Linotype, serif',
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
              cursor: submissionStatus === 'submitting' || roundLocked ? 'not-allowed' : 'pointer',
              opacity: submissionStatus === 'submitting' || roundLocked ? 0.6 : 1,
              transition: 'all 0.3s ease',
              fontFamily: 'Cinzel, serif',
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
      
      {/* Informational Note for the user */}
      <div style={{
          background: 'linear-gradient(145deg, rgba(30, 15, 8, 0.5), rgba(15, 7, 4, 0.5))',
          border: '2px dashed #8b4513',
          borderRadius: '15px',
          padding: '2rem',
          marginTop: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '2rem auto',
      }}>
          <p style={{
              fontSize: '1.1rem',
              color: '#d4af37',
              fontStyle: 'italic',
          }}>
              **Round Head Access**
              <br/>
              Your changes are saved if the round is **Unlocked**. Only the Admin can lock/unlock the round.
          </p>
      </div>
    </div>
  )
}