"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Code, Mic, Award, CheckCircle, ArrowRight, Play, Pause, RotateCcw, Sparkles, Zap } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

interface InteractiveDemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InteractiveDemoModal({ isOpen, onClose }: InteractiveDemoModalProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aiConfidence, setAiConfidence] = useState(0)

  const demoSteps = [
    {
      title: t("demo.steps.portfolio_analysis.title"),
      description: t("demo.steps.portfolio_analysis.description"),
      icon: Code,
      color: "from-cyan-500 to-blue-600",
      simulation: t("demo.steps.portfolio_analysis.simulation"),
    },
    {
      title: t("demo.steps.voice_evaluation.title"),
      description: t("demo.steps.voice_evaluation.description"),
      icon: Mic,
      color: "from-purple-500 to-pink-600",
      simulation: t("demo.steps.voice_evaluation.simulation"),
    },
    {
      title: t("demo.steps.ai_generation.title"),
      description: t("demo.steps.ai_generation.description"),
      icon: Brain,
      color: "from-amber-500 to-orange-600",
      simulation: t("demo.steps.ai_generation.simulation"),
    },
    {
      title: t("demo.steps.final_certification.title"),
      description: t("demo.steps.final_certification.description"),
      icon: Award,
      color: "from-green-500 to-teal-600",
      simulation: t("demo.steps.final_certification.simulation"),
    },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentStep < demoSteps.length) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentStep < demoSteps.length - 1) {
              setCurrentStep((prevStep) => prevStep + 1)
              setAiConfidence((prev) => Math.min(prev + 20, 94))
              return 0
            } else {
              setIsPlaying(false)
              return 100
            }
          }
          return prev + 2
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, demoSteps.length])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setProgress(0)
    setAiConfidence(0)
    setIsPlaying(false)
  }

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setProgress(0)
      setAiConfidence((prev) => Math.min(prev + 20, 94))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center flex items-center justify-center">
            <Sparkles className="h-6 w-6 mr-2 text-cyan-400" />
            {t("demo.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 p-6">
          {/* Demo Progress */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                {t("demo.step_counter", { current: currentStep + 1, total: demoSteps.length })}
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                {t("demo.ai_confidence", { confidence: aiConfidence })}
              </Badge>
            </div>
            <Progress value={(currentStep / (demoSteps.length - 1)) * 100} className="h-2 mb-4" />
          </div>

          {/* Current Step Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-r ${demoSteps[currentStep].color} flex items-center justify-center mx-auto mb-6`}
              >
                {(() => {
                  const Icon = demoSteps[currentStep].icon
                  return <Icon className="h-12 w-12 text-white" />
                })()}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{demoSteps[currentStep].title}</h3>
              <p className="text-gray-300 text-lg mb-6">{demoSteps[currentStep].description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Simulation Display */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">{t("demo.realtime_simulation")}</h4>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm">{t("demo.ai_active")}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-cyan-400 font-mono text-sm">{demoSteps[currentStep].simulation}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{t("demo.progress")}</span>
                  <span className="text-white">{Math.floor(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Simulated Results */}
              {currentStep === 0 && progress > 50 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("demo.results.javascript_expert")}
                  </div>
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("demo.results.react_advanced")}
                  </div>
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("demo.results.clean_code")}
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && progress > 30 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className="flex items-center text-purple-400 text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    {t("demo.results.clarity_excellent")}
                  </div>
                  <div className="flex items-center text-purple-400 text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    {t("demo.results.technical_expertise")}
                  </div>
                  <div className="flex items-center text-purple-400 text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    {t("demo.results.presentation_confidence")}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-green-900/30 to-teal-900/30 rounded-lg p-4 border border-green-500/30"
                >
                  <div className="flex items-center mb-2">
                    <Award className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-green-400 font-semibold">{t("demo.results.certificate_generated")}</span>
                  </div>
                  <p className="text-white font-medium">{t("demo.results.expert_react_developer")}</p>
                  <p className="text-gray-300 text-sm">{t("demo.results.confidence_verified")}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Demo Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={handlePlayPause}
              className={`${
                isPlaying
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              } text-white`}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? t("demo.controls.pause") : t("demo.controls.start")}
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentStep >= demoSteps.length - 1}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {t("demo.controls.next")}
            </Button>

            <Button
              onClick={handleRestart}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("demo.controls.restart")}
            </Button>
          </div>

          {/* Call to Action */}
          {currentStep === demoSteps.length - 1 && progress === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-500/30"
            >
              <h3 className="text-white font-semibold text-xl mb-4">{t("demo.cta.ready_to_start")}</h3>
              <p className="text-gray-300 mb-6">
                {t("demo.cta.join_thousands")}
              </p>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t("demo.cta.join_beta")}
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
