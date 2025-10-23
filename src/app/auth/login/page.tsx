"use client"

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        localStorage.setItem('token', data.token)
        // redirect based on role
        const role = data.user?.role
        if (role === 'admin') {
          window.location.href = '/admin/rounds/round-1'
        } else if (role === 'round-head') {
          window.location.href = `/auth/round-head` // you can change to specific round
        } else {
          window.location.href = '/'
        }
      }
    } catch (err) {
      setError('Server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080608' }}>
      <form onSubmit={submit} style={{ background: '#111', padding: '2rem', borderRadius: '12px', color: '#ffd700', width: '360px' }}>
        <h2 style={{ marginBottom: '1rem', fontFamily: '"Cinzel", serif' }}>Sign in</h2>
        {error && <div style={{ color: '#ff7c7c', marginBottom: '1rem' }}>{error}</div>}
        <div style={{ marginBottom: '0.8rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem' }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#ffd700' }} />
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#ffd700' }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', background: '#8b0000', color: '#ffd700', borderRadius: '8px', fontWeight: 700 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
