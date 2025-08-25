"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Target,
  BookOpen,
  Award,
  BarChart3,
  Bell,
  User,
  Sparkles
} from "lucide-react"

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  position: "top" | "bottom" | "left" | "right"
  icon: any
  highlight?: boolean
}

interface FeatureTourProps {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function FeatureTour({ isActive, onComplete, onSkip }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Votre nouveau tableau de bord",
      description: "Bienvenue dans votre espace personnel Corp1o1. Ici, vous pouvez suivre vos progrès et accéder à toutes vos fonctionnalités.",
      target: "dashboard-header",
      position: "bottom",
      icon: Sparkles,
      highlight: true
    },
    {
      id: "stats",
      title: "Statistiques en temps réel",
      description: "Suivez vos métriques clés : confiance IA, certificats obtenus, rang global et série d'apprentissage.",
      target: "quick-stats",
      position: "bottom",
      icon: BarChart3
    },
    {
      id: "actions",
      title: "Actions rapides",
      description: "Accédez rapidement aux fonctionnalités principales : nouvelles évaluations, cours et certificats.",
      target: "quick-actions",
      position: "bottom",
      icon: Target
    },
    {
      id: "skills",
      title: "Progression des compétences",
      description: "Visualisez votre progression dans différents domaines et identifiez vos points forts.",
      target: "skill-progress",
      position: "top",
      icon: Award
    },
    {
      id: "learning",
      title: "Parcours d'apprentissage",
      description: "Continuez vos cours actifs et découvrez de nouveaux parcours adaptés à vos objectifs.",
      target: "learning-paths",
      position: "top",
      icon: BookOpen
    },
    {
      id: "profile",
      title: "Menu utilisateur",
      description: "Gérez votre profil, paramètres et abonnement depuis ce menu. N'oubliez pas de consulter vos notifications!",
      target: "user-menu",
      position: "left",
      icon: User
    }
  ]

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
    }
  }, [isActive])

  const currentTourStep = tourSteps[currentStep]

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkipTour = () => {
    setIsVisible(false)
    setTimeout(() => {
      onSkip()
    }, 300)
  }

  if (!isActive || !isVisible) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      
      {/* Tour tooltip - responsive positioning */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-50 w-[90%] max-w-sm inset-x-0 mx-auto sm:w-auto sm:inset-auto"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-revolutionary-cyan/20 shadow-2xl shadow-revolutionary-cyan/10 p-4 sm:p-6">
            {/* Close button - improved touch target */}
            <button
              onClick={handleSkipTour}
              className="absolute right-2 top-2 sm:right-3 sm:top-3 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <currentTourStep.icon className="h-5 w-5 text-revolutionary-cyan" />
                <Badge variant="secondary" className="text-xs">
                  {currentStep + 1} / {tourSteps.length}
                </Badge>
              </div>
              {currentTourStep.highlight && (
                <Badge className="bg-gradient-to-r from-revolutionary-amber/20 to-revolutionary-orange/20 text-revolutionary-amber border border-revolutionary-amber/30">
                  Important
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentTourStep.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentTourStep.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation - responsive layout */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={handleSkipTour}
                className="text-gray-400 hover:text-white text-xs sm:text-sm w-full sm:w-auto"
              >
                Passer la visite
              </Button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    size="sm"
                    className="text-gray-300 hover:text-white flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Précédent</span>
                    <span className="sm:hidden">Préc.</span>
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90 text-white flex-1 sm:flex-none"
                >
                  {currentStep < tourSteps.length - 1 ? (
                    <>
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Terminer
                      <Sparkles className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Pointer arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800/95" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Helper text for specific elements - responsive */}
      <div className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:transform sm:-translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-revolutionary-cyan/20 to-revolutionary-blue/20 backdrop-blur-lg rounded-lg px-3 sm:px-4 py-2 border border-revolutionary-cyan/30 text-center"
        >
          <p className="text-white text-sm">
            👆 Regardez cette section: <span className="font-medium text-revolutionary-cyan">{currentTourStep.title}</span>
          </p>
        </motion.div>
      </div>
    </>
  )
}