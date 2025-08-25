"use client"

import { Container, Section, Grid } from "@/components/ui-v2/container"
import { Stat } from "@/components/ui-v2/typography"
import { useTranslation } from "@/hooks/use-translation"
import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { MessageSquare, Zap, Users, Target, TrendingUp, Activity } from "lucide-react"

// Simple animated counter hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  
  const start = () => {
    if (hasStarted) return
    setHasStarted(true)
    
    let startTime: number | null = null
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * end))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }
  
  return { count, start }
}

// Simple Stat component with clean animation
function AnimatedStat({ 
  value, 
  rawValue, 
  label,
  index 
}: { 
  value: string
  rawValue?: number
  label: string
  index: number 
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, threshold: 0.3 })
  const { count, start } = useCountUp(rawValue || 0)
  
  useEffect(() => {
    if (inView) {
      start()
    }
  }, [inView, start])
  
  const displayValue = rawValue ? 
    (rawValue >= 1000000000 ? `${Math.floor(count / 1000000000)}B+` :
     rawValue >= 1000000 ? `${(count / 1000000).toFixed(2)}M` :
     rawValue >= 1000 ? `${Math.floor(count / 1000)}k+` :
     count.toString() + '%') : value
     
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      className="flex flex-col items-center text-center h-20 justify-center"
    >
      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-none mb-2 min-h-[40px] flex items-center">
        {displayValue}
      </div>
      <div className="text-xs text-muted-foreground font-normal leading-tight max-w-28">
        {label}
      </div>
    </motion.div>
  )
}

export function RevolutionaryStats() {
  const { t } = useTranslation()
  
  const stats = [
    {
      value: "64B+",
      rawValue: 64,
      label: "Messages sent in 2024"
    },
    {
      value: "4B+",
      rawValue: 4,
      label: "API calls per year"
    },
    {
      value: "1.05m",
      rawValue: 1050000,
      label: "Daily active users"
    },
    {
      value: "99.7%",
      rawValue: 99.7,
      label: "AI Precision Rate"
    }
  ]

  return (
    <Section spacing="md" className="border-y border-revolutionary-cyan/5 bg-gradient-to-b from-background to-revolutionary-blue/2 py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto items-stretch">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-center">
              <AnimatedStat
                value={stat.value}
                rawValue={stat.rawValue}
                label={stat.label}
                index={index}
              />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
