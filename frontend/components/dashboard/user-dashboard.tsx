"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardEmpty } from "@/components/empty-states/dashboard-empty"
import { IntelligentSignup } from "@/components/onboarding/intelligent-signup"
import { AILoading } from "@/components/loading/ai-loading"
import { Button } from "@/components/ui/button"
import { 
  Brain,
  Award,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  Clock,
  BookOpen,
  ArrowRight,
  Play,
  Zap,
  Target,
  BarChart3,
  CheckCircle,
  Crown,
  Sparkles,
  Calendar,
  Plus,
  ChevronRight,
  Activity
} from "lucide-react"

const UserDashboard = () => {
  const { user, isLoading, getToken, refreshUserData } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [showAIOnboarding, setShowAIOnboarding] = useState(false)
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [aiLoadingStage, setAiLoadingStage] = useState("Analyzing your profile")
  const [personalizedData, setPersonalizedData] = useState<any>(null)

  // Load personalization from localStorage on mount and fetch from backend if needed
  useEffect(() => {
    const loadPersonalization = async () => {
      console.log("🔍 [DASHBOARD] Checking for personalization data...")
      console.log("🔍 [DASHBOARD] User from context:", user)
      console.log("🔍 [DASHBOARD] User personalization from context:", user?.personalization)
      
      // First check localStorage
      const savedPersonalization = localStorage.getItem('userPersonalization')
      console.log("🔍 [DASHBOARD] Raw localStorage value:", savedPersonalization)
      
      if (savedPersonalization) {
        try {
          const parsed = JSON.parse(savedPersonalization)
          console.log("📊 [DASHBOARD] Parsed personalization from localStorage:", parsed)
          console.log("📊 [DASHBOARD] personalizedContent:", parsed?.personalizedContent)
          console.log("📊 [DASHBOARD] learningPath:", parsed?.learningPath)
          console.log("📊 [DASHBOARD] assessmentPlan:", parsed?.assessmentPlan)
          setPersonalizedData(parsed)
        } catch (error) {
          console.error("Error parsing saved personalization:", error)
        }
      } else if (user && !user?.personalization) {
        // If no localStorage but user exists, try fetching from backend
        console.log("🔄 [DASHBOARD] No localStorage, fetching from backend...")
        try {
          const token = await getToken()
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
          const response = await fetch(`${apiUrl}/api/personalization`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log("✅ [DASHBOARD] Fetched personalization from backend:", result)
            if (result.data?.personalization) {
              setPersonalizedData(result.data.personalization)
              localStorage.setItem('userPersonalization', JSON.stringify(result.data.personalization))
            }
          } else {
            console.log("❌ [DASHBOARD] No personalization found on backend")
          }
        } catch (error) {
          console.error("Error fetching personalization:", error)
        }
      } else {
        console.log("⚠️ [DASHBOARD] No personalization in localStorage or backend")
      }
    }
    
    if (user) {
      loadPersonalization()
    }
  }, [user, getToken])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-revolutionary-cyan"></div>
      </div>
    )
  }

  // Handle no user state (should not happen with proper auth)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access your dashboard</p>
        </div>
      </div>
    )
  }

  // Check if user has personalization data (from state or user object)
  const userPersonalization = personalizedData || user?.personalization
  console.log("🎯 [DASHBOARD] Final personalization being used:", userPersonalization)
  console.log("🎯 [DASHBOARD] Type of personalization:", typeof userPersonalization)
  console.log("🎯 [DASHBOARD] Keys in personalization:", userPersonalization ? Object.keys(userPersonalization) : 'none')
  const hasPersonalization = userPersonalization?.personalizedContent || userPersonalization?.learningPath
  console.log("🎯 [DASHBOARD] Has personalization:", hasPersonalization)
  console.log("🎯 [DASHBOARD] personalizedContent exists:", !!userPersonalization?.personalizedContent)
  console.log("🎯 [DASHBOARD] learningPath exists:", !!userPersonalization?.learningPath)
  
  // Don't auto-redirect, let user choose when to start personalization

  // User data (now from real auth context)
  const userData = {
    name: user.name,
    level: "Expert", // TODO: Calculate from user stats
    aiConfidence: userPersonalization?.confidence || user?.personalization?.confidence || user.statistics?.aiConfidence || 0,
    globalRank: user.statistics?.globalRank || 0,
    streakDays: user.statistics?.streakDays || 0,
    completedAssessments: user.statistics?.completedAssessments || 0,
    activeCourses: user.statistics?.activeCourses || 0
  }

  // Determine user state for empty state
  const getUserStateType = () => {
    const hasAssessments = userData.completedAssessments > 0
    const hasCourses = userData.activeCourses > 0
    const hasCertificates = (user.statistics?.certificatesEarned || 0) > 0

    if (!hasAssessments && !hasCourses) {
      return "complete-beginner"
    } else if (hasAssessments && !hasCourses) {
      return "assessment-completed"
    } else if (hasCourses && !hasCertificates) {
      return "learning-progress"
    } else if (hasCertificates) {
      return "advanced"
    }
    return "complete-beginner"
  }

  // Check if we should show empty state
  const shouldShowEmptyState = userData.completedAssessments === 0 && 
                              userData.activeCourses === 0 && 
                              (user.statistics?.certificatesEarned || 0) === 0

  // Empty state handlers
  const handleStartAssessment = () => {
    // TODO: Navigate to assessment page
    console.log("Navigate to assessment")
  }

  const handleExploreCourses = () => {
    // TODO: Navigate to courses page
    console.log("Navigate to courses")
  }

  const handleViewCertificates = () => {
    // TODO: Navigate to certificates page
    console.log("Navigate to certificates")
  }

  const handleStartAIOnboarding = () => {
    console.log("🤖 Starting AI Onboarding from dashboard")
    setShowAIOnboarding(true)
  }

  const handleAIOnboardingComplete = async (onboardingData: any) => {
    try {
      console.log("🤖 [FRONTEND] AI Onboarding completed with data:", onboardingData)
      
      // Hide the onboarding form and show AI loading
      setShowAIOnboarding(false)
      setIsProcessingAI(true)
      
      // Update loading stages as we process
      setAiLoadingStage("Analyzing your profile")
      
      const token = await getToken()
      console.log("🤖 [FRONTEND] Got token:", token ? 'TOKEN_PRESENT' : 'NO_TOKEN')
      
      setAiLoadingStage("Identifying learning goals")
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const fullUrl = `${apiUrl}/api/personalization/generate`
      console.log("🤖 [FRONTEND] Calling URL:", fullUrl)
      
      const requestBody = { onboardingData }
      console.log("🤖 [FRONTEND] Request body:", JSON.stringify(requestBody, null, 2))
      
      setAiLoadingStage("Creating personalized curriculum")
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log("🤖 [FRONTEND] Response status:", response.status)
      console.log("🤖 [FRONTEND] Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        setAiLoadingStage("Optimizing learning path")
        const result = await response.json()
        console.log('✅ [FRONTEND] AI personalization completed:', result.data.personalization)
        
        setAiLoadingStage("Finalizing your experience")
        
        // Store personalization data directly in state
        console.log('💾 [DASHBOARD] Storing personalization data:')
        console.log('💾 [DASHBOARD] Full result:', result)
        console.log('💾 [DASHBOARD] result.data:', result.data)
        console.log('💾 [DASHBOARD] result.data.personalization:', result.data.personalization)
        
        const personalizationToStore = result.data.personalization || result.personalization || result.data
        console.log('💾 [DASHBOARD] Data to store:', personalizationToStore)
        
        setPersonalizedData(personalizationToStore)
        
        // Also save to localStorage for persistence
        localStorage.setItem('userPersonalization', JSON.stringify(personalizationToStore))
        console.log('💾 [DASHBOARD] Saved to localStorage')
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setIsProcessingAI(false)
      } else {
        const errorText = await response.text()
        console.error('❌ [FRONTEND] AI personalization failed')
        console.error('❌ [FRONTEND] Response status:', response.status)
        console.error('❌ [FRONTEND] Response text:', errorText)
        setIsProcessingAI(false)
      }
    } catch (error) {
      console.error('❌ Error during AI personalization:', error)
      setIsProcessingAI(false)
    }
  }

  const handleAIOnboardingSkip = () => {
    console.log("🚫 AI Onboarding skipped from dashboard")
    setShowAIOnboarding(false)
  }

  // Show AI processing loading state
  if (isProcessingAI) {
    return <AILoading stage={aiLoadingStage} />
  }

  // Show AI onboarding if requested
  if (showAIOnboarding) {
    return (
      <IntelligentSignup
        onComplete={handleAIOnboardingComplete}
        onSkip={handleAIOnboardingSkip}
      />
    )
  }

  // Show empty state for new users
  if (shouldShowEmptyState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2">
        <div className="max-w-7xl mx-auto">
          <DashboardEmpty
            userType={getUserStateType()}
            userName={user.name.split(' ')[0] || 'Utilisateur'}
            onStartAssessment={handleStartAssessment}
            onExploreCourses={handleExploreCourses}
            onViewCertificates={handleViewCertificates}
            onStartAIOnboarding={() => {
              sessionStorage.setItem('onboarding-in-progress', 'true')
              router.push('/onboarding')
            }}
          />
        </div>
      </div>
    )
  }

  const quickStats = [
    {
      label: "AI Confidence",
      value: `${userData.aiConfidence}%`,
      icon: Brain,
      trend: "+3%",
      color: "text-revolutionary-cyan"
    },
    {
      label: "Certificates",
      value: "12",
      icon: Award,
      trend: "+2",
      color: "text-revolutionary-amber"
    },
    {
      label: "Global Rank",
      value: `#${userData.globalRank}`,
      icon: Crown,
      trend: "+15",
      color: "text-revolutionary-purple"
    },
    {
      label: "Learning Streak",
      value: `${userData.streakDays} days`,
      icon: Zap,
      trend: "Current",
      color: "text-green-500"
    }
  ]

  // Dynamic skill areas based on personalization
  const getSkillAreas = () => {
    if (hasPersonalization && userPersonalization?.personalizedContent?.prioritySkills) {
      const skills = userPersonalization.personalizedContent.prioritySkills
      const colors = ["revolutionary-cyan", "revolutionary-amber", "revolutionary-purple", "revolutionary-cyan"]
      
      return skills.slice(0, 4).map((skill: string, index: number) => ({
        name: skill.split(' ').slice(0, 2).join(' '), // Shorten name for display
        progress: 70 + Math.floor(Math.random() * 25), // TODO: Get actual progress
        level: index < 2 ? "Intermediate" : "Beginner",
        color: colors[index],
        trend: "up"
      }))
    }
    
    // Default skill areas
    return [
      {
        name: "Communication",
        progress: 94,
        level: "Expert",
        color: "revolutionary-cyan",
        trend: "up"
      },
      {
        name: "Leadership",
        progress: 78,
        level: "Advanced",
        color: "revolutionary-amber",
        trend: "up"
      },
      {
        name: "Creativity",
        progress: 85,
        level: "Advanced", 
        color: "revolutionary-purple",
        trend: "up"
      },
      {
        name: "Analytics",
        progress: 90,
        level: "Expert",
        color: "revolutionary-cyan",
        trend: "stable"
      }
    ]
  }
  
  const skillAreas = getSkillAreas()

  const recentActivity = [
    {
      title: "Communication Assessment Completed",
      type: "Assessment",
      date: "2 hours ago",
      status: "completed"
    },
    {
      title: "Leadership Course Progress",
      type: "Course",
      date: "1 day ago",
      status: "in-progress"
    },
    {
      title: "Expert Certificate Earned",
      type: "Achievement",
      date: "3 days ago",
      status: "completed"
    }
  ]

  const upcomingTasks = [
    {
      title: "Complete Leadership Module",
      deadline: "Due in 2 days",
      priority: "high"
    },
    {
      title: "Take Analytics Assessment",
      deadline: "Due in 5 days", 
      priority: "medium"
    },
    {
      title: "Portfolio Review",
      deadline: "Due in 1 week",
      priority: "low"
    }
  ]

  // Dynamic learning paths based on personalization
  const getLearningPaths = () => {
    if (hasPersonalization && userPersonalization?.learningPath?.modules) {
      const modules = userPersonalization.learningPath.modules
      
      return modules.slice(0, 3).map((module: any, index: number) => ({
        title: module.title,
        progress: index === 0 ? 30 : index === 1 ? 15 : 0,
        modules: module.skills?.length || 4,
        completed: index === 0 ? 1 : 0,
        timeLeft: module.duration || "4 weeks"
      }))
    }
    
    // Default learning paths
    return [
      {
        title: "Advanced Communication",
        progress: 65,
        modules: 8,
        completed: 5,
        timeLeft: "3 weeks"
      },
      {
        title: "Creative Leadership",
        progress: 30,
        modules: 6,
        completed: 2,
        timeLeft: "5 weeks"
      },
      {
        title: "Data Analytics",
        progress: 80,
        modules: 5,
        completed: 4,
        timeLeft: "1 week"
      }
    ]
  }
  
  const learningPaths = getLearningPaths()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-revolutionary-blue/2 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          id="dashboard-header"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                Welcome back, {userData.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-muted-foreground">
                {hasPersonalization && userPersonalization?.personalizedContent?.welcomeMessage 
                  ? userPersonalization.personalizedContent.welcomeMessage.split('.')[0] + '.'
                  : "Continue your learning journey and track your progress"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {hasPersonalization && (
                <>
                  <Button
                    onClick={async () => {
                      console.log("🔄 Refreshing personalization from backend...")
                      try {
                        const token = await getToken()
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                        const response = await fetch(`${apiUrl}/api/personalization`, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          console.log("✅ Refreshed personalization:", result)
                          if (result.data?.personalization) {
                            setPersonalizedData(result.data.personalization)
                            localStorage.setItem('userPersonalization', JSON.stringify(result.data.personalization))
                          }
                        }
                      } catch (error) {
                        console.error("Error refreshing:", error)
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-blue-400 border-blue-400/30 hover:bg-blue-500/10"
                  >
                    Refresh from DB
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem('userPersonalization')
                      setPersonalizedData(null)
                      console.log("🗑️ Cleared personalization")
                    }}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400/30 hover:bg-red-500/10"
                  >
                    Clear Local
                  </Button>
                </>
              )}
              {!hasPersonalization && (
                <Button
                  onClick={() => {
                    sessionStorage.setItem('onboarding-in-progress', 'true')
                    router.push('/onboarding')
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-400/30 text-purple-300 hover:text-white hover:border-purple-400/60 hover:bg-purple-500/20"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Personalization
                </Button>
              )}
              <div className="w-px h-8 bg-revolutionary-cyan/20"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-revolutionary-cyan">{userData.aiConfidence}%</div>
                <div className="text-xs text-muted-foreground">AI Confidence</div>
              </div>
              <div className="w-px h-8 bg-revolutionary-cyan/20"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">#{userData.globalRank}</div>
                <div className="text-xs text-muted-foreground">Global Rank</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          id="quick-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => (
            <div key={stat.label} className="glass rounded-xl p-4 border border-revolutionary-cyan/10">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xs text-green-500 font-medium">{stat.trend}</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          id="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8"
        >
          <button className="flex-1 glass rounded-xl p-4 border border-revolutionary-cyan/10 hover:border-revolutionary-cyan/20 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-revolutionary-cyan/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-revolutionary-cyan" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">New Assessment</div>
                  <div className="text-xs text-muted-foreground">Test your skills</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-revolutionary-cyan group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>
          
          <button className="flex-1 glass rounded-xl p-4 border border-revolutionary-cyan/10 hover:border-revolutionary-cyan/20 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-revolutionary-purple/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-revolutionary-purple" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Continue Learning</div>
                  <div className="text-xs text-muted-foreground">{userData.activeCourses} active courses</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-revolutionary-purple group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>

          <button className="flex-1 glass rounded-xl p-4 border border-revolutionary-cyan/10 hover:border-revolutionary-cyan/20 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-revolutionary-amber/20 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-revolutionary-amber" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">View Certificates</div>
                  <div className="text-xs text-muted-foreground">{userData.completedAssessments} earned</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-revolutionary-amber group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Skill Areas */}
            <motion.div
              id="skill-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6 border border-revolutionary-cyan/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Skill Progress</h2>
                <button className="text-xs text-revolutionary-cyan hover:text-white transition-colors">
                  View all
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillAreas.map((skill, index) => (
                  <div key={skill.name} className="p-4 rounded-xl bg-revolutionary-blue/5 border border-revolutionary-cyan/5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-white">{skill.name}</div>
                        <div className="text-xs text-muted-foreground">{skill.level}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${skill.trend === 'up' ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium text-${skill.color}`}>{skill.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-revolutionary-blue/10 rounded-full h-2">
                      <div 
                        className={`bg-${skill.color} h-2 rounded-full transition-all duration-1000`}
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Learning Paths */}
            <motion.div
              id="learning-paths"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-6 border border-revolutionary-cyan/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Active Learning Paths</h2>
                <button className="text-xs text-revolutionary-cyan hover:text-white transition-colors">
                  Browse more
                </button>
              </div>
              
              <div className="space-y-4">
                {learningPaths.map((path, index) => (
                  <div key={path.title} className="flex items-center justify-between p-4 rounded-xl bg-revolutionary-blue/5 border border-revolutionary-cyan/5 hover:border-revolutionary-cyan/10 transition-all duration-300 cursor-pointer group">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-white">{path.title}</div>
                        <div className="text-xs text-muted-foreground">{path.timeLeft} left</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {path.completed}/{path.modules} modules completed
                      </div>
                      <div className="w-full bg-revolutionary-blue/10 rounded-full h-2">
                        <div 
                          className="bg-revolutionary-cyan h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-sm font-medium text-white">{path.progress}%</span>
                      <button className="w-8 h-8 bg-revolutionary-cyan rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-xl p-6 border border-revolutionary-cyan/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                <button className="text-xs text-revolutionary-cyan hover:text-white transition-colors">
                  View all
                </button>
              </div>
              
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-revolutionary-blue/5">
                    <div className={`w-2 h-2 rounded-full ${activity.status === 'completed' ? 'bg-green-500' : 'bg-revolutionary-amber'}`}></div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-medium">{activity.title}</div>
                      <div className="text-xs text-muted-foreground">{activity.type} • {activity.date}</div>
                    </div>
                    {activity.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Upcoming Tasks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-6 border border-revolutionary-cyan/10"
            >
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-revolutionary-cyan" />
                <h3 className="text-sm font-semibold text-white">Upcoming Tasks</h3>
              </div>
              
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    task.priority === 'high' ? 'bg-red-500/10 border-red-500/20' :
                    task.priority === 'medium' ? 'bg-revolutionary-amber/10 border-revolutionary-amber/20' :
                    'bg-revolutionary-blue/5 border-revolutionary-cyan/10'
                  }`}>
                    <div className="text-white text-xs font-medium mb-1">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.deadline}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-xl p-6 border border-revolutionary-cyan/10"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-revolutionary-amber" />
                <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
              </div>
              
              <div className="space-y-4">
                {hasPersonalization && userPersonalization?.personalizedContent?.quickWins ? (
                  userPersonalization.personalizedContent.quickWins.slice(0, 2).map((quickWin: string, index: number) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      index === 0 ? 'bg-revolutionary-cyan/10 border border-revolutionary-cyan/20' 
                                  : 'bg-revolutionary-purple/10 border border-revolutionary-purple/20'
                    }`}>
                      <div className="text-white text-xs font-medium mb-1">
                        {quickWin.split('.')[0]}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Personalized recommendation based on your profile
                      </div>
                      <button className={`text-xs ${
                        index === 0 ? 'text-revolutionary-cyan' : 'text-revolutionary-purple'
                      } hover:text-white transition-colors`}>
                        Start Now →
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-revolutionary-cyan/10 border border-revolutionary-cyan/20">
                      <div className="text-white text-xs font-medium mb-1">Focus on Leadership Skills</div>
                      <div className="text-xs text-muted-foreground mb-2">Based on your career goals and current progress</div>
                      <button className="text-xs text-revolutionary-cyan hover:text-white transition-colors">
                        Start Assessment →
                      </button>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-revolutionary-purple/10 border border-revolutionary-purple/20">
                      <div className="text-white text-xs font-medium mb-1">Complete Creative Portfolio</div>
                      <div className="text-xs text-muted-foreground mb-2">You're 85% through this skill area</div>
                      <button className="text-xs text-revolutionary-purple hover:text-white transition-colors">
                        Continue →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-xl p-6 border border-revolutionary-cyan/10"
            >
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-revolutionary-purple" />
                <h3 className="text-sm font-semibold text-white">This Week</h3>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-revolutionary-cyan">8.5h</div>
                  <div className="text-xs text-muted-foreground">Learning Time</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Assessments</span>
                    <span className="text-white">3 completed</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Modules</span>
                    <span className="text-white">5 finished</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Certificates</span>
                    <span className="text-white">1 earned</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { UserDashboard }