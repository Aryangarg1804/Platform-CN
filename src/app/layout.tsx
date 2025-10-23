import './globals.css'
import React from 'react'

export const metadata = {
  title: "Hogwarts Tournament • Platform 9¾",
  description: 'Magical house leaderboards and round management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white overflow-x-hidden">
        <header className="w-full py-4 px-6 bg-gradient-to-r from-[#2b1a0f] via-[#4b2b13] to-[#2b1a0f] shadow-md border-b-2 border-yellow-600/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-['Cinzel'] text-amber-300">⚡ Platform 9¾</div>
              <div className="text-sm text-amber-200">Hogwarts Tournament</div>
            </div>
            <nav>
              <a href="/" className="mr-4 text-amber-200 hover:underline">Home</a>
              <a href="/public/house-leaderboard" className="mr-4 text-amber-200 hover:underline">House Leaderboard</a>
              <a href="/public/team-leaderboard" className="text-amber-200 hover:underline">Team Leaderboard</a>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}
