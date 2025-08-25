// app/skills/[slug]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  TrendingUp,
  Target,
  BookOpen,
  Award,
  Clock,
  Users,
  MessageSquare,
  Palette,
  Heart,
  Shield,
  ArrowLeft,
  Play,
  Zap,
  Star,
  BarChart3,
  Activity,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Code,
  Briefcase,
  Cpu,
  Headphones,
  Camera,
  Music,
  Utensils,
  Hammer,
  Calendar,
  ChevronRight,
  FileText,
  Video,
  Download,
  Share2,
  RefreshCw,
  Lock,
  Unlock
} from "lucide-react"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { useTranslation } from "@/hooks/use-translation"

// Skill type definitions
interface SkillData {
  slug: string
  name: string
  category: string
  description: string
  icon: React.ElementType
  color: string
  level: number
  confidence: number
  trend: "up" | "down" | "stable"
  marketDemand: "high" | "medium" | "low"
  learningPaths: LearningPath[]
  assessments: Assessment[]
  certificates: Certificate[]
  relatedSkills: RelatedSkill[]
  industryStats: IndustryStats
  personalProgress: PersonalProgress
  aiRecommendations: AIRecommendation[]
}

interface LearningPath {
  id: string
  title: string
  description: string
  duration: string
  difficulty: string
  modules: number
  completedModules: number
  match: number
}

interface Assessment {
  id: string
  title: string
  type: string
  duration: string
  difficulty: string
  lastTaken?: string
  score?: number
  available: boolean
  recommended: boolean
}

interface Certificate {
  id: string
  title: string
  level: string
  issuedDate?: string
  status: "earned" | "in-progress" | "locked"
  progress?: number
  blockchain?: boolean
}

interface RelatedSkill {
  slug: string
  name: string
  level: number
  correlation: number
}

interface IndustryStats {
  averageLevel: number
  topPercentile: number
  demandGrowth: number
  salaryPremium: number
  jobOpenings: number
}

interface PersonalProgress {
  startDate: string
  totalHours: number
  assessmentsTaken: number
  projectsCompleted: number
  milestones: Milestone[]
  weeklyProgress: number[]
}

interface Milestone {
  id: string
  title: string
  achieved: boolean
  date?: string
  level: number
}

interface AIRecommendation {
  id: string
  type: "learning" | "assessment" | "project" | "skill"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  estimatedTime: string
  impact: string
}

// Skill data mapping
const skillDataMap: Record<string, Partial<SkillData>> = {
  communication: {
    name: "Communication Interpersonnelle",
    category: "Communication & Leadership",
    description: "Maîtrisez l'art de la communication efficace et empathique dans tous les contextes professionnels et personnels.",
    icon: MessageSquare,
    color: "from-blue-500 to-cyan-600",
    level: 92,
    confidence: 95,
    trend: "up",
    marketDemand: "high"
  },
  creativity: {
    name: "Pensée Créative",
    category: "Innovation & Créativité",
    description: "Développez votre capacité à générer des idées innovantes et à résoudre des problèmes de manière créative.",
    icon: Palette,
    color: "from-purple-500 to-pink-600",
    level: 88,
    confidence: 90,
    trend: "up",
    marketDemand: "high"
  },
  "emotional-intelligence": {
    name: "Intelligence Émotionnelle",
    category: "Compétences Humaines",
    description: "Comprenez et gérez vos émotions et celles des autres pour créer des relations harmonieuses.",
    icon: Heart,
    color: "from-green-500 to-teal-600",
    level: 85,
    confidence: 88,
    trend: "up",
    marketDemand: "high"
  },
  leadership: {
    name: "Leadership Collaboratif",
    category: "Communication & Leadership",
    description: "Inspirez et guidez les équipes vers l'excellence avec un leadership authentique et inclusif.",
    icon: Users,
    color: "from-amber-500 to-orange-600",
    level: 78,
    confidence: 82,
    trend: "stable",
    marketDemand: "high"
  },
  "problem-solving": {
    name: "Résolution de Problèmes",
    category: "Stratégie & Analyse",
    description: "Analysez et résolvez des problèmes complexes avec des approches structurées et innovantes.",
    icon: Lightbulb,
    color: "from-cyan-500 to-blue-600",
    level: 82,
    confidence: 85,
    trend: "up",
    marketDemand: "high"
  },
  "project-management": {
    name: "Gestion de Projet",
    category: "Leadership & Management",
    description: "Planifiez, exécutez et livrez des projets avec succès en respectant les délais et budgets.",
    icon: Briefcase,
    color: "from-indigo-500 to-purple-600",
    level: 75,
    confidence: 80,
    trend: "up",
    marketDemand: "medium"
  },
  "digital-literacy": {
    name: "Littératie Numérique",
    category: "Compétences Techniques",
    description: "Naviguez avec aisance dans l'environnement numérique moderne et utilisez les outils technologiques efficacement.",
    icon: Cpu,
    color: "from-gray-500 to-gray-700",
    level: 70,
    confidence: 75,
    trend: "up",
    marketDemand: "high"
  },
  "public-speaking": {
    name: "Prise de Parole en Public",
    category: "Communication & Leadership",
    description: "Captivez votre audience et transmettez vos idées avec clarté et impact.",
    icon: Headphones,
    color: "from-red-500 to-pink-600",
    level: 68,
    confidence: 72,
    trend: "up",
    marketDemand: "medium"
  }
}

export default function SkillPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [skillData, setSkillData] = useState<SkillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAIInsights, setShowAIInsights] = useState(false)

  const mockUser = {
    name: "Alexandre Dubois",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  }

  useEffect(() => {
    const fetchSkillData = async () => {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const baseData = skillDataMap[slug]
      if (!baseData) {
        setSkillData(null)
        setLoading(false)
        return
      }

      // Build complete skill data
      const completeSkillData: SkillData = {
        slug,
        ...baseData,
        learningPaths: [
          {
            id: `${slug}-advanced`,
            title: t("skill_page.path_advanced", { skill: baseData.name ?? ""  }),
            description: t("skill_page.path_advanced_desc"),
            duration: "6 semaines",
            difficulty: "advanced",
            modules: 8,
            completedModules: 5,
            match: 95
          },
          {
            id: `${slug}-practical`,
            title: t("skill_page.path_practical", { skill: baseData.name ?? "" }),
            description: t("skill_page.path_practical_desc"),
            duration: "4 semaines",
            difficulty: "intermediate",
            modules: 6,
            completedModules: 2,
            match: 88
          },
          {
            id: `${slug}-fundamentals`,
            title: t("skill_page.path_fundamentals", { skill: baseData.name ?? ""  }),
            description: t("skill_page.path_fundamentals_desc"),
            duration: "3 semaines",
            difficulty: "beginner",
            modules: 5,
            completedModules: 5,
            match: 100
          }
        ],
        assessments: [
          {
            id: `assess-${slug}-1`,
            title: t("skill_page.assessment_comprehensive", { skill: baseData.name ?? ""  }),
            type: "comprehensive",
            duration: "45 min",
            difficulty: "advanced",
            available: true,
            recommended: true
          },
          {
            id: `assess-${slug}-2`,
            title: t("skill_page.assessment_quick", { skill: baseData.name ?? ""  }),
            type: "quick",
            duration: "15 min",
            difficulty: "intermediate",
            lastTaken: "2024-01-15",
            score: 88,
            available: true,
            recommended: false
          },
          {
            id: `assess-${slug}-3`,
            title: t("skill_page.assessment_practical", { skill: baseData.name ?? ""  }),
            type: "practical",
            duration: "60 min",
            difficulty: "advanced",
            available: false,
            recommended: false
          }
        ],
        certificates: [
          {
            id: `cert-${slug}-1`,
            title: t("skill_page.certificate_expert", { skill: baseData.name ?? ""  }),
            level: "expert",
            status: baseData.level! >= 90 ? "earned" : "in-progress",
            progress: baseData.level! >= 90 ? 100 : (baseData.level! / 90) * 100,
            issuedDate: baseData.level! >= 90 ? "2024-01-18" : undefined,
            blockchain: true
          },
          {
            id: `cert-${slug}-2`,
            title: t("skill_page.certificate_advanced", { skill: baseData.name ?? ""  }),
            level: "advanced",
            status: baseData.level! >= 75 ? "earned" : baseData.level! >= 50 ? "in-progress" : "locked",
            progress: baseData.level! >= 75 ? 100 : baseData.level! >= 50 ? ((baseData.level! - 50) / 25) * 100 : 0,
            issuedDate: baseData.level! >= 75 ? "2023-09-10" : undefined,
            blockchain: false
          },
          {
            id: `cert-${slug}-3`,
            title: t("skill_page.certificate_intermediate", { skill: baseData.name ?? ""  }),
            level: "intermediate",
            status: baseData.level! >= 50 ? "earned" : baseData.level! >= 25 ? "in-progress" : "locked",
            progress: baseData.level! >= 50 ? 100 : baseData.level! >= 25 ? ((baseData.level! - 25) / 25) * 100 : 0,
            issuedDate: baseData.level! >= 50 ? "2023-06-20" : undefined,
            blockchain: false
          }
        ],
        relatedSkills: [
          {
            slug: "leadership",
            name: "Leadership",
            level: 78,
            correlation: 85
          },
          {
            slug: "emotional-intelligence",
            name: "Intelligence Émotionnelle",
            level: 85,
            correlation: 92
          },
          {
            slug: "problem-solving",
            name: "Résolution de Problèmes",
            level: 82,
            correlation: 78
          }
        ],
        industryStats: {
          averageLevel: 65,
          topPercentile: 95,
          demandGrowth: 23,
          salaryPremium: 15,
          jobOpenings: 12500
        },
        personalProgress: {
          startDate: "2023-03-15",
          totalHours: 156,
          assessmentsTaken: 12,
          projectsCompleted: 8,
          milestones: [
            { id: "m1", title: t("skill_page.milestone_started"), achieved: true, date: "2023-03-15", level: 0 },
            { id: "m2", title: t("skill_page.milestone_25"), achieved: true, date: "2023-04-20", level: 25 },
            { id: "m3", title: t("skill_page.milestone_50"), achieved: true, date: "2023-06-15", level: 50 },
            { id: "m4", title: t("skill_page.milestone_75"), achieved: true, date: "2023-09-10", level: 75 },
            { id: "m5", title: t("skill_page.milestone_90"), achieved: baseData.level! >= 90, date: baseData.level! >= 90 ? "2024-01-15" : undefined, level: 90 }
          ],
          weeklyProgress: [75, 78, 82, 85, 87, 88, 90, 92]
        },
        aiRecommendations: [
          {
            id: "rec-1",
            type: "assessment",
            title: t("skill_page.rec_assessment_title"),
            description: t("skill_page.rec_assessment_desc"),
            priority: "high",
            estimatedTime: "45 min",
            impact: t("skill_page.rec_assessment_impact")
          },
          {
            id: "rec-2",
            type: "learning",
            title: t("skill_page.rec_learning_title"),
            description: t("skill_page.rec_learning_desc"),
            priority: "medium",
            estimatedTime: "2 semaines",
            impact: t("skill_page.rec_learning_impact")
          },
          {
            id: "rec-3",
            type: "project",
            title: t("skill_page.rec_project_title"),
            description: t("skill_page.rec_project_desc"),
            priority: "medium",
            estimatedTime: "1 semaine",
            impact: t("skill_page.rec_project_impact")
          },
          {
            id: "rec-4",
            type: "skill",
            title: t("skill_page.rec_skill_title"),
            description: t("skill_page.rec_skill_desc"),
            priority: "low",
            estimatedTime: "4 semaines",
            impact: t("skill_page.rec_skill_impact")
          }
        ]
      } as SkillData

      setSkillData(completeSkillData)
      setLoading(false)
    }

    fetchSkillData()
  }, [slug, t])

  const getRecommendationIcon = (type: string) => {
    switch(type) {
      case "assessment": return Brain
      case "learning": return BookOpen
      case "project": return Target
      case "skill": return Zap
      default: return Star
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "low": return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  const getCertificateStatusColor = (status: string) => {
    switch(status) {
      case "earned": return "text-green-400"
      case "in-progress": return "text-amber-400"
      case "locked": return "text-gray-400"
      default: return "text-gray-400"
    }
  }

  const getCertificateStatusIcon = (status: string) => {
    switch(status) {
      case "earned": return CheckCircle
      case "in-progress": return Clock
      case "locked": return Lock
      default: return Lock
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation user={mockUser} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-white">{t("skill_page.loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!skillData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation user={mockUser} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{t("skill_page.not_found")}</h1>
            <p className="text-gray-300 mb-4">{t("skill_page.not_found_desc")}</p>
            <Button 
              onClick={() => router.push('/skills')} 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("skill_page.back_to_skills")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => router.push('/skills')}
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("skill_page.back_to_skills")}
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4 flex-1">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${skillData.color} flex items-center justify-center`}>
                <skillData.icon className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{skillData.name}</h1>
                <div className="flex items-center space-x-4 mb-4">
                  <Badge className="bg-slate-700 text-gray-300">{skillData.category}</Badge>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`h-4 w-4 ${
                      skillData.trend === "up" ? "text-green-400" : 
                      skillData.trend === "down" ? "text-red-400" : "text-gray-400"
                    }`} />
                    <span className={`text-sm font-medium ${
                      skillData.marketDemand === "high" ? "text-green-400" :
                      skillData.marketDemand === "medium" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {t(`skill_page.demand_${skillData.marketDemand}`)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{skillData.industryStats.jobOpenings.toLocaleString()} {t("skill_page.job_openings")}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">{skillData.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-3">
              <Button
                onClick={() => setShowAIInsights(!showAIInsights)}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-900/20 bg-transparent"
              >
                <Brain className="h-4 w-4 mr-2" />
                {t("skill_page.ai_analysis")}
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          {showAIInsights && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/30">
                <CardContent className="p-6">
                  <h3 className="text-purple-400 font-semibold text-lg mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    {t("skill_page.ai_insights_title")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-purple-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300 font-medium">{t("skill_page.growth_rate")}</span>
                          <Badge className="bg-green-500/20 text-green-400">+{skillData.industryStats.demandGrowth}%</Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{t("skill_page.growth_rate_desc")}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300 font-medium">{t("skill_page.salary_premium")}</span>
                          <Badge className="bg-amber-500/20 text-amber-400">+{skillData.industryStats.salaryPremium}%</Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{t("skill_page.salary_premium_desc")}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-purple-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300 font-medium">{t("skill_page.mastery_time")}</span>
                          <Badge className="bg-cyan-500/20 text-cyan-400">3-6 {t("skill_page.months")}</Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{t("skill_page.mastery_time_desc")}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300 font-medium">{t("skill_page.career_impact")}</span>
                          <Badge className="bg-pink-500/20 text-pink-400">{t("skill_page.high")}</Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{t("skill_page.career_impact_desc")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_page.your_level")}</span>
                  <Activity className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{skillData.level}%</div>
                <Progress value={skillData.level} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_page.vs_average")}</span>
                  <BarChart3 className="h-4 w-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">+{skillData.level - skillData.industryStats.averageLevel}%</div>
                <div className="text-xs text-green-400">{t("skill_page.above_average")}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_page.time_invested")}</span>
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{skillData.personalProgress.totalHours}h</div>
                <div className="text-xs text-purple-400">{t("skill_page.since", { date: skillData.personalProgress.startDate })}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_page.certificates")}</span>
                  <Award className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {skillData.certificates.filter(c => c.status === "earned").length}/{skillData.certificates.length}
                </div>
                <div className="text-xs text-amber-400">{t("skill_page.earned")}</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
              <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_page.overview")}
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_page.learning_paths")}
              </TabsTrigger>
              <TabsTrigger value="assessments" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_page.assessments")}
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_page.certificates")}
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_page.ai_recommendations")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Progress Chart */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t("skill_page.progress_chart")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Chart placeholder */}
                      <div className="h-64 flex items-center justify-center bg-slate-800/30 rounded-lg">
                        <BarChart3 className="h-16 w-16 text-gray-600" />
                        <p className="text-gray-400 ml-4">{t("skill_page.chart_placeholder")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Milestones */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t("skill_page.milestones")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {skillData.personalProgress.milestones.map((milestone, index) => (
                          <div key={milestone.id} className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              milestone.achieved 
                                ? "bg-gradient-to-r from-green-500 to-green-600" 
                                : "bg-gradient-to-r from-gray-500 to-gray-600"
                            }`}>
                              {milestone.achieved ? (
                                <CheckCircle className="h-5 w-5 text-white" />
                              ) : (
                                <span className="text-white text-sm font-medium">{milestone.level}%</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${milestone.achieved ? "text-white" : "text-gray-400"}`}>
                                {milestone.title}
                              </h4>
                              {milestone.date && (
                                <p className="text-xs text-gray-500">
                                  {t("skill_page.achieved_on", { date: milestone.date })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Related Skills */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t("skill_page.related_skills")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {skillData.relatedSkills.map((skill) => (
                          <div 
                            key={skill.slug}
                            onClick={() => router.push(`/skills/${skill.slug}`)}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 cursor-pointer transition-all"
                          >
                            <div>
                              <h4 className="text-white font-medium">{skill.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={skill.level} className="h-1 w-20" />
                                <span className="text-xs text-gray-400">{skill.level}%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                                {skill.correlation}% {t("skill_page.correlation")}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t("skill_page.quick_stats")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t("skill_page.assessments_taken")}</span>
                          <span className="text-white font-medium">{skillData.personalProgress.assessmentsTaken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t("skill_page.projects_completed")}</span>
                          <span className="text-white font-medium">{skillData.personalProgress.projectsCompleted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t("skill_page.top_percentile")}</span>
                          <span className="text-white font-medium">{t("skill_page.top_percent", { percent: skillData.industryStats.topPercentile })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t("skill_page.ai_confidence")}</span>
                          <span className="text-cyan-400 font-medium">{skillData.confidence}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="learning" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skillData.learningPaths.map((path) => (
                  <Card 
                    key={path.id}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all"
                    onClick={() => router.push(`/learning/${path.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1">{path.title}</h3>
                          <p className="text-gray-300 text-sm">{path.description}</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                          {path.match}% {t("skill_page.match")}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{t("skill_page.duration")}</span>
                          <span className="text-white">{path.duration}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{t("skill_page.difficulty")}</span>
                          <Badge className="bg-slate-700 text-gray-300">
                            {t(`assessments.${path.difficulty}`)}
                          </Badge>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">{t("skill_page.progress")}</span>
                            <span className="text-white">{path.completedModules}/{path.modules} {t("skill_page.modules")}</span>
                          </div>
                          <Progress value={(path.completedModules / path.modules) * 100} className="h-2" />
                        </div>
                      </div>
                      
                      <Button className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                        <Play className="h-4 w-4 mr-2" />
                        {path.completedModules > 0 ? t("skill_page.continue") : t("skill_page.start")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <div className="space-y-6">
                {skillData.assessments.map((assessment) => (
                  <Card 
                    key={assessment.id}
                    className={`bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border transition-all ${
                      assessment.recommended 
                        ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10" 
                        : "border-slate-600/30"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-white font-semibold text-lg">{assessment.title}</h3>
                            {assessment.recommended && (
                              <Badge className="bg-cyan-500/20 text-cyan-400">
                                {t("skill_page.recommended")}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {assessment.duration}
                            </div>
                            <Badge className="bg-slate-700 text-gray-300">
                              {t(`assessments.${assessment.difficulty}`)}
                            </Badge>
                            <Badge variant="outline" className="border-slate-600 text-gray-300">
                              {t(`skill_page.assessment_${assessment.type}`)}
                            </Badge>
                          </div>
                          
                          {assessment.lastTaken && (
                            <div className="p-3 rounded-lg bg-slate-800/30 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">{t("skill_page.last_taken", { date: assessment.lastTaken })}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium">{assessment.score}%</span>
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button 
                            className={`${
                              assessment.available 
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white" 
                                : "bg-gray-600 text-gray-300 cursor-not-allowed"
                            }`}
                            disabled={!assessment.available}
                            onClick={() => assessment.available && router.push(`/assessments/skill/${skillData.slug}/${assessment.id}`)}
                          >
                            {assessment.available ? (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                {assessment.lastTaken ? t("skill_page.retake_assessment") : t("skill_page.start_assessment")}
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                {t("skill_page.locked")}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {skillData.certificates.map((certificate) => {
                  const StatusIcon = getCertificateStatusIcon(certificate.status)
                  return (
                    <Card 
                      key={certificate.id}
                      className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            certificate.status === "earned" 
                              ? "bg-gradient-to-r from-green-500 to-green-600" 
                              : certificate.status === "in-progress"
                                ? "bg-gradient-to-r from-amber-500 to-orange-600"
                                : "bg-gradient-to-r from-gray-500 to-gray-600"
                          }`}>
                            <StatusIcon className="h-6 w-6 text-white" />
                          </div>
                          {certificate.blockchain && certificate.status === "earned" && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Blockchain
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-white font-semibold mb-1">{certificate.title}</h3>
                        <p className={`text-sm mb-3 ${getCertificateStatusColor(certificate.status)}`}>
                          {t(`skill_page.certificate_${certificate.status}`)}
                        </p>
                        
                        {certificate.status === "in-progress" && certificate.progress !== undefined && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">{t("skill_page.progress")}</span>
                              <span className="text-white">{Math.round(certificate.progress)}%</span>
                            </div>
                            <Progress value={certificate.progress} className="h-2" />
                          </div>
                        )}
                        
                        {certificate.issuedDate && (
                          <p className="text-xs text-gray-400 mb-4">
                            {t("skill_page.issued_on", { date: certificate.issuedDate })}
                          </p>
                        )}
                        
                        <Button 
                          className={`w-full ${
                            certificate.status === "earned" 
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                              : certificate.status === "in-progress"
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                : "bg-gray-600 cursor-not-allowed"
                          } text-white`}
                          disabled={certificate.status === "locked"}
                          onClick={() => {
                            if (certificate.status === "earned") {
                              router.push('/certificates')
                            } else if (certificate.status === "in-progress") {
                              router.push(`/assessments/skill/${skillData.slug}`)
                            }
                          }}
                        >
                          {certificate.status === "earned" ? (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              {t("skill_page.view_certificate")}
                            </>
                          ) : certificate.status === "in-progress" ? (
                            <>
                              <Target className="h-4 w-4 mr-2" />
                              {t("skill_page.continue_progress")}
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              {t("skill_page.locked")}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skillData.aiRecommendations.map((recommendation) => {
                  const RecIcon = getRecommendationIcon(recommendation.type)
                  return (
                    <Card 
                      key={recommendation.id}
                      className={`bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border ${getPriorityColor(recommendation.priority)}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            recommendation.priority === "high" 
                              ? "bg-gradient-to-r from-red-500 to-red-600" 
                              : recommendation.priority === "medium"
                                ? "bg-gradient-to-r from-amber-500 to-orange-600"
                                : "bg-gradient-to-r from-gray-500 to-gray-600"
                          }`}>
                            <RecIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-white font-semibold">{recommendation.title}</h3>
                              <Badge className={getPriorityColor(recommendation.priority) + " text-xs"}>
                                {t(`skill_page.priority_${recommendation.priority}`)}
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm">{recommendation.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t("skill_page.estimated_time")}</span>
                            <span className="text-white">{recommendation.estimatedTime}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t("skill_page.impact")}</span>
                            <span className="text-cyan-400">{recommendation.impact}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                          onClick={() => {
                            if (recommendation.type === "assessment") {
                              router.push(`/assessments/skill/${skillData.slug}`)
                            } else if (recommendation.type === "learning") {
                              router.push(`/learning/${skillData.learningPaths[0]?.id}`)
                            } else if (recommendation.type === "skill") {
                              router.push('/skills')
                            }
                          }}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {t("skill_page.start_now")}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
