import React from 'react'
import PortalDoor from '@/components/PortalDoor'

export default function HomePage() {
  return (
    <div className="homepage">
      {/* Background */}
      <img src="/images/platform.jpg" alt="Platform 9¾" className="bg-image" />
      <div className="overlay" />

      {/* Floating mist */}
      <div className="mist" />

      {/* Main content */}
      <main>
        <header>
          <h1 className="h1-hp">Platform 9¾</h1>
          <p></p>
        </header>


        <footer>
          Powered by Coding Ninjas
        </footer>
      </main>

      {/* Sparks */}
      <div className="spark spark-1" />
      <div className="spark spark-2" />
    </div>
  )

}

