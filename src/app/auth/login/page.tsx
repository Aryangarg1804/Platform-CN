// "use client"

// import { useState } from 'react'

// export default function LoginPage() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)

//   const submit = async (e: any) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')
//     try {
//       const res = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       })
//       const data = await res.json()
      
//       if (!res.ok) {
//         setError(data.error || 'Login failed')
//       } else {
//         localStorage.setItem('token', data.token)
//         // redirect based on role
//         const role = data.user?.role
//         const roundAssigned = data.user?.roundAssigned
//         if (role === 'admin') {
//           window.location.href = '/admin/rounds/round-1'
//         } else if (role === 'round-head') {
          
//           window.location.href = `/auth/round-head/round-${roundAssigned}` // you can change to specific round
//         } else {
//           window.location.href = '/'
//         }
//       }
//     } catch (err) {
//       setError('Server error')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080608' }}>
//       <form onSubmit={submit} style={{ background: '#111', padding: '2rem', borderRadius: '12px', color: '#ffd700', width: '360px' }}>
//         <h2 style={{ marginBottom: '1rem', fontFamily: '"Cinzel", serif' }}>Sign in</h2>
//         {error && <div style={{ color: '#ff7c7c', marginBottom: '1rem' }}>{error}</div>}
//         <div style={{ marginBottom: '0.8rem' }}>
//           <label style={{ display: 'block', fontSize: '0.9rem' }}>Email</label>
//           <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#ffd700' }} />
//         </div>
//         <div style={{ marginBottom: '0.8rem' }}>
//           <label style={{ display: 'block', fontSize: '0.9rem' }}>Password</label>
//           <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#ffd700' }} />
//         </div>
//         <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', background: '#8b0000', color: '#ffd700', borderRadius: '8px', fontWeight: 700 }}>
//           {loading ? 'Signing in...' : 'Sign in'}
//         </button>
//       </form>
//     </div>
//   )
// }


"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        localStorage.setItem("token", data.token);
        const role = data.user?.role;
        const roundAssigned = data.user?.roundAssigned;

        if (role === "admin") {
          window.location.href = "/admin/rounds/round-1";
        } else if (role === "round-head") {
          window.location.href = `/auth/round-head/round-${roundAssigned}`;
        } else {
          window.location.href = "/";
        }
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#120b05] to-[#1b0f07] relative overflow-hidden font-[Cinzel]">
      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.3,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Login Form */}
      <form
        onSubmit={submit}
        className="relative bg-[#1a0f08]/90 border border-yellow-700 rounded-2xl p-8 w-[360px] shadow-[0_0_25px_rgba(255,215,0,0.2)] text-[#ffd700]"
      >
        {/* Glowing Corners */}
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-yellow-500 rounded-tl-xl"></div>
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-yellow-500 rounded-tr-xl"></div>
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-yellow-500 rounded-bl-xl"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-yellow-500 rounded-br-xl"></div>

        {/* Title */}
        <h2 className="text-center text-2xl mb-2 text-yellow-400 font-semibold drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]">
          Round Head Passage
        </h2>
        <p className="text-center italic text-sm text-yellow-200/80 mb-6">
          Only trusted round heads may pass through
        </p>

        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm mb-3 text-center">{error}</div>
        )}

        {/* Email input */}
        <label className="block text-sm mb-1">Enchanted Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 bg-[#0a0705] border border-yellow-800 rounded-md text-yellow-100 focus:ring-2 focus:ring-yellow-500 outline-none placeholder:text-yellow-200/40"
          placeholder="Enter your magical email"
        />

        {/* Password input */}
        <label className="block text-sm mb-1">Magical Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-2 bg-[#0a0705] border border-yellow-800 rounded-md text-yellow-100 focus:ring-2 focus:ring-yellow-500 outline-none placeholder:text-yellow-200/40"
          placeholder="Enter your secret charm"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-red-800 to-yellow-600 text-yellow-100 font-semibold rounded-md shadow-[0_0_10px_rgba(255,215,0,0.4)] hover:shadow-[0_0_20px_rgba(255,215,0,0.7)] hover:scale-[1.03] transition-all duration-300"
        >
          {loading ? "Opening Portal..." : "🪄 Enter Platform 9¾"}
        </button>

        {/* Footer text */}
        <p className="text-center text-xs text-yellow-300/70 mt-4 italic">
          “Muggles can’t see it, only true wizards can pass.”
        </p>
      </form>
    </div>
  );
}
