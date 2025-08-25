"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"

interface ParticleProps {
  size: number
  x: number
  y: number
  delay: number
  duration: number
  color: string
}

const Particle: React.FC<ParticleProps> = ({ size, x, y, delay, duration, color }) => {
  return (
    <div
      className="absolute rounded-full opacity-60 animate-subtle-float"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  )
}

interface ParticleAnimationProps {
  className?: string
  particleCount?: number
}

export function ParticleAnimation({ className, particleCount = 50 }: ParticleAnimationProps) {
  // Generate particles with random properties
  const particles = useMemo(() => {
    const colors = [
      '#22d3ee', // revolutionary-cyan
      '#f59e0b', // revolutionary-amber  
      '#8b5cf6', // revolutionary-purple
      '#ec4899', // revolutionary-pink
    ]

    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 1, // 1-5px
      x: Math.random() * 100, // 0-100%
      y: Math.random() * 100, // 0-100%
      delay: Math.random() * 4, // 0-4s delay
      duration: Math.random() * 3 + 3, // 3-6s duration
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [particleCount])

  return (
    <div 
      className={cn(
        "relative w-full h-96 overflow-hidden",
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-revolutionary-cyan/10 rounded-full blur-3xl animate-glow-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-revolutionary-purple/10 rounded-full blur-2xl animate-glow-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          size={particle.size}
          x={particle.x}
          y={particle.y}
          delay={particle.delay}
          duration={particle.duration}
          color={particle.color}
        />
      ))}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6"/>
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        
        {/* Animated connection lines */}
        <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-glow-pulse" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;10" dur="3s" repeatCount="indefinite"/>
        </line>
        <line x1="70%" y1="30%" x2="30%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-glow-pulse" strokeDasharray="3,7" style={{ animationDelay: '1.5s' }}>
          <animate attributeName="stroke-dashoffset" values="10;0" dur="4s" repeatCount="indefinite"/>
        </line>
        <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-glow-pulse" strokeDasharray="8,4" style={{ animationDelay: '3s' }}>
          <animate attributeName="stroke-dashoffset" values="0;12" dur="5s" repeatCount="indefinite"/>
        </line>
      </svg>

      {/* Floating elements */}
      <div className="absolute top-1/4 left-1/4 w-8 h-8 border border-revolutionary-cyan/30 rounded-lg animate-subtle-float" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-6 h-6 border border-revolutionary-amber/30 rounded-full animate-subtle-float" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-revolutionary-purple/20 rounded animate-subtle-float" style={{ animationDelay: '5s', animationDuration: '7s' }}></div>
    </div>
  )
}