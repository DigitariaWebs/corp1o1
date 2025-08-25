// app/learning/[pathId]/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Brain, 
  Play, 
  CheckCircle,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Lightbulb,
  Target,
  Award,
  Zap,
  Video,
  FileText,
  Headphones,
  Download,
  Share2,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Sparkles,
  BarChart3,
  Lock,
  ChevronRight,
  Eye,
  Heart,
  Shield,
  Cpu,
  Activity,
  Bot,
  User,
  Timer,
  Flame,
  Globe,
  Coffee,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowRight,
  CheckSquare,
  Circle,
  PlayCircle,
  PauseCircle,
  Headphones as AudioIcon,
  FileText as DocumentIcon,
  MonitorPlay,
  PenTool,
  Layers,
  Workflow,
  TrendingDown,
  AlertTriangle,
  ThumbsUp
} from "lucide-react"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { useTranslation } from "@/hooks/use-translation"
import { AILearningAssistant } from "@/components/ai/ai-learning-assistant"

// Enhanced interfaces for realistic adaptive learning with AI analysis
interface AIAnalysisResult {
  overallAssessment: string
  strengthsIdentified: string[]
  improvementAreas: string[]
  personalizedRecommendations: string[]
  learningStyleConfidence: number
  predictedOutcomes: string[]
  adaptiveStrategies: string[]
  nextOptimalActions: string[]
}

interface LearningSession {
  id: string
  startTime: Date
  endTime?: Date
  moduleId: string
  interactions: number
  focusEvents: { timestamp: Date; score: number }[]
  strugglingMoments: string[]
  breakthroughMoments: string[]
  aiInterventions: string[]
  performanceMetrics: {
    comprehensionRate: number
    retentionScore: number
    engagementLevel: number
    difficultyProgression: number
  }
}
interface AdaptiveLearningProfile {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  pace: 'slow' | 'medium' | 'fast'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  focusTime: number
  preferredHours: string[]
  weakAreas: string[]
  strongAreas: string[]
  motivationFactors: string[]
  retentionRate: number
  engagementPattern: 'morning' | 'afternoon' | 'evening' | 'flexible'
  strugglingConcepts: string[]
  masteredConcepts: string[]
}

interface SmartRecommendation {
  id: string
  type: 'content' | 'timing' | 'method' | 'practice' | 'review' | 'break' | 'difficulty'
  title: string
  description: string
  reasoning: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  timeToImplement: number
  category: string
  actionable: boolean
  implementedAt?: Date
}

interface EnhancedModule {
  id: string
  title: string
  description: string
  duration: string
  estimatedTime: number // in minutes
  type: 'video' | 'reading' | 'interactive' | 'practice' | 'assessment' | 'discussion'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completed: boolean
  locked: boolean
  progress: number
  aiAdaptations: string[]
  personalizedContent?: {
    adaptedForStyle: boolean
    difficultyAdjusted: boolean
    additionalResources: Resource[]
    customExamples: string[]
    adaptedExplanations: string[]
  }
  engagementScore: number
  timeSpent: number
  averageScore?: number
  attemptsCount: number
  lastAccessed?: Date
  completedAt?: Date
  strugglingAreas: string[]
  masteredConcepts: string[]
  nextOptimalSession?: Date
  prerequisites: string[]
  skillsUnlocked: string[]
  userNotes: string[]
  bookmarks: number[]
  realTimeAdaptations: string[]
}

interface Resource {
  id: string
  title: string
  type: 'video' | 'document' | 'audio' | 'interactive' | 'external'
  duration?: string
  size?: string
  url: string
  aiRecommended?: boolean
  personalizedReason?: string
  relevanceScore: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

interface LearningAnalytics {
  totalTimeSpent: number
  averageSessionLength: number
  completionRate: number
  retentionScore: number
  engagementTrend: 'increasing' | 'stable' | 'decreasing'
  learningVelocity: number
  strugglingTopics: string[]
  strongTopics: string[]
  focusPatterns: { time: string; score: number }[]
  weeklyProgress: number[]
  skillProgression: { skill: string; level: number; trend: 'up' | 'down' | 'stable' }[]
  predictedCompletion: Date
  riskFactors: string[]
  achievements: string[]
}

interface LearningPathData {
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
  completedModules: number
  progress: number
  skills: string[]
  modules: EnhancedModule[]
  aiProfile: AdaptiveLearningProfile
  smartRecommendations: SmartRecommendation[]
  analytics: LearningAnalytics
  nextRecommendation: string
  estimatedCompletion: string
  learningObjectives: string[]
  adaptiveFeatures: string[]
  currentStreak: number
  longestStreak: number
  certificateProgress: number
  collaborativeFeatures: boolean
  mentorSupport: boolean
  realTimeAdaptation: boolean
}

interface LearningContext {
  currentModule?: string
  currentSkill?: string
  progress?: number
  timeSpent?: number
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  lastActivity?: Date
  weakAreas?: string[]
  strongAreas?: string[]
  goals?: string[]
  sessionDuration?: number
  focusScore?: number
  strugglingTopics?: string[]
  completedModules?: string[]
  currentStreak?: number
  totalHours?: number
  averageScore?: number
}

export default function EnhancedLearningPath() {
  const { pathId } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  
  // Core state
  const [pathData, setPathData] = useState<LearningPathData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAIInsights, setShowAIInsights] = useState(false)
  
  // Enhanced adaptive learning state with AI analysis
  const [adaptiveMode, setAdaptiveMode] = useState(true)
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date())
  const [focusScore, setFocusScore] = useState(87)
  const [adaptationsSuggested, setAdaptationsSuggested] = useState(3)
  const [realTimeInsights, setRealTimeInsights] = useState<string[]>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [learningVelocity, setLearningVelocity] = useState(1.23) // concepts per minute
  const [aiAnalysisResult, setAIAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiAssistantContext, setAiAssistantContext] = useState<LearningContext>({
    currentModule: undefined,
    progress: 0,
    learningStyle: 'visual',
    currentSkill: 'communication',
    timeSpent: 0,
    difficultyLevel: 'intermediate',
    weakAreas: [],
    strongAreas: [],
    sessionDuration: 0,
    focusScore: 87,
    strugglingTopics: [],
    completedModules: [],
    currentStreak: 5,
    totalHours: 24.5,
    averageScore: 88
  })

  // Real-time tracking
  const [currentSessionStats, setCurrentSessionStats] = useState({
    timeSpent: 0,
    conceptsLearned: 0,
    interactionsCount: 0,
    focusBreaks: 0,
    averageEngagement: 0
  })

  // Enhanced mock data with realistic learning patterns
  const mockLearningPathData: LearningPathData = {
    id: pathId as string,
    title: "Advanced Communication & Leadership Mastery",
    description: "Master advanced communication techniques, emotional intelligence, and leadership skills with AI-powered personalized learning",
    category: 'Communication & Leadership',
    difficulty: 'advanced',
    duration: '6 weeks',
    instructor: 'Dr. Sarah Martinez, Communication Expert',
    rating: 4.9,
    students: 18247,
    totalModules: 12,
    completedModules: 5,
    progress: 42,
    skills: [
      'Advanced Communication', 
      'Active Listening', 
      'Conflict Resolution', 
      'Empathetic Leadership', 
      'Public Speaking',
      'Emotional Intelligence',
      'Team Dynamics',
      'Strategic Communication'
    ],
    modules: [
      {
        id: 'module-1',
        title: 'Communication Fundamentals & Psychology',
        description: 'Deep dive into the psychological foundations of effective communication',
        duration: '45 min',
        estimatedTime: 45,
        type: 'video',
        difficulty: 'beginner',
        completed: true,
        locked: false,
        progress: 100,
        aiAdaptations: [
          'Content adapted for visual learning style',
          'Additional examples added for better comprehension',
          'Pacing adjusted to match attention span'
        ],
        engagementScore: 94,
        timeSpent: 42,
        averageScore: 92,
        attemptsCount: 1,
        lastAccessed: new Date('2024-01-15'),
        completedAt: new Date('2024-01-15'),
        strugglingAreas: [],
        masteredConcepts: ['Basic communication theory', 'Psychological principles', 'Communication models'],
        nextOptimalSession: new Date(Date.now() + 86400000), // Tomorrow
        prerequisites: [],
        skillsUnlocked: ['Advanced Listening', 'Non-verbal Communication'],
        userNotes: ['Great introduction to communication psychology'],
        bookmarks: [15, 28, 35],
        realTimeAdaptations: ['Slowed down complex concepts', 'Added visual diagrams'],
        personalizedContent: {
          adaptedForStyle: true,
          difficultyAdjusted: false,
          additionalResources: [],
          customExamples: [
            'Corporate meeting communication example',
            'Customer service scenario'
          ],
          adaptedExplanations: [
            'Visual breakdown of communication flow',
            'Interactive decision tree for response types'
          ]
        }
      },
      {
        id: 'module-2',
        title: 'Active Listening & Empathetic Response',
        description: 'Master the art of deep listening and empathetic communication',
        duration: '60 min',
        estimatedTime: 60,
        type: 'interactive',
        difficulty: 'intermediate',
        completed: true,
        locked: false,
        progress: 100,
        aiAdaptations: [
          'Interactive exercises increased based on kinesthetic preferences',
          'Real-world scenarios personalized to user background',
          'Difficulty calibrated to maintain optimal challenge'
        ],
        engagementScore: 91,
        timeSpent: 58,
        averageScore: 89,
        attemptsCount: 2,
        lastAccessed: new Date('2024-01-16'),
        completedAt: new Date('2024-01-16'),
        strugglingAreas: ['Emotional validation techniques'],
        masteredConcepts: ['Active listening principles', 'Empathetic responses', 'Body language reading'],
        nextOptimalSession: new Date(Date.now() + 172800000), // 2 days
        prerequisites: ['module-1'],
        skillsUnlocked: ['Conflict Mediation', 'Emotional Intelligence'],
        userNotes: ['Need more practice with emotional validation'],
        bookmarks: [22, 45],
        realTimeAdaptations: ['Added extra practice scenarios', 'Provided immediate feedback'],
        personalizedContent: {
          adaptedForStyle: true,
          difficultyAdjusted: true,
          additionalResources: [],
          customExamples: [
            'Workplace conflict resolution',
            'Customer complaint handling'
          ],
          adaptedExplanations: [
            'Step-by-step listening framework',
            'Empathy response templates'
          ]
        }
      },
      {
        id: 'module-3',
        title: 'Non-Verbal Communication & Body Language',
        description: 'Decode and master non-verbal communication signals',
        duration: '50 min',
        estimatedTime: 50,
        type: 'video',
        difficulty: 'intermediate',
        completed: true,
        locked: false,
        progress: 85,
        aiAdaptations: [
          'Video speed adjusted for better retention',
          'Subtitles and visual annotations added',
          'Practice exercises integrated throughout'
        ],
        engagementScore: 88,
        timeSpent: 47,
        averageScore: 85,
        attemptsCount: 1,
        lastAccessed: new Date('2024-01-17'),
        strugglingAreas: ['Cultural differences in body language', 'Micro-expressions'],
        masteredConcepts: ['Basic body language', 'Posture interpretation', 'Eye contact patterns'],
        nextOptimalSession: new Date(Date.now() + 259200000), // 3 days
        prerequisites: ['module-1', 'module-2'],
        skillsUnlocked: ['Advanced Persuasion', 'Cross-cultural Communication'],
        userNotes: ['Focus on cultural sensitivity'],
        bookmarks: [18, 33, 41],
        realTimeAdaptations: ['Highlighted cultural nuances', 'Added practice videos'],
        personalizedContent: {
          adaptedForStyle: true,
          difficultyAdjusted: false,
          additionalResources: [],
          customExamples: [
            'International business meeting scenarios',
            'Cross-cultural communication cases'
          ],
          adaptedExplanations: [
            'Cultural body language comparison chart',
            'Interactive gesture interpretation tool'
          ]
        }
      },
      {
        id: 'module-4',
        title: 'Conflict Resolution & Mediation Strategies',
        description: 'Learn advanced techniques for resolving conflicts constructively',
        duration: '75 min',
        estimatedTime: 75,
        type: 'practice',
        difficulty: 'advanced',
        completed: false,
        locked: false,
        progress: 25,
        aiAdaptations: [
          'Scenario complexity adjusted to current skill level',
          'Additional preparation materials provided'
        ],
        engagementScore: 76,
        timeSpent: 18,
        averageScore: 78,
        attemptsCount: 1,
        lastAccessed: new Date('2024-01-18'),
        strugglingAreas: ['De-escalation techniques', 'Win-win solutions'],
        masteredConcepts: ['Conflict identification', 'Basic mediation principles'],
        nextOptimalSession: new Date(Date.now() + 86400000), // Tomorrow
        prerequisites: ['module-1', 'module-2', 'module-3'],
        skillsUnlocked: ['Leadership Communication', 'Team Dynamics'],
        userNotes: ['Need more practice with de-escalation'],
        bookmarks: [8, 15],
        realTimeAdaptations: ['Reduced complexity initially', 'Added step-by-step guidance'],
        personalizedContent: {
          adaptedForStyle: false,
          difficultyAdjusted: true,
          additionalResources: [],
          customExamples: [
            'Team disagreement resolution',
            'Client-vendor conflict scenarios'
          ],
          adaptedExplanations: [
            'Conflict resolution flowchart',
            'De-escalation phrase examples'
          ]
        }
      },
      {
        id: 'module-5',
        title: 'Emotional Intelligence in Leadership',
        description: 'Develop emotional intelligence for effective leadership',
        duration: '90 min',
        estimatedTime: 90,
        type: 'interactive',
        difficulty: 'advanced',
        completed: false,
        locked: false,
        progress: 8,
        aiAdaptations: [],
        engagementScore: 0,
        timeSpent: 7,
        attemptsCount: 1,
        lastAccessed: new Date('2024-01-18'),
        strugglingAreas: [],
        masteredConcepts: [],
        nextOptimalSession: new Date(Date.now() + 172800000), // 2 days
        prerequisites: ['module-4'],
        skillsUnlocked: ['Strategic Leadership', 'Team Motivation'],
        userNotes: [],
        bookmarks: [],
        realTimeAdaptations: [],
        personalizedContent: {
          adaptedForStyle: false,
          difficultyAdjusted: false,
          additionalResources: [],
          customExamples: [],
          adaptedExplanations: []
        }
      },
      {
        id: 'module-6',
        title: 'Public Speaking & Presentation Mastery',
        description: 'Master confident public speaking and impactful presentations',
        duration: '80 min',
        estimatedTime: 80,
        type: 'practice',
        difficulty: 'advanced',
        completed: false,
        locked: true,
        progress: 0,
        aiAdaptations: [],
        engagementScore: 0,
        timeSpent: 0,
        attemptsCount: 0,
        strugglingAreas: [],
        masteredConcepts: [],
        prerequisites: ['module-4', 'module-5'],
        skillsUnlocked: ['Advanced Persuasion', 'Thought Leadership'],
        userNotes: [],
        bookmarks: [],
        realTimeAdaptations: []
      }
    ],
    aiProfile: {
      learningStyle: 'visual',
      pace: 'medium',
      difficulty: 'intermediate',
      focusTime: 50,
      preferredHours: ['09:00', '14:00', '20:00'],
      weakAreas: ['Public Speaking', 'Conflict De-escalation', 'Cultural Sensitivity'],
      strongAreas: ['Active Listening', 'Empathy', 'Analytical Thinking'],
      motivationFactors: ['Progress Tracking', 'Real-world Application', 'Peer Recognition'],
      retentionRate: 87,
      engagementPattern: 'morning',
      strugglingConcepts: ['Advanced de-escalation', 'Cross-cultural nuances'],
      masteredConcepts: ['Basic communication theory', 'Active listening', 'Body language basics']
    },
    smartRecommendations: [
      {
        id: 'rec-1',
        type: 'method',
        title: 'Switch to Interactive Learning',
        description: 'Your engagement increases 34% with interactive content vs. videos',
        reasoning: 'Analysis shows higher retention and completion rates with hands-on exercises',
        confidence: 92,
        impact: 'high',
        urgency: 'medium',
        timeToImplement: 0,
        category: 'Learning Optimization',
        actionable: true
      },
      {
        id: 'rec-2',
        type: 'timing',
        title: 'Optimal Study Schedule',
        description: 'Schedule complex topics for 9-11 AM when your focus peaks',
        reasoning: 'Your cognitive performance data shows 23% better comprehension during morning hours',
        confidence: 88,
        impact: 'medium',
        urgency: 'low',
        timeToImplement: 5,
        category: 'Schedule Optimization',
        actionable: true
      },
      {
        id: 'rec-3',
        type: 'practice',
        title: 'Additional De-escalation Practice',
        description: 'Extra practice scenarios for conflict de-escalation techniques',
        reasoning: 'Identified as struggling area with 67% accuracy rate - below your usual 89%',
        confidence: 95,
        impact: 'high',
        urgency: 'high',
        timeToImplement: 15,
        category: 'Skill Reinforcement',
        actionable: true
      },
      {
        id: 'rec-4',
        type: 'break',
        title: 'Micro-Break Recommendation',
        description: 'Take a 5-minute break to maintain optimal focus',
        reasoning: 'Focus score has decreased to 76% - a break will restore to 85%+',
        confidence: 87,
        impact: 'medium',
        urgency: 'medium',
        timeToImplement: 5,
        category: 'Focus Optimization',
        actionable: true
      }
    ],
    analytics: {
      totalTimeSpent: 172, // minutes
      averageSessionLength: 43, // minutes
      completionRate: 85,
      retentionScore: 87,
      engagementTrend: 'increasing',
      learningVelocity: 1.23, // concepts per minute
      strugglingTopics: ['De-escalation', 'Cultural Sensitivity', 'Public Speaking'],
      strongTopics: ['Active Listening', 'Empathy', 'Communication Theory'],
      focusPatterns: [
        { time: '09:00', score: 92 },
        { time: '14:00', score: 85 },
        { time: '20:00', score: 78 }
      ],
      weeklyProgress: [12, 28, 42, 58, 65, 78, 85],
      skillProgression: [
        { skill: 'Communication', level: 78, trend: 'up' },
        { skill: 'Leadership', level: 65, trend: 'up' },
        { skill: 'Conflict Resolution', level: 45, trend: 'stable' },
        { skill: 'Public Speaking', level: 23, trend: 'up' }
      ],
      predictedCompletion: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      riskFactors: ['Struggling with advanced concepts', 'Lower engagement in video content'],
      achievements: ['5-day streak', 'First module mastery', 'Empathy expert', 'Communication foundation']
    },
    nextRecommendation: 'Focus on Module 4: Conflict Resolution - practice de-escalation scenarios',
    estimatedCompletion: '3 weeks',
    learningObjectives: [
      'Master advanced communication techniques',
      'Develop emotional intelligence and empathy',
      'Learn effective conflict resolution strategies',
      'Build confident public speaking skills',
      'Understand cross-cultural communication nuances'
    ],
    adaptiveFeatures: [
      'Real-time difficulty adjustment',
      'Personalized content recommendations',
      'Intelligent pacing optimization',
      'Context-aware explanations',
      'Smart practice scheduling'
    ],
    currentStreak: 5,
    longestStreak: 12,
    certificateProgress: 42,
    collaborativeFeatures: true,
    mentorSupport: true,
    realTimeAdaptation: true
  }

  // Initialize learning path data with realistic loading
  useEffect(() => {
    const loadPathData = async () => {
      // Simulate realistic API loading with progress updates
      setLoading(true)
      
      // Simulate analysis phase
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Load base data
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // AI processing
      await new Promise(resolve => setTimeout(resolve, 400))
      
      setPathData(mockLearningPathData)
      setLoading(false)
      
      // Initialize real-time insights
      setTimeout(() => {
        setRealTimeInsights([
          '🎯 Optimal learning window detected',
          '📊 Engagement 23% above average',
          '🧠 Focus score in peak range'
        ])
      }, 2000)
    }

    loadPathData()
  }, [pathId])

  // Update AI assistant context when path data changes
  useEffect(() => {
    if (pathData) {
      const currentModule = pathData.modules.find(m => m.id === currentModuleId)
      setAiAssistantContext({
        currentModule: currentModule?.title,
        progress: pathData.progress,
        learningStyle: pathData.aiProfile.learningStyle,
        currentSkill: 'communication',
        timeSpent: Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000),
        difficultyLevel: pathData.difficulty as 'beginner' | 'intermediate' | 'advanced',
        weakAreas: pathData.aiProfile.weakAreas,
        strongAreas: pathData.aiProfile.strongAreas,
        sessionDuration: Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000),
        focusScore: focusScore,
        strugglingTopics: pathData.analytics.strugglingTopics,
        completedModules: pathData.modules.filter(m => m.completed).map(m => m.title),
        currentStreak: pathData.currentStreak,
        totalHours: Math.round(pathData.analytics.totalTimeSpent / 60 * 10) / 10,
        averageScore: Math.round(pathData.modules.filter(m => m.averageScore).reduce((acc, m) => acc + m.averageScore!, 0) / pathData.modules.filter(m => m.averageScore).length)
      })
    }
  }, [pathData, currentModuleId, focusScore, sessionStartTime])

  // Enhanced session tracking
  useEffect(() => {
    if (sessionActive) {
      const interval = setInterval(() => {
        setCurrentSessionStats(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + 1
        }))
        
        // Simulate focus score fluctuations
        setFocusScore(prev => {
          const change = (Math.random() - 0.5) * 4
          return Math.max(70, Math.min(100, prev + change))
        })
        
        // Update learning velocity
        if (currentSessionStats.timeSpent > 0 && currentSessionStats.conceptsLearned > 0) {
          setLearningVelocity(currentSessionStats.conceptsLearned / currentSessionStats.timeSpent)
        }
      }, 60000) // Every minute
      
      return () => clearInterval(interval)
    }
  }, [sessionActive, currentSessionStats.timeSpent, currentSessionStats.conceptsLearned])

  // AI Analysis Functions
  const performAIAnalysis = async (analysisType: 'learning_path' | 'performance' | 'recommendations') => {
    setIsAnalyzing(true)
    
    try {
      const analysisPrompt = `
      Analyze this learning data and provide insights:
      
      LEARNING PATH: ${pathData?.title}
      CURRENT PROGRESS: ${pathData?.progress}%
      COMPLETED MODULES: ${pathData?.completedModules}/${pathData?.totalModules}
      
      LEARNER PROFILE:
      - Learning Style: ${pathData?.aiProfile.learningStyle}
      - Pace: ${pathData?.aiProfile.pace}
      - Focus Time: ${pathData?.aiProfile.focusTime} minutes
      - Strong Areas: ${pathData?.aiProfile.strongAreas.join(', ')}
      - Weak Areas: ${pathData?.aiProfile.weakAreas.join(', ')}
      
      PERFORMANCE METRICS:
      - Time Spent: ${pathData?.analytics.totalTimeSpent} minutes
      - Retention Score: ${pathData?.analytics.retentionScore}%
      - Engagement Trend: ${pathData?.analytics.engagementTrend}
      - Learning Velocity: ${pathData?.analytics.learningVelocity} concepts/min
      
      CURRENT SESSION:
      - Focus Score: ${focusScore}%
      - Session Duration: ${currentSessionStats.timeSpent} minutes
      - Active Module: ${currentModuleId || 'None'}
      
      Based on this data, provide a comprehensive analysis including:
      1. Overall learning assessment
      2. Identified strengths and areas for improvement
      3. Personalized recommendations
      4. Predicted outcomes
      5. Adaptive strategies
      6. Next optimal actions
      
      Format as JSON with these fields:
      {
        "overallAssessment": "...",
        "strengthsIdentified": ["...", "..."],
        "improvementAreas": ["...", "..."],
        "personalizedRecommendations": ["...", "..."],
        "learningStyleConfidence": 0-100,
        "predictedOutcomes": ["...", "..."],
        "adaptiveStrategies": ["...", "..."],
        "nextOptimalActions": ["...", "..."]
      }
      `
      
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          type: analysisType,
          context: {
            pathData,
            currentSession: currentSessionStats,
            focusScore,
            learningVelocity
          }
        })
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setAIAnalysisResult(analysis)
        
        // Update insights based on analysis
        const newInsights = [
          `🎯 AI Analysis: ${analysis.overallAssessment.slice(0, 50)}...`,
          `💡 Key Strength: ${analysis.strengthsIdentified[0]}`,
          `🚀 Next Action: ${analysis.nextOptimalActions[0]}`
        ]
        setRealTimeInsights(newInsights)
        
        // Generate adaptive recommendations
        setAdaptationsSuggested(prev => prev + analysis.personalizedRecommendations.length)
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      // Fallback to simulated analysis
      const simulatedAnalysis: AIAnalysisResult = {
        overallAssessment: `Based on your ${pathData?.progress}% progress and ${focusScore}% focus score, you're performing well with some areas for optimization.`,
        strengthsIdentified: pathData?.aiProfile.strongAreas || ['Active Learning', 'Engagement'],
        improvementAreas: pathData?.aiProfile.weakAreas || ['Time Management', 'Retention'],
        personalizedRecommendations: [
          `Optimize study sessions to ${pathData?.aiProfile.focusTime} minutes`,
          `Focus on ${pathData?.aiProfile.learningStyle} learning materials`,
          'Practice spaced repetition for better retention'
        ],
        learningStyleConfidence: 87,
        predictedOutcomes: [
          `Completion in ${pathData?.estimatedCompletion}`,
          'Strong skill development in communication',
          'Improved focus scores with consistent practice'
        ],
        adaptiveStrategies: [
          'Adjust content difficulty based on performance',
          'Provide additional practice for weak areas',
          'Optimize session timing for peak performance'
        ],
        nextOptimalActions: [
          `Continue with ${pathData?.nextRecommendation}`,
          'Take a 10-minute break if focus drops below 80%',
          'Review previous module concepts for reinforcement'
        ]
      }
      setAIAnalysisResult(simulatedAnalysis)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Enhanced session tracking with AI insights
  const startEnhancedSession = (moduleId: string) => {
    const session: LearningSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      moduleId,
      interactions: 0,
      focusEvents: [{ timestamp: new Date(), score: focusScore }],
      strugglingMoments: [],
      breakthroughMoments: [],
      aiInterventions: [],
      performanceMetrics: {
        comprehensionRate: 0,
        retentionScore: 0,
        engagementLevel: 0,
        difficultyProgression: 0
      }
    }
    
    setCurrentSession(session)
    setCurrentModuleId(moduleId)
    setSessionActive(true)
    setSessionStartTime(new Date())
    
    // Trigger AI analysis for session optimization
    setTimeout(() => {
      performAIAnalysis('performance')
    }, 30000) // Analyze after 30 seconds
  }

  // Handle context updates from AI assistant
  const handleContextUpdate = (updates: Partial<LearningContext>) => {
    setAiAssistantContext(prev => ({ ...prev, ...updates }))
    if (updates.currentModule) {
      const moduleId = pathData?.modules.find(m => m.title === updates.currentModule)?.id
      if (moduleId) {
        setCurrentModuleId(moduleId)
      }
    }
  }

  // Start learning session
  const startLearningSession = (moduleId: string) => {
    startEnhancedSession(moduleId)
    setCurrentSessionStats({
      timeSpent: 0,
      conceptsLearned: 0,
      interactionsCount: 0,
      focusBreaks: 0,
      averageEngagement: 0
    })
  }

  // Smart recommendation system with AI integration
  const generateSmartRecommendation = () => {
    if (!pathData) return
    
    const newRec: SmartRecommendation = {
      id: `rec-${Date.now()}`,
      type: 'method',
      title: 'AI-Generated Learning Optimization',
      description: `Based on your ${Math.floor(currentSessionStats.timeSpent)} minute session, switch to ${pathData.aiProfile.learningStyle} learning materials`,
      reasoning: `Your engagement patterns show 18% better retention with ${pathData.aiProfile.learningStyle} content`,
      confidence: 89,
      impact: 'medium',
      urgency: 'low',
      timeToImplement: 2,
      category: 'Real-time Optimization',
      actionable: true
    }
    
    setPathData(prev => prev ? {
      ...prev,
      smartRecommendations: [newRec, ...prev.smartRecommendations.slice(0, 5)]
    } : null)
    
    setAdaptationsSuggested(prev => prev + 1)
    
    // Trigger AI analysis for better recommendations
    performAIAnalysis('recommendations')
  }

  // Get module type icon
  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return MonitorPlay
      case 'reading': return DocumentIcon
      case 'interactive': return PenTool
      case 'practice': return Target
      case 'assessment': return CheckSquare
      case 'discussion': return MessageCircle
      default: return BookOpen
    }
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Loading screen with realistic progress
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 text-white">
        <MainNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <motion.div
              className="relative w-20 h-20 mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-full h-full text-cyan-400" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold text-white mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              AI Analyzing Your Learning Path
            </motion.h2>
            <div className="space-y-2 text-gray-300">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                📊 Processing learning analytics...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                🧠 Personalizing content recommendations...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                ⚡ Optimizing learning experience...
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!pathData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 text-white">
        <MainNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Learning Path Not Found</h2>
            <p className="text-gray-300 mb-6">The requested learning path could not be loaded.</p>
            <Button onClick={() => router.push('/learning')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Hub
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 text-white">
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Real-time Status */}
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
              Back to Learning Hub
            </Button>
            
            <div className="flex items-center space-x-3">
              {/* Real-time Status Indicators */}
              <div className="flex items-center space-x-2">
                {sessionActive && (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                    <Circle className="w-2 h-2 mr-1 fill-current" />
                    Live Session
                  </Badge>
                )}
                
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
                
                {adaptiveMode && (
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Adaptive Mode
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <Button
                onClick={() => setAdaptiveMode(!adaptiveMode)}
                variant={adaptiveMode ? "default" : "outline"}
                size="sm"
                className={adaptiveMode ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Brain className="h-4 w-4 mr-2" />
                {adaptiveMode ? 'Adaptive On' : 'Enable Adaptive'}
              </Button>
              
              <Button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                variant={showAIAssistant ? "default" : "outline"}
                size="sm"
                className="relative"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
                {adaptationsSuggested > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-cyan-500 text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center">
                    {adaptationsSuggested}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Path Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{pathData.title}</h1>
                  <p className="text-lg text-gray-300">{pathData.description}</p>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4 mb-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {pathData.duration}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {pathData.students.toLocaleString()} learners
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-amber-400" />
                  {pathData.rating}
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {pathData.instructor}
                </div>
                <Badge className={getDifficultyColor(pathData.difficulty)}>
                  {pathData.difficulty}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Award className="w-3 h-3 mr-1" />
                  Certificate Available
                </Badge>
              </div>

              {/* Enhanced Progress Overview */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg">Learning Progress</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-cyan-400 font-bold text-2xl">{pathData.progress}%</span>
                      {pathData.analytics.engagementTrend === 'increasing' && (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <Progress value={pathData.progress} className="h-4 mb-2" />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{pathData.completedModules}/{pathData.totalModules} modules completed</span>
                      <span>Est. completion: {pathData.estimatedCompletion}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-white">{pathData.currentStreak}</div>
                      <div className="text-sm text-gray-400">Day Streak</div>
                      <Flame className="w-4 h-4 text-orange-400 mx-auto mt-1" />
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-cyan-400">{focusScore}%</div>
                      <div className="text-sm text-gray-400">Focus Score</div>
                      <Target className="w-4 h-4 text-cyan-400 mx-auto mt-1" />
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-green-400">{Math.round(pathData.analytics.totalTimeSpent / 60)}h</div>
                      <div className="text-sm text-gray-400">Time Invested</div>
                      <Timer className="w-4 h-4 text-green-400 mx-auto mt-1" />
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-purple-400">{learningVelocity.toFixed(1)}</div>
                      <div className="text-sm text-gray-400">Learning Velocity</div>
                      <Zap className="w-4 h-4 text-purple-400 mx-auto mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced AI Insights Sidebar */}
            <div className="space-y-6">
              {/* Real-time Insights */}
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/40">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    AI Insights
                    <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">Live</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realTimeInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="text-sm text-purple-100 p-2 rounded bg-purple-500/10"
                      >
                        {insight}
                      </motion.div>
                    ))}
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">{pathData.analytics.retentionScore}%</div>
                        <div className="text-xs text-gray-400">Retention</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-cyan-400">{adaptationsSuggested}</div>
                        <div className="text-xs text-gray-400">Adaptations</div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={generateSmartRecommendation}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Insight
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Profile */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Learning Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Learning Style</span>
                      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 capitalize">
                        {pathData.aiProfile.learningStyle}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Optimal Pace</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 capitalize">
                        {pathData.aiProfile.pace}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Focus Duration</span>
                      <span className="text-white font-medium">{pathData.aiProfile.focusTime}min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Best Time</span>
                      <span className="text-white font-medium">{pathData.aiProfile.engagementPattern}</span>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-2">Strong Areas</div>
                      <div className="flex flex-wrap gap-1">
                        {pathData.aiProfile.strongAreas.slice(0, 3).map((area, index) => (
                          <Badge key={index} className="bg-green-500/20 text-green-400 text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Session Stats */}
              {sessionActive && (
                <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/40">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Current Session
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Time Active</span>
                        <span className="text-white font-medium">{currentSessionStats.timeSpent}min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Concepts Learned</span>
                        <span className="text-green-400 font-medium">{currentSessionStats.conceptsLearned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Focus Score</span>
                        <span className={`font-medium ${focusScore > 85 ? 'text-green-400' : focusScore > 70 ? 'text-amber-400' : 'text-red-400'}`}>
                          {focusScore}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50">
              <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="modules" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                Modules
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Learning Objectives */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Learning Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {pathData.learningObjectives.map((objective, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{objective}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Smart Recommendations */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      AI Recommendations
                      <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 text-xs">
                        {pathData.smartRecommendations.length} Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pathData.smartRecommendations.slice(0, 3).map((rec) => (
                        <motion.div 
                          key={rec.id} 
                          className="p-4 rounded-lg bg-slate-700/40 border border-slate-600/40"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-white font-medium text-sm">{rec.title}</h4>
                            <div className="flex items-center space-x-1">
                              <Badge className={
                                rec.impact === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                rec.impact === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                'bg-green-500/20 text-green-400 border-green-500/30'
                              }>
                                {rec.impact} impact
                              </Badge>
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                {rec.confidence}%
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{rec.timeToImplement}min to implement</span>
                            {rec.actionable && (
                              <Button size="sm" variant="outline" className="text-xs">
                                Apply Now
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="modules" className="mt-8">
              <div className="space-y-6">
                {pathData.modules.map((module, index) => {
                  const TypeIcon = getModuleTypeIcon(module.type)
                  const isCurrentModule = currentModuleId === module.id
                  
                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border transition-all duration-300 ${
                        module.locked ? 'border-slate-600/30 opacity-60' :
                        module.completed ? 'border-green-500/40 shadow-green-500/10' :
                        isCurrentModule ? 'border-cyan-500/60 shadow-cyan-500/20' :
                        'border-slate-600/50 hover:border-slate-500/70'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  module.completed ? 'bg-green-500' :
                                  module.locked ? 'bg-slate-600' :
                                  isCurrentModule ? 'bg-cyan-500' :
                                  'bg-purple-500'
                                }`}>
                                  {module.completed ? (
                                    <CheckCircle className="h-6 w-6 text-white" />
                                  ) : module.locked ? (
                                    <Lock className="h-6 w-6 text-white" />
                                  ) : (
                                    <TypeIcon className="h-6 w-6 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-white font-semibold text-lg">{module.title}</h3>
                                  <p className="text-gray-300 text-sm mt-1">{module.description}</p>
                                </div>
                              </div>

                              {/* Module Metadata */}
                              <div className="flex items-center flex-wrap gap-3 mb-4 text-sm text-gray-400">
                                <div className="flex items-center">
                                  <TypeIcon className="h-4 w-4 mr-1" />
                                  {module.type}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {module.duration}
                                </div>
                                <Badge className={getDifficultyColor(module.difficulty)}>
                                  {module.difficulty}
                                </Badge>
                                {module.engagementScore > 0 && (
                                  <div className="flex items-center">
                                    <Activity className="h-4 w-4 mr-1" />
                                    {module.engagementScore}% engagement
                                  </div>
                                )}
                                {module.averageScore && (
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 mr-1 text-amber-400" />
                                    {module.averageScore}% score
                                  </div>
                                )}
                              </div>

                              {/* Progress Bar */}
                              {!module.locked && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-300">Progress</span>
                                    <span className="text-white font-medium">{module.progress}%</span>
                                  </div>
                                  <Progress value={module.progress} className="h-2" />
                                </div>
                              )}

                              {/* AI Adaptations */}
                              {module.aiAdaptations.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-cyan-400 text-sm font-medium mb-2 flex items-center">
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    AI Adaptations Applied
                                  </h4>
                                  <div className="space-y-1">
                                    {module.aiAdaptations.slice(0, 2).map((adaptation, idx) => (
                                      <div key={idx} className="text-gray-300 text-sm flex items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 mt-2 flex-shrink-0" />
                                        {adaptation}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Skills Unlocked */}
                              {module.skillsUnlocked && module.skillsUnlocked.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-purple-400 text-sm font-medium mb-2">Skills Unlocked</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {module.skillsUnlocked.map((skill, idx) => (
                                      <Badge key={idx} className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Struggling Areas Warning */}
                              {module.strugglingAreas.length > 0 && (
                                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                  <div className="flex items-center mb-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 mr-2" />
                                    <span className="text-amber-400 text-sm font-medium">Needs Attention</span>
                                  </div>
                                  <div className="text-amber-100 text-sm">
                                    {module.strugglingAreas.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 ml-6">
                              {!module.locked && (
                                <div className="flex flex-col space-y-2">
                                  <Button
                                    onClick={() => startLearningSession(module.id)}
                                    className={`${
                                      module.completed ? 
                                      'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 
                                      isCurrentModule ?
                                      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700' :
                                      'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                                    } transition-all duration-200`}
                                  >
                                    {module.completed ? (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Review
                                      </>
                                    ) : isCurrentModule ? (
                                      <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Continue
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Start
                                      </>
                                    )}
                                  </Button>
                                  
                                  {module.progress > 0 && !module.completed && (
                                    <Button variant="outline" size="sm">
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Reset
                                    </Button>
                                  )}
                                </div>
                              )}
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>

                          {/* Module Footer with Additional Info */}
                          {(module.lastAccessed || module.nextOptimalSession) && (
                            <div className="mt-4 pt-4 border-t border-slate-600/30 flex items-center justify-between text-xs text-gray-400">
                              {module.lastAccessed && (
                                <span>Last accessed: {module.lastAccessed.toLocaleDateString()}</span>
                              )}
                              {module.nextOptimalSession && (
                                <span>Optimal next session: {module.nextOptimalSession.toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Learning Analytics */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Learning Analytics
                        {isAnalyzing && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="ml-2"
                          >
                            <Cpu className="h-4 w-4 text-cyan-400" />
                          </motion.div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Time Investment */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Total Time Invested</span>
                            <span className="text-white font-medium">
                              {Math.round(pathData.analytics.totalTimeSpent / 60)}h {pathData.analytics.totalTimeSpent % 60}m
                            </span>
                          </div>
                          <Progress value={75} className="h-3" />
                        </div>

                        {/* Completion Rate */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Completion Rate</span>
                            <span className="text-cyan-400 font-medium">
                              {pathData.analytics.completionRate}%
                            </span>
                          </div>
                          <Progress value={pathData.analytics.completionRate} className="h-3" />
                        </div>

                        {/* Retention Score */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Knowledge Retention</span>
                            <span className="text-green-400 font-medium flex items-center">
                              {pathData.analytics.retentionScore}%
                              <TrendingUp className="w-3 h-3 ml-1" />
                            </span>
                          </div>
                          <Progress value={pathData.analytics.retentionScore} className="h-3" />
                        </div>

                        {/* Learning Velocity */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Learning Velocity</span>
                            <span className="text-purple-400 font-medium">
                              {pathData.analytics.learningVelocity} concepts/min
                            </span>
                          </div>
                          <Progress value={80} className="h-3" />
                        </div>

                        {/* Weekly Progress Chart */}
                        <div className="mt-6">
                          <h4 className="text-white font-medium mb-3">Weekly Progress</h4>
                          <div className="flex items-end space-x-2 h-20">
                            {pathData.analytics.weeklyProgress.map((progress, index) => (
                              <div key={index} className="flex-1 flex flex-col items-center">
                                <div 
                                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t"
                                  style={{ height: `${(progress / 100) * 80}px` }}
                                />
                                <span className="text-xs text-gray-400 mt-1">W{index + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skill Progression */}
                  <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Skill Progression
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pathData.analytics.skillProgression.map((skill, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300 text-sm">{skill.skill}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">{skill.level}%</span>
                                {skill.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : skill.trend === 'down' ? (
                                  <TrendingDown className="w-4 h-4 text-red-400" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gray-400" />
                                )}
                              </div>
                            </div>
                            <Progress value={skill.level} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Analysis Panel */}
                <div className="space-y-6">
                  {aiAnalysisResult && (
                    <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/40">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Brain className="h-5 w-5 mr-2" />
                          AI Analysis Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-purple-300 font-medium text-sm mb-2">Overall Assessment</h4>
                            <p className="text-purple-100 text-xs">{aiAnalysisResult.overallAssessment}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-green-300 font-medium text-sm mb-2">Strengths</h4>
                            <div className="space-y-1">
                              {aiAnalysisResult.strengthsIdentified.map((strength, index) => (
                                <div key={index} className="text-green-100 text-xs flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                                  {strength}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-amber-300 font-medium text-sm mb-2">Areas for Improvement</h4>
                            <div className="space-y-1">
                              {aiAnalysisResult.improvementAreas.map((area, index) => (
                                <div key={index} className="text-amber-100 text-xs flex items-center">
                                  <Target className="w-3 h-3 mr-2 text-amber-400" />
                                  {area}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-cyan-300 font-medium text-sm mb-2">Next Actions</h4>
                            <div className="space-y-1">
                              {aiAnalysisResult.nextOptimalActions.slice(0, 3).map((action, index) => (
                                <div key={index} className="text-cyan-100 text-xs flex items-center">
                                  <ArrowRight className="w-3 h-3 mr-2 text-cyan-400" />
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Achievements */}
                  <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Award className="h-5 w-5 mr-2" />
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pathData.analytics.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span className="text-gray-300">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Factors */}
                  {pathData.analytics.riskFactors.length > 0 && (
                    <Card className="bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm border border-red-500/40">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Attention Needed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {pathData.analytics.riskFactors.map((factor, index) => (
                            <div key={index} className="text-red-100 text-xs flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-2 text-red-400" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Enhanced resource cards would go here */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Supplementary Reading
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">
                      AI-curated additional materials based on your learning progress
                    </p>
                    <div className="space-y-2 mb-4">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">AI Recommended</Badge>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Beginner Friendly</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Resources
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Video className="h-5 w-5 mr-2" />
                      Video Tutorials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">
                      Expert-led video content tailored to your learning style
                    </p>
                    <div className="space-y-2 mb-4">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">HD Quality</Badge>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Subtitles Available</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Videos
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm border border-slate-600/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <PenTool className="h-5 w-5 mr-2" />
                      Practice Exercises
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">
                      Interactive exercises designed to reinforce your learning
                    </p>
                    <div className="space-y-2 mb-4">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Interactive</Badge>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Advanced Level</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Start Practice
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Enhanced AI Learning Assistant */}
      <AILearningAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        context={aiAssistantContext}
        enableVoice={true}
        enableOpenAI={true}
        onContextUpdate={handleContextUpdate}
        size="default"
        position="fixed"
      />
    </div>
  )
}