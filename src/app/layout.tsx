// src/app/ClientRootLayout.tsx (This is the Client Component)
'use client' 

import './globals.css'
import React, { useState } from 'react'

// ❌ REMOVE THE 'export const metadata' BLOCK FROM HERE

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white overflow-x-hidden">
        <header className="w-full py-4 px-6 bg-gradient-to-r from-[#2b1a0f] via-[#4b2b13] to-[#2b1a0f] shadow-md border-b-2 border-yellow-600/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            <div className="flex items-center gap-4">
              <div className="text-2xl font-['Cinzel'] text-amber-300">⚡ Platform 9¾</div>
              <div className="text-sm text-amber-200 hidden sm:block">Hogwarts Tournament</div>
            </div>

            <button 
              className="sm:hidden text-amber-200 text-3xl p-2 focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
            
            <nav 
              className={`
                absolute sm:static top-16 left-0 w-full sm:w-auto 
                bg-[#2b1a0f] sm:bg-transparent shadow-lg sm:shadow-none 
                flex flex-col sm:flex-row items-center gap-4 py-4 sm:py-0 
                z-50 transition-all duration-300 ease-in-out
                ${isMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0 hidden sm:flex'}
              `}
            >
              <a href="/" onClick={toggleMenu} className="text-amber-200 hover:underline">Home</a>
              <a href="/public/house-leaderboard" onClick={toggleMenu} className="text-amber-200 hover:underline">House Leaderboard</a>
              <a href="/public/team-leaderboard" onClick={toggleMenu} className="text-amber-200 hover:underline">Team Leaderboard</a>
            </nav>
            
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}