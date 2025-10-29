// src/app/ClientRootLayout.tsx (This is the Client Component)
'use client'

import './globals.css'
import React, { useState } from 'react'
import Image from 'next/image'; // Import the next/image component
import cnLogo from '/public/images/cn_logo.png' // Correctly import the image (assuming cn_logo.png is the one)

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <html lang="en">
      <head>
        {/* Head elements */}
      </head>
      <body>
        <header className="header-bg w-full py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">

            <div className="flex items-center gap-4">
              {/* Correctly use the Image component */}
              <div className="flex items-center text-2xl font-['Cinzel'] text-amber-300">
                  <Image
                    src={cnLogo} // Use the imported image object
                    alt="Coding Ninjas Logo"
                    width={35} // Specify width
                    height={35} // Specify height
                    className="mr-2" // Add some margin if needed
                  />
                 Platform 9¾
               </div>
              <div className="text-sm text-amber-200 hidden sm:block">Hogwarts Tournament</div>
            </div>

            <button
              className="sm:hidden menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>

            <nav className="hidden sm:flex items-center gap-2">
              <a href="/" className="nav-link">Home</a>
              <a href="/public/house-leaderboard" className="nav-link">House Leaderboard</a>
              <a href="/public/team-leaderboard" className="nav-link">Team Leaderboard</a>
            </nav>
          </div>

          {isMenuOpen && (
            <nav className="mobile-menu sm:hidden absolute top-20 left-4 right-4 py-6 rounded z-50">
              <div className="flex flex-col items-center gap-6">
                <a href="/" onClick={() => setIsMenuOpen(false)} className="nav-link">Home</a>
                <a href="/public/house-leaderboard" onClick={() => setIsMenuOpen(false)} className="nav-link">House Leaderboard</a>
                <a href="/public/team-leaderboard" onClick={() => setIsMenuOpen(false)} className="nav-link">Team Leaderboard</a>
              </div>
            </nav>
          )}
        </header>

        {children}
      </body>
    </html>
  );
}