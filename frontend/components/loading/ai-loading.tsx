"use client"

import React from "react"
import { motion } from "framer-motion"
import { Brain, Sparkles, Zap, Target, BookOpen, TrendingUp } from "lucide-react"

interface AILoadingProps {
  stage?: string
  progress?: number
}

export const AILoading: React.FC<AILoadingProps> = ({ stage = "Analyzing your profile", progress = 0 }) => {
  const loadingStages = [
    { icon: Brain, text: "Analyzing your profile", color: "revolutionary-cyan" },
    { icon: Target, text: "Identifying learning goals", color: "revolutionary-purple" },
    { icon: BookOpen, text: "Creating personalized curriculum", color: "revolutionary-amber" },
    { icon: TrendingUp, text: "Optimizing learning path", color: "revolutionary-cyan" },
    { icon: Sparkles, text: "Finalizing your experience", color: "revolutionary-purple" }
  ]

  const currentStageIndex = loadingStages.findIndex(s => s.text === stage) || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 border border-revolutionary-cyan/20"
        >
          {/* AI Brain Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-revolutionary-cyan/20 to-revolutionary-purple/20 rounded-full blur-xl"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative w-24 h-24 bg-gradient-to-br from-revolutionary-cyan to-revolutionary-purple rounded-full flex items-center justify-center"
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              
              {/* Orbiting particles */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-revolutionary-cyan rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    x: [0, 40 * Math.cos((i * 120) * Math.PI / 180), 0],
                    y: [0, 40 * Math.sin((i * 120) * Math.PI / 180), 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white text-center mb-2"
          >
            AI is personalizing your experience
          </motion.h2>

          {/* Current Stage */}
          <motion.p
            key={stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-revolutionary-cyan mb-8"
          >
            {stage}...
          </motion.p>

          {/* Progress Stages */}
          <div className="space-y-3 mb-6">
            {loadingStages.map((loadingStage, index) => {
              const Icon = loadingStage.icon
              const isActive = index === currentStageIndex
              const isCompleted = index < currentStageIndex

              return (
                <motion.div
                  key={loadingStage.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-revolutionary-blue/20 border border-revolutionary-cyan/30' : 
                    isCompleted ? 'opacity-60' : 'opacity-30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? `bg-${loadingStage.color}/20` : 'bg-revolutionary-blue/10'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isActive ? `text-${loadingStage.color}` : 
                      isCompleted ? 'text-green-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <span className={`text-sm ${
                    isActive ? 'text-white font-medium' : 'text-muted-foreground'
                  }`}>
                    {loadingStage.text}
                  </span>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-auto"
                    >
                      <Zap className="w-4 h-4 text-revolutionary-cyan" />
                    </motion.div>
                  )}
                  {isCompleted && (
                    <div className="ml-auto">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 bg-green-500 rounded-full"
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-revolutionary-blue/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-revolutionary-cyan to-revolutionary-purple rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStageIndex + 1) * 20}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Info Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground text-center mt-6"
          >
            This usually takes 10-15 seconds. We're creating a unique learning experience just for you.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}