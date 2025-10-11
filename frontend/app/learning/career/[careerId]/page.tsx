// app/learning/career/[careerId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Brain,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Building,
  Target,
  Award,
  BookOpen,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Zap,
  Shield,
  Code,
  Database,
  Smartphone,
  Paintbrush,
  Stethoscope,
  Scale,
  Calculator,
  Microscope,
  Wrench,
  Plane,
  ChefHat,
  Music,
  Camera,
  PenTool,
  GraduationCap,
  Briefcase,
  Heart,
  Globe,
  Share2,
  Bookmark,
  Download,
  MessageCircle,
  BarChart3,
  UserCheck,
  Rocket,
  Cpu
} from "lucide-react"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingChatBar } from "@/components/chat"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

// Career interface (same as in main page)
interface Career {
  id: string
  title: string
  description: string
  category: string
  icon: React.ElementType
  color: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  duration: string
  salary: {
    min: number
    max: number
    currency: string
  }
  growth: number
  demand: 'high' | 'medium' | 'low'
  skills: string[]
  requirements: string[]
  responsibilities: string[]
  companies: string[]
  locations: string[]
  thumbnail: string
  featured: boolean
  trending: boolean
  new: boolean
  learningPaths: number
  certificate: boolean
  aiEnhanced: boolean
  lastUpdated: string
}

interface LearningPath {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  modules: number
  rating: number
  students: number
  progress?: number
  completed?: boolean
}

export default function CareerDetailPage() {
  const { careerId } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { user, getToken } = useAuth()
  
  const [career, setCareer] = useState<Career | null>(null)
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Mock career data (same as in main page)
  const mockCareers: Career[] = [
    {
      id: 'ai-engineer',
      title: 'AI Engineer',
      description: 'Design and implement artificial intelligence systems, machine learning models, and intelligent automation solutions',
      category: 'technology',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      difficulty: 'advanced',
      duration: '12-18 months',
      salary: { min: 90000, max: 180000, currency: 'USD' },
      growth: 25,
      demand: 'high',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Deep Learning', 'NLP', 'Computer Vision'],
      requirements: ['Bachelor\'s in Computer Science', 'Strong programming skills', 'ML/AI experience', 'Mathematics background'],
      responsibilities: ['Develop AI models', 'Data preprocessing', 'Model optimization', 'Deploy ML systems', 'Research new techniques'],
      companies: ['Google', 'Microsoft', 'OpenAI', 'Tesla', 'Meta', 'Amazon'],
      locations: ['San Francisco', 'Seattle', 'New York', 'Austin', 'Remote'],
      thumbnail: '/careers/ai-engineer.jpg',
      featured: true,
      trending: true,
      new: false,
      learningPaths: 8,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-15'
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      description: 'Extract insights from complex data sets using statistical analysis, machine learning, and data visualization',
      category: 'technology',
      icon: Database,
      color: 'from-blue-500 to-cyan-600',
      difficulty: 'intermediate',
      duration: '8-12 months',
      salary: { min: 75000, max: 140000, currency: 'USD' },
      growth: 22,
      demand: 'high',
      skills: ['Python', 'R', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization', 'Big Data'],
      requirements: ['Bachelor\'s in Data Science/Statistics', 'Programming experience', 'Statistical knowledge', 'Business acumen'],
      responsibilities: ['Data analysis', 'Model building', 'Insight generation', 'Report creation', 'Stakeholder communication'],
      companies: ['Netflix', 'Spotify', 'Uber', 'Airbnb', 'LinkedIn', 'Twitter'],
      locations: ['New York', 'San Francisco', 'Boston', 'Chicago', 'Remote'],
      thumbnail: '/careers/data-scientist.jpg',
      featured: true,
      trending: true,
      new: false,
      learningPaths: 6,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-10'
    },
    {
      id: 'full-stack-developer',
      title: 'Full Stack Developer',
      description: 'Build complete web applications handling both frontend and backend development',
      category: 'technology',
      icon: Code,
      color: 'from-indigo-500 to-purple-600',
      difficulty: 'intermediate',
      duration: '6-10 months',
      salary: { min: 60000, max: 120000, currency: 'USD' },
      growth: 15,
      demand: 'high',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'AWS'],
      requirements: ['Programming experience', 'Web development knowledge', 'Database understanding', 'Version control'],
      responsibilities: ['Frontend development', 'Backend APIs', 'Database design', 'Testing', 'Deployment'],
      companies: ['Shopify', 'Stripe', 'Square', 'Twilio', 'GitHub', 'Vercel'],
      locations: ['San Francisco', 'New York', 'Austin', 'Portland', 'Remote'],
      thumbnail: '/careers/full-stack-developer.jpg',
      featured: true,
      trending: false,
      new: false,
      learningPaths: 7,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-12'
    }
  ]

  const mockLearningPaths: LearningPath[] = [
    {
      id: 'ai-fundamentals',
      title: 'AI & Machine Learning Fundamentals',
      description: 'Master the core concepts of artificial intelligence and machine learning',
      duration: '8 weeks',
      difficulty: 'beginner',
      modules: 12,
      rating: 4.8,
      students: 15420,
      progress: 0
    },
    {
      id: 'deep-learning',
      title: 'Deep Learning with TensorFlow',
      description: 'Build and deploy deep learning models using TensorFlow',
      duration: '10 weeks',
      difficulty: 'intermediate',
      modules: 15,
      rating: 4.9,
      students: 8930,
      progress: 0
    },
    {
      id: 'nlp-advanced',
      title: 'Advanced Natural Language Processing',
      description: 'Advanced techniques in NLP and language models',
      duration: '12 weeks',
      difficulty: 'advanced',
      modules: 18,
      rating: 4.7,
      students: 5670,
      progress: 0
    }
  ]

  useEffect(() => {
    loadCareerData()
  }, [careerId])

  const loadCareerData = async () => {
    try {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const foundCareer = mockCareers.find(c => c.id === careerId)
      if (foundCareer) {
        setCareer(foundCareer)
        setLearningPaths(mockLearningPaths)
      }
    } catch (error) {
      console.error('Error loading career data:', error)
    } finally {
      setLoading(false)
    }
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

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-amber-500/20 text-amber-400'
      case 'low': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`
  }

  const handleStartLearning = (pathId: string) => {
    router.push(`/learning/${pathId}`)
  }

  const handleSendMessage = (message: string) => {
    console.log('Career chat message:', message)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Brain className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-300">Loading career details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!career) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Career Not Found</h2>
            <p className="text-gray-300 mb-6">The requested career could not be found.</p>
            <Button onClick={() => router.push('/learning')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Career Hub
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const CareerIcon = career.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Career Hub
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={isBookmarked ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : ""}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Career Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Career Hero Image */}
              <div className="relative h-64 lg:h-80 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl overflow-hidden mb-8">
                <div className={`absolute inset-0 bg-gradient-to-br ${career.color} opacity-30`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-32 h-32 rounded-3xl bg-gradient-to-r ${career.color} flex items-center justify-center shadow-2xl`}>
                    <CareerIcon className="w-16 h-16 text-white" />
                  </div>
                </div>
                {/* Overlay badges */}
                <div className="absolute top-6 left-6 flex flex-wrap gap-3">
                  {career.new && (
                    <Badge className="bg-green-500 text-white shadow-lg">
                      New Career
                    </Badge>
                  )}
                  {career.trending && (
                    <Badge className="bg-red-500 text-white shadow-lg">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trending
                    </Badge>
                  )}
                  {career.aiEnhanced && (
                    <Badge className="bg-purple-500 text-white shadow-lg">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Enhanced
                    </Badge>
                  )}
                </div>
                {/* Demand badge */}
                <div className="absolute top-6 right-6">
                  <Badge className={`${getDemandColor(career.demand)} shadow-lg text-sm px-4 py-2`}>
                    {career.demand} demand
                  </Badge>
                </div>
                {/* Career title overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                    {career.title}
                  </h1>
                  <p className="text-lg text-gray-200 drop-shadow-md max-w-2xl">
                    {career.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4 mb-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatSalary(career.salary)}
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                  {career.growth}% growth
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {career.duration}
                </div>
                <Badge className={getDifficultyColor(career.difficulty)}>
                  {career.difficulty}
                </Badge>
                <Badge className={getDemandColor(career.demand)}>
                  {career.demand} demand
                </Badge>
                {career.aiEnhanced && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Enhanced
                  </Badge>
                )}
              </div>

              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50 mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-cyan-400">{career.learningPaths}</div>
                      <div className="text-sm text-gray-400">Learning Paths</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-green-400">{career.skills.length}</div>
                      <div className="text-sm text-gray-400">Key Skills</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-purple-400">{career.companies.length}</div>
                      <div className="text-sm text-gray-400">Top Companies</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-amber-400">{career.locations.length}</div>
                      <div className="text-sm text-gray-400">Locations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                <CardHeader>
                  <CardTitle className="text-white">Start Your Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    onClick={() => setActiveTab('learning-paths')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Take Assessment
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Guide
                  </Button>
                </CardContent>
              </Card>

              {/* Career Insights */}
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/40">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Career Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="text-purple-300 font-medium mb-1">Growth Potential</div>
                      <div className="text-purple-100">{career.growth}% annual growth rate</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-purple-300 font-medium mb-1">Market Demand</div>
                      <div className="text-purple-100 capitalize">{career.demand} demand in current market</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-purple-300 font-medium mb-1">Learning Time</div>
                      <div className="text-purple-100">{career.duration} to get started</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/60 mb-8">
              <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="skills" className="text-gray-300 data-[state=active]:text-white">
                Skills & Requirements
              </TabsTrigger>
              <TabsTrigger value="learning-paths" className="text-gray-300 data-[state=active]:text-white">
                Learning Paths
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="text-gray-300 data-[state=active]:text-white">
                Opportunities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Responsibilities */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Key Responsibilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {career.responsibilities.map((responsibility, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{responsibility}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {career.requirements.map((requirement, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{requirement}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-8">
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Essential Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {career.skills.map((skill, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge className="w-full justify-center py-2 text-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning-paths" className="mt-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Learning Paths</h2>
                  <Badge className="bg-cyan-500/20 text-cyan-400">
                    {learningPaths.length} paths available
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {learningPaths.map((path, index) => (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 group h-full overflow-hidden">
                        {/* Learning Path Image */}
                        <div className="relative h-32 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${career.color} opacity-20`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${career.color} flex items-center justify-center shadow-lg`}>
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          {/* Difficulty badge */}
                          <div className="absolute top-3 right-3">
                            <Badge className={getDifficultyColor(path.difficulty)}>
                              {path.difficulty}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="mb-4">
                            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                              {path.title}
                            </h3>
                            <p className="text-gray-300 text-sm mb-4">
                              {path.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {path.duration}
                              </div>
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {path.modules} modules
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {path.students.toLocaleString()}
                              </div>
                            </div>
                            <Badge className={getDifficultyColor(path.difficulty)}>
                              {path.difficulty}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1 text-amber-400" />
                              <span className="text-white font-medium">{path.rating}</span>
                            </div>
                            {path.progress !== undefined && (
                              <div className="text-right">
                                <div className="text-sm text-gray-300">{path.progress}% complete</div>
                                <Progress value={path.progress} className="h-1.5 w-20" />
                              </div>
                            )}
                          </div>

                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                            onClick={() => handleStartLearning(path.id)}
                          >
                            {path.progress && path.progress > 0 ? (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Continue Learning
                              </>
                            ) : (
                              <>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Start Learning
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Companies */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Top Companies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {career.companies.map((company, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 rounded-lg bg-slate-700/50 text-center hover:bg-slate-600/50 transition-colors cursor-pointer"
                        >
                          <div className="text-white font-medium">{company}</div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Locations */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Popular Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {career.locations.map((location, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                          <MapPin className="h-4 w-4 text-cyan-400" />
                          <span className="text-gray-300">{location}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Floating Chat Bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask me about this career, skills needed, or learning paths..."
        enableVoice={true}
        enableMinimize={true}
      />
    </div>
  )
}
