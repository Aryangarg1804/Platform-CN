'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Cinzel_Decorative, EB_Garamond } from 'next/font/google'
import Image from 'next/image' 
import { useRouter } from 'next/navigation' // <-- Added import

// --- Font Setup ---
const cinzel = Cinzel_Decorative({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-cinzel',
})

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-garamond',
})

// --- Component ---
export default function HomePage() {
  const router = useRouter() // <-- Added router hook

  // --- Animation Variants ---
  const textVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({ 
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay, ease: "easeOut" }
    })
  };

  const titleVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2,
        ease: "easeOut"
      }
    }
  };
  
  // --- Added Button Variants ---
  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 0px 16px rgba(251, 191, 36, 0.6)", // Matched gold color
      textShadow: "0px 0px 8px rgba(251, 191, 36, 0.8)", // Matched gold color
      transition: {
        duration: 0.3,
        yoyo: Infinity 
      }
    },
    tap: {
      scale: 0.95,
      boxShadow: "0px 0px 8px rgba(251, 191, 36, 0.4)",
      textShadow: "0px 0px 4px rgba(251, 191, 36, 0.4)",
    }
  };

  const sectionFadeIn = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 } 
    }
  };

  const itemFadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } }
  };

  // --- Scroll-Linked Animations Setup ---
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollY } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const aboutRef = useRef<HTMLElement>(null);
  const { scrollYProgress: aboutScrollY } = useScroll({
    target: aboutRef,
    offset: ["start end", "end start"] 
  });

  const trialsRef = useRef<HTMLElement>(null);
  const { scrollYProgress: trialsScrollY } = useScroll({
    target: trialsRef,
    offset: ["start end", "end start"]
  });

  const leaderboardRef = useRef<HTMLElement>(null);
  const { scrollYProgress: leaderboardScrollY } = useScroll({
    target: leaderboardRef,
    offset: ["start end", "end start"]
  });

  // 1. Hero background fade
  const heroImageOpacity = useTransform(heroScrollY, [0.3, 0.7], [1, 0]); 
  const heroParticlesOpacity = useTransform(heroScrollY, [0.5, 0.8], [1, 0]);
  const heroContentOpacity = useTransform(heroScrollY, [0.3, 0.7], [1, 0]); 

  // 2. About section parallax
  const aboutParchmentY = useTransform(aboutScrollY, [0, 1], ["-10%", "10%"]); 
  const aboutTextY = useTransform(aboutScrollY, [0, 1], ["0%", "20%"]); 

  // 3. Trials section parallax
  const trialBannerY = (index: number) => 
    useTransform(trialsScrollY, [0, 1], ['-20%', `${index % 2 === 0 ? '10%' : '20%'}`]); 

  const leaderboardContentY = useTransform(leaderboardScrollY, [0, 1], ["0%", "30%"]);


  return (
    <div className={`bg-black ${cinzel.variable} ${garamond.variable}`}>
      
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory">

        {/* --- Hero Section (Snap Point 1) --- */}
        <section ref={heroRef} className="min-h-screen snap-start flex items-center justify-center relative py-8 sm:py-12">
          
          {/* Background Image */}
          <motion.div 
            className="absolute inset-0 z-10"
            style={{ opacity: heroImageOpacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-gray-900 z-10" />
            <Image 
              src="/images/platform.jpg"
              alt="Magical background"
              layout="fill"
              objectFit="cover"
              priority 
            />
          </motion.div>

          {/* Floating Particles */}
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ opacity: heroParticlesOpacity }}
          >
            {/* Small/Fast Particles */}
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-amber-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.1, 0.6, 0.1],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
            {/* Large/Slow Motes */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`mote-${i}`}
                className="absolute w-4 h-4 bg-amber-200 rounded-full blur-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, 20, 0],
                  x: [0, -20, 0],
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{
                  duration: 8 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 4,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
          
          {/* Hero Content */}
          <motion.div 
            className="text-center px-4 sm:px-6 md:px-8 flex flex-col items-center relative z-30 max-w-6xl mx-auto w-full"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
        

            <motion.h2
              className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-serif tracking-wider text-gray-200 my-3 sm:my-4 md:my-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-0"
              variants={textVariant} initial="hidden" animate="visible" custom={0.2}
            >
              <span className="hidden sm:block h-px w-8 md:w-12 lg:w-16 bg-gray-500 opacity-50 sm:mr-3 md:mr-4"></span>
              Coding Ninjas CUIET
              <span className="hidden sm:block h-px w-8 md:w-12 lg:w-16 bg-gray-500 opacity-50 sm:ml-3 md:ml-4"></span>
            </motion.h2>

            {/* Title with Static Glow */}
            <motion.h1
              className="font-magic text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl text-amber-100 leading-tight [text-shadow:0_0_20px_rgba(251,191,36,0.7),0_0_40px_rgba(217,119,6,0.5)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              Platform 9 ¾
            </motion.h1>
            
            <motion.p
              className="text-base sm:text-lg md:text-xl text-gray-300 font-serif max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl mt-4 sm:mt-6 px-2"
              variants={textVariant} initial="hidden" animate="visible" custom={0.4}
            >
              Welcome to a realm where mystery meets mastery, and every choice could tip the balance between light and shadow. This documentation maps the journey — rules, lore, and the mechanics that drive each trial.
            </motion.p>

            {/* --- ADDED BUTTON --- */}
               <motion.button
              className="
                mt-10 sm:mt-12 md:mt-14 // Margin top
                px-10 py-4 // Padding
                font-magic uppercase tracking-widest // <-- Use the magic font
                text-xl sm:text-2xl text-amber-100
                bg-gradient-to-br from-yellow-900 via-amber-700 to-yellow-900 // Aged brass gradient
                border-2 border-amber-400/50
                rounded-md // Less rounded, more like a plaque
                shadow-lg shadow-black/40
                transition-all duration-300 ease-in-out
                hover:from-yellow-800 hover:to-amber-600 // Brighter on hover
                hover:shadow-xl
                [text-shadow:0_0_8px_rgba(251,191,36,0.4)] // Subtle base text glow
              "
              // --- FIXED ONCLICK ---
              onClick={() => window.location.href = '/public'}
              variants={{ ...buttonVariants, ...textVariant }} // Combine button hover/tap with text fade-in
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              custom={0.4} // <<< Kept faster delay
            >
              ENTER REALM
            </motion.button>
            {/* --- END ADDED BUTTON --- */}

          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div
            className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ delay: 1.5, duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ opacity: heroContentOpacity }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.div>

        </section>
        {/* --- About Section (Snap Point 2) --- */}
        <section ref={aboutRef} className="min-h-screen snap-start flex items-center justify-center relative z-20 p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden">
          
          <motion.div
            className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center"
            variants={sectionFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            
            {/* Left Column: Parchment (Parallax) */}
            <motion.div 
              className="w-full min-h-[320px] sm:min-h-[380px] md:h-96 bg-[#f7f3e8] border-2 sm:border-4 border-[#d3c0a1] rounded-lg shadow-2xl p-4 sm:p-6 md:p-8 text-black flex flex-col"
              style={{ 
                fontFamily: 'var(--font-garamond)', 
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
                background: 'linear-gradient(to bottom, #f7f3e8, #f0e9d6)',
                y: aboutParchmentY 
              }}
              variants={itemFadeIn}
            >
              <h3 
                className="text-2xl sm:text-3xl text-gray-800 mb-3 sm:mb-4 border-b-2 border-gray-400 pb-2"
                style={{ fontFamily: 'var(--font-magic)' }}
              >
                Platform Manual
              </h3>
              <p className="text-base sm:text-lg text-gray-700 italic mb-3 sm:mb-4">
                Here, logic intertwines with lore. This manual collects the rules, mechanics, and the ethos behind each challenge.
              </p>
              <p className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4">
                Courage and cunning, alliances and betrayals — everything you need to navigate the trials is written here. Read wisely; not everything is as it seems.
              </p>
              <p className="text-base sm:text-lg text-gray-500 mt-auto text-right">
                - Platform 9 ¾
              </p>
            </motion.div>

            {/* Right Column: Text Content (Parallax + Stagger) */}
            <motion.div 
              className="text-white font-serif flex flex-col h-full gap-2"
              style={{ y: aboutTextY }} 
              variants={sectionFadeIn}
            >
              <div className="space-y-4">
                <motion.h2 
                  className="font-magic text-3xl sm:text-4xl md:text-5xl text-amber-300"
                  variants={itemFadeIn}
                >
                  About the Realm
                </motion.h2>

                <motion.p 
                  className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed"
                  variants={itemFadeIn}
                >
                  A Saga of Wizards, Wits, and Wonders — this isn't just an event; it's an odyssey through imagination, intellect, and intrigue. Every twist hides a truth; every riddle, a revelation.
                </motion.p>
              </div>
              
              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed"
                variants={itemFadeIn}
              >
                Are you ready to trust your instincts, test your wits, and uncover what lies beyond the ordinary? The magic awaits — if you dare to chase it.
              </motion.p>
            </motion.div>

          </motion.div>

        </section>

        {/* --- House Virtues Section (Snap Point 3) --- */}
        <section
          ref={trialsRef}
          className="min-h-screen snap-start flex flex-col items-center justify-center relative z-20 p-4 pb-16 sm:p-6 md:p-8 overflow-hidden"
        >
          <motion.div
            className="w-full flex flex-col items-center gap-8 sm:gap-12"
            variants={sectionFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Section Title */}
            <motion.h2
              className="font-magic text-3xl sm:text-4xl md:text-5xl text-amber-100 [text-shadow:0_0_10px_rgba(251,191,36,0.7)] mb-16 sm:mb-20 md:mb-24 text-center px-4"
              variants={itemFadeIn}
            >
              A Saga of Wizards, Wits, and Wonders
            </motion.h2>

            {/* Banners Grid */}
            <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2 mb-2 sm:mb-4">
              {/* Gryffindor Banner */}
              <motion.div
                className="h-36 sm:h-44 md:h-52 rounded-lg border-2 sm:border-4 border-red-800/50 shadow-2xl p-3 sm:p-4 flex flex-col justify-between text-center relative overflow-hidden group"
                whileHover={{ scale: 1.05, shadow: '0 0 30px rgba(185, 28, 28, 0.7)' }}
                style={{ y: trialBannerY(0) }}
                variants={itemFadeIn}
              >
                <Image
                  src="/images/gryffindor-bg.jpg"
                  alt="Gryffindor theme"
                  layout="fill"
                  objectFit="cover"
                  className="z-0 opacity-30 group-hover:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="relative z-20 flex flex-col justify-between h-full">
                  <h3 className="font-magic text-2xl sm:text-3xl text-red-200">Gryffindor</h3>
                  <p className="font-serif text-base sm:text-lg text-gray-300 px-2">
                    "The trial of <b>courage</b>. To stand against darkness, even when one stands alone."
                  </p>
                  <div className="w-full h-2 bg-gradient-to-r from-red-700 via-red-500 to-red-700"></div>
                </div>
              </motion.div>

              {/* Ravenclaw Banner */}
              <motion.div
                className="h-48 sm:h-56 md:h-64 rounded-lg border-2 sm:border-4 border-blue-800/50 shadow-2xl p-3 sm:p-4 flex flex-col justify-between text-center relative overflow-hidden group"
                whileHover={{ scale: 1.05, shadow: '0 0 30px rgba(30, 64, 175, 0.7)' }}
                style={{ y: trialBannerY(1) }}
                variants={itemFadeIn}
              >
                <Image
                  src="/images/ravenclaw-bg.jpg"
                  alt="Ravenclaw theme"
                  layout="fill"
                  objectFit="cover"
                  className="z-0 opacity-30 group-hover:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="relative z-20 flex flex-col justify-between h-full">
                  <h3 className="font-magic text-2xl sm:text-3xl text-blue-200">Ravenclaw</h3>
                  <p className="font-serif text-base sm:text-lg text-gray-300 px-2">
                    "The trial of <b>wit</b>. To understand that the deepest riddle is not a lock, but a key."
                  </p>
                  <div className="w-full h-2 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700"></div>
                </div>
              </motion.div>

              {/* Hufflepuff Banner */}
              <motion.div
                className="h-48 sm:h-56 md:h-64 rounded-lg border-2 sm:border-4 border-yellow-800/50 shadow-2xl p-3 sm:p-4 flex flex-col justify-between text-center relative overflow-hidden group"
                whileHover={{ scale: 1.05, shadow: '0 0 30px rgba(180, 130, 28, 0.7)' }}
                style={{ y: trialBannerY(2) }}
                variants={itemFadeIn}
              >
                <Image
                  src="/images/hufflepuff-bg.jpg"
                  alt="Hufflepuff theme"
                  layout="fill"
                  objectFit="cover"
                  className="z-0 opacity-30 group-hover:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="relative z-20 flex flex-col justify-between h-full">
                  <h3 className="font-magic text-2xl sm:text-3xl text-yellow-200">Hufflepuff</h3>
                  <p className="font-serif text-base sm:text-lg text-gray-300 px-2">
                    "The trial of <b>loyalty</b>. To be the shield for those who have no other."
                  </p>
                  <div className="w-full h-2 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700"></div>
                </div>
              </motion.div>

              {/* Slytherin Banner (with question mark) */}
              <motion.div
                className="h-48 sm:h-56 md:h-64 rounded-lg border-2 sm:border-4 border-green-800/50 shadow-2xl p-3 sm:p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group"
                whileHover={{ scale: 1.05, shadow: '0 0 30px rgba(22, 101, 52, 0.7)' }}
                style={{ y: trialBannerY(3) }}
                variants={itemFadeIn}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>

                {/* Giant question mark */}
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <motion.h1
                    className="text-[6rem] sm:text-[7rem] md:text-[8rem] font-magic text-green-200 opacity-90 drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ?
                  </motion.h1>
                </div>
              </motion.div>
            </div>

            {/* --- Start Trial Button with Decorative Elements --- */}
            <div className="relative w-full flex justify-center items-center mt-0 mb-16 sm:mb-24">
              {/* Left Line - Hidden on mobile */}
              <div className="absolute left-0 w-1/3 hidden sm:flex items-center">
                <div className="h-[2px] flex-grow bg-gradient-to-r from-transparent to-amber-400"></div>
              </div>

              {/* Right Line - Hidden on mobile */}
              <div className="absolute right-0 w-1/3 hidden sm:flex items-center">
                <div className="h-[2px] flex-grow bg-gradient-to-l from-transparent to-amber-400"></div>
              </div>

              {/* Button Container */}
              <div className="relative">
                {/* Button */}
                <motion.button
                  onClick={() => window.location.href = '/public'}
                  className="font-magic px-6 sm:px-12 md:px-16 py-2 sm:py-3 md:py-4 
                            bg-transparent text-white text-base sm:text-xl md:text-2xl 
                            rounded-md relative z-10 
                            border-2 border-amber-400
                            uppercase tracking-wider overflow-hidden
                            scale-90 sm:scale-100"
                  initial="initial"
                  animate="animate"
                >
                  <motion.span
                    className="block whitespace-nowrap"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.8,
                      ease: "easeOut",
                      delay: 0.2
                    }}
                  >
                    Begin Your Trial
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>


        {/* --- Leaderboard Section (Snap Point 4) --- */}
        <section 
          ref={leaderboardRef} 
          className="min-h-screen snap-start flex flex-col items-center justify-start relative z-20 p-4 sm:p-6 md:p-8 overflow-hidden"
        >
          {/* Content Container */}
          <motion.div
            className="w-full max-w-5xl flex flex-col items-center relative z-10 pt-8 sm:pt-10"
            variants={sectionFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            style={{ y: leaderboardContentY }}
          >
            {/* Title */}
            <motion.h2
              className="font-magic text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-amber-100 [text-shadow:0_0_15px_rgba(251,191,36,0.8)] mb-6 sm:mb-8 text-center px-4"
              variants={itemFadeIn}
            >
              The Final Standings
            </motion.h2>
            <motion.p 
              className="font-serif text-base sm:text-lg md:text-xl text-gray-300 -mt-4 sm:-mt-5 mb-12 sm:mb-14 text-center px-4 opacity-90"
              variants={itemFadeIn}
            >
              The trials are complete. View the results of your courage and cunning.
            </motion.p>

            {/* Links Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-20 w-full max-w-4xl px-2"
              variants={sectionFadeIn}
            >
              
              {/* --- House Leaderboard Link --- */}
              <motion.a
                href="/public/house-leaderboard"
                className="relative p-6 sm:p-8 bg-[#0c0c0c] border-2 border-amber-800/60 rounded-lg shadow-2xl overflow-hidden cursor-pointer group"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(251, 191, 36, 0.1)'
                }}
                variants={itemFadeIn}
                whileHover="hover"
              >
                {/* Glowing orb/effect */}
                <motion.div 
                  className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500 rounded-full blur-3xl opacity-10 transition-opacity duration-500"
                  variants={{ hover: { opacity: 0.2, scale: 1.3 } }}
                />
                
                {/* Corner Emblem: House Cup */}
                <div className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 opacity-20 group-hover:opacity-60 transition-opacity duration-300">
                  <svg className="w-full h-full text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 3a1 1 0 011-1h6a1 1 0 011 1v1h2a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2V3zm4 2V4h-2v1h2zm-3 8V8h2v5H7zm6 0V8h2v5h-2z" clipRule="evenodd" /></svg>
                </div>

                <h3 className="font-magic text-3xl sm:text-4xl text-amber-200 mb-2 sm:mb-3 relative z-10">
                  House Cup
                </h3>
                <p className="font-serif text-base sm:text-lg text-gray-400 relative z-10">
                  View the points for Gryffindor, Ravenclaw, Hufflepuff, and Slytherin.
                </p>

                {/* Arrow on hover */}
                <motion.div 
                  className="relative z-10 mt-4 sm:mt-6 text-amber-500 font-serif font-bold text-base sm:text-lg"
                  variants={{ hover: { x: 10 } }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  See Standings &rarr;
                </motion.div>
              </motion.a>

              {/* --- Team Leaderboard Link --- */}
              <motion.a
                href="/public/team-leaderboard"
                className="relative p-6 sm:p-8 bg-[#0c0c0c] border-2 border-emerald-800/60 rounded-lg shadow-2xl overflow-hidden cursor-pointer group"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(22, 163, 74, 0.1)'
                }}
                variants={itemFadeIn}
                whileHover="hover"
              >
                {/* Glowing orb/effect */}
                <motion.div 
                  className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500 rounded-full blur-3xl opacity-10 transition-opacity duration-500"
                  variants={{ hover: { opacity: 0.2, scale: 1.3 } }}
                />

                {/* Corner Emblem: Dueling Wands/Stars */}
                <div className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 opacity-20 group-hover:opacity-60 transition-opacity duration-300">
                  <svg className="w-full h-full text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>

                <h3 className="font-magic text-3xl sm:text-4xl text-emerald-200 mb-2 sm:mb-3 relative z-10">
                  Team Trials
                </h3>
                <p className="font-serif text-base sm:text-lg text-gray-400 relative z-10">
                  See the results from the team-based duels and challenges.
                </p>

                {/* Arrow on hover */}
                <motion.div 
                  className="relative z-10 mt-4 sm:mt-6 text-emerald-500 font-serif font-bold text-base sm:text-lg"
                  variants={{ hover: { x: 10 } }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  See Roster &rarr;
                </motion.div>
              </motion.a>

            </motion.div>
          </motion.div>
        </section>

      </div>
    </div>
  )
}
