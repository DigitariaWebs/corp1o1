"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline"
import { 
  Link2, 
  Brain, 
  Award, 
  TrendingUp, 
  Shield,
  Zap,
  Users,
  Target
} from "lucide-react"

interface HowItWorksSectionProps {
  onGetStarted?: () => void
}

// Timeline data for Corp1o1
const corp1o1TimelineData = [
  {
    id: 1,
    title: "Connectez",
    date: "Étape 1",
    content: "Liez vos projets GitHub, Behance, vidéos et créations. Notre IA analyse tous types de portfolios et téléchargements directs.",
    category: "Connection",
    icon: Link2,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Analysez",
    date: "Étape 2",
    content: "Notre IA évalue vos compétences réelles avec une analyse multi-dimensionnelle. 99.7% de précision sur code, créativité et soft skills.",
    category: "Analysis",
    icon: Brain,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "Certifiez",
    date: "Étape 3",
    content: "Recevez des certificats NFT évolutifs sur blockchain, reconnus par 10,000+ entreprises mondiales. Impossible à falsifier.",
    category: "Certification",
    icon: Award,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 75,
  },
  {
    id: 4,
    title: "Évoluez",
    date: "Étape 4",
    content: "Accédez à notre marketplace exclusif d'emplois et missions. Votre réputation grandit avec vos compétences.",
    category: "Evolution",
    icon: TrendingUp,
    relatedIds: [3, 5],
    status: "in-progress" as const,
    energy: 60,
  },
  {
    id: 5,
    title: "Sécurisez",
    date: "Garantie",
    content: "Protection maximale avec cryptage militaire et conformité RGPD. Vos données restent votre propriété.",
    category: "Security",
    icon: Shield,
    relatedIds: [4, 6],
    status: "pending" as const,
    energy: 100,
  },
  {
    id: 6,
    title: "Optimisez",
    date: "IA",
    content: "Parcours d'apprentissage personnalisé par l'IA. Recommandations basées sur vos objectifs de carrière.",
    category: "Optimization",
    icon: Zap,
    relatedIds: [5, 7],
    status: "pending" as const,
    energy: 85,
  },
  {
    id: 7,
    title: "Collaborez",
    date: "Réseau",
    content: "Rejoignez une communauté mondiale de talents vérifiés. Opportunités de collaboration et mentorat.",
    category: "Network",
    icon: Users,
    relatedIds: [6, 8],
    status: "pending" as const,
    energy: 70,
  },
  {
    id: 8,
    title: "Progressez",
    date: "Continu",
    content: "Suivi en temps réel de votre progression. Badges et achievements débloqués au fur et à mesure.",
    category: "Progress",
    icon: Target,
    relatedIds: [7, 1],
    status: "pending" as const,
    energy: 50,
  },
];

export function HowItWorksSection({ onGetStarted }: HowItWorksSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Comment ça Marche
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            4 étapes simples pour révolutionner votre carrière et faire reconnaître vos vraies compétences
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Left Column - Overview Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-1 space-y-4"
          >
            {[
              {
                icon: Link2,
                title: "Connectez",
                description: "Liez vos projets et portfolios",
                color: "from-cyan-500 to-blue-600"
              },
              {
                icon: Brain,
                title: "Analysez",
                description: "IA évalue vos compétences",
                color: "from-purple-500 to-pink-600"
              },
              {
                icon: Award,
                title: "Certifiez",
                description: "Certificats blockchain sécurisés",
                color: "from-amber-500 to-orange-600"
              },
              {
                icon: TrendingUp,
                title: "Évoluez",
                description: "Opportunités professionnelles",
                color: "from-green-500 to-teal-600"
              }
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:translate-x-2 hover:shadow-xl hover:shadow-cyan-500/10 flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right Column - Radial Timeline */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-2 h-[600px] relative"
          >
            {/* Instruction Badge */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 blur-xl"></div>
                <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-lg rounded-full px-6 py-2.5 border border-cyan-400/40 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <p className="text-sm text-cyan-300 font-semibold tracking-wide">
                      CLIQUEZ SUR LES NŒUDS POUR EXPLORER
                    </p>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Timeline Container - Directly integrated */}
            <div className="h-full w-full relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50 rounded-3xl"></div>
              <div className="h-full w-full scale-75 lg:scale-90">
                <RadialOrbitalTimeline timelineData={corp1o1TimelineData} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-2xl p-8 border border-slate-600/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Prêt à Révolutionner Votre Carrière ?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Rejoignez des milliers de talents qui ont déjà transformé leur avenir professionnel avec Corp1o1
            </p>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-cyan-500/30 transform hover:-translate-y-1 transition-all duration-300"
            >
              Commencer Maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}