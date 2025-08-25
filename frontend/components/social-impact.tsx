"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Heart, Globe, Users, TrendingUp, ArrowRight } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

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

// Simple Impact Stat component
function ImpactStat({ 
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
    (rawValue >= 1000000 ? `${(count / 1000000).toFixed(1)}M` :
     rawValue >= 1000 ? `${Math.floor(count / 1000)}K` :
     count.toLocaleString()) : value
     
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      className="text-center"
    >
      <div className="text-3xl md:text-4xl font-bold text-white leading-none mb-2">
        {displayValue}
      </div>
      <div className="text-sm text-muted-foreground font-normal">
        {label}
      </div>
    </motion.div>
  )
}

export function SocialImpact() {
  const { t } = useTranslation()
  
  const impactStats = [
    {
      value: "125K",
      rawValue: 125000,
      label: "Funds raised for education"
    },
    {
      value: "2.5K",
      rawValue: 2500,
      label: "Youth helped worldwide"
    },
    {
      value: "85",
      rawValue: 85,
      label: "Countries reached"
    },
    {
      value: "350K",
      rawValue: 350000,
      label: "Target amount for 2024"
    }
  ]

  const initiatives = [
    {
      icon: TrendingUp,
      title: "Free Skills Training",
      description: "Providing accessible skill development programs for underserved communities."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connecting learners worldwide with opportunities for growth and development."
    },
    {
      icon: Heart,
      title: "Community First",
      description: "Building sustainable programs that create lasting impact in local communities."
    }
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-revolutionary-blue/2">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-revolutionary-cyan/20 mb-6">
            <Heart className="w-4 h-4 text-revolutionary-cyan mr-2" />
            <span className="text-sm font-semibold text-revolutionary-cyan uppercase tracking-wider">
              Social Impact
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Making a difference through education
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every skill assessment purchased helps fund free education programs for underserved youth worldwide.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {impactStats.map((stat, index) => (
            <div key={index} className="flex justify-center">
              <ImpactStat
                value={stat.value}
                rawValue={stat.rawValue}
                label={stat.label}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Progress Bar Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="glass rounded-2xl p-8 border border-revolutionary-cyan/10">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">2024 Impact Goal</h3>
              <p className="text-muted-foreground">Help 5,000 students access quality education</p>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>$125K of $350K raised</span>
              </div>
              <div className="w-full bg-revolutionary-blue/10 rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-amber h-3 rounded-full"
                  initial={{ width: '0%' }}
                  whileInView={{ width: '36%' }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground mt-2">
                36% complete
              </div>
            </div>
          </div>
        </motion.div>

        {/* Initiatives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {initiatives.map((initiative, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass rounded-2xl p-6 border border-revolutionary-cyan/10 hover:border-revolutionary-cyan/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-revolutionary-cyan/20 rounded-2xl flex items-center justify-center mb-4">
                <initiative.icon className="w-6 h-6 text-revolutionary-cyan" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {initiative.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {initiative.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="glass rounded-2xl p-8 border border-revolutionary-cyan/10 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Join our mission
            </h3>
            <p className="text-muted-foreground mb-6">
              Every purchase contributes to our education fund. Together, we're building a more skilled and equitable world.
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-revolutionary-cyan text-white rounded-xl font-semibold hover:bg-revolutionary-cyan/90 transition-colors duration-200">
              Learn more about our impact
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}