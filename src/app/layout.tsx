'use client';
import './globals.css';
import React, { useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <header className="header-bg w-full py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="platform-title">Platform 9¾</div>
              <div className="subtitle hidden sm:block">Hogwarts Tournament</div>
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
