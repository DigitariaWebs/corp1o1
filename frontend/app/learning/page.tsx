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
  RefreshCw,
  GraduationCap,
  DollarSign,
  MapPin,
  TrendingDown,
  UserCheck,
  Rocket,
  Cpu,
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
  PenTool
} from "lucide-react"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingChatBar } from "@/components/chat"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

// Types for Career Learning Hub
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
  growth: number // percentage growth
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

interface CareerCategory {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  careerCount: number
  averageSalary: number
  growth: number
}

interface UserProgress {
  careersExplored: number
  learningPathsStarted: number
  certificatesEarned: number
  skillsAcquired: number
  currentStreak: number
  totalHoursLearned: number
  averageRating: number
}

export default function CareerLearningHub() {
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
  const [careers, setCareers] = useState<Career[]>([])
  const [categories, setCategories] = useState<CareerCategory[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [featuredCareers, setFeaturedCareers] = useState<Career[]>([])
  const [trendingCareers, setTrendingCareers] = useState<Career[]>([])

  // Mock data for career categories
  const mockCategories: CareerCategory[] = [
    {
      id: 'technology',
      name: 'Technology & IT',
      description: 'Software development, cybersecurity, data science, and emerging tech careers',
      icon: Cpu,
      color: 'from-blue-500 to-cyan-600',
      careerCount: 15,
      averageSalary: 85000,
      growth: 12
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Medical',
      description: 'Medical professionals, healthcare administration, and wellness careers',
      icon: Stethoscope,
      color: 'from-green-500 to-emerald-600',
      careerCount: 12,
      averageSalary: 75000,
      growth: 15
    },
    {
      id: 'business',
      name: 'Business & Finance',
      description: 'Management, finance, marketing, and entrepreneurship opportunities',
      icon: Briefcase,
      color: 'from-purple-500 to-indigo-600',
      careerCount: 18,
      averageSalary: 70000,
      growth: 8
    },
    {
      id: 'creative',
      name: 'Creative & Design',
      description: 'Graphic design, content creation, arts, and multimedia careers',
      icon: Paintbrush,
      color: 'from-pink-500 to-rose-600',
      careerCount: 10,
      averageSalary: 55000,
      growth: 6
    },
    {
      id: 'education',
      name: 'Education & Training',
      description: 'Teaching, training, instructional design, and educational technology',
      icon: GraduationCap,
      color: 'from-amber-500 to-orange-600',
      careerCount: 8,
      averageSalary: 50000,
      growth: 5
    },
    {
      id: 'engineering',
      name: 'Engineering & Manufacturing',
      description: 'Mechanical, electrical, civil engineering and manufacturing roles',
      icon: Wrench,
      color: 'from-gray-500 to-slate-600',
      careerCount: 14,
      averageSalary: 80000,
      growth: 7
    }
  ]

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
      id: 'data-analyst',
      title: 'Data Analyst',
      description: 'Analyze business data to help organizations make informed decisions and improve performance',
      category: 'technology',
      icon: BarChart3,
      color: 'from-green-500 to-teal-600',
      difficulty: 'beginner',
      duration: '4-6 months',
      salary: { min: 50000, max: 85000, currency: 'USD' },
      growth: 18,
      demand: 'high',
      skills: ['Excel', 'SQL', 'Python', 'Tableau', 'Power BI', 'Statistics', 'Business Intelligence'],
      requirements: ['Bachelor\'s degree', 'Analytical thinking', 'Basic programming', 'Business understanding'],
      responsibilities: ['Data collection', 'Analysis and reporting', 'Dashboard creation', 'Trend identification', 'Recommendations'],
      companies: ['IBM', 'Deloitte', 'PwC', 'Accenture', 'Salesforce', 'HubSpot'],
      locations: ['Chicago', 'Atlanta', 'Dallas', 'Denver', 'Remote'],
      thumbnail: '/careers/data-analyst.jpg',
      featured: false,
      trending: true,
      new: false,
      learningPaths: 4,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-08'
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
    },
    {
      id: 'cybersecurity-analyst',
      title: 'Cybersecurity Analyst',
      description: 'Protect organizations from cyber threats by monitoring, analyzing, and responding to security incidents',
      category: 'technology',
      icon: Shield,
      color: 'from-red-500 to-orange-600',
      difficulty: 'intermediate',
      duration: '8-12 months',
      salary: { min: 65000, max: 110000, currency: 'USD' },
      growth: 20,
      demand: 'high',
      skills: ['Network Security', 'Incident Response', 'SIEM', 'Penetration Testing', 'Risk Assessment', 'Compliance'],
      requirements: ['IT background', 'Security certifications', 'Analytical skills', 'Attention to detail'],
      responsibilities: ['Threat monitoring', 'Incident response', 'Security assessments', 'Policy development', 'Training'],
      companies: ['CrowdStrike', 'Palo Alto Networks', 'FireEye', 'Rapid7', 'Splunk', 'IBM Security'],
      locations: ['Washington DC', 'San Francisco', 'Boston', 'Atlanta', 'Remote'],
      thumbnail: '/careers/cybersecurity-analyst.jpg',
      featured: false,
      trending: true,
      new: false,
      learningPaths: 5,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-05'
    },
    {
      id: 'mobile-app-developer',
      title: 'Mobile App Developer',
      description: 'Create mobile applications for iOS and Android platforms using modern development frameworks',
      category: 'technology',
      icon: Smartphone,
      color: 'from-cyan-500 to-blue-600',
      difficulty: 'intermediate',
      duration: '6-9 months',
      salary: { min: 55000, max: 100000, currency: 'USD' },
      growth: 12,
      demand: 'medium',
      skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'JavaScript', 'Mobile UI/UX', 'APIs'],
      requirements: ['Programming experience', 'Mobile development knowledge', 'UI/UX understanding', 'Cross-platform skills'],
      responsibilities: ['App development', 'UI implementation', 'API integration', 'Testing', 'App store deployment'],
      companies: ['Meta', 'Snapchat', 'TikTok', 'Uber', 'Airbnb', 'Spotify'],
      locations: ['San Francisco', 'New York', 'Seattle', 'Los Angeles', 'Remote'],
      thumbnail: '/careers/mobile-developer.jpg',
      featured: false,
      trending: false,
      new: true,
      learningPaths: 4,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-20'
    },
    {
      id: 'graphic-designer',
      title: 'Graphic Designer',
      description: 'Create visual concepts and designs for branding, marketing materials, and digital media',
      category: 'creative',
      icon: PenTool,
      color: 'from-pink-500 to-rose-600',
      difficulty: 'beginner',
      duration: '3-6 months',
      salary: { min: 35000, max: 65000, currency: 'USD' },
      growth: 3,
      demand: 'medium',
      skills: ['Adobe Creative Suite', 'Typography', 'Color Theory', 'Branding', 'UI/UX', 'Illustration'],
      requirements: ['Design education', 'Portfolio', 'Creative skills', 'Software proficiency'],
      responsibilities: ['Visual design', 'Brand development', 'Marketing materials', 'Client collaboration', 'Project management'],
      companies: ['Apple', 'Nike', 'Coca-Cola', 'Adobe', 'Canva', 'Figma'],
      locations: ['New York', 'Los Angeles', 'Chicago', 'Portland', 'Remote'],
      thumbnail: '/careers/graphic-designer.jpg',
      featured: false,
      trending: false,
      new: false,
      learningPaths: 3,
      certificate: true,
      aiEnhanced: false,
      lastUpdated: '2024-01-03'
    },
    {
      id: 'digital-marketing-specialist',
      title: 'Digital Marketing Specialist',
      description: 'Develop and execute digital marketing campaigns across various online platforms',
      category: 'business',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      difficulty: 'beginner',
      duration: '4-6 months',
      salary: { min: 40000, max: 70000, currency: 'USD' },
      growth: 8,
      demand: 'medium',
      skills: ['SEO/SEM', 'Social Media', 'Google Analytics', 'Content Marketing', 'Email Marketing', 'PPC'],
      requirements: ['Marketing knowledge', 'Analytical skills', 'Communication', 'Digital tools experience'],
      responsibilities: ['Campaign development', 'Content creation', 'Performance analysis', 'Strategy optimization', 'Reporting'],
      companies: ['Google', 'Facebook', 'HubSpot', 'Mailchimp', 'Hootsuite', 'Buffer'],
      locations: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Remote'],
      thumbnail: '/careers/digital-marketing.jpg',
      featured: false,
      trending: true,
      new: false,
      learningPaths: 5,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-07'
    },
    {
      id: 'project-manager',
      title: 'Project Manager',
      description: 'Lead and coordinate projects from initiation to completion, ensuring timely delivery and quality',
      category: 'business',
      icon: Target,
      color: 'from-purple-500 to-indigo-600',
      difficulty: 'intermediate',
      duration: '6-9 months',
      salary: { min: 60000, max: 95000, currency: 'USD' },
      growth: 6,
      demand: 'medium',
      skills: ['Project Planning', 'Agile/Scrum', 'Risk Management', 'Team Leadership', 'Communication', 'Budgeting'],
      requirements: ['Bachelor\'s degree', 'Leadership experience', 'Organizational skills', 'Industry knowledge'],
      responsibilities: ['Project planning', 'Team coordination', 'Risk management', 'Stakeholder communication', 'Quality control'],
      companies: ['Microsoft', 'Amazon', 'IBM', 'Accenture', 'Deloitte', 'PwC'],
      locations: ['Seattle', 'New York', 'Chicago', 'Boston', 'Remote'],
      thumbnail: '/careers/project-manager.jpg',
      featured: true,
      trending: false,
      new: false,
      learningPaths: 6,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-11'
    },
    {
      id: 'financial-analyst',
      title: 'Financial Analyst',
      description: 'Analyze financial data and market trends to provide investment recommendations and business insights',
      category: 'business',
      icon: Calculator,
      color: 'from-green-500 to-emerald-600',
      difficulty: 'intermediate',
      duration: '6-12 months',
      salary: { min: 55000, max: 90000, currency: 'USD' },
      growth: 5,
      demand: 'medium',
      skills: ['Financial Modeling', 'Excel', 'SQL', 'Statistics', 'Market Analysis', 'Risk Assessment'],
      requirements: ['Finance degree', 'Analytical skills', 'Attention to detail', 'Industry knowledge'],
      responsibilities: ['Financial analysis', 'Model building', 'Report creation', 'Investment research', 'Risk assessment'],
      companies: ['Goldman Sachs', 'JPMorgan', 'Morgan Stanley', 'BlackRock', 'Vanguard', 'Fidelity'],
      locations: ['New York', 'Chicago', 'Boston', 'San Francisco', 'Remote'],
      thumbnail: '/careers/financial-analyst.jpg',
      featured: false,
      trending: false,
      new: false,
      learningPaths: 4,
      certificate: true,
      aiEnhanced: true,
      lastUpdated: '2024-01-09'
    },
    {
      id: 'registered-nurse',
      title: 'Registered Nurse',
      description: 'Provide patient care, administer treatments, and coordinate with healthcare teams',
      category: 'healthcare',
      icon: Stethoscope,
      color: 'from-emerald-500 to-green-600',
      difficulty: 'intermediate',
      duration: '2-4 years',
      salary: { min: 50000, max: 80000, currency: 'USD' },
      growth: 9,
      demand: 'high',
      skills: ['Patient Care', 'Medical Knowledge', 'Communication', 'Critical Thinking', 'Empathy', 'Technology'],
      requirements: ['Nursing degree', 'RN license', 'Clinical experience', 'CPR certification'],
      responsibilities: ['Patient assessment', 'Treatment administration', 'Care coordination', 'Documentation', 'Education'],
      companies: ['Mayo Clinic', 'Johns Hopkins', 'Cleveland Clinic', 'Kaiser Permanente', 'HCA Healthcare'],
      locations: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
      thumbnail: '/careers/registered-nurse.jpg',
      featured: true,
      trending: false,
      new: false,
      learningPaths: 2,
      certificate: true,
      aiEnhanced: false,
      lastUpdated: '2024-01-06'
    },
    {
      id: 'physical-therapist',
      title: 'Physical Therapist',
      description: 'Help patients recover from injuries and improve mobility through therapeutic exercises',
      category: 'healthcare',
      icon: Heart,
      color: 'from-teal-500 to-cyan-600',
      difficulty: 'advanced',
      duration: '3-4 years',
      salary: { min: 60000, max: 95000, currency: 'USD' },
      growth: 17,
      demand: 'high',
      skills: ['Anatomy', 'Physiology', 'Exercise Therapy', 'Patient Assessment', 'Communication', 'Rehabilitation'],
      requirements: ['Doctorate in PT', 'State license', 'Clinical experience', 'Continuing education'],
      responsibilities: ['Patient evaluation', 'Treatment planning', 'Exercise prescription', 'Progress monitoring', 'Education'],
      companies: ['ATI Physical Therapy', 'Select Medical', 'Kindred Healthcare', 'Encompass Health'],
      locations: ['Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
      thumbnail: '/careers/physical-therapist.jpg',
      featured: false,
      trending: true,
      new: false,
      learningPaths: 1,
      certificate: true,
      aiEnhanced: false,
      lastUpdated: '2024-01-14'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Educate students in various subjects, develop lesson plans, and foster learning environments',
      category: 'education',
      icon: GraduationCap,
      color: 'from-amber-500 to-yellow-600',
      difficulty: 'intermediate',
      duration: '2-4 years',
      salary: { min: 35000, max: 60000, currency: 'USD' },
      growth: 4,
      demand: 'medium',
      skills: ['Subject Knowledge', 'Classroom Management', 'Communication', 'Patience', 'Technology', 'Assessment'],
      requirements: ['Teaching degree', 'State certification', 'Student teaching', 'Background check'],
      responsibilities: ['Lesson planning', 'Instruction delivery', 'Student assessment', 'Parent communication', 'Professional development'],
      companies: ['Public Schools', 'Private Schools', 'Charter Schools', 'Online Schools', 'Tutoring Centers'],
      locations: ['All Major Cities', 'Suburban Areas', 'Rural Communities', 'Remote'],
      thumbnail: '/careers/teacher.jpg',
      featured: false,
      trending: false,
      new: false,
      learningPaths: 1,
      certificate: true,
      aiEnhanced: false,
      lastUpdated: '2024-01-04'
    },
    {
      id: 'mechanical-engineer',
      title: 'Mechanical Engineer',
      description: 'Design, develop, and test mechanical devices and systems for various industries',
      category: 'engineering',
      icon: Wrench,
      color: 'from-gray-500 to-slate-600',
      difficulty: 'advanced',
      duration: '4-5 years',
      salary: { min: 65000, max: 110000, currency: 'USD' },
      growth: 2,
      demand: 'medium',
      skills: ['CAD Software', 'Engineering Principles', 'Problem Solving', 'Mathematics', 'Materials Science', 'Manufacturing'],
      requirements: ['Engineering degree', 'PE license', 'Industry experience', 'Technical skills'],
      responsibilities: ['Design development', 'Testing and analysis', 'Project management', 'Technical documentation', 'Collaboration'],
      companies: ['Boeing', 'Tesla', 'General Electric', 'Ford', 'Caterpillar', 'Lockheed Martin'],
      locations: ['Detroit', 'Seattle', 'Houston', 'Los Angeles', 'Chicago'],
      thumbnail: '/careers/mechanical-engineer.jpg',
      featured: false,
      trending: false,
      new: false,
      learningPaths: 2,
      certificate: true,
      aiEnhanced: false,
      lastUpdated: '2024-01-13'
    },
    {
      id: 'chef',
      title: 'Chef',
      description: 'Create culinary experiences, manage kitchen operations, and develop innovative recipes',
      category: 'creative',
      icon: ChefHat,
      color: 'from-orange-500 to-red-600',
      difficulty: 'intermediate',
      duration: '2-4 years',
      salary: { min: 30000, max: 70000, currency: 'USD' },
      growth: 6,
      demand: 'medium',
      skills: ['Culinary Arts', 'Menu Planning', 'Kitchen Management', 'Food Safety', 'Creativity', 'Leadership'],
      requirements: ['Culinary education', 'Kitchen experience', 'Food safety certification', 'Creativity'],
      responsibilities: ['Menu development', 'Food preparation', 'Kitchen management', 'Staff training', 'Cost control'],
      companies: ['Restaurant Groups', 'Hotels', 'Catering Companies', 'Food Service', 'Private Chefs'],
      locations: ['New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Las Vegas'],
      thumbnail: '/careers/chef.jpg',
      featured: false,
      trending: false,
      new: false,
      learningPaths: 1,
      certificate: true,
      aiEnhanced: false,
      lastUpdated: '2024-01-02'
    }
  ]

  const mockUserProgress: UserProgress = {
    careersExplored: 8,
    learningPathsStarted: 4,
    certificatesEarned: 2,
    skillsAcquired: 15,
    currentStreak: 12,
    totalHoursLearned: 87,
    averageRating: 4.7
  }

  // Initialize data
  useEffect(() => {
    loadCareerData()
  }, [])

  const loadCareerData = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, use mock data. In the future, this could fetch from an API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
      
      setCareers(mockCareers)
      setCategories(mockCategories)
      setUserProgress(mockUserProgress)
      setFeaturedCareers(mockCareers.filter(career => career.featured))
      setTrendingCareers(mockCareers.filter(career => career.trending))

    } catch (err) {
      console.error('Error loading career data:', err)
      setError('Failed to load career data')
      
      // Fallback to mock data
      setCareers(mockCareers)
      setCategories(mockCategories)
      setUserProgress(mockUserProgress)
      setFeaturedCareers(mockCareers.filter(career => career.featured))
      setTrendingCareers(mockCareers.filter(career => career.trending))
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort careers
  const filteredCareers = careers.filter(career => {
    const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         career.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         career.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || career.category === selectedCategory
    const matchesDifficulty = difficultyFilter === 'all' || career.difficulty === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  }).sort((a, b) => {
    const demandOrder = { 'high': 3, 'medium': 2, 'low': 1 }
    
    switch (sortBy) {
      case 'salary':
        return b.salary.max - a.salary.max
      case 'growth':
        return b.growth - a.growth
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'demand':
        return demandOrder[b.demand] - demandOrder[a.demand]
      default: // recommended
        return (b.growth * demandOrder[b.demand]) - (a.growth * demandOrder[a.demand])
    }
  })

  const handleCareerClick = (careerId: string) => {
    router.push(`/learning/career/${careerId}`)
  }

  const handleSendMessage = (message: string) => {
    console.log('Career learning chat message:', message)
    // TODO: Implement your chat logic here for career-related queries
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Brain className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-300">Loading career opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className="bg-red-500/20 border-red-500/30 border rounded-lg p-8">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              
              <h3 className="text-2xl font-semibold mb-4 text-red-300">
                Error Loading Career Data
              </h3>
              
              <p className="text-lg mb-8 text-red-400">
                {error}
              </p>
              
              <div className="space-y-4">
                <Button onClick={loadCareerData} className="bg-red-500 hover:bg-red-600 px-8 py-3">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/assessments'} 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8 py-3"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Take Skills Assessment
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
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has no careers (successful load but empty)
  if (!loading && !error && careers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <MainNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Career Learning Hub
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Discover your dream career and the path to get there
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
              <Briefcase className="h-20 w-20 text-cyan-400 mx-auto mb-6" />
              <h3 className="text-3xl font-semibold text-white mb-4">Explore Career Opportunities</h3>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
                No career data is available yet. Start by taking skill assessments to unlock personalized career recommendations tailored to your interests and goals.
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
                Complete assessments → Get career recommendations → Start learning path
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32"> {/* Add padding for floating chat bar */}
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Career Learning Hub
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Discover your dream career and the learning path to get there
            </p>
            
            {/* Hero Stats */}
            {userProgress && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-cyan-400">{userProgress.careersExplored}</div>
                  <div className="text-sm text-gray-400">Careers Explored</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-green-400">{userProgress.certificatesEarned}</div>
                  <div className="text-sm text-gray-400">Certificates</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-purple-400">{userProgress.skillsAcquired}</div>
                  <div className="text-sm text-gray-400">Skills Acquired</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="text-2xl font-bold text-amber-400">{userProgress.currentStreak}</div>
                  <div className="text-sm text-gray-400">Day Streak</div>
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
                  placeholder="Search careers, skills, or companies..."
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
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="recommended">Recommended</option>
                  <option value="salary">Highest Salary</option>
                  <option value="growth">Fastest Growing</option>
                  <option value="demand">High Demand</option>
                  <option value="newest">Newest</option>
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
              Discover Careers
            </TabsTrigger>
            <TabsTrigger value="featured" className="text-gray-300 data-[state=active]:text-white">
              Featured ({featuredCareers.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-gray-300 data-[state=active]:text-white">
              Categories
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-gray-300 data-[state=active]:text-white">
              Trending ({trendingCareers.length})
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-8">
            {/* Featured Careers */}
            {featuredCareers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Star className="h-6 w-6 mr-2 text-amber-400" />
                  Featured Career Opportunities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCareers.slice(0, 3).map((career, index) => (
                    <motion.div
                      key={career.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full overflow-hidden"
                        onClick={() => handleCareerClick(career.id)}
                      >
                        {/* Career Image */}
                        <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${career.color} opacity-20`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${career.color} flex items-center justify-center shadow-2xl`}>
                              <career.icon className="w-10 h-10 text-white" />
                            </div>
                          </div>
                          {/* Overlay badges */}
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {career.new && (
                              <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                New
                                  </Badge>
                                )}
                            {career.trending && (
                              <Badge className="bg-red-500 text-white text-xs shadow-lg">
                                Trending
                                  </Badge>
                                )}
                            {career.aiEnhanced && (
                              <Badge className="bg-purple-500 text-white text-xs shadow-lg">
                                    <Brain className="h-3 w-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                          {/* Demand badge */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${getDemandColor(career.demand)} shadow-lg`}>
                              {career.demand} demand
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          {/* Career Header */}
                          <div className="mb-4">
                              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                              {career.title}
                              </h3>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {career.description}
                              </p>
                          </div>

                          {/* Career Metadata */}
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatSalary(career.salary)}
                              </div>
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                                {career.growth}%
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {career.duration}
                              </div>
                            </div>
                            <Badge className={getDifficultyColor(career.difficulty)}>
                              {career.difficulty}
                            </Badge>
                          </div>

                          {/* Key Skills */}
                            <div className="mb-4">
                            <p className="text-gray-400 text-xs mb-2">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {career.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {career.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{career.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white group-hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCareerClick(career.id)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Explore Career
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Careers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  All Career Opportunities ({filteredCareers.length})
                </h2>
                <div className="text-sm text-gray-400">
                  Showing {filteredCareers.length} of {careers.length} careers
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCareers.map((career, index) => (
                    <motion.div
                      key={career.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full overflow-hidden"
                        onClick={() => handleCareerClick(career.id)}
                      >
                        {/* Career Image */}
                        <div className="relative h-32 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${career.color} opacity-20`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${career.color} flex items-center justify-center shadow-lg`}>
                              <career.icon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          {/* Overlay badges */}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {career.new && (
                              <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                New
                              </Badge>
                            )}
                            {career.trending && (
                              <Badge className="bg-red-500 text-white text-xs shadow-lg">
                                Trending
                              </Badge>
                            )}
                            {career.aiEnhanced && (
                              <Badge className="bg-purple-500 text-white text-xs shadow-lg">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                                  </Badge>
                                )}
                              </div>
                        </div>

                        <CardContent className="p-4">
                          {/* Career Header */}
                          <div className="mb-3">
                              <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                              {career.title}
                              </h3>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {career.description}
                              </p>
                          </div>

                          {/* Career Metadata */}
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {formatSalary(career.salary)}
                              </span>
                              <span className="flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                                {career.growth}%
                              </span>
                            </div>
                            <Badge className={getDifficultyColor(career.difficulty)}>
                              {career.difficulty}
                            </Badge>
                          </div>

                          {/* Demand and Skills */}
                            <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-xs">Demand</span>
                              <Badge className={getDemandColor(career.demand)}>
                                {career.demand}
                              </Badge>
                              </div>
                            <div className="flex flex-wrap gap-1">
                              {career.skills.slice(0, 2).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {career.skills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{career.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCareerClick(career.id)
                            }}
                          >
                            Explore Career
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCareers.map((career, index) => (
                    <motion.div
                      key={career.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group"
                        onClick={() => handleCareerClick(career.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h3 className="text-white font-semibold text-lg mr-4 group-hover:text-cyan-400 transition-colors">
                                  {career.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {career.new && <Badge className="bg-green-500 text-white text-xs">New</Badge>}
                                  {career.trending && <Badge className="bg-red-500 text-white text-xs">Trending</Badge>}
                                  {career.aiEnhanced && (
                                    <Badge className="bg-purple-500 text-white text-xs">
                                      <Brain className="h-3 w-3 mr-1" />AI
                                    </Badge>
                                  )}
                                  <Badge className={getDifficultyColor(career.difficulty)}>
                                    {career.difficulty}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-gray-300 mb-3 max-w-2xl">{career.description}</p>
                              <div className="flex items-center space-x-6 text-sm text-gray-400">
                                <span className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {formatSalary(career.salary)}
                                </span>
                                <span className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                                  {career.growth}% growth
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {career.duration}
                                </span>
                                <span className="flex items-center">
                                  <Badge className={getDemandColor(career.demand)}>
                                    {career.demand} demand
                                  </Badge>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400">{career.learningPaths}</div>
                                <div className="text-xs text-gray-400">Learning Paths</div>
                                </div>
                              <Button 
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCareerClick(career.id)
                                }}
                              >
                                Explore Career
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

          {/* Featured Tab */}
          <TabsContent value="featured" className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Featured Career Opportunities
              </h2>
              {featuredCareers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCareers.map((career, index) => (
                    <motion.div
                      key={career.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full overflow-hidden"
                        onClick={() => handleCareerClick(career.id)}
                      >
                        {/* Career Image */}
                        <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${career.color} opacity-20`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${career.color} flex items-center justify-center shadow-2xl`}>
                              <career.icon className="w-10 h-10 text-white" />
                            </div>
                          </div>
                          {/* Overlay badges */}
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {career.new && (
                              <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                New
                              </Badge>
                            )}
                            {career.trending && (
                              <Badge className="bg-red-500 text-white text-xs shadow-lg">
                                Trending
                              </Badge>
                            )}
                            {career.aiEnhanced && (
                              <Badge className="bg-purple-500 text-white text-xs shadow-lg">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          {/* Demand badge */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${getDemandColor(career.demand)} shadow-lg`}>
                              {career.demand} demand
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="mb-4">
                              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                              {career.title}
                              </h3>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {career.description}
                            </p>
                              </div>

                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatSalary(career.salary)}
                              </div>
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                                {career.growth}%
                              </div>
                              <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                {career.duration}
                              </div>
                            </div>
                            <Badge className={getDifficultyColor(career.difficulty)}>
                              {career.difficulty}
                                </Badge>
                              </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-xs">Demand Level</span>
                              <Badge className={getDemandColor(career.demand)}>
                                {career.demand} demand
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-xs mb-2">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {career.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {career.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{career.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                            <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white group-hover:scale-105 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation()
                              handleCareerClick(career.id)
                              }}
                            >
                            <Eye className="h-4 w-4 mr-2" />
                            Explore Career
                            </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-12">
                  <div className="text-center">
                    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Featured Careers</h3>
                    <p className="text-gray-400 mb-6">Check back later for featured career opportunities</p>
                    <Button 
                      onClick={() => setActiveTab('discover')}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      Explore All Careers
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
              <h2 className="text-2xl font-bold text-white mb-6">Browse by Career Category</h2>
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
                            <p className="text-gray-400 text-sm">{category.careerCount} careers</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">{category.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              ${category.averageSalary.toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                              {category.growth}%
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Trending Career Opportunities
              </h2>
              {trendingCareers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingCareers.map((career, index) => (
                    <motion.div
                      key={career.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 group h-full overflow-hidden"
                        onClick={() => handleCareerClick(career.id)}
                      >
                        {/* Career Image */}
                        <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${career.color} opacity-20`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${career.color} flex items-center justify-center shadow-2xl`}>
                              <career.icon className="w-10 h-10 text-white" />
                            </div>
                          </div>
                          {/* Overlay badges */}
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            <Badge className="bg-red-500 text-white text-xs shadow-lg">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                            {career.aiEnhanced && (
                              <Badge className="bg-purple-500 text-white text-xs shadow-lg">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          {/* Demand badge */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${getDemandColor(career.demand)} shadow-lg`}>
                              {career.demand} demand
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="mb-4">
                            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                              {career.title}
                            </h3>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {career.description}
                            </p>
                          </div>
                        
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatSalary(career.salary)}
                          </div>
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                                {career.growth}%
                        </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {career.duration}
                          </div>
                          </div>
                            <Badge className={getDifficultyColor(career.difficulty)}>
                              {career.difficulty}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-xs">Demand Level</span>
                              <Badge className={getDemandColor(career.demand)}>
                                {career.demand} demand
                              </Badge>
                        </div>
                            <p className="text-gray-400 text-xs mb-2">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {career.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {career.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{career.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white group-hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCareerClick(career.id)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Explore Career
                          </Button>
                    </CardContent>
                  </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-12">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Trending Careers</h3>
                    <p className="text-gray-400 mb-6">Check back later for trending career opportunities</p>
                    <Button 
                      onClick={() => setActiveTab('discover')}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      Explore All Careers
                    </Button>
                  </div>
                </Card>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chat Bar */}
      <FloatingChatBar
        onSendMessage={handleSendMessage}
        placeholder="Ask me about careers, skills needed, or learning paths..."
        enableVoice={true}
        enableMinimize={true}
      />
    </div>
  )
}