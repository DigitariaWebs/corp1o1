"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  Zap,
  Award,
  Clock,
  Users,
  MessageSquare,
  Palette,
  Heart,
  Plus,
  ArrowRight,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

interface SkillCategory {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  color: string
  type: string
  skillCount: number
  isFeatured: boolean
  statistics: any
  userProgress?: {
    currentLevel: string
    lastScore: number
    bestScore: number
    attemptCount: number
    lastAssessmentAt: string
  }
}

interface SkillProgress {
  categoryId: string
  categoryName: string
  category: any
  currentLevel: string
  lastScore: number
  bestScore: number
  attemptCount: number
  lastAssessmentAt: string
  firstAssessmentAt: string
  progression: any[]
  nextRecommendedLevel: string
  aiInsights: any
}

interface SkillAnalytics {
  totalAssessments: number
  averageScore: number
  totalTimeSpent: number
  passRate: number
  scoreProgression: any[]
  timeRange: string
}

interface SkillRecommendation {
  type: string
  categoryId: string
  categoryName: string
  currentLevel?: string
  recommendedLevel: string
  reason: string
  priority: string
  estimatedTime: string
  benefits: string[]
}

interface LearningPath {
  id: string
  title: string
  description: string
  duration: string
  difficulty: "beginner" | "intermediate" | "advanced"
  skills: string[]
  progress: number
  nextMilestone: string
  estimatedCompletion: string
}

export function SkillsManagement() {
  const { t } = useTranslation()
  const { getToken } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // API Data
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([])
  const [skillAnalytics, setSkillAnalytics] = useState<SkillAnalytics | null>(null)
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([])

  // Fetch skills data from API
  useEffect(() => {
    fetchSkillsData()
  }, [])

  const fetchSkillsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = await getToken()
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Fetch skill categories
      const categoriesResponse = await fetch('/api/skills/categories', { headers })
      if (!categoriesResponse.ok) throw new Error('Failed to fetch skill categories')
      const categoriesData = await categoriesResponse.json()
      setSkillCategories(categoriesData.data.categories || [])

      // Fetch skill progress with analytics and recommendations
      const progressResponse = await fetch('/api/skills/progress?includeHistory=true&includeRecommendations=true&timeRange=30d', { headers })
      if (!progressResponse.ok) throw new Error('Failed to fetch skill progress')
      const progressData = await progressResponse.json()
      
      setSkillProgress(progressData.data.skillProgress || [])
      setSkillAnalytics(progressData.data.analytics || null)

      // Fetch recommendations
      const recommendationsResponse = await fetch('/api/skills/recommendations?limit=8', { headers })
      if (!recommendationsResponse.ok) throw new Error('Failed to fetch recommendations')
      const recData = await recommendationsResponse.json()
      setRecommendations(recData.data.recommendations || [])

    } catch (err) {
      console.error('Error fetching skills data:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load skills data'
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch skill categories')) {
          errorMessage = 'Unable to load skill categories. This might be because you haven\'t taken any assessments yet.'
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication error. Please sign in again.'
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied. You may need to complete your profile setup.'
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      // Fallback to mock data
      setSkillCategories(mockSkillCategories)
      setRecommendations(mockRecommendations)
    } finally {
      setLoading(false)
    }
  }

  // Mock data fallback
  const mockSkillCategories: SkillCategory[] = [
    {
      id: "communication",
      name: "communication",
      displayName: "Communication Interpersonnelle",
      description: "Skills in interpersonal communication",
      icon: "💬",
      color: "#22d3ee",
      type: "soft-skills",
      skillCount: 8,
      isFeatured: true,
      statistics: {},
      userProgress: {
        currentLevel: "advanced",
        lastScore: 92,
        bestScore: 95,
        attemptCount: 3,
        lastAssessmentAt: "2024-01-15T10:00:00Z"
      }
    },
    {
      id: "creativity",
      name: "creativity",
      displayName: "Pensée Créative",
      description: "Creative thinking and innovation skills",
      icon: "🎨",
      color: "#8b5cf6",
      type: "creative",
      skillCount: 6,
      isFeatured: true,
      statistics: {},
      userProgress: {
        currentLevel: "advanced",
        lastScore: 88,
        bestScore: 90,
        attemptCount: 2,
        lastAssessmentAt: "2024-01-10T14:30:00Z"
      }
    },
    {
      id: "leadership",
      name: "leadership",
      displayName: "Leadership Collaboratif",
      description: "Leadership and team management",
      icon: "👥",
      color: "#f59e0b",
      type: "business",
      skillCount: 10,
      isFeatured: true,
      statistics: {},
      userProgress: {
        currentLevel: "intermediate",
        lastScore: 78,
        bestScore: 82,
        attemptCount: 4,
        lastAssessmentAt: "2024-01-08T09:15:00Z"
      }
    }
  ]

  const mockRecommendations: SkillRecommendation[] = [
    {
      type: 'new_skill',
      categoryId: 'ai-collaboration',
      categoryName: 'Intelligence Artificielle Collaborative',
      recommendedLevel: 'beginner',
      reason: 'Expand your skill portfolio with emerging AI skills',
      priority: 'high',
      estimatedTime: '2-3 months',
      benefits: ['Career advancement', 'Future-ready skills', 'Innovation opportunities']
    },
    {
      type: 'skill_advancement',
      categoryId: 'communication',
      categoryName: 'Communication Digitale Avancée',
      currentLevel: 'advanced',
      recommendedLevel: 'expert',
      reason: 'Advance from advanced to expert level',
      priority: 'medium',
      estimatedTime: '1-2 months',
      benefits: ['Higher skill recognition', 'Digital influence', 'Thought leadership']
    }
  ]

  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([
    {
      id: "communication-master",
      title: "Maîtrise de la Communication",
      description: "Développez vos compétences de communication interpersonnelle et leadership",
      duration: "6 mois",
      difficulty: "advanced",
      skills: ["Communication", "Leadership", "Négociation", "Présentation"],
      progress: 65,
      nextMilestone: "Maîtriser la communication non-verbale",
      estimatedCompletion: "Mars 2024",
    },
    {
      id: "creative-innovation",
      title: "Innovateur Créatif",
      description: "Libérez votre potentiel créatif et développez des solutions innovantes",
      duration: "4 mois",
      difficulty: "intermediate",
      skills: ["Pensée Créative", "Design Thinking", "Innovation", "Brainstorming"],
      progress: 25,
      nextMilestone: "Comprendre les méthodes de créativité",
      estimatedCompletion: "Mai 2024",
    },
    {
      id: "emotional-mastery",
      title: "Maîtrise Émotionnelle",
      description: "Développez votre intelligence émotionnelle et vos relations humaines",
      duration: "3 mois",
      difficulty: "intermediate",
      skills: ["Intelligence Émotionnelle", "Empathie", "Gestion Stress", "Relations"],
      progress: 40,
      nextMilestone: "Développer l'empathie cognitive",
      estimatedCompletion: "Avril 2024",
    },
  ])

  // Get unique categories from skill categories
  const categories = ["all", ...Array.from(new Set(skillCategories.map(cat => cat.type)))]

  const filteredSkillCategories = selectedCategory === "all" 
    ? skillCategories 
    : skillCategories.filter((cat) => cat.type === selectedCategory)

  // Helper function to get icon component
  const getIconForSkill = (iconString: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      '💬': MessageSquare,
      '🎨': Palette,
      '👥': Users,
      '❤️': Heart,
      '🧠': Brain,
      '⭐': Award,
    }
    return iconMap[iconString] || Brain
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  // Calculate analytics display values
  const analyticsDisplayValues = {
    masteredSkills: skillCategories.filter(cat => cat.userProgress?.currentLevel === 'expert').length,
    averageLevel: skillAnalytics?.averageScore ? `${Math.round(skillAnalytics.averageScore)}%` : '0%',
    activePaths: learningPaths.length,
    learningHours: skillAnalytics?.totalTimeSpent ? `${skillAnalytics.totalTimeSpent}h` : '0h'
  }

  const marketDemandColors = {
    high: "text-green-400",
    medium: "text-yellow-400",
    low: "text-red-400",
  }

  const difficultyColors = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-yellow-500/20 text-yellow-400",
    advanced: "bg-red-500/20 text-red-400",
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <Brain className="h-8 w-8 text-cyan-400 animate-spin mr-3" />
          <span className="text-white text-lg">Loading your skills...</span>
        </div>
      </div>
    )
  }

  if (error) {
    const isNoSkillsError = error.includes('haven\'t taken any assessments') || 
                           error.includes('skill categories') ||
                           error.includes('403')

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t("skills.title")}</h2>
          <div className={`${isNoSkillsError ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg p-6 max-w-2xl mx-auto`}>
            {isNoSkillsError ? (
              <Brain className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            ) : (
              <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
            )}
            
            <h3 className={`text-lg font-semibold mb-3 ${isNoSkillsError ? 'text-blue-300' : 'text-red-300'}`}>
              {isNoSkillsError ? 'Get Started with Skills' : 'Error Loading Skills'}
            </h3>
            
            <p className={`mb-6 ${isNoSkillsError ? 'text-blue-200' : 'text-red-400'}`}>
              {isNoSkillsError ? 
                'Begin your journey by taking your first skill assessment. Our AI will analyze your abilities and help you track your professional growth.' :
                error
              }
            </p>
            
            <div className="space-y-3">
              {!isNoSkillsError && (
                <Button onClick={fetchSkillsData} className="bg-red-500 hover:bg-red-600 w-full">
                  Try Again
                </Button>
              )}
              <Button 
                onClick={() => window.location.href = '/assessments'} 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 w-full"
              >
                <Target className="h-4 w-4 mr-2" />
                {isNoSkillsError ? 'Start Your First Assessment' : 'Take Assessment Instead'}
              </Button>
              <Button 
                onClick={() => window.location.href = '/learning'} 
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Explore Learning Paths
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has no skills (successful load but empty)
  if (!loading && !error && skillCategories.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold text-white mb-4">{t("skills.title")}</h2>
          <p className="text-gray-300 text-lg">
            {t("skills.subtitle")}
          </p>
        </motion.div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-12 max-w-2xl mx-auto">
            <Brain className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">Start Your Skills Journey</h3>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              You haven't taken any skill assessments yet. Take your first assessment to discover your strengths and begin tracking your professional development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/assessments'} 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
              >
                <Target className="h-5 w-5 mr-2" />
                Take Your First Assessment
              </Button>
              <Button 
                onClick={() => window.location.href = '/learning'} 
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-3"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Explore Learning Paths
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-4">{t("skills.title")}</h2>
        <p className="text-gray-300 text-lg">
          {t("skills.subtitle")}
        </p>
      </motion.div>

      {/* Skills Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: t("skills.mastered_skills"), value: analyticsDisplayValues.masteredSkills.toString(), icon: Award, color: "from-cyan-500 to-blue-600" },
          { label: t("skills.average_level"), value: analyticsDisplayValues.averageLevel, icon: TrendingUp, color: "from-green-500 to-teal-600" },
          { label: t("skills.active_paths"), value: analyticsDisplayValues.activePaths.toString(), icon: Target, color: "from-purple-500 to-pink-600" },
          { label: t("skills.learning_hours"), value: analyticsDisplayValues.learningHours, icon: Clock, color: "from-amber-500 to-orange-600" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="skills" className="text-gray-300 data-[state=active]:text-white">
            {t("skills.my_skills")}
          </TabsTrigger>
          <TabsTrigger value="paths" className="text-gray-300 data-[state=active]:text-white">
            {t("skills.learning_paths")}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-gray-300 data-[state=active]:text-white">
            {t("skills.ai_recommendations")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-8">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "border-slate-600 text-gray-300 hover:text-white hover:bg-slate-800 bg-transparent"
                }`}
              >
                {category === "all" ? t("skills.all_categories") : category}
              </Button>
            ))}
          </motion.div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkillCategories.map((skillCategory, index) => {
              const IconComponent = getIconForSkill(skillCategory.icon)
              return (
                <motion.div
                  key={skillCategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                          style={{ backgroundColor: skillCategory.color + '20' }}
                        >
                          <IconComponent className="h-6 w-6" style={{ color: skillCategory.color }} />
                        </div>
                        <div className="flex items-center space-x-2">
                          {skillCategory.userProgress && (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          )}
                          {skillCategory.isFeatured && (
                            <span className="text-sm font-medium text-green-400">
                              {t("skills.high_demand")}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-white font-semibold text-lg mb-2">{skillCategory.displayName}</h3>
                      <p className="text-gray-400 text-sm mb-4 capitalize">{skillCategory.type.replace('-', ' ')}</p>

                      {skillCategory.userProgress ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300">{t("skills.level")}</span>
                              <span className="text-white font-medium">{skillCategory.userProgress.lastScore}%</span>
                            </div>
                            <Progress value={skillCategory.userProgress.lastScore} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300">Best Score</span>
                              <span className="text-cyan-400 font-medium">{skillCategory.userProgress.bestScore}%</span>
                            </div>
                            <Progress value={skillCategory.userProgress.bestScore} className="h-2" />
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-600/30">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                              <span>{t("skills.last_assessment")}: {formatDate(skillCategory.userProgress.lastAssessmentAt)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Level: {skillCategory.userProgress.currentLevel}</span>
                              <span>Attempts: {skillCategory.userProgress.attemptCount}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-400 text-sm mb-4">Not assessed yet</p>
                          <p className="text-gray-400 text-xs mb-4">{skillCategory.skillCount} skills available</p>
                        </div>
                      )}

                      <Button className="w-full mt-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white">
                        <Brain className="h-4 w-4 mr-2" />
                        {skillCategory.userProgress ? t("skills.new_assessment") : "Start Assessment"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {learningPaths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-xl">{path.title}</CardTitle>
                      <Badge className={difficultyColors[path.difficulty]}>{path.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{path.description}</p>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progression</span>
                        <span className="text-white font-medium">{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-3" />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Durée:</span>
                          <p className="text-white font-medium">{path.duration}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Fin estimée:</span>
                          <p className="text-white font-medium">{path.estimatedCompletion}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Prochaine étape:</p>
                        <p className="text-cyan-400 font-medium">{path.nextMilestone}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Compétences développées:</p>
                        <div className="flex flex-wrap gap-2">
                          {path.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-slate-700 text-gray-300">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Continuer le Parcours
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Add New Learning Path */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border-2 border-dashed border-slate-600/50 hover:border-slate-500/70 transition-all duration-300 h-full flex items-center justify-center cursor-pointer group">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Nouveau Parcours</h3>
                  <p className="text-gray-400 mb-4">Découvrez des parcours personnalisés basés sur vos objectifs</p>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <Zap className="h-4 w-4 mr-2" />
                    {t("skills.ai_recommendations")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-8">
          <div className="space-y-8">
            {/* AI Recommendations Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="h-8 w-8 text-purple-400 mr-3" />
                    <div>
                      <h3 className="text-white font-semibold text-xl">{t("skills.ai_recommendations")} Personnalisées</h3>
                      <p className="text-gray-300">Basées sur votre profil, vos objectifs et les tendances du marché</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((recommendation, index) => {
                const getRecommendationIcon = (type: string) => {
                  switch (type) {
                    case 'new_skill': return Brain
                    case 'skill_advancement': return TrendingUp
                    default: return Target
                  }
                }

                const getRecommendationColor = (priority: string) => {
                  switch (priority) {
                    case 'high': return 'from-red-500 to-pink-600'
                    case 'medium': return 'from-yellow-500 to-orange-600'
                    case 'low': return 'from-green-500 to-teal-600'
                    default: return 'from-blue-500 to-cyan-600'
                  }
                }

                const IconComponent = getRecommendationIcon(recommendation.type)
                
                return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getRecommendationColor(recommendation.priority)} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <Badge
                          className={`${
                            recommendation.priority === "high"
                              ? "bg-red-500/20 text-red-400"
                              : recommendation.priority === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {recommendation.priority === "high"
                            ? "Priorité Haute"
                            : recommendation.priority === "medium"
                              ? "Priorité Moyenne"
                              : "Priorité Basse"}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <Badge variant="secondary" className="bg-slate-700 text-gray-300 text-xs mb-2">
                          {recommendation.type === 'new_skill' ? 'Nouvelle Compétence' : recommendation.type === 'skill_advancement' ? 'Progression' : 'Recommandation'}
                        </Badge>
                        <h3 className="text-white font-semibold text-lg">{recommendation.categoryName}</h3>
                      </div>

                      <p className="text-gray-300 mb-4">{recommendation.reason}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Temps d'investissement:</span>
                          <span className="text-white">{recommendation.estimatedTime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Niveau cible:</span>
                          <span className="text-cyan-400 capitalize">{recommendation.recommendedLevel}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Bénéfices:</p>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.benefits.slice(0, 3).map((benefit, i) => (
                            <Badge key={i} variant="outline" className="text-gray-300 border-gray-600 text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button className={`w-full bg-gradient-to-r ${getRecommendationColor(recommendation.priority)} hover:opacity-90 text-white`}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Commencer
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
