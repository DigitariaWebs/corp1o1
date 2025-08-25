"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Award, 
  BookOpen, 
  BarChart3,
  Code,
  X,
  ChevronRight
} from "lucide-react"

interface FeatureUnlockProps {
  feature: {
    id: string
    title: string
    description: string
    icon: any
    unlockCondition: string
    benefits: string[]
  }
  isVisible: boolean
  onExplore: () => void
  onDismiss: () => void
}

export function FeatureUnlock({ feature, isVisible, onExplore, onDismiss }: FeatureUnlockProps) {
  const [isShowing, setIsShowing] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true)
      // Auto-dismiss after 10 seconds if user doesn't interact
      const timer = setTimeout(() => {
        handleDismiss()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const handleDismiss = () => {
    setIsShowing(false)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }

  const handleExplore = () => {
    setIsShowing(false)
    setTimeout(() => {
      onExplore()
    }, 300)
  }

  if (!isVisible || !isShowing) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Feature unlock modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="relative max-w-md w-full bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-revolutionary-cyan/20 shadow-2xl shadow-revolutionary-cyan/10 p-6"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Celebration animation */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-revolutionary-cyan/20 to-revolutionary-blue/20 rounded-full flex items-center justify-center border border-revolutionary-cyan/30"
            >
              <feature.icon className="h-8 w-8 text-revolutionary-cyan" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge className="bg-gradient-to-r from-revolutionary-amber/20 to-revolutionary-orange/20 text-revolutionary-amber border border-revolutionary-amber/30 mb-3">
                🎉 Nouvelle fonctionnalité débloquée!
              </Badge>
              
              <h2 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h2>
              
              <p className="text-gray-300 text-sm mb-4">
                {feature.description}
              </p>

              <div className="bg-gradient-to-r from-revolutionary-cyan/10 to-revolutionary-blue/10 rounded-lg p-3 mb-4">
                <p className="text-xs text-revolutionary-cyan font-medium">
                  Condition remplie: {feature.unlockCondition}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h3 className="text-sm font-semibold text-white mb-3">
              Ce que vous pouvez maintenant faire:
            </h3>
            <div className="space-y-2">
              {feature.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-1.5 h-1.5 bg-revolutionary-cyan rounded-full" />
                  <span className="text-gray-300 text-xs">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex space-x-3"
          >
            <Button
              onClick={handleExplore}
              className="flex-1 bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90 text-white font-semibold"
            >
              Explorer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white border border-slate-600"
            >
              Plus tard
            </Button>
          </motion.div>

          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="h-5 w-5 text-revolutionary-amber" />
            </motion.div>
          </div>
          
          <div className="absolute -bottom-2 -left-2">
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.1, 1] 
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="h-4 w-4 text-revolutionary-purple" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Predefined features that can be unlocked
export const UNLOCKABLE_FEATURES = {
  learningPaths: {
    id: "learning-paths",
    title: "Parcours d'apprentissage",
    description: "Accédez à des parcours personnalisés basés sur vos résultats d'évaluation",
    icon: BookOpen,
    unlockCondition: "Première évaluation complétée",
    benefits: [
      "Parcours adaptatif personnalisé",
      "Recommandations IA intelligentes", 
      "Suivi de progression détaillé"
    ]
  },
  
  analytics: {
    id: "analytics",
    title: "Analytics avancées",
    description: "Analysez vos performances avec des statistiques détaillées",
    icon: BarChart3,
    unlockCondition: "3 évaluations complétées",
    benefits: [
      "Graphiques de progression",
      "Comparaisons temporelles",
      "Insights personnalisés"
    ]
  },
  
  portfolio: {
    id: "portfolio",
    title: "Portfolio professionnel",
    description: "Créez votre portfolio de compétences avec intégrations",
    icon: Code,
    unlockCondition: "Premier certificat obtenu",
    benefits: [
      "Intégration GitHub/LinkedIn",
      "Portfolio public partageable",
      "Validation de compétences"
    ]
  },
  
  certificates: {
    id: "certificates",
    title: "Certificats blockchain",
    description: "Obtenez des certificats sécurisés et vérifiables",
    icon: Award,
    unlockCondition: "Cours complété avec succès",
    benefits: [
      "Certificats infalsifiables",
      "Reconnaissance internationale",
      "Partage professionnel"
    ]
  }
}