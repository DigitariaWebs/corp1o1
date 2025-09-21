'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'

interface SnowDot {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  drift: number
  rotation: number
  rotationSpeed: number
}

interface SnowDotsProps {
  count?: number
  speed?: number
  size?: { min: number; max: number }
  opacity?: { min: number; max: number }
  className?: string
  wind?: number
}

export default function SnowDots({
  count = 60,
  speed = 1,
  size = { min: 2, max: 4 },
  opacity = { min: 0.1, max: 0.8 },
  className = '',
  wind = 0.2
}: SnowDotsProps) {
  const [snowDots, setSnowDots] = useState<SnowDot[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number>()

  // Initialize snow dots
  const initializeSnowDots = useCallback(() => {
    const dots: SnowDot[] = []
    for (let i = 0; i < count; i++) {
      dots.push({
        id: i,
        x: Math.random() * (dimensions.width || window.innerWidth),
        y: Math.random() * (dimensions.height || window.innerHeight),
        size: Math.random() * (size.max - size.min) + size.min,
        opacity: Math.random() * (opacity.max - opacity.min) + opacity.min,
        speed: Math.random() * 0.5 + 0.5,
        drift: (Math.random() - 0.5) * wind,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2
      })
    }
    setSnowDots(dots)
  }, [count, size, opacity, dimensions, wind])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Initialize snow dots when dimensions are available
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      initializeSnowDots()
    }
  }, [dimensions, initializeSnowDots])

  // Animate snow dots using requestAnimationFrame for better performance
  useEffect(() => {
    if (snowDots.length === 0) return

    const animate = () => {
      setSnowDots(prevDots =>
        prevDots.map(dot => {
          let newY = dot.y + dot.speed * speed
          let newX = dot.x + dot.drift + Math.sin(dot.y * 0.01) * 0.3
          let newRotation = dot.rotation + dot.rotationSpeed

          // Reset position when dot goes off screen
          if (newY > dimensions.height) {
            newY = -10
            newX = Math.random() * dimensions.width
            newRotation = Math.random() * 360
          }

          // Keep x within bounds with some drift
          if (newX < -10) {
            newX = dimensions.width + 10
          } else if (newX > dimensions.width + 10) {
            newX = -10
          }

          return {
            ...dot,
            x: newX,
            y: newY,
            rotation: newRotation
          }
        })
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [snowDots.length, speed, dimensions])

  if (dimensions.width === 0 || dimensions.height === 0) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ width: '100vw', height: '100vh' }}
    >
      {snowDots.map(dot => (
        <div
          key={dot.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.opacity,
            transform: `rotate(${dot.rotation}deg)`,
            boxShadow: `0 0 ${dot.size * 2}px rgba(255, 255, 255, ${dot.opacity * 0.5})`,
            filter: `blur(${dot.size < 2 ? 0.5 : 0}px)`
          }}
        />
      ))}
    </div>
  )
}
