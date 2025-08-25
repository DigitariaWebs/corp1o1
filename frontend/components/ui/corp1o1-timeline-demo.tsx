"use client";

import { 
  Brain, 
  Target, 
  Zap, 
  Award, 
  Users, 
  TrendingUp, 
  Shield, 
  Sparkles,
  Rocket,
  Globe
} from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const corp1o1TimelineData = [
  {
    id: 1,
    title: "Évaluation IA",
    date: "Étape 1",
    content: "Notre IA révolutionnaire analyse vos compétences avec 99,7% de précision, dépassant les méthodes traditionnelles de recrutement basées sur les diplômes.",
    category: "Assessment",
    icon: Brain,
    relatedIds: [2, 8],
    status: "completed" as const,
    energy: 100,
    color: "from-cyan-400 to-blue-600",
  },
  {
    id: 2,
    title: "Analyse Personnalisée",
    date: "Étape 2",
    content: "Algorithmes avancés créent votre profil unique de compétences, identifiant vos forces et axes d'amélioration avec une précision inégalée.",
    category: "Analysis",
    icon: Target,
    relatedIds: [1, 3, 9],
    status: "completed" as const,
    energy: 95,
    color: "from-blue-500 to-purple-600",
  },
  {
    id: 3,
    title: "Parcours Adaptatif",
    date: "Étape 3",
    content: "Création automatique de votre parcours d'apprentissage personnalisé, optimisé par l'IA pour maximiser votre progression et votre engagement.",
    category: "Learning",
    icon: Zap,
    relatedIds: [2, 4, 10],
    status: "in-progress" as const,
    energy: 75,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: 4,
    title: "Formation Interactive",
    date: "Étape 4",
    content: "Modules d'apprentissage adaptatifs avec feedback temps réel, gamification et suivi de progression pour un engagement maximum.",
    category: "Training",
    icon: Sparkles,
    relatedIds: [3, 5],
    status: "in-progress" as const,
    energy: 60,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: 5,
    title: "Certification Blockchain",
    date: "Étape 5",
    content: "Obtention de certificats infalsifiables sécurisés par blockchain, reconnus par plus de 10,000 entreprises à travers le monde.",
    category: "Certification",
    icon: Award,
    relatedIds: [4, 6],
    status: "pending" as const,
    energy: 40,
    color: "from-emerald-400 to-teal-600",
  },
  {
    id: 6,
    title: "Réseau Professionnel",
    date: "Étape 6",
    content: "Accès à notre écosystème de talents vérifié, connexion avec des entreprises innovantes et opportunités de carrière exclusives.",
    category: "Network",
    icon: Users,
    relatedIds: [5, 7],
    status: "pending" as const,
    energy: 30,
    color: "from-indigo-400 to-purple-600",
  },
  {
    id: 7,
    title: "Évolution Continue",
    date: "Étape 7",
    content: "Suivi permanent de vos compétences, mise à jour automatique de votre profil et recommendations d'évolution de carrière.",
    category: "Evolution",
    icon: TrendingUp,
    relatedIds: [6, 8],
    status: "pending" as const,
    energy: 20,
    color: "from-pink-400 to-rose-600",
  },
  {
    id: 8,
    title: "Impact Global",
    date: "Révolution",
    content: "Contribution à la révolution des compétences mondiales, où le talent réel est reconnu au-delà des diplômes traditionnels.",
    category: "Impact",
    icon: Globe,
    relatedIds: [1, 9],
    status: "pending" as const,
    energy: 10,
    color: "from-cyan-300 to-blue-500",
  },
  {
    id: 9,
    title: "Sécurité Avancée",
    date: "Garantie",
    content: "Protection maximale de vos données avec cryptage de niveau militaire et conformité RGPD pour une sécurité absolue.",
    category: "Security",
    icon: Shield,
    relatedIds: [2, 10],
    status: "completed" as const,
    energy: 100,
    color: "from-slate-400 to-gray-600",
  },
  {
    id: 10,
    title: "Innovation IA",
    date: "Futur",
    content: "Technologie de pointe utilisant GPT-4, Claude et Gemini pour une expérience d'apprentissage révolutionnaire et personnalisée.",
    category: "Innovation",
    icon: Rocket,
    relatedIds: [3, 9],
    status: "completed" as const,
    energy: 100,
    color: "from-violet-400 to-purple-600",
  },
];

export function Corp1o1TimelineDemo() {
  return (
    <div className="w-full">
      <RadialOrbitalTimeline timelineData={corp1o1TimelineData} />
    </div>
  );
}

export default Corp1o1TimelineDemo;