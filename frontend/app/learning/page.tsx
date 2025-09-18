// app/learning/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Brain,
  Play,
  CheckCircle,
  Clock,
  Users,
  Star,
  TrendingUp,
  Target,
  Award,
  Zap,
  Video,
  FileText,
  Headphones,
  Search,
  Filter,
  Grid,
  List,
  ChevronRight,
  Sparkles,
  BarChart3,
  Globe,
  Heart,
  MessageSquare,
  Palette,
  Code,
  Building,
  ArrowRight,
  Eye,
  Bookmark,
  Share2,
  Download,
  Calendar,
  AlertCircle,
  Info,
  Lightbulb,
  Trophy,
  Shield,
  Flame,
  Coffee,
  Briefcase,
  RefreshCw
} from "lucide-react"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingChatBar } from "@/components/chat"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

// Types for Learning Hub
interface LearningPath {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  duration: string
  instructor: string
  rating: number
  students: number
  totalModules: number
  completedModules?: number
  progress?: number
  skills: string[]
  thumbnail: string
  featured: boolean
  new: boolean
  trending: boolean
  price?: number
  originalPrice?: number
  languages: string[]
  level: number
  estimatedHours: number
  certificate: boolean
  aiEnhanced: boolean
  adaptiveContent: boolean
  lastUpdated: string
}

interface LearningCategory {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  pathCount: number
  totalHours: number
}

interface UserProgress {
  totalPathsStarted: number
  totalPathsCompleted: number
  totalHoursLearned: number
  currentStreak: number
  certificates: number
  skillsAcquired: number
  averageRating: number
}

export default function LearningHub() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user, getToken } = useAuth()
  
  // State management
  const [activeTab, setActiveTab] = useState("discover")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recommended")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [categories, setCategories] = useState<LearningCategory[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [featuredPaths, setFeaturedPaths] = useState<LearningPath[]>([])
  const [continueLearning, setContinueLearning] = useState<LearningPath[]>([])
  const [enrolledPaths, setEnrolledPaths] = useState<LearningPath[]>([])

  // Mock user for navigation
  const mockUser = {
    name: user?.name || "Student",
    avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  }

  // Mock data for demonstration
  const mockCategories: LearningCategory[] = [
    {
      id: 'communication',
      name: t('learning_hub.categories.communication'),
      description: t('learning_hub.categories.communication_desc'),
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-600',
      pathCount: 12,
      totalHours: 48
    },
    {
      id: 'leadership',
      name: t('learning_hub.categories.leadership'),
      description: t('learning_hub.categories.leadership_desc'),
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      pathCount: 8,
      totalHours: 36
    },
    {
      id: 'technical',
      name: t('learning_hub.categories.technical'),
      description: t('learning_hub.categories.technical_desc'),
      icon: Code,
      color: 'from-green-500 to-teal-600',
      pathCount: 15,
      totalHours: 72
    },
    {
      id: 'creative',
      name: t('learning_hub.categories.creative'),
      description: t('learning_hub.categories.creative_desc'),
      icon: Palette,
      color: 'from-amber-500 to-orange-600',
      pathCount: 10,
      totalHours: 40
    },
    {
      id: 'business',
      name: t('learning_hub.categories.business'),
      description: t('learning_hub.categories.business_desc'),
      icon: Briefcase,
      color: 'from-indigo-500 to-blue-600',
      pathCount: 14,
      totalHours: 56
    },
    {
      id: 'personal',
      name: t('learning_hub.categories.personal'),
      description: t('learning_hub.categories.personal_desc'),
      icon: Heart,
      color: 'from-rose-500 to-pink-600',
      pathCount: 9,
      totalHours: 32
    }
  ]

  const mockLearningPaths: LearningPath[] = [
    {
      id: 'advanced-communication',
      title: t('learning_paths.advanced_communication.title'),
      description: t('learning_paths.advanced_communication.description'),
      category: 'communication',
      difficulty: 'advanced',
      duration: '6 weeks',
      instructor: 'Dr. Sarah Martinez',
      rating: 4.8,
      students: 12847,
      totalModules: 8,
      completedModules: 3,
      progress: 37,
      skills: ['Verbal Communication', 'Active Listening', 'Conflict Resolution', 'Empathetic Leadership'],
      thumbnail: '/learning/communication-advanced.jpg',
      featured: true,
      new: false,
      trending: true,
      languages: ['English', 'French'],
      level: 85,
      estimatedHours: 24,
      certificate: true,
      aiEnhanced: true,
      adaptiveContent: true,
      lastUpdated: '2024-01-15'
    },
    {
      id: 'leadership-essentials',
      title: t('learning_paths.leadership_essentials.title'),
      description: t('learning_paths.leadership_essentials.description'),
      category: 'leadership',
      difficulty: 'intermediate',
      duration: '8 weeks',
      instructor: 'Marcus Johnson',
      rating: 4.9,
      students: 18293,
      totalModules: 12,
      completedModules: 0,
      progress: 0,
      skills: ['Team Management', 'Decision Making', 'Strategic Thinking', 'Motivation'],
      thumbnail: '/learning/leadership-essentials.jpg',
      featured: true,
      new: true,
      trending: false,
      languages: ['English', 'French', 'Spanish'],
      level: 0,
      estimatedHours: 32,
      certificate: true,
      aiEnhanced: true,
      adaptiveContent: true,
      lastUpdated: '2024-01-20'
    },
    {
      id: 'emotional-intelligence',
      title: t('learning_paths.emotional_intelligence.title'),
      description: t('learning_paths.emotional_intelligence.description'),
      category: 'personal',
      difficulty: 'intermediate',
      duration: '4 weeks',
      instructor: 'Dr. Emma Chen',
      rating: 4.7,
      students: 9456,
      totalModules: 6,
      completedModules: 6,
      progress: 100,
      skills: ['Self-Awareness', 'Empathy', 'Social Skills', 'Emotional Regulation'],
      thumbnail: '/learning/emotional-intelligence.jpg',
      featured: false,
      new: false,
      trending: true,
      languages: ['English', 'French'],
      level: 90,
      estimatedHours: 16,
      certificate: true,
      aiEnhanced: true,
      adaptiveContent: true,
      lastUpdated: '2024-01-10'
    },
    {
      id: 'digital-transformation',
      title: t('learning_paths.digital_transformation.title'),
      description: t('learning_paths.digital_transformation.description'),
      category: 'technical',
      difficulty: 'advanced',
      duration: '10 weeks',
      instructor: 'Alex Rodriguez',
      rating: 4.6,
      students: 7234,
      totalModules: 15,
      completedModules: 2,
      progress: 13,
      skills: ['Digital Strategy', 'Technology Integration', 'Change Management', 'Innovation'],
      thumbnail: '/learning/digital-transformation.jpg',
      featured: true,
      new: false,
      trending: false,
      languages: ['English', 'French'],
      level: 13,
      estimatedHours: 40,
      certificate: true,
      aiEnhanced: true,
      adaptiveContent: true,
      lastUpdated: '2024-01-08'
    },
    {
      id: 'creative-problem-solving',
      title: t('learning_paths.creative_problem_solving.title'),
      description: t('learning_paths.creative_problem_solving.description'),
      category: 'creative',
      difficulty: 'beginner',
      duration: '5 weeks',
      instructor: 'Maya Patel',
      rating: 4.5,
      students: 11567,
      totalModules: 9,
      completedModules: 0,
      progress: 0,
      skills: ['Creative Thinking', 'Problem Analysis', 'Innovation Methods', 'Design Thinking'],
      thumbnail: '/learning/creative-problem-solving.jpg',
      featured: false,
      new: true,
      trending: true,
      languages: ['English', 'French'],
      level: 0,
      estimatedHours: 20,
      certificate: true,
      aiEnhanced: true,
      adaptiveContent: true,
      lastUpdated: '2024-01-22'
    },
    {
      id: 'business-strategy',
      title: t('learning_paths.business_strategy.title'),
      description: t('learning_paths.business_strategy.description'),
      category: 'business',
      difficulty: 'expert',
      duration: '12 weeks',
      instructor: 'Prof. David Kim',
      rating: 4.9,
      students: 5678,
      totalModules: 18,
      completedModules: 0,
      progress: 0,
      skills: ['Strategic Planning', 'Market Analysis', 'Competitive Intelligence', 'Business Development'],
      thumbnail: '/learning/business-strategy.jpg',
      featured: true,
      new: false,
      trending: false,
      languages: ['English', 'French'],
      level: 0,
      estimatedHours: 48,
      certificate: true,
      aiEnhanced: true,
      adaptiveContent: true,
      lastUpdated: '2024-01-05'
    }
  ]

  const mockUserProgress: UserProgress = {
    totalPathsStarted: 4,
    totalPathsCompleted: 1,
    totalHoursLearned: 87,
    currentStreak: 12,
    certificates: 3,
    skillsAcquired: 15,
    averageRating: 4.7
  }

  // Initialize data
  useEffect(() => {
    loadLearningData()
  }, [])

  const loadLearningData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Fetch all learning paths
      const pathsResponse = await fetch('/api/learning-paths?limit=50', { headers })
      if (!pathsResponse.ok) throw new Error('Failed to fetch learning paths')
      const pathsData = await pathsResponse.json()
      
      // Transform API data to match frontend interface
      const transformedPaths = pathsData.data.paths.map((path: any) => ({
        id: path._id,
        title: path.title,
        description: path.description,
        category: path.category,
        difficulty: path.difficulty,
        duration: `${Math.ceil(path.estimatedHours / 7)} weeks`,
        instructor: path.instructor?.name || 'Expert Instructor',
        rating: path.metadata?.rating || 4.5,
        students: path.metadata?.studentsEnrolled || 0,
        totalModules: path.moduleCount || path.modules?.length || 0,
        completedModules: path.userProgress?.completedModules || 0,
        progress: path.userProgress?.percentage || 0,
        skills: path.skills || [],
        thumbnail: `/learning/${path.category}.jpg`,
        featured: path.metadata?.featured || false,
        new: path.metadata?.isNew || false,
        trending: path.metadata?.trending || false,
        languages: path.metadata?.languages || ['English'],
        level: path.userProgress?.percentage || 0,
        estimatedHours: path.estimatedHours,
        certificate: true,
        aiEnhanced: true,
        adaptiveContent: true,
        lastUpdated: path.updatedAt
      }))

      setLearningPaths(transformedPaths)

      // Fetch featured paths
      const featuredResponse = await fetch('/api/learning-paths/featured?limit=6', { headers })
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json()
        const transformedFeatured = featuredData.data.featuredPaths.map((path: any) => ({
          id: path._id,
          title: path.title,
          description: path.description,
          category: path.category,
          difficulty: path.difficulty,
          duration: `${Math.ceil(path.estimatedHours / 7)} weeks`,
          instructor: path.instructor?.name || 'Expert Instructor',
          rating: path.metadata?.rating || 4.5,
          students: path.metadata?.studentsEnrolled || 0,
          totalModules: path.moduleCount || path.modules?.length || 0,
          completedModules: path.userProgress?.completedModules || 0,
          progress: path.userProgress?.percentage || 0,
          skills: path.skills || [],
          thumbnail: `/learning/${path.category}.jpg`,
          featured: true,
          new: path.metadata?.isNew || false,
          trending: path.metadata?.trending || false,
          languages: path.metadata?.languages || ['English'],
          level: path.userProgress?.percentage || 0,
          estimatedHours: path.estimatedHours,
          certificate: true,
          aiEnhanced: true,
          adaptiveContent: true,
          lastUpdated: path.updatedAt
        }))
        setFeaturedPaths(transformedFeatured)
      }

      // Fetch enrolled paths if user is authenticated
      if (user) {
        const enrolledResponse = await fetch('/api/learning-paths/enrolled', { headers })
        if (enrolledResponse.ok) {
          const enrolledData = await enrolledResponse.json()
          const transformedEnrolled = enrolledData.data.enrolled.in_progress?.map((path: any) => ({
            id: path._id,
            title: path.title,
            description: path.description,
            category: path.category,
            difficulty: path.difficulty,
            duration: `${Math.ceil(path.estimatedHours / 7)} weeks`,
            instructor: 'Expert Instructor',
            rating: path.metadata?.rating || 4.5,
            students: path.metadata?.studentsEnrolled || 0,
            totalModules: path.moduleCount || 0,
            completedModules: Math.floor((path.userProgress?.percentage || 0) / 100 * (path.moduleCount || 1)),
            progress: path.userProgress?.percentage || 0,
            skills: path.skills || [],
            thumbnail: `/learning/${path.category}.jpg`,
            featured: false,
            new: false,
            trending: false,
            languages: ['English'],
            level: path.userProgress?.percentage || 0,
            estimatedHours: path.estimatedHours,
            certificate: true,
            aiEnhanced: true,
            adaptiveContent: true,
            lastUpdated: path.updatedAt
          })) || []
          
          setEnrolledPaths(transformedEnrolled)
          setContinueLearning(transformedEnrolled.filter((path: any) => path.progress > 0 && path.progress < 100))

          // Calculate user progress stats (moved inside the if block)
          const totalStarted = enrolledData?.data?.summary?.total || 0
          const totalCompleted = enrolledData?.data?.summary?.completed || 0
          const totalHours = enrolledData?.data?.enrolled?.completed?.reduce((sum: number, path: any) => sum + (path.estimatedHours || 0), 0) || 0

          setUserProgress({
            totalPathsStarted: totalStarted,
            totalPathsCompleted: totalCompleted,
            totalHoursLearned: totalHours,
            currentStreak: 12, // Could be calculated from user activity
            certificates: totalCompleted,
            skillsAcquired: totalCompleted * 3, // Estimate based on completed paths
            averageRating: 4.7
          })
        } else {
          // Set default progress when enrolled data is not available
          setUserProgress({
            totalPathsStarted: 0,
            totalPathsCompleted: 0,
            totalHoursLearned: 0,
            currentStreak: 0,
            certificates: 0,
            skillsAcquired: 0,
            averageRating: 4.7
          })
        }
      }

      // Set mock categories (these could come from a categories API)
      setCategories(mockCategories)

    } catch (err) {
      console.error('Error loading learning data:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load learning data'
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch learning paths')) {
          errorMessage = 'Unable to load learning paths. This might be because no learning content is available yet, or you need to complete your profile setup first.'
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication error. Please sign in again.'
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied. You may need to complete your profile setup or take skill assessments first.'
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      // Fallback to mock data
      setCategories(mockCategories)
      setLearningPaths(mockLearningPaths)
      setUserProgress(mockUserProgress)
      setFeaturedPaths(mockLearningPaths.filter(path => path.featured))
      setContinueLearning(mockLearningPaths.filter(path => path.progress && path.progress > 0 && path.progress < 100))
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort learning paths
  const filteredPaths = learningPaths.filter(path => {
    const matchesSearch = path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || path.category === selectedCategory
    const matchesDifficulty = difficultyFilter === 'all' || path.difficulty === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'students':
        return b.students - a.students
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'duration':
        return a.estimatedHours - b.estimatedHours
      default: // recommended
        return (b.rating * b.students / 1000) - (a.rating * a.students / 1000)
    }
  })

  const handlePathClick = (pathId: string) => {
    router.push(`/learning/${pathId}`)
  }

  const handleSendMessage = (message: string) => {
    console.log('Learning chat message:', message)
    // TODO: Implement your chat logic here for learning-related queries
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400'
      case 'intermediate': return 'bg-amber-500/20 text-amber-400'
      case 'advanced': return 'bg-red-500/20 text-red-400'
      case 'expert': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatDuration = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}min`
    return `${hours}h`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation user={mockUser} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Brain className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-300">Loading learning paths...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const isNoContentError = error.includes('no learning content') || 
                             error.includes('learning paths') ||
                             error.includes('profile setup') ||
                             error.includes('403')

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation user={mockUser} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className={`${isNoContentError ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg p-8`}>
              {isNoContentError ? (
                <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              )}
              
              <h3 className={`text-2xl font-semibold mb-4 ${isNoContentError ? 'text-blue-300' : 'text-red-300'}`}>
                {isNoContentError ? 'Get Started with Learning' : 'Error Loading Learning Paths'}
              </h3>
              
              <p className={`text-lg mb-8 ${isNoContentError ? 'text-blue-200' : 'text-red-400'}`}>
                {isNoContentError ? 
                  'Start your learning journey by taking skill assessments first. This helps us recommend the most relevant learning paths for your goals.' :
                  error
                }
              </p>
              
              <div className="space-y-4">
                {!isNoContentError && (
                  <Button onClick={loadLearningData} className="bg-red-500 hover:bg-red-600 px-8 py-3">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/assessments'} 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8 py-3"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {isNoContentError ? 'Start with Assessments' : 'Take Skills Assessment'}
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/skills'} 
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-3"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    View Skills Dashboard
                  </Button>
                </div>
                
                {isNoContentError && (
                  <p className="text-sm text-gray-400 mt-6">
                    Complete skill assessments to unlock personalized learning recommendations
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has no learning paths (successful load but empty)
  if (!loading && !error && learningPaths.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation user={mockUser} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Learning Hub
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Discover your potential through personalized learning paths
            </p>
          </motion.div>

          {/* Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center py-16"
          >
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-12 max-w-3xl mx-auto">
              <BookOpen className="h-20 w-20 text-cyan-400 mx-auto mb-6" />
              <h3 className="text-3xl font-semibold text-white mb-4">Begin Your Learning Journey</h3>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
                No learning paths are available yet. Start by taking skill assessments to unlock personalized learning recommendations tailored to your goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = '/assessments'} 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Take Skill Assessments
                </Button>
                <Button 
                  onClick={() => window.location.href = '/skills'} 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-4 text-lg"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  View Skills Dashboard
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-8">
                Complete assessments → Get skill recommendations → Unlock learning paths
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <MainNavigation user={mockUser} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32"> {/* Add padding for floating chat bar */}
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {t('learning_hub.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {t('learning_hub.subtitle')}
            </p>
            
            {/* Hero Stats */}
            {userProgress && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-cyan-400">{userProgress.totalHoursLearned}h</div>
                  <div className="text-sm text-gray-400">{t('stats.hours_learned')}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-green-400">{userProgress.certificates}</div>
                  <div className="text-sm text-gray-400">{t('stats.certificates')}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-purple-400">{userProgress.skillsAcquired}</div>
                  <div className="text-sm text-gray-400">{t('stats.skills_acquired')}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-amber-400">{userProgress.currentStreak}</div>
                  <div className="text-sm text-gray-400">{t('stats.day_streak')}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('learning_hub.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">{t('filters.all_categories')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">{t('filters.all_difficulties')}</option>
                  <option value="beginner">{t('difficulty.beginner')}</option>
                  <option value="intermediate">{t('difficulty.intermediate')}</option>
                  <option value="advanced">{t('difficulty.advanced')}</option>
                  <option value="expert">{t('difficulty.expert')}</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="recommended">{t('sort.recommended')}</option>
                  <option value="rating">{t('sort.rating')}</option>
                  <option value="students">{t('sort.popularity')}</option>
                  <option value="newest">{t('sort.newest')}</option>
                  <option value="duration">{t('sort.duration')}</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-slate-600 rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 mb-8">
            <TabsTrigger value="discover" className="text-gray-300 data-[state=active]:text-white">
              {t('tabs.discover')}
            </TabsTrigger>
            <TabsTrigger value="continue" className="text-gray-300 data-[state=active]:text-white">
              {t('tabs.continue_learning')} ({continueLearning.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-gray-300 data-[state=active]:text-white">
              {t('tabs.categories')}
            </TabsTrigger>
            <TabsTrigger value="my-progress" className="text-gray-300 data-[state=active]:text-white">
              {t('tabs.my_progress')}
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-8">
            {/* Featured Paths */}
            {featuredPaths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Star className="h-6 w-6 mr-2 text-amber-400" />
                  {t('learning_hub.featured_paths')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPaths.slice(0, 3).map((path, index) => (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full"
                        onClick={() => handlePathClick(path.id)}
                      >
                        <CardContent className="p-6">
                          {/* Path Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {path.new && (
                                  <Badge className="bg-green-500 text-white mr-2 text-xs">
                                    {t('badges.new')}
                                  </Badge>
                                )}
                                {path.trending && (
                                  <Badge className="bg-red-500 text-white mr-2 text-xs">
                                    {t('badges.trending')}
                                  </Badge>
                                )}
                                {path.aiEnhanced && (
                                  <Badge className="bg-purple-500 text-white text-xs">
                                    <Brain className="h-3 w-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                                {path.title}
                              </h3>
                              <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                                {path.description}
                              </p>
                            </div>
                          </div>

                          {/* Path Metadata */}
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDuration(path.estimatedHours)}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {path.students.toLocaleString()}
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-amber-400" />
                                {path.rating}
                              </div>
                            </div>
                            <Badge className={getDifficultyColor(path.difficulty)}>
                              {t(`difficulty.${path.difficulty}`)}
                            </Badge>
                          </div>

                          {/* Progress Bar (if started) */}
                          {path.progress !== undefined && path.progress > 0 && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-300">{t('progress.completed')}</span>
                                <span className="text-cyan-400 font-medium">{path.progress}%</span>
                              </div>
                              <Progress value={path.progress} className="h-2" />
                            </div>
                          )}

                          {/* Skills */}
                          <div className="mb-4">
                            <p className="text-gray-400 text-xs mb-2">{t('learning_hub.skills_you_will_learn')}</p>
                            <div className="flex flex-wrap gap-1">
                              {path.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {path.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{path.skills.length - 3} {t('more')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white group-hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePathClick(path.id)
                            }}
                          >
                            {path.progress && path.progress > 0 ? (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                {t('actions.continue')}
                              </>
                            ) : (
                              <>
                                <BookOpen className="h-4 w-4 mr-2" />
                                {t('actions.start_learning')}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Learning Paths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {t('learning_hub.all_paths')} ({filteredPaths.length})
                </h2>
                <div className="text-sm text-gray-400">
                  {t('learning_hub.showing_results', { count: filteredPaths.length, total: learningPaths.length })}
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPaths.map((path, index) => (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full"
                        onClick={() => handlePathClick(path.id)}
                      >
                        <CardContent className="p-6">
                          {/* Similar content as featured paths but more compact */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {path.new && (
                                  <Badge className="bg-green-500 text-white mr-2 text-xs">{t('badges.new')}</Badge>
                                )}
                                {path.trending && (
                                  <Badge className="bg-red-500 text-white mr-2 text-xs">{t('badges.trending')}</Badge>
                                )}
                                {path.aiEnhanced && (
                                  <Badge className="bg-purple-500 text-white text-xs">
                                    <Brain className="h-3 w-3 mr-1" />AI
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                                {path.title}
                              </h3>
                              <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                                {path.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(path.estimatedHours)}
                              </span>
                              <span className="flex items-center">
                                <Star className="h-3 w-3 mr-1 text-amber-400" />
                                {path.rating}
                              </span>
                            </div>
                            <Badge className={getDifficultyColor(path.difficulty)}>
                              {t(`difficulty.${path.difficulty}`)}
                            </Badge>
                          </div>

                          {path.progress !== undefined && path.progress > 0 && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-300">{path.progress}% {t('progress.complete')}</span>
                              </div>
                              <Progress value={path.progress} className="h-1.5" />
                            </div>
                          )}

                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePathClick(path.id)
                            }}
                          >
                            {path.progress && path.progress > 0 ? t('actions.continue') : t('actions.start')}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPaths.map((path, index) => (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group"
                        onClick={() => handlePathClick(path.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h3 className="text-white font-semibold text-lg mr-4 group-hover:text-cyan-400 transition-colors">
                                  {path.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {path.new && <Badge className="bg-green-500 text-white text-xs">{t('badges.new')}</Badge>}
                                  {path.trending && <Badge className="bg-red-500 text-white text-xs">{t('badges.trending')}</Badge>}
                                  {path.aiEnhanced && (
                                    <Badge className="bg-purple-500 text-white text-xs">
                                      <Brain className="h-3 w-3 mr-1" />AI
                                    </Badge>
                                  )}
                                  <Badge className={getDifficultyColor(path.difficulty)}>
                                    {t(`difficulty.${path.difficulty}`)}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-gray-300 mb-3 max-w-2xl">{path.description}</p>
                              <div className="flex items-center space-x-6 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatDuration(path.estimatedHours)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {path.students.toLocaleString()}
                                </span>
                                <span className="flex items-center">
                                  <Star className="h-4 w-4 mr-1 text-amber-400" />
                                  {path.rating}
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  {path.totalModules} {t('modules')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {path.progress !== undefined && path.progress > 0 && (
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-cyan-400">{path.progress}%</div>
                                  <div className="text-xs text-gray-400">{t('progress.complete')}</div>
                                </div>
                              )}
                              <Button 
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePathClick(path.id)
                                }}
                              >
                                {path.progress && path.progress > 0 ? t('actions.continue') : t('actions.start')}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Continue Learning Tab */}
          <TabsContent value="continue" className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {t('learning_hub.continue_where_left_off')}
              </h2>
              {continueLearning.length > 0 ? (
                <div className="space-y-6">
                  {continueLearning.map((path, index) => (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group"
                        onClick={() => handlePathClick(path.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                                {path.title}
                              </h3>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-300">{t('progress.modules_completed', { completed: path.completedModules?? 0, total: path.totalModules })}</span>
                                <span className="text-cyan-400 font-semibold">{path.progress}% {t('progress.complete')}</span>
                              </div>
                              <Progress value={path.progress || 0} className="h-2 mb-4" />
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {t('time_remaining')}: {Math.round((100 - (path.progress || 0)) / 100 * path.estimatedHours)}h
                                </span>
                                <Badge className={getDifficultyColor(path.difficulty)}>
                                  {t(`difficulty.${path.difficulty}`)}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white ml-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePathClick(path.id)
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {t('actions.continue')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-12">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">{t('learning_hub.no_ongoing_paths')}</h3>
                    <p className="text-gray-400 mb-6">{t('learning_hub.start_first_path')}</p>
                    <Button 
                      onClick={() => setActiveTab('discover')}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      {t('actions.explore_paths')}
                    </Button>
                  </div>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">{t('learning_hub.explore_categories')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full"
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setActiveTab('discover')
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mr-4`}>
                            <category.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-gray-400 text-sm">{category.pathCount} {t('paths')}</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">{category.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{category.totalHours}h {t('content')}</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* My Progress Tab */}
          <TabsContent value="my-progress" className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">{t('learning_hub.my_progress')}</h2>
              {userProgress && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Progress Overview */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t('progress.overview')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 rounded-lg bg-slate-700/30">
                            <div className="text-2xl font-bold text-cyan-400">{userProgress.totalPathsStarted}</div>
                            <div className="text-sm text-gray-400">{t('progress.paths_started')}</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-slate-700/30">
                            <div className="text-2xl font-bold text-green-400">{userProgress.totalPathsCompleted}</div>
                            <div className="text-sm text-gray-400">{t('progress.paths_completed')}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">{t('progress.completion_rate')}</span>
                            <span className="text-white font-medium">
                              {Math.round((userProgress.totalPathsCompleted / userProgress.totalPathsStarted) * 100)}%
                            </span>
                          </div>
                          <Progress value={(userProgress.totalPathsCompleted / userProgress.totalPathsStarted) * 100} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-purple-400">{userProgress.skillsAcquired}</div>
                            <div className="text-xs text-gray-400">{t('progress.skills')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-amber-400">{userProgress.certificates}</div>
                            <div className="text-xs text-gray-400">{t('progress.certificates')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-red-400">{userProgress.currentStreak}</div>
                            <div className="text-xs text-gray-400">{t('progress.day_streak')}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Analytics */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t('progress.learning_analytics')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-cyan-400 mb-2">{userProgress.totalHoursLearned}h</div>
                          <p className="text-gray-400 text-sm">{t('progress.total_time_learning')}</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300">{t('progress.avg_session_rating')}</span>
                              <span className="text-amber-400 font-medium">{userProgress.averageRating}/5</span>
                            </div>
                            <Progress value={(userProgress.averageRating / 5) * 100} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 rounded-lg bg-slate-700/30">
                              <div className="text-lg font-bold text-green-400">{Math.round(userProgress.totalHoursLearned / 7)}</div>
                              <div className="text-xs text-gray-400">{t('progress.hours_per_week')}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-700/30">
                              <div className="text-lg font-bold text-blue-400">{Math.round(userProgress.totalHoursLearned / userProgress.totalPathsStarted)}</div>
                              <div className="text-xs text-gray-400">{t('progress.hours_per_path')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chat Bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask me about learning paths, skills, or course recommendations..."
        enableVoice={true}
        enableMinimize={true}
      />
    </div>
  )
}