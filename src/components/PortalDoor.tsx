'use client'

import React from 'react'
import { motion } from 'framer-motion'

type Props = {
  title: string
  subtitle?: string
  href: string
  accent?: string
  role?: 'admin' | 'round-head' | 'user'
}

export default function PortalDoor({ title, subtitle, href, accent, role }: Props) {
  const getPortalColor = () => {
    switch (role) {
      case 'admin':
        return { primary: '#FFD700', secondary: '#FF6B00', light: 'rgba(255, 215, 0, 0.3)' }
      case 'round-head':
        return { primary: '#87CEEB', secondary: '#4169E1', light: 'rgba(135, 206, 235, 0.3)' }
      case 'user':
      default:
        return { primary: '#2E8B57', secondary: '#228B22', light: 'rgba(46, 139, 87, 0.3)' }
    }
  }

  const colors = getPortalColor()

  return (
    <div style={{ perspective: '1200px', fontFamily: 'Cinzel, serif' }}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotateX: 40 }}
        whileInView={{ scale: 1, opacity: 1, rotateX: 0 }}
        whileHover={{ y: -12, scale: 1.05, rotateX: -5 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        viewport={{ once: true }}
        style={{
          position: 'relative',
          width: '280px',
          height: '380px',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15, 10, 5, 0.98) 0%, rgba(40, 25, 15, 0.95) 100%)',
          border: '3px solid rgba(212, 175, 55, 0.7)',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.7), 
                       inset 0 0 40px ${colors.light},
                       0 0 80px ${colors.light}`,
          backdropFilter: 'blur(20px)',
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Animated background layers */}
        <motion.div
          animate={{
            background: [
              `radial-gradient(circle at 50% 50%, ${colors.light} 0%, transparent 60%)`,
              `radial-gradient(circle at 60% 40%, ${colors.light} 0%, transparent 70%)`,
              `radial-gradient(circle at 40% 60%, ${colors.light} 0%, transparent 70%)`,
              `radial-gradient(circle at 50% 50%, ${colors.light} 0%, transparent 60%)`
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Magical energy particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, Math.cos((i / 8) * Math.PI * 2) * 80, 0],
              y: [0, Math.sin((i / 8) * Math.PI * 2) * 80, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: (i / 8) * 0.5,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: colors.primary,
              boxShadow: `0 0 12px ${colors.primary}`,
              top: '50%',
              left: '50%',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        ))}

        {/* Main Portal Circle - Stunning Visual */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${colors.light}, transparent 50%)`,
            zIndex: 2,
            flexShrink: 0
          }}
        >
          {/* Outer ring - main */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `3px solid ${colors.primary}`,
              boxShadow: `0 0 40px ${colors.primary}, inset 0 0 30px ${colors.primary}40`,
              opacity: 0.8
            }}
          />

          {/* Middle ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '15px',
              borderRadius: '50%',
              border: `2px dashed ${colors.secondary}`,
              boxShadow: `0 0 20px ${colors.secondary}60`,
              opacity: 0.6
            }}
          />

          {/* Inner pulsing circle */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                `0 0 30px ${colors.primary}80, inset 0 0 20px ${colors.primary}40`,
                `0 0 50px ${colors.primary}, inset 0 0 30px ${colors.primary}`,
                `0 0 30px ${colors.primary}80, inset 0 0 20px ${colors.primary}40`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: '35px',
              borderRadius: '50%',
              border: `2px solid ${colors.primary}`,
              background: `radial-gradient(circle, ${colors.primary}20, transparent 70%)`,
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Magical sparkles/stars */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.div
              key={angle}
              animate={{ 
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                delay: (angle / 360) * 2
              }}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                background: colors.primary,
                borderRadius: '50%',
                boxShadow: `0 0 16px ${colors.primary}`,
                top: '50%',
                left: '50%',
                transform: `rotate(${angle}deg) translateY(-75px)`
              }}
            />
          ))}
        </motion.div>

        {/* Title */}
        <motion.h3
          animate={{ textShadow: [
            `0 0 10px ${colors.primary}40`,
            `0 0 20px ${colors.primary}80`,
            `0 0 10px ${colors.primary}40`
          ]}}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: colors.primary,
            margin: '12px 0 6px 0',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            textShadow: `0 2px 12px ${colors.primary}60`,
            position: 'relative',
            zIndex: 2,
            flex: '0 0 auto'
          }}
        >
          {title}
        </motion.h3>

        {/* Subtitle */}
        {subtitle && (
          <p style={{
            fontSize: '0.75rem',
            color: colors.primary,
            margin: '0 0 16px 0',
            opacity: 0.7,
            fontStyle: 'italic',
            letterSpacing: '0.3px',
            position: 'relative',
            zIndex: 2,
            flex: '0 0 auto'
          }}>
            {subtitle}
          </p>
        )}

        {/* Magical divider line */}
        <motion.div
          animate={{ 
            scaleX: [0.5, 1, 0.5],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
            margin: '12px 0',
            boxShadow: `0 0 10px ${colors.primary}`,
            position: 'relative',
            zIndex: 2,
            transformOrigin: 'center',
            flex: '0 0 auto'
          }}
        />

        {/* Enter button - Enchanted */}
        <motion.a
          href={href}
          whileHover={{
            scale: 1.1,
            boxShadow: `0 0 30px ${colors.primary}, 0 0 60px ${colors.secondary}60, inset 0 0 20px ${colors.primary}40`,
            y: -2
          }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'inline-block',
            marginTop: 'auto',
            padding: '10px 24px',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            color: '#0a0605',
            border: `2px solid ${colors.primary}`,
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'none',
            boxShadow: `0 6px 18px ${colors.primary}60, inset 0 1px 0 rgba(255,255,255,0.3), 0 0 15px ${colors.primary}40`,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 2,
            textShadow: `0 1px 3px rgba(0,0,0,0.5)`,
            flex: '0 0 auto'
          }}
        >
           Enter 
        </motion.a>

        {/* Corner magic runes - animated */}
        {[
          { top: '16px', left: '16px' },
          { top: '16px', right: '16px' },
          { bottom: '16px', left: '16px' },
          { bottom: '16px', right: '16px' }
        ].map((pos, idx) => (
          <motion.div
            key={idx}
            animate={{ 
              opacity: [0.2, 0.9, 0.2],
              rotate: [0, 360, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              delay: idx * 0.3,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              fontSize: '1.3rem',
              color: colors.primary,
              fontWeight: 'bold',
              textShadow: `0 0 12px ${colors.primary}`,
              filter: `drop-shadow(0 0 4px ${colors.primary})`,
              ...pos,
              zIndex: 2
            }}
          >
            ✦
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}