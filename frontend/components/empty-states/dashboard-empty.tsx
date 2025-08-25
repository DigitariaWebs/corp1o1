"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Award, 
  BookOpen,
  ArrowRight,
  Target,
  Zap
} from "lucide-react"

interface DashboardEmptyProps {
  userType: "complete-beginner" | "assessment-completed" | "learning-progress" | "advanced"
  userName: string
  onStartAssessment: () => void
  onExploreCourses: () => void
  onViewCertificates?: () => void
  onStartAIOnboarding?: () => void
}

export function DashboardEmpty({ 
  userType, 
  userName, 
  onStartAssessment, 
  onExploreCourses,
  onViewCertificates,
  onStartAIOnboarding
}: DashboardEmptyProps) {
  
  const getEmptyStateContent = () => {
    switch (userType) {
      case "complete-beginner":
        return {
          title: `Prêt à découvrir vos talents, ${userName}?`,
          subtitle: "L'aventure commence par une première évaluation",
          description: "Notre IA va analyser vos compétences et créer un parcours personnalisé pour maximiser votre potentiel.",
          primaryAction: {
            label: "Commencer l'évaluation",
            onClick: onStartAssessment,
            icon: Brain
          },
          secondaryAction: {
            label: "Explorer les cours",
            onClick: onExploreCourses,
            icon: BookOpen
          },
          features: [
            { icon: Brain, text: "Évaluation IA en 10 min", color: "text-revolutionary-cyan" },
            { icon: Target, text: "Parcours personnalisé", color: "text-revolutionary-purple" },
            { icon: Award, text: "Certificats reconnus", color: "text-revolutionary-amber" }
          ],
          illustration: "🚀"
        }

      case "assessment-completed":
        return {
          title: "Excellent! Vos résultats sont prêts",
          subtitle: "Découvrez vos parcours d'apprentissage recommandés",
          description: "Basé sur votre évaluation, nous avons sélectionné les meilleurs parcours pour développer vos compétences.",
          primaryAction: {
            label: "Voir mes recommandations",
            onClick: onExploreCourses,
            icon: Sparkles
          },
          secondaryAction: {
            label: "Nouvelle évaluation",
            onClick: onStartAssessment,
            icon: Brain
          },
          features: [
            { icon: TrendingUp, text: "Progression optimisée", color: "text-green-500" },
            { icon: BookOpen, text: "Contenu adaptatif", color: "text-revolutionary-cyan" },
            { icon: Zap, text: "Apprentissage rapide", color: "text-revolutionary-amber" }
          ],
          illustration: "🎯"
        }

      case "learning-progress":
        return {
          title: "Continuez sur votre lancée!",
          subtitle: "Vos cours vous attendent",
          description: "Vous progressez bien dans vos apprentissages. Continuez pour débloquer de nouvelles fonctionnalités.",
          primaryAction: {
            label: "Continuer l'apprentissage",
            onClick: onExploreCourses,
            icon: BookOpen
          },
          secondaryAction: {
            label: "Nouvelle évaluation",
            onClick: onStartAssessment,
            icon: Brain
          },
          features: [
            { icon: TrendingUp, text: "Progression visible", color: "text-green-500" },
            { icon: Award, text: "Objectifs proches", color: "text-revolutionary-amber" },
            { icon: Sparkles, text: "Nouvelles compétences", color: "text-revolutionary-purple" }
          ],
          illustration: "⚡"
        }

      case "advanced":
        return {
          title: `Impressionnant, ${userName}!`,
          subtitle: "Vous maîtrisez déjà beaucoup de domaines",
          description: "Explorez des fonctionnalités avancées comme le mentorat ou les défis experts.",
          primaryAction: {
            label: "Voir mes certificats",
            onClick: onViewCertificates || onExploreCourses,
            icon: Award
          },
          secondaryAction: {
            label: "Défis experts",
            onClick: onStartAssessment,
            icon: Target
          },
          features: [
            { icon: Award, text: "Expertise reconnue", color: "text-revolutionary-amber" },
            { icon: Target, text: "Défis avancés", color: "text-revolutionary-purple" },
            { icon: Sparkles, text: "Mentorat disponible", color: "text-revolutionary-cyan" }
          ],
          illustration: "👑"
        }

      default:
        return getEmptyStateContent() // Fallback to complete-beginner
    }
  }

  const content = getEmptyStateContent()

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Illustration */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-6xl mb-6"
        >
          {content.illustration}
        </motion.div>

        {/* Main content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-3">
            {content.title}
          </h1>
          <p className="text-revolutionary-cyan text-lg mb-4">
            {content.subtitle}
          </p>
          <p className="text-gray-300 leading-relaxed max-w-lg mx-auto">
            {content.description}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {content.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg p-4 border border-revolutionary-cyan/10"
            >
              <feature.icon className={`h-6 w-6 ${feature.color} mx-auto mb-2`} />
              <p className="text-white text-sm font-medium">{feature.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={content.primaryAction.onClick}
            className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue hover:from-revolutionary-cyan/90 hover:to-revolutionary-blue/90 text-white font-semibold px-6 py-3 text-base"
          >
            <content.primaryAction.icon className="h-5 w-5 mr-2" />
            {content.primaryAction.label}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button
            variant="ghost"
            onClick={content.secondaryAction.onClick}
            className="text-white hover:text-revolutionary-cyan border border-slate-600 hover:border-revolutionary-cyan/40"
          >
            <content.secondaryAction.icon className="h-4 w-4 mr-2" />
            {content.secondaryAction.label}
          </Button>
        </motion.div>

        {/* AI Onboarding Button */}
        {onStartAIOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <Button
              onClick={onStartAIOnboarding}
              variant="outline"
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-400/30 text-purple-300 hover:text-white hover:border-purple-400/60 hover:bg-purple-500/20"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Personnaliser mon expérience avec l'IA
              <Brain className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-gray-400 text-xs mt-2">
              Laissez notre IA créer un parcours sur mesure pour vous
            </p>
          </motion.div>
        )}

        {/* Beta notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Badge className="bg-gradient-to-r from-revolutionary-amber/20 to-revolutionary-orange/20 text-black border border-revolutionary-amber/30">
            🚀 Version Beta - Nouvelles fonctionnalités en cours de développement
          </Badge>
        </motion.div>
      </motion.div>
    </div>
  )
}