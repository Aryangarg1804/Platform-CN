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
        // Store token in memory instead of localStorage for this demo
        const token = data.token;
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
    <>
    
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0E1A40] via-[#1a2654] to-[#0E1A40] relative overflow-hidden">
        {/* Brick wall texture overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(0deg, #5D5D5D 0px, #5D5D5D 2px, transparent 2px, transparent 30px),
                           repeating-linear-gradient(90deg, #5D5D5D 0px, #5D5D5D 2px, transparent 2px, transparent 60px)`
        }}></div>

        {/* Magical floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#ECB939] rounded-full animate-shimmer"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Steam effects */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`steam-${i}`}
            className="absolute bottom-0 w-20 h-20 bg-gradient-to-t from-[#AAAAAA]/20 to-transparent rounded-full blur-xl animate-steam"
            style={{
              left: `${20 + i * 15}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          ></div>
        ))}

        {/* Main Login Container */}
        <div className="relative z-10 w-full max-w-md px-4">
          {/* Platform Sign */}
          <div className="text-center mb-8 animate-float">
            <div className="inline-block bg-gradient-to-b from-[#4169E1] to-[#2d4da3] border-4 border-[#ECB939] rounded-lg px-8 py-4 shadow-2xl animate-glow">
              <h1 className="harry-font text-5xl text-[#ECB939] drop-shadow-[0_2px_8px_rgba(236,185,57,0.8)] tracking-wider">
                Platform 9¾
              </h1>
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={submit}
            className="relative bg-gradient-to-b from-[#0E1A40]/95 to-[#1a2654]/95 border-4 border-[#D3A625] rounded-xl p-8 shadow-2xl backdrop-blur-sm"
            style={{
              boxShadow: '0 0 40px rgba(236, 185, 57, 0.3), inset 0 0 60px rgba(14, 26, 64, 0.5)',
            }}
          >
            {/* Decorative corner pieces */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[#ECB939]"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[#ECB939]"></div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[#ECB939]"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[#ECB939]"></div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl mb-2 text-[#ECB939] font-bold tracking-wide" style={{
                textShadow: '0 0 10px rgba(236, 185, 57, 0.5), 0 0 20px rgba(236, 185, 57, 0.3)',
              }}>
                Round Head Entry
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D3A625] to-transparent mx-auto mb-3"></div>
              <p className="text-[#AAAAAA] text-sm italic">
                Only authorized wizards may proceed
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/30 border-2 border-red-600 text-red-300 text-sm p-3 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            {/* Email input */}
            <div className="mb-5">
              <label className="block text-[#ECB939] text-sm mb-2 font-semibold tracking-wide">
                Wizarding Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#0E1A40]/80 border-2 border-[#5D5D5D] rounded-lg text-[#AAAAAA] focus:border-[#4169E1] focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 placeholder:text-[#5D5D5D] transition-all duration-300"
                placeholder="your.name@hogwarts.edu"
                required
              />
            </div>

            {/* Password input */}
            <div className="mb-6">
              <label className="block text-[#ECB939] text-sm mb-2 font-semibold tracking-wide">
                Secret Passphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#0E1A40]/80 border-2 border-[#5D5D5D] rounded-lg text-[#AAAAAA] focus:border-[#4169E1] focus:outline-none focus:ring-2 focus:ring-[#4169E1]/50 placeholder:text-[#5D5D5D] transition-all duration-300"
                placeholder="Enter your magical password"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#4169E1] to-[#5a7ee6] text-[#ECB939] font-bold text-lg rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-2 border-[#D3A625] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              {loading ? "Opening the Barrier..." : "Pass Through the Wall"}
            </button>

            {/* Footer text */}
            <div className="mt-6 text-center">
              <p className="text-[#5D5D5D] text-xs italic leading-relaxed">
                "Between platforms nine and ten, if you are wizard enough,<br />
                you'll find the barrier less solid than it looks."
              </p>
            </div>
          </form>

          {/* Bottom decorative element */}
          <div className="text-center mt-6">
            <div className="inline-block text-[#D3A625] text-xs tracking-widest opacity-60">
              ✦ MINISTRY AUTHORIZED ACCESS ✦
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
