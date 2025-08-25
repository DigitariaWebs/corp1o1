"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Brain, 
  Award, 
  TrendingUp, 
  Zap,
  ChevronRight,
  X 
} from "lucide-react"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onStartTour: () => void
  userName: string
}

export function WelcomeModal({ isOpen, onClose, onStartTour, userName }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const welcomeSteps = [
    {
      title: `Bienvenue, ${userName}! 🎉`,
      subtitle: "Votre révolution des compétences commence maintenant",
      description: "Corp1o1 utilise l'IA pour révolutionner la façon dont vous développez et validez vos compétences.",
      features: [
        { icon: Brain, text: "IA avancée d'évaluation", color: "text-revolutionary-cyan" },
        { icon: Award, text: "Certificats blockchain", color: "text-revolutionary-amber" },
        { icon: TrendingUp, text: "Apprentissage adaptatif", color: "text-revolutionary-purple" }
      ]
    },
    {
      title: "Découvrez vos super-pouvoirs",
      subtitle: "L'ère des diplômes poussiéreux est révolue",
      description: "Notre IA analyse vos compétences réelles et vous aide à progresser de manière personnalisée.",
      features: [
        { icon: Zap, text: "Évaluations instantanées", color: "text-green-500" },
        { icon: Brain, text: "Recommandations IA", color: "text-revolutionary-cyan" },
        { icon: TrendingUp, text: "Suivi en temps réel", color: "text-revolutionary-purple" }
      ]
    },
    {
      title: "Prêt à commencer?",
      subtitle: "Votre parcours personnalisé vous attend",
      description: "Nous allons vous guider à travers votre nouveau tableau de bord et vous montrer comment maximiser votre potentiel.",
      features: [
        { icon: Award, text: "Première évaluation gratuite", color: "text-revolutionary-amber" },
        { icon: Brain, text: "Parcours adaptatif", color: "text-revolutionary-cyan" },
        { icon: Sparkles, text: "Débloquez votre potentiel", color: "text-revolutionary-pink" }
      ]
    }
  ]

  const currentWelcome = welcomeSteps[currentStep]

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onStartTour()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-revolutionary-cyan/20 shadow-2xl shadow-revolutionary-cyan/10">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Bienvenue dans Corp1o1 - Guide d'introduction
        </DialogTitle>
        
        {/* Close button - improved positioning for mobile */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 sm:right-4 sm:top-4 text-gray-400 hover:text-white transition-colors z-50 p-2 rounded-lg hover:bg-slate-700/50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-revolutionary-cyan/5 to-revolutionary-blue/5 rounded-lg" />
          
          <div className="relative p-4 sm:p-6 md:p-8">
            {/* Progress indicator */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {welcomeSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index <= currentStep 
                        ? "bg-revolutionary-cyan" 
                        : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-2">
                  {currentWelcome.title}
                </h1>
                
                {/* Subtitle */}
                <p className="text-revolutionary-cyan text-lg mb-4">
                  {currentWelcome.subtitle}
                </p>
                
                {/* Description */}
                <p className="text-gray-300 mb-8 leading-relaxed">
                  {currentWelcome.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {currentWelcome.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-4 border border-revolutionary-cyan/10"
                    >
                      <feature.icon className={`h-8 w-8 ${feature.color} mx-auto mb-2`} />
                      <p className="text-white text-sm font-medium">{feature.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Action buttons - responsive layout */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-400 hover:text-white w-full sm:w-auto"
              >
                Passer l'introduction
              </Button>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-gray-300 hover:text-white flex-1 sm:flex-none"
                  >
                    Précédent
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90 text-white font-semibold px-4 sm:px-6 flex-1 sm:flex-none"
                >
                  {currentStep < welcomeSteps.length - 1 ? (
                    <>
                      <span className="hidden sm:inline">Suivant</span>
                      <span className="sm:hidden">Suivant</span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Commencer la visite</span>
                      <span className="sm:hidden">Commencer</span>
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Beta badge - improved positioning */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
              <Badge className="bg-gradient-to-r from-revolutionary-amber/20 to-revolutionary-orange/20 text-revolutionary-amber border border-revolutionary-amber/30 text-xs sm:text-sm">
                Beta
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}