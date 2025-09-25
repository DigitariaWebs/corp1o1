"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { AILearningAssistant } from "@/components/ai/ai-learning-assistant"
import { FloatingChatBar } from "@/components/chat/floating-chat-bar"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Enhanced chat message type
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'suggestion' | 'encouragement' | 'question' | 'adaptive' | 'system' | 'insight' | 'warning'
  metadata?: {
    confidence?: number
    moduleContext?: string
    progressContext?: number
    skillContext?: string[]
    adaptationType?: 'content' | 'timing' | 'method' | 'difficulty'
    actionRequired?: boolean
    links?: Array<{ title: string; url: string }>
    suggestions?: string[]
    aiThinkingTime?: number
    responseQuality?: 'excellent' | 'good' | 'average'
    contextRelevance?: number
  }
  feedback?: 'positive' | 'negative' | null
}

// Learning context interface
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

interface AIAssistantContextType {
  // State
  isFullScreen: boolean
  isMinimized: boolean
  isVisible: boolean
  messages: ChatMessage[]
  sessionData: any
  currentPage: string
  
  // Actions
  goToFullScreen: () => void
  minimizeToFloating: () => void
  toggleMinimized: () => void
  showAssistant: () => void
  hideAssistant: () => void
  addMessage: (message: ChatMessage) => void
  clearSession: () => void
  updateLearningContext: (context: Partial<LearningContext>) => void
  
  // Context data
  learningContext: LearningContext
  sessionStats: {
    messagesExchanged: number
    sessionDuration: number
    helpfulnessScore: number
    learningInsights: number
  }
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  
  // Core state
  const [isFullScreen, setIsFullScreen] = useState(pathname === '/ai-assistant')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionData, setSessionData] = useState<any>({})
  
  // Learning context state
  const [learningContext, setLearningContext] = useState<LearningContext>({
    currentModule: user?.currentLearningModule || "Getting Started",
    progress: user?.learningProgress || 0,
    learningStyle: user?.learningStyle || "visual",
    currentStreak: user?.learningStreak || 0,
    sessionDuration: 0,
    focusScore: 88,
    strongAreas: user?.strongSkills || ["Communication", "Problem Solving"],
    weakAreas: user?.improvementAreas || [],
    strugglingTopics: [],
    completedModules: user?.completedModules || [],
    totalHours: user?.totalLearningHours || 0,
    averageScore: user?.averageAssessmentScore || 85
  })
  
  // Session stats
  const [sessionStats, setSessionStats] = useState({
    messagesExchanged: 0,
    sessionDuration: 0,
    helpfulnessScore: 85,
    learningInsights: 0
  })
  
  // Timer ref for session duration
  const sessionTimerRef = useRef<NodeJS.Timeout>()
  
  // Update full screen state based on current path
  useEffect(() => {
    const isAIAssistantPage = pathname === '/ai-assistant'
    setIsFullScreen(isAIAssistantPage)
    
    // Hide floating assistant when on full screen AI page
    if (isAIAssistantPage) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
      setIsMinimized(false) // Show floating assistant when navigating away
    }
  }, [pathname])
  
  // Session timer
  useEffect(() => {
    if (isVisible && !isFullScreen) {
      sessionTimerRef.current = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          sessionDuration: prev.sessionDuration + 1
        }))
      }, 1000)
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
    
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [isVisible, isFullScreen])
  
  // Actions
  const goToFullScreen = useCallback(() => {
    router.push('/ai-assistant')
  }, [router])
  
  const minimizeToFloating = useCallback(() => {
    if (pathname === '/ai-assistant') {
      router.back() // Go back to previous page
    } else {
      setIsMinimized(true)
      setIsVisible(true)
    }
  }, [pathname, router])
  
  const toggleMinimized = useCallback(() => {
    if (isFullScreen) {
      minimizeToFloating()
    } else {
      setIsMinimized(!isMinimized)
    }
  }, [isFullScreen, isMinimized, minimizeToFloating])
  
  const showAssistant = useCallback(() => {
    setIsVisible(true)
    setIsMinimized(false)
  }, [])
  
  const hideAssistant = useCallback(() => {
    setIsVisible(false)
  }, [])
  
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
    setSessionStats(prev => ({
      ...prev,
      messagesExchanged: prev.messagesExchanged + 1
    }))
  }, [])
  
  const clearSession = useCallback(() => {
    setMessages([])
    setSessionData({})
    setSessionStats({
      messagesExchanged: 0,
      sessionDuration: 0,
      helpfulnessScore: 85,
      learningInsights: 0
    })
  }, [])
  
  const updateLearningContext = useCallback((updates: Partial<LearningContext>) => {
    setLearningContext(prev => ({ ...prev, ...updates }))
  }, [])
  
  // Don't show floating assistant on landing page, auth pages, or AI assistant page
  const shouldShowFloatingAssistant = isVisible && 
    !isFullScreen && 
    pathname !== '/' && 
    !pathname.startsWith('/sign-') &&
    pathname !== '/ai-assistant'
  
  const value: AIAssistantContextType = {
    // State
    isFullScreen,
    isMinimized,
    isVisible,
    messages,
    sessionData,
    currentPage: pathname,
    
    // Actions
    goToFullScreen,
    minimizeToFloating,
    toggleMinimized,
    showAssistant,
    hideAssistant,
    addMessage,
    clearSession,
    updateLearningContext,
    
    // Context data
    learningContext,
    sessionStats
  }
  
  return (
    <AIAssistantContext.Provider value={value}>
      {children}
      
      {/* Floating AI Assistant - only show when not on full screen page */}
      {shouldShowFloatingAssistant && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 pointer-events-auto">
            <AILearningAssistant
              isOpen={!isMinimized}
              onClose={hideAssistant}
              context={learningContext}
              position="fixed"
              size="default"
              enableVoice={true}
              enableOpenAI={true}
              className="pointer-events-auto z-50"
              onContextUpdate={updateLearningContext}
              onGoToFullScreen={goToFullScreen}
            />
          </div>
        </div>
      )}
      
      {/* Z-index management for pages */}
      <style jsx global>{`
        .ai-assistant-page {
          z-index: 10;
        }
        .other-pages {
          z-index: 20;
        }
        .floating-ai-assistant {
          z-index: 40;
        }
        .ai-assistant-overlay {
          z-index: 50;
        }
      `}</style>
    </AIAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider')
  }
  return context
}