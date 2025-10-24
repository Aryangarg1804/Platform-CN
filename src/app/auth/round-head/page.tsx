'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Credentials = {
  email: string
  password: string
  round: number
}

// Hardcoded 7 credentials
const allowedUsers: Credentials[] = [
  { email: 'khushboo1@round-head.com', password: 'khushboo', round: 1 },
  { email: 'khushboo2@gmail.com', password: 'khushboo', round: 2 },
  { email: 'khushboo3@gmail.com', password: 'khushboo', round: 3 },
  { email: 'khushboo4@gmail.com', password: 'khushboo', round: 4 },
  { email: 'khushboo5@gmail.com', password: 'khushboo', round: 5 },
  { email: 'khushboo6@gmail.com', password: 'khushboo', round: 6 },
  { email: 'khushboo7@gmail.com', password: 'khushboo', round: 7 },
]

export default function RoundHeadLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const user = allowedUsers.find(
      u => u.email === email && u.password === password
    )

    if (user) {
  router.push(`/auth/round-head/round-${user.round}`)
} else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-xl p-8 shadow-lg w-80 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-center text-purple-800 mb-4">Round Head Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="p-2 border rounded text-black"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-2 border rounded text-black"
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-purple-800 text-white p-2 rounded hover:bg-purple-700 transition"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
