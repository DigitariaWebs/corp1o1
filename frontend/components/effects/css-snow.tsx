'use client'

import React from 'react'

interface CSSSnowProps {
  count?: number
  className?: string
}

export default function CSSSnow({ count = 50, className = '' }: CSSSnowProps) {
  return (
    <div className={`snow-container ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${12 + Math.random() * 8}s`
          }}
        />
      ))}
    </div>
  )
}
