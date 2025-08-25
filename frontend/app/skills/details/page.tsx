// app/skills/details/page.tsx
"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  ChevronRight,
  ArrowLeft,
  BarChart3,
  Sparkles,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
  Zap,
  Calendar,
  Globe,
  Shield,
  Star,
  Activity,
  Share2,
  Download,
  Lightbulb
} from "lucide-react"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { useTranslation } from "@/hooks/use-translation"

// ... (keep all your interfaces - SkillDetails, SubSkill, etc.)

interface SkillDetails {
  id: string
  name: string
  category: string
  level: number
  confidence: number
  trend: "up" | "down" | "stable"
  lastAssessed: string
  nextRecommendedAssessment: string
  relatedSkills: string[]
  marketDemand: "high" | "medium" | "low"
  icon: React.ElementType
  color: string
  description: string
  subSkills: SubSkill[]
  learningPaths: string[]
  assessmentHistory: AssessmentHistory[]
  milestones: Milestone[]
  industryBenchmark: number
  globalRank: number
  totalPractitioners: number
}

interface SubSkill {
  id: string
  name: string
  level: number
  progress: number
}

interface AssessmentHistory {
  id: string
  date: string
  score: number
  confidence: number
  duration: string
  improvements: string[]
}

interface Milestone {
  id: string
  title: string
  description: string
  achieved: boolean
  date?: string
  level: number
}

// Create a separate component for the main content
function SkillDetailsContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const skillId = searchParams.get("id") || "communication"
  
  const [skill, setSkill] = useState<SkillDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")

  const mockUser = {
    name: "Alexandre Dubois",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  }

  useEffect(() => {
    // Simulate loading skill details
    const loadSkillDetails = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data based on skillId
      const mockSkill: SkillDetails = {
        id: skillId,
        name: t("skill_details.communication_interpersonal"),
        category: "Communication & Leadership",
        level: 92,
        confidence: 95,
        trend: "up",
        lastAssessed: t("skill_details.days_ago", { days: 2 }),
        nextRecommendedAssessment: t("skill_details.in_months", { months: 3 }),
        relatedSkills: ["Leadership", "Négociation", "Présentation", "Écoute Active"],
        marketDemand: "high",
        icon: MessageSquare,
        color: "from-blue-500 to-cyan-600",
        description: t("skill_details.skill_description"),
        subSkills: [
          { id: "verbal", name: t("skill_details.verbal_communication"), level: 95, progress: 100 },
          { id: "nonverbal", name: t("skill_details.non_verbal_communication"), level: 88, progress: 75 },
          { id: "listening", name: t("skill_details.active_listening"), level: 93, progress: 100 },
          { id: "empathy", name: t("skill_details.empathy"), level: 90, progress: 85 },
          { id: "clarity", name: t("skill_details.clarity_expression"), level: 91, progress: 90 }
        ],
        learningPaths: ["advanced-communication", "leadership-essentials", "emotional-intelligence"],
        assessmentHistory: [
          {
            id: "assessment-1",
            date: "2024-01-15",
            score: 92,
            confidence: 95,
            duration: "45 min",
            improvements: ["Écoute active", "Communication non-verbale"]
          }
        ],
        milestones: [
          {
            id: "milestone-1",
            title: "Expert en Communication",
            description: "Atteindre 90% en communication interpersonnelle",
            achieved: true,
            date: "2024-01-15",
            level: 90
          }
        ],
        industryBenchmark: 75,
        globalRank: 1250,
        totalPractitioners: 125000
      }

      setSkill(mockSkill)
      setLoading(false)
    }

    loadSkillDetails()
  }, [skillId, t])

  // ... (keep all your existing functions)

  const getSkillLevelLabel = (level: number) => {
    if (level >= 90) return t("skill_details.expert")
    if (level >= 75) return t("skill_details.advanced")
    if (level >= 50) return t("skill_details.intermediate")
    if (level >= 25) return t("skill_details.beginner")
    return t("skill_details.novice")
  }

  const getMarketDemandColor = (demand: string) => {
    switch(demand) {
      case "high": return "text-green-400"
      case "medium": return "text-yellow-400"
      case "low": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const handleStartAssessment = () => {
    router.push(`/assessments/skill/${skillId}`)
  }

  const handleViewLearningPath = (pathId: string) => {
    router.push(`/learning/${pathId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation user={mockUser} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-white">{t("skill_details.loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation user={mockUser} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{t("skill_details.skill_not_found")}</h1>
            <Button 
              onClick={() => router.push('/skills')} 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("skill_details.back_to_skills")}
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
        {/* Back Navigation */}
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
            {t("skill_details.back_to_skills")}
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${skill.color} flex items-center justify-center`}>
                <skill.icon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{skill.name}</h1>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-slate-700 text-gray-300">{skill.category}</Badge>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`h-4 w-4 ${
                      skill.trend === "up" ? "text-green-400" : 
                      skill.trend === "down" ? "text-red-400" : "text-gray-400"
                    }`} />
                    <span className="text-gray-300">{getSkillLevelLabel(skill.level)}</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getMarketDemandColor(skill.marketDemand)}`}>
                    <Target className="h-4 w-4" />
                    <span className="text-sm">{t(`skills.${skill.marketDemand}_demand`)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleStartAssessment}>
                <Brain className="h-4 w-4 mr-2" />
                {t("skill_details.start_assessment")}
              </Button>
              <Button onClick={() => handleShareProgress()}>
                <Share2 className="h-4 w-4 mr-2" />
                {t("skill_details.share")}
              </Button>
            </div>
          </div>

          {/* Skill Level Progress */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_details.current_level")}</span>
                  <Activity className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{skill.level}%</div>
                <Progress value={skill.level} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_details.ai_confidence")}</span>
                  <Brain className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{skill.confidence}%</div>
                <div className="text-sm text-purple-400">{t("skill_details.highly_accurate")}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_details.global_rank")}</span>
                  <Globe className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">#{skill.globalRank}</div>
                <div className="text-sm text-amber-400">{t("skill_details.top_percent", { percent: 1 })}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{t("skill_details.vs_industry")}</span>
                  <BarChart3 className="h-4 w-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">+{skill.level - skill.industryBenchmark}%</div>
                <div className="text-sm text-green-400">{t("skill_details.above_average")}</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
              <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_details.overview")}
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_details.progress")}
              </TabsTrigger>
              <TabsTrigger value="assessments" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_details.assessments")}
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_details.learning")}
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-gray-300 data-[state=active]:text-white">
                {t("skill_details.ai_insights")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Sub-skills */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        {t("skill_details.sub_skills")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {skill.subSkills.map((subSkill) => (
                          <div key={subSkill.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                            <div>
                              <h4 className="text-white font-medium">{subSkill.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-400">{t("skill_details.level")}: {subSkill.level}%</span>
                                <Progress value={subSkill.progress} className="w-20 h-2" />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">{subSkill.level}%</div>
                              <div className="text-xs text-gray-400">{subSkill.progress}% {t("skill_details.complete")}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Related Skills */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Sparkles className="h-5 w-5 mr-2" />
                        {t("skill_details.related_skills")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {skill.relatedSkills.map((relatedSkill, index) => (
                          <Badge key={index} variant="outline" className="bg-slate-700/50 text-gray-300 border-slate-600">
                            {relatedSkill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Assessment Summary */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        {t("skill_details.assessment_summary")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{t("skill_details.last_assessed")}</span>
                        <span className="text-white">{skill.lastAssessed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{t("skill_details.next_recommended")}</span>
                        <span className="text-white">{skill.nextRecommendedAssessment}</span>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        onClick={handleStartAssessment}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        {t("skill_details.start_new_assessment")}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Learning Paths */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        {t("skill_details.recommended_learning")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {skill.learningPaths.map((pathId, index) => (
                        <div key={pathId} className="p-3 rounded-lg bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors"
                             onClick={() => handleViewLearningPath(pathId)}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium text-sm">{t(`learning_paths.${pathId}.title`)}</h4>
                              <p className="text-gray-400 text-xs mt-1">{t(`learning_paths.${pathId}.duration`)}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Add other TabsContent components for progress, assessments, learning, and insights */}
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}

// Loading fallback component
function SkillDetailsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading skill details...</p>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function SkillDetailsPage() {
  return (
    <Suspense fallback={<SkillDetailsLoading />}>
      <SkillDetailsContent />
    </Suspense>
  )
}