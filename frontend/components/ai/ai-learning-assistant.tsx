// components/ai/ai-learning-assistant.tsx
"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { SimpleCommandMenu as CommandMenu } from "./simple-command-menu"
import { MessageContent } from "@/components/chat/message-content"
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  X,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  Sparkles,
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Zap,
  Heart,
  Star,
  Activity,
  Shield,
  Globe,
  Coffee,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  MoreHorizontal,
  Cpu,
  Timer,
  Flame
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { sendChat } from "@/lib/ai-client"

// Enhanced Types for the AI Assistant
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
  isTyping?: boolean
  streamed?: boolean
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

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  context?: LearningContext
  className?: string
  position?: 'fixed' | 'relative'
  size?: 'compact' | 'default' | 'expanded'
  enableVoice?: boolean
  enableOpenAI?: boolean
  onContextUpdate?: (context: Partial<LearningContext>) => void
}

interface AssistantPersonality {
  name: string
  avatar: string
  greeting: string
  style: 'encouraging' | 'professional' | 'friendly' | 'motivational' | 'analytical'
  expertise: string[]
  responseStyle: string
  promptModifier: string
}

const ASSISTANT_PERSONALITIES: AssistantPersonality[] = [
  {
    name: "ARIA",
    avatar: "🤖",
    greeting: "Hi! I'm ARIA, your adaptive learning companion. I analyze your learning patterns in real-time to provide personalized guidance.",
    style: "encouraging",
    expertise: ["learning_optimization", "motivation", "skill_development", "adaptive_content"],
    responseStyle: "encouraging and supportive with actionable insights",
    promptModifier: "Be encouraging, provide specific actionable advice, and focus on learning optimization."
  },
  {
    name: "SAGE",
    avatar: "🧠",
    greeting: "Hello! I'm SAGE, your strategic learning advisor. I use advanced analytics to guide your educational journey.",
    style: "professional", 
    expertise: ["knowledge_assessment", "curriculum_design", "progress_tracking", "advanced_analytics"],
    responseStyle: "analytical and data-driven with strategic insights",
    promptModifier: "Be analytical, use data-driven insights, and provide strategic learning guidance."
  },
  {
    name: "COACH",
    avatar: "💪",
    greeting: "Hey there! I'm COACH, your performance optimizer. Let's push your limits and achieve breakthrough results!",
    style: "motivational",
    expertise: ["goal_setting", "performance_improvement", "habit_formation", "breakthrough_strategies"],
    responseStyle: "motivational and action-oriented with performance focus",
    promptModifier: "Be motivational, focus on performance optimization, and encourage breakthrough thinking."
  },
  {
    name: "MENTOR",
    avatar: "🎓",
    greeting: "Welcome! I'm MENTOR, your wisdom guide. I combine experience with AI to provide deep learning insights.",
    style: "analytical",
    expertise: ["deep_learning", "conceptual_understanding", "critical_thinking", "knowledge_synthesis"],
    responseStyle: "wise and analytical with deep conceptual insights",
    promptModifier: "Provide deep insights, focus on conceptual understanding, and encourage critical thinking."
  }
]

 
export function AILearningAssistant({
  isOpen,
  onClose,
  context = {},
  className = "",
  position = "fixed",
  size = "default",
  enableVoice = true,
  enableOpenAI = true,
  onContextUpdate
}: AIAssistantProps) {
  const router = useRouter()
  const { t } = useTranslation()
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(size === 'expanded')
  const [activePersonality, setActivePersonality] = useState(0)
  const [isThinking, setIsThinking] = useState(false)
  
  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandSearchQuery, setCommandSearchQuery] = useState("")
  
  // Enhanced AI Configuration with Multiple Providers
  const [aiProvider, setAIProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai')
  const [aiModel, setAIModel] = useState("gpt-4")
  const [temperature, setTemperature] = useState(0.7)
  const [conversationMemory, setConversationMemory] = useState<ChatMessage[]>([])
  
  // Enhanced Features state
  const [voiceEnabled, setVoiceEnabled] = useState(enableVoice)
  const [speechMode, setSpeechMode] = useState<'off' | 'listening' | 'speaking'>('off')
  const [advancedVoiceMode, setAdvancedVoiceMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [autoSuggestions, setAutoSuggestions] = useState(true)
  const [contextAware, setContextAware] = useState(true)
  const [smartInsights, setSmartInsights] = useState(true)
  const [adaptiveResponses, setAdaptiveResponses] = useState(true)
  const [voiceSpeed, setVoiceSpeed] = useState(1.0)
  const [voicePitch, setVoicePitch] = useState(1.0)
  const [continuousListening, setContinuousListening] = useState(false)
  
  // Enhanced Analytics
  const [sessionStats, setSessionStats] = useState({
    messagesExchanged: 0,
    topicsDiscussed: [] as string[],
    helpfulnessScore: 85,
    sessionDuration: 0,
    averageResponseTime: 2.3,
    contextAccuracy: 94,
    learningInsights: 7,
    adaptiveRecommendations: 12
  })
  
  // Real-time learning insights
  const [realtimeInsights, setRealtimeInsights] = useState({
    currentFocus: 'Communication fundamentals',
    strugglingConcept: null as string | null,
    recommendedAction: 'Continue current module',
    confidenceLevel: 87,
    nextOptimalBreak: '12 minutes',
    learningVelocity: 'Above average'
  })
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const voiceRef = useRef<any>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom with smooth animation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  // Initialize with enhanced welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const personality = ASSISTANT_PERSONALITIES[activePersonality]
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: personality.greeting + " " + generateEnhancedWelcome(),
        timestamp: new Date(),
        type: 'encouragement',
        metadata: { 
          confidence: 100,
          contextRelevance: 95,
          responseQuality: 'excellent'
        }
      }
      setMessages([welcomeMessage])
      
      // Add initial insights after welcome
      setTimeout(() => {
        if (context.progress !== undefined) {
          addSmartInsight()
        }
      }, 3000)
    }
  }, [isOpen, activePersonality, context])

  // Enhanced session timer with insights
  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          sessionDuration: prev.sessionDuration + 1
        }))
        
        // Generate insights every 5 minutes
        if (sessionStats.sessionDuration % 300 === 0 && sessionStats.sessionDuration > 0) {
          generateSessionInsight()
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [isOpen, sessionStats.sessionDuration])

  // Enhanced voice recognition setup with advanced features
  useEffect(() => {
    if (voiceEnabled && typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = continuousListening
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 3
      
      recognition.onresult = (event: any) => {
        const results = event.results
        const latest = results[results.length - 1]
        const transcript = latest[0].transcript
        
        setCurrentMessage(transcript)
        
        if (latest.isFinal) {
          if (continuousListening && advancedVoiceMode) {
            // In advanced voice mode, auto-send after pause
            setTimeout(() => {
              if (transcript.trim()) {
                handleSendMessage()
              }
            }, 1000)
          } else {
            setSpeechMode('off')
          }
        }
      }
      
      recognition.onend = () => {
        if (continuousListening && speechMode === 'listening') {
          // Restart recognition for continuous listening
          setTimeout(() => {
            recognition.start()
          }, 100)
        } else {
          setSpeechMode('off')
        }
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setSpeechMode('off')
      }
      
      voiceRef.current = recognition
    }

    // Enhanced speech synthesis setup
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis
      
      // Load available voices
      const loadVoices = () => {
        const voices = speechSynthRef.current?.getVoices() || []
        // Filter for high-quality voices
        const preferredVoices = voices.filter(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.localService)
        )
        return preferredVoices.length > 0 ? preferredVoices : voices
      }
      
      // Set up voice change listener
      if (speechSynthRef.current?.addEventListener) {
        speechSynthRef.current.addEventListener('voiceschanged', loadVoices)
      }
    }
  }, [voiceEnabled, continuousListening, advancedVoiceMode])

  // Advanced voice response with enhanced features
  const speakResponse = (content: string, options: { interrupt?: boolean } = {}) => {
    if (!voiceEnabled || !speechSynthRef.current) return
    
    if (options.interrupt) {
      speechSynthRef.current.cancel()
    }
    
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = voiceSpeed
    utterance.pitch = voicePitch
    utterance.volume = 0.9
    
    // Select best available voice
    const voices = speechSynthRef.current.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    // Add speech event listeners
    utterance.onstart = () => setSpeechMode('speaking')
    utterance.onend = () => {
      setSpeechMode('off')
      if (advancedVoiceMode && continuousListening) {
        // In advanced voice mode, start listening again after speaking
        setTimeout(() => {
          handleVoiceInput()
        }, 500)
      }
    }
    
    speechSynthRef.current.speak(utterance)
  }

  // Advanced voice conversation mode
  const toggleAdvancedVoiceMode = () => {
    if (!advancedVoiceMode) {
      // Entering advanced voice mode
      setAdvancedVoiceMode(true)
      setContinuousListening(true)
      setVoiceEnabled(true)
      
      // Start with a voice greeting
      const greeting = `Advanced voice mode activated. I'm ${ASSISTANT_PERSONALITIES[activePersonality].name}, ready for our conversation. How can I help you today?`
      speakResponse(greeting)
      
      // Start listening after greeting
      setTimeout(() => {
        handleVoiceInput()
      }, 3000)
    } else {
      // Exiting advanced voice mode
      setAdvancedVoiceMode(false)
      setContinuousListening(false)
      setSpeechMode('off')
      speechSynthRef.current?.cancel()
      
      speakResponse("Advanced voice mode deactivated. Switching back to text conversation.")
    }
  }

  // Enhanced context-aware welcome generation
  const generateEnhancedWelcome = (): string => {
    if (!context) return "Ready to optimize your learning experience!"
    
    const welcomes = []
    
    if (context.currentModule) {
      welcomes.push(`I see you're working on "${context.currentModule}". Let's make this session highly effective!`)
    }
    
    if (context.progress && context.progress > 70) {
      welcomes.push(`Impressive progress at ${context.progress}%! You're in the advanced learning zone.`)
    } else if (context.progress && context.progress > 30) {
      welcomes.push(`Great momentum at ${context.progress}% completion. Let's maintain this learning velocity!`)
    }
    
    if (context.currentStreak && context.currentStreak > 5) {
      welcomes.push(`${context.currentStreak} day learning streak! Your consistency is building real expertise.`)
    }
    
    if (context.learningStyle) {
      welcomes.push(`I've optimized my responses for your ${context.learningStyle} learning style.`)
    }
    
    return welcomes.length > 0 ? welcomes[Math.floor(Math.random() * welcomes.length)] : "Ready to accelerate your learning!"
  }

  // Advanced message analysis with intent recognition
  const analyzeMessageAdvanced = (message: string): {
    intent: string
    topics: string[]
    urgency: 'low' | 'medium' | 'high'
    complexity: 'simple' | 'moderate' | 'complex'
    emotion: 'frustrated' | 'motivated' | 'confused' | 'excited' | 'neutral'
    requiresContext: boolean
    suggestedActions: string[]
  } => {
    const lowerMessage = message.toLowerCase()
    
    // Enhanced intent classification
    let intent = 'general'
    if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('confused')) intent = 'help'
    if (lowerMessage.includes('explain') || lowerMessage.includes('understand') || lowerMessage.includes('clarify')) intent = 'explanation'
    if (lowerMessage.includes('motivat') || lowerMessage.includes('encourage') || lowerMessage.includes('confidence')) intent = 'motivation'
    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing') || lowerMessage.includes('performance')) intent = 'progress'
    if (lowerMessage.includes('difficult') || lowerMessage.includes('hard') || lowerMessage.includes('challenging')) intent = 'difficulty'
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('what next')) intent = 'recommendation'
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('assessment')) intent = 'assessment'
    
    // Topic extraction
    const topics = []
    if (lowerMessage.includes('communication')) topics.push('communication')
    if (lowerMessage.includes('leadership')) topics.push('leadership')
    if (lowerMessage.includes('skill') || lowerMessage.includes('ability')) topics.push('skills')
    if (lowerMessage.includes('module') || lowerMessage.includes('lesson')) topics.push('content')
    if (lowerMessage.includes('time') || lowerMessage.includes('schedule')) topics.push('timing')
    
    // Emotion detection
    let emotion: 'frustrated' | 'motivated' | 'confused' | 'excited' | 'neutral' = 'neutral'
    if (lowerMessage.includes('frustrated') || lowerMessage.includes('annoyed') || lowerMessage.includes('stuck')) emotion = 'frustrated'
    if (lowerMessage.includes('excited') || lowerMessage.includes('love') || lowerMessage.includes('amazing')) emotion = 'excited'
    if (lowerMessage.includes('confused') || lowerMessage.includes('lost') || lowerMessage.includes('unclear')) emotion = 'confused'
    if (lowerMessage.includes('motivated') || lowerMessage.includes('ready') || lowerMessage.includes('let\'s go')) emotion = 'motivated'
    
    // Complexity assessment
    const wordCount = message.split(' ').length
    const complexity = wordCount > 20 ? 'complex' : wordCount > 10 ? 'moderate' : 'simple'
    
    // Urgency detection
    let urgency: 'low' | 'medium' | 'high' = 'low'
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately')) urgency = 'high'
    if (lowerMessage.includes('soon') || lowerMessage.includes('quick') || lowerMessage.includes('fast')) urgency = 'medium'
    
    // Suggested actions based on analysis
    const suggestedActions = []
    if (intent === 'help') suggestedActions.push('provide_step_by_step_guidance', 'offer_alternative_explanation')
    if (intent === 'motivation') suggestedActions.push('highlight_progress', 'set_micro_goals', 'celebrate_achievements')
    if (emotion === 'frustrated') suggestedActions.push('acknowledge_difficulty', 'break_down_concept', 'suggest_break')
    if (topics.includes('timing')) suggestedActions.push('optimize_schedule', 'suggest_study_rhythm')
    
    const requiresContext = topics.length > 0 || intent !== 'general' || emotion !== 'neutral'
    
    return { intent, topics, urgency, complexity, emotion, requiresContext, suggestedActions }
  }

  // Enhanced OpenAI integration with advanced prompting
  const callEnhancedAI = async (message: string, analysis: any): Promise<string> => {
    const personality = ASSISTANT_PERSONALITIES[activePersonality]
    
    // Build conversation context from recent messages
    const recentMessages = conversationMemory.slice(-8).map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    // Advanced system prompt with comprehensive functionality
    const systemPrompt = `You are ${personality.name}, an advanced AI learning assistant with sophisticated capabilities:

PERSONALITY & STYLE:
- Name: ${personality.name}
- Style: ${personality.responseStyle}
- Expertise: ${personality.expertise.join(', ')}
- Approach: ${personality.promptModifier}

CURRENT LEARNING CONTEXT:
- Current Module: ${context.currentModule || 'None'}
- Progress: ${context.progress || 0}%
- Learning Style: ${context.learningStyle || 'Unknown'}
- Session Duration: ${context.sessionDuration || 0} minutes
- Focus Score: ${context.focusScore || 'Unknown'}%
- Strong Areas: ${context.strongAreas?.join(', ') || 'None identified'}
- Weak Areas: ${context.weakAreas?.join(', ') || 'None identified'}
- Struggling Topics: ${context.strugglingTopics?.join(', ') || 'None'}
- Completed Modules: ${context.completedModules?.join(', ') || 'None'}
- Current Streak: ${context.currentStreak || 0} days
- Total Learning Hours: ${context.totalHours || 0}
- Average Score: ${context.averageScore || 'Unknown'}%

USER MESSAGE ANALYSIS:
- Intent: ${analysis.intent}
- Emotional State: ${analysis.emotion}
- Urgency Level: ${analysis.urgency}
- Complexity: ${analysis.complexity}
- Topics: ${analysis.topics.join(', ')}
- Suggested Actions: ${analysis.suggestedActions.join(', ')}

ADVANCED CAPABILITIES TO USE:
1. PERSONALIZED LEARNING ANALYSIS:
   - Analyze learning patterns from context data
   - Identify knowledge gaps and suggest specific improvements
   - Predict optimal learning paths based on progress and style
   - Recommend personalized study schedules

2. ADAPTIVE CONTENT GENERATION:
   - Create custom explanations based on learning style
   - Generate practice questions tailored to weak areas
   - Suggest real-world applications of concepts
   - Provide step-by-step breakdowns for complex topics

3. MOTIVATIONAL PSYCHOLOGY:
   - Use specific progress data to encourage continuation
   - Address emotional states with appropriate responses
   - Set micro-goals based on current performance
   - Celebrate achievements with context-aware recognition

4. INTELLIGENT RECOMMENDATIONS:
   - Suggest optimal study times based on focus patterns
   - Recommend difficulty adjustments based on performance
   - Propose supplementary resources for struggling topics
   - Advise on learning technique improvements

5. PREDICTIVE INSIGHTS:
   - Estimate time to complete current module
   - Predict potential roadblocks based on patterns
   - Suggest preventive measures for common struggles
   - Forecast skill development trajectory

6. CONTEXTUAL PROBLEM SOLVING:
   - Break down complex problems into manageable steps
   - Provide multiple solution approaches
   - Offer alternative explanations when confused
   - Connect new concepts to previously mastered material

RESPONSE REQUIREMENTS:
- Maximum 200 words for conversational responses
- Use specific data points from context when available
- Include actionable advice or next steps
- Match the emotional tone appropriately
- Reference user's specific learning journey
- Provide concrete examples when helpful
- Ask clarifying questions when needed

RESPONSE FORMAT:
- Start with acknowledgment of user's emotional state if relevant
- Provide main response with specific context references
- Include 1-2 actionable suggestions
- End with encouraging note tied to their progress

Remember: You have access to detailed learning analytics. Use this data to provide highly personalized, contextually relevant responses that feel like they come from someone who truly understands the user's learning journey.`

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: aiProvider,
          model: aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...recentMessages,
            { role: 'user', content: message }
          ],
          temperature: temperature,
          max_tokens: 300,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.response || data.choices?.[0]?.message?.content || data.content

    } catch (error) {
      console.error(`${aiProvider} Error:`, error)
      throw error
    }
  }

  // Enhanced simulated response with context awareness
  const generateEnhancedResponse = (
    message: string, 
    analysis: any, 
    personality: AssistantPersonality
  ): { content: string; type: ChatMessage['type']; confidence: number; suggestions?: string[] } => {
    
    // Select response based on intent and context
    let responseTemplate = ""
    let suggestions: string[] = []
    
    switch (analysis.intent) {
      case 'help':
        responseTemplate = `I understand you need help with this concept. Based on your ${context.learningStyle || 'learning'} style and ${context.progress || 0}% progress, let me break this down specifically for you. ${
          context.weakAreas?.includes(analysis.topics[0]) 
            ? "I notice this is one of your growth areas, so let's approach it systematically." 
            : "You have strong foundations, so we can build on what you already know."
        }`
        suggestions = [
          "Show me a step-by-step breakdown",
          "Give me a practical example",
          "What are the key concepts I should focus on?"
        ]
        break
        
      case 'motivation':
        if (context.progress && context.progress > 60) {
          responseTemplate = `You're doing exceptionally well! At ${context.progress}% completion, you're ahead of 78% of learners at this stage. Your ${context.currentStreak || 'consistent'} approach is building real expertise. ${
            analysis.emotion === 'frustrated' 
              ? "I can sense some frustration, but remember - challenge is where growth happens!" 
              : "Keep this momentum going!"
          }`
        } else {
          responseTemplate = `Every expert was once a beginner, and you're making solid progress! Your focus on ${context.currentModule || 'this material'} shows commitment. ${
            context.strongAreas?.length 
              ? `Your strengths in ${context.strongAreas[0]} will definitely help you here.` 
              : "You're developing valuable skills with each session."
          }`
        }
        suggestions = [
          "Set a micro-goal for today",
          "Show me my recent achievements",
          "What's my next milestone?"
        ]
        break
        
      case 'progress':
        responseTemplate = `Your learning analytics look great! You're at ${context.progress || 0}% with a ${context.focusScore || 85}% focus score. ${
          context.sessionDuration && context.sessionDuration > 30 
            ? `Your ${context.sessionDuration} minute session today shows excellent dedication.` 
            : "Your learning consistency is building strong neural pathways."
        } ${
          context.averageScore && context.averageScore > 80 
            ? "Your high comprehension scores indicate you're mastering the material effectively." 
            : "Focus on understanding over speed - you're building lasting knowledge."
        }`
        suggestions = [
          "What should I focus on next?",
          "How can I improve my weak areas?",
          "Show me my learning trends"
        ]
        break
        
      case 'difficulty':
        responseTemplate = `I understand this feels challenging. Looking at your data, ${
          context.learningStyle === 'visual' 
            ? "visual learners often benefit from diagrams and flowcharts for complex concepts." 
            : context.learningStyle === 'kinesthetic'
            ? "hands-on practice might help you grasp this better."
            : "breaking complex ideas into smaller chunks usually helps."
        } Your previous success with ${context.strongAreas?.[0] || 'foundational concepts'} shows you have the capability. ${
          analysis.emotion === 'frustrated' 
            ? "Take a 10-minute break, then try a different approach." 
            : "Let's tackle this step by step."
        }`
        suggestions = [
          "Break this into smaller steps",
          "Show me a different approach",
          "Give me additional practice exercises"
        ]
        break
        
      default:
        responseTemplate = `Thanks for reaching out! Based on your current focus on ${context.currentModule || 'learning'} and your ${context.learningStyle || 'unique'} learning approach, I'm here to help optimize your experience. ${
          context.focusScore && context.focusScore > 85 
            ? "Your high focus score shows you're in a great learning state!" 
            : "Let's make this session as effective as possible."
        }`
        suggestions = [
          "Help me with my current topic",
          "Motivate me to keep going",
          "Show me my progress insights"
        ]
    }
    
    // Add personality flavor
    if (personality.style === 'motivational') {
      responseTemplate += " 🚀 You've got this!"
    } else if (personality.style === 'analytical') {
      responseTemplate += " Let's use data to optimize your learning path."
    }
    
    return {
      content: responseTemplate,
      type: analysis.intent === 'motivation' ? 'encouragement' : 'text',
      confidence: 85 + Math.random() * 10,
      suggestions
    }
  }

  // Main AI response generation with enhanced logic
  const generateAIResponse = async (userMessage: string): Promise<ChatMessage> => {
    const analysis = analyzeMessageAdvanced(userMessage)
    const personality = ASSISTANT_PERSONALITIES[activePersonality]
    
    setIsThinking(true)
    const thinkingStartTime = Date.now()
    
    // Simulate realistic AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800))
    
    let response: { content: string; type: ChatMessage['type']; confidence: number; suggestions?: string[] }
    
    // Try enhanced AI first (OpenAI/Anthropic/Gemini)
    try {
      const aiResponse = await callEnhancedAI(userMessage, analysis)
      response = {
        content: aiResponse,
        type: analysis.intent === 'motivation' ? 'encouragement' : 'text',
        confidence: 96,
        suggestions: analysis.suggestedActions.map(action => 
          action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        ).slice(0, 3)
      }
    } catch (error) {
      console.error(`AI Provider (${aiProvider}) Error, falling back to enhanced simulation:`, error)
      response = generateEnhancedResponse(userMessage, analysis, personality)
    }
    
    setIsThinking(false)
    const thinkingTime = Date.now() - thinkingStartTime
    
    // Update conversation memory
    setConversationMemory(prev => [...prev.slice(-12), {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])
    
    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      type: response.type,
      metadata: {
        confidence: response.confidence,
        suggestions: response.suggestions,
        aiThinkingTime: thinkingTime,
        responseQuality: response.confidence > 90 ? 'excellent' : response.confidence > 80 ? 'good' : 'average',
        contextRelevance: analysis.requiresContext ? 95 : 80,
        provider: aiProvider,
        ...analysis
      }
    }
  }

  // Enhanced smart insight generation
  const addSmartInsight = () => {
    if (!smartInsights) return
    
    const insights = [
      `📊 Learning Velocity: You're processing new concepts 23% faster than last week. Your neural efficiency is improving!`,
      `🎯 Focus Pattern: Your concentration peaks around ${new Date().getHours()}:00. Consider scheduling complex topics during these hours.`,
      `⚡ Breakthrough Alert: You're 73% through this difficulty curve. Most learners see a comprehension jump right about here!`,
      `🧠 Cognitive Load: Your current session has optimal cognitive load. This is the sweet spot for deep learning.`,
      `📈 Progress Prediction: At your current pace, you'll complete this path 4 days ahead of schedule. Exceptional work!`
    ]
    
    const insight = insights[Math.floor(Math.random() * insights.length)]
    
    const insightMessage: ChatMessage = {
      id: `insight-${Date.now()}`,
      role: 'assistant',
      content: insight,
      timestamp: new Date(),
      type: 'insight',
      metadata: {
        confidence: 92,
        responseQuality: 'excellent',
        contextRelevance: 98
      }
    }
    
    setMessages(prev => [...prev, insightMessage])
    setSessionStats(prev => ({ ...prev, learningInsights: prev.learningInsights + 1 }))
  }

  // Generate session insights based on activity
  const generateSessionInsight = () => {
    const sessionMinutes = sessionStats.sessionDuration / 60
    if (sessionMinutes > 45) {
      const insight: ChatMessage = {
        id: `session-insight-${Date.now()}`,
        role: 'assistant',
        content: `🕒 Optimal Break Time: You've been learning for ${Math.round(sessionMinutes)} minutes. Research shows a 10-15 minute break now will improve retention by up to 20%. Your brain will consolidate what you've learned!`,
        timestamp: new Date(),
        type: 'suggestion',
        metadata: { confidence: 94, contextRelevance: 100 }
      }
      setMessages(prev => [...prev, insight])
    }
  }

  // Command menu handlers
  const handleCommandSelect = (command: any) => {
    if (command.href) {
      router.push(command.href)
    } else if (command.action) {
      command.action()
    } else {
      // Handle AI-specific commands
      if (command.id === 'ai-learning-plan') {
        setCurrentMessage("Create a personalized learning plan for me based on my current skills and goals")
        setShowCommandMenu(false)
      } else if (command.id === 'ai-skill-analysis') {
        setCurrentMessage("Analyze my current skills and provide recommendations for improvement")
        setShowCommandMenu(false)
      } else if (command.id === 'voice-mode') {
        setVoiceEnabled(!voiceEnabled)
        setShowCommandMenu(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setCurrentMessage(value)
    
    // Check for slash command
    if (value === '/') {
      console.log('Slash detected, opening command menu')
      setShowCommandMenu(true)
      setCommandSearchQuery('')
    } else if (value.startsWith('/') && showCommandMenu) {
      setCommandSearchQuery(value.slice(1))
    } else if (!value.startsWith('/') && showCommandMenu) {
      console.log('Closing command menu')
      setShowCommandMenu(false)
      setCommandSearchQuery('')
    }
  }

  // Enhanced message sending with improved analytics
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    // Don't send slash commands as messages
    if (currentMessage.startsWith('/')) {
      setCurrentMessage("")
      setShowCommandMenu(false)
      setCommandSearchQuery('')
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
      metadata: {
        moduleContext: context.currentModule,
        progressContext: context.progress
      }
    }

    setMessages(prev => [...prev, userMessage])
    const userMessageText = currentMessage
    setCurrentMessage("")

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      messagesExchanged: prev.messagesExchanged + 1,
      averageResponseTime: (prev.averageResponseTime * prev.messagesExchanged + 2.3) / (prev.messagesExchanged + 1)
    }))

    try {
      // Start streaming AI response - no placeholder, just empty message
      const assistantMsgId = `ai-${Date.now()}`
      let fullContent = ''
      
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streamed: true,
      }])

      await sendChat(userMessageText, undefined, {
        stream: true,
        assistant: true,
        onChunk: (chunk) => {
          fullContent += chunk
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId 
              ? { ...m, content: fullContent }
              : m
          ))
        },
      })

      // Get final message for further processing
      const finalMsg = {
        id: assistantMsgId,
        role: 'assistant' as const,
        content: fullContent,
        timestamp: new Date(),
        streamed: true,
      }
      
      // Add to conversation memory
      setConversationMemory(prev => [...prev.slice(-12), finalMsg])
      
      // Enhanced text-to-speech with voice mode awareness
      if (voiceEnabled && speechMode !== 'off') {
        speakResponse(finalMsg.content, { interrupt: false })
      }
      
      // Trigger adaptive recommendations
      if (adaptiveResponses && Math.random() > 0.7) {
        setTimeout(() => {
          setSessionStats(prev => ({ ...prev, adaptiveRecommendations: prev.adaptiveRecommendations + 1 }))
        }, 2000)
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm experiencing some technical difficulties, but I'm still here to help! Try rephrasing your question, and I'll do my best to assist you.",
        timestamp: new Date(),
        type: 'text',
        metadata: { confidence: 0 }
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Enhanced voice input handling
  const handleVoiceInput = () => {
    if (speechMode === 'listening') {
      voiceRef.current?.stop()
      setSpeechMode('off')
    } else if (voiceRef.current) {
      voiceRef.current.start()
      setSpeechMode('listening')
    }
  }

  // Enhanced message feedback with learning
  const handleMessageFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ))
    
    // Enhanced helpfulness score calculation
    setSessionStats(prev => ({
      ...prev,
      helpfulnessScore: feedback === 'positive' ? 
        Math.min(prev.helpfulnessScore + 8, 100) : 
        Math.max(prev.helpfulnessScore - 3, 0),
      contextAccuracy: feedback === 'positive' ? 
        Math.min(prev.contextAccuracy + 2, 100) :
        Math.max(prev.contextAccuracy - 1, 0)
    }))
  }

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    const quickMessages = {
      help: "I need help understanding this concept better. Can you break it down for me?",
      motivation: "I could use some motivation right now. Help me stay focused on my goals!",
      progress: "How am I doing with my learning progress? What should I focus on next?",
      insight: "Give me a learning insight based on my current performance and patterns.",
      break: "Should I take a break? How long have I been studying?",
      optimize: "How can I optimize my learning for better results?"
    }
    
    setCurrentMessage(quickMessages[action as keyof typeof quickMessages] || action)
  }

  // Clear chat with analytics reset
  const clearChat = () => {
    setMessages([])
    setConversationMemory([])
    setSessionStats({
      messagesExchanged: 0,
      topicsDiscussed: [],
      helpfulnessScore: 85,
      sessionDuration: 0,
      averageResponseTime: 2.3,
      contextAccuracy: 94,
      learningInsights: 0,
      adaptiveRecommendations: 0
    })
  }

  // Utility functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  }

  // Enhanced responsive size classes with better height management
  const getSizeClasses = () => {
    // Use viewport height for better scaling
    const baseHeight = "h-[min(85vh,40rem)] max-h-[85vh]"
    const compactHeight = "h-[min(70vh,32rem)] max-h-[70vh]"
    const expandedHeight = "h-[min(90vh,48rem)] max-h-[90vh]"
    
    if (isExpanded) {
      return `w-[calc(100vw-1rem)] max-w-[95vw] sm:max-w-[32rem] lg:max-w-[36rem] xl:max-w-[40rem] 2xl:max-w-[44rem] ${expandedHeight}`
    }
    
    switch (size) {
      case 'compact':
        return `w-80 sm:w-84 lg:w-88 xl:w-92 ${compactHeight}`
      case 'expanded':
        return `w-[calc(100vw-1rem)] max-w-[95vw] sm:max-w-[32rem] lg:max-w-[36rem] xl:max-w-[40rem] 2xl:max-w-[44rem] ${expandedHeight}`
      default:
        return `w-96 sm:w-[26rem] lg:w-[28rem] xl:w-[32rem] 2xl:w-[36rem] ${baseHeight}`
    }
  }

  const positionClasses = position === 'fixed' ? 
    'fixed right-2 sm:right-4 lg:right-6 top-2 sm:top-4 lg:top-6 z-50' : 
    'relative'

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`${positionClasses} ${getSizeClasses()} ${className}`}
          style={{ maxHeight: '100vh' }}
        >
          <Card className="h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-gradient-to-r from-purple-500/30 to-cyan-500/30 shadow-2xl flex flex-col overflow-hidden mx-2 sm:mx-0">
            {/* Enhanced Header */}
            <CardHeader className="py-3 sm:py-4 border-b border-slate-600/50 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-cyan-900/40 backdrop-blur-sm shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-base sm:text-lg relative shrink-0"
                    animate={{ 
                      boxShadow: isThinking ? "0 0 20px rgba(147, 51, 234, 0.5)" : "0 0 10px rgba(147, 51, 234, 0.2)" 
                    }}
                  >
                    {ASSISTANT_PERSONALITIES[activePersonality].avatar}
                    {isThinking && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-cyan-400"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-white text-base sm:text-lg font-bold flex items-center flex-wrap gap-1 sm:gap-2">
                      <span className="truncate">{ASSISTANT_PERSONALITIES[activePersonality].name}</span>
                      <Badge className="bg-green-500/20 text-green-400 text-xs shrink-0">
                        {aiProvider === 'openai' ? '🤖 OpenAI' : 
                         aiProvider === 'anthropic' ? '🧠 Claude' : 
                         '✨ Gemini'}
                      </Badge>
                      {advancedVoiceMode && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs animate-pulse shrink-0">
                          Voice Chat
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                      <span className="text-green-400 text-xs font-medium">
                        {isThinking ? 'Analyzing...' : 'Online'}
                      </span>
                      {sessionStats.contextAccuracy > 90 && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs shrink-0">
                          {sessionStats.contextAccuracy}% Accuracy
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 shrink-0">
                  {/* Enhanced Stats - Responsive */}
                  <div className="hidden sm:flex items-center space-x-2 mr-2">
                    {sessionStats.messagesExchanged > 0 && (
                      <Badge variant="outline" className="text-xs bg-slate-800/50">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {sessionStats.messagesExchanged}
                      </Badge>
                    )}
                    {sessionStats.learningInsights > 0 && (
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {sessionStats.learningInsights}
                      </Badge>
                    )}
                    {sessionStats.helpfulnessScore > 90 && (
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400">
                        <Heart className="w-3 h-3 mr-1" />
                        {sessionStats.helpfulnessScore}%
                      </Badge>
                    )}
                  </div>
                  
                  {/* Control Buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-gray-400 hover:text-white h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-white h-8 w-8 p-0"
                  >
                    {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Settings Panel - Responsive */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-4 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                  >
                    {/* Personality Selector - Responsive Grid */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block font-medium">
                        AI Personality
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ASSISTANT_PERSONALITIES.map((personality, index) => (
                          <Button
                            key={index}
                            variant={activePersonality === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActivePersonality(index)}
                            className="text-xs flex items-center justify-start p-2 h-auto"
                          >
                            <span className="mr-2 shrink-0">{personality.avatar}</span>
                            <div className="text-left min-w-0">
                              <div className="font-medium truncate">{personality.name}</div>
                              <div className="text-[10px] opacity-70 capitalize truncate">{personality.style}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Feature Toggles - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voiceEnabled}
                          onChange={(e) => setVoiceEnabled(e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700 shrink-0"
                        />
                        <span className="text-gray-300">Voice Input</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contextAware}
                          onChange={(e) => setContextAware(e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700 shrink-0"
                        />
                        <span className="text-gray-300">Context Aware</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smartInsights}
                          onChange={(e) => setSmartInsights(e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700 shrink-0"
                        />
                        <span className="text-gray-300">Smart Insights</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adaptiveResponses}
                          onChange={(e) => setAdaptiveResponses(e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700 shrink-0"
                        />
                        <span className="text-gray-300">Adaptive Mode</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={continuousListening}
                          onChange={(e) => setContinuousListening(e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700 shrink-0"
                        />
                        <span className="text-gray-300">Continuous Voice</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={advancedVoiceMode}
                          onChange={(e) => setAdvancedVoiceMode(e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700 shrink-0"
                        />
                        <span className="text-gray-300">Voice Chat</span>
                      </label>
                    </div>

                    {/* AI Provider Selection - Responsive */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block font-medium">
                        AI Provider
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'openai', name: 'OpenAI', icon: '🤖', models: ['gpt-4', 'gpt-3.5-turbo'] },
                          { key: 'anthropic', name: 'Claude', icon: '🧠', models: ['claude-3-sonnet', 'claude-3-haiku'] },
                          { key: 'gemini', name: 'Gemini', icon: '✨', models: ['gemini-pro', 'gemini-pro-vision'] }
                        ].map((provider) => (
                          <Button
                            key={provider.key}
                            variant={aiProvider === provider.key ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setAIProvider(provider.key as 'openai' | 'anthropic' | 'gemini')
                              setAIModel(provider.models[0])
                            }}
                            className="text-xs flex flex-col items-center justify-center p-2 h-12"
                          >
                            <span className="text-sm">{provider.icon}</span>
                            <span className="text-[10px] mt-1 truncate">{provider.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Model Selection - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block font-medium">
                          Model
                        </label>
                        <select
                          value={aiModel}
                          onChange={(e) => setAIModel(e.target.value)}
                          className="w-full text-xs bg-slate-700 border-slate-600 text-white rounded px-2 py-1"
                        >
                          {aiProvider === 'openai' && (
                            <>
                              <option value="gpt-4">GPT-4 (Recommended)</option>
                              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </>
                          )}
                          {aiProvider === 'anthropic' && (
                            <>
                              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                              <option value="claude-3-haiku">Claude 3 Haiku</option>
                            </>
                          )}
                          {aiProvider === 'gemini' && (
                            <>
                              <option value="gemini-pro">Gemini Pro</option>
                              <option value="gemini-pro-vision">Gemini Pro Vision</option>
                            </>
                          )}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block font-medium">
                          Creativity
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 w-8">{temperature}</span>
                        </div>
                      </div>
                    </div>

                    {/* Voice Settings - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block font-medium">
                          Voice Speed
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={voiceSpeed}
                            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 w-8">{voiceSpeed}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block font-medium">
                          Voice Pitch
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={voicePitch}
                            onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 w-8">{voicePitch}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>

            {/* Enhanced Chat Messages - Responsive */}
            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 min-h-0">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[80%] lg:max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' 
                      : message.type === 'encouragement'
                      ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500/30 text-green-100'
                      : message.type === 'insight'
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 text-purple-100'
                      : message.type === 'suggestion'
                      ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-500/30 text-amber-100'
                      : 'bg-gradient-to-r from-slate-700 to-slate-600 text-gray-100'
                  } p-3 sm:p-4 rounded-2xl shadow-lg backdrop-blur-sm`}>
                    
                    {/* Enhanced Message Header - Responsive */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Bot className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-medium opacity-80 truncate">
                            {ASSISTANT_PERSONALITIES[activePersonality].name}
                          </span>
                          {message.type && (
                            <Badge className={`text-[10px] shrink-0 ${
                              message.type === 'insight' ? 'bg-purple-500/20 text-purple-300' :
                              message.type === 'encouragement' ? 'bg-green-500/20 text-green-300' :
                              message.type === 'suggestion' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {message.type === 'insight' ? '💡 Insight' :
                               message.type === 'encouragement' ? '🚀 Motivation' :
                               message.type === 'suggestion' ? '💭 Suggestion' : 'Response'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          {message.metadata?.confidence && (
                            <Badge variant="outline" className="text-[10px] bg-slate-800/50">
                              {message.metadata.confidence}%
                            </Badge>
                          )}
                          {message.metadata?.aiThinkingTime && (
                            <Badge variant="outline" className="text-[10px] bg-slate-800/50 hidden sm:flex">
                              <Timer className="w-2 h-2 mr-1" />
                              {formatDuration(message.metadata.aiThinkingTime)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="text-sm leading-relaxed mb-2 sm:mb-3">
                      <MessageContent 
                        content={message.content}
                        className="text-sm"
                      />
                    </div>

                    {/* Enhanced Suggestions - Responsive */}
                    {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs opacity-70 mb-2">💡 Try asking:</div>
                        <div className="grid grid-cols-1 gap-2">
                          {message.metadata.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentMessage(suggestion)}
                              className="text-xs w-full justify-start h-auto py-2 px-3 border-opacity-30 hover:border-opacity-60 transition-all"
                            >
                              <span className="mr-2 shrink-0">›</span>
                              <span className="truncate">{suggestion}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Message Footer - Responsive */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-600/20">
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMessageFeedback(message.id, 'positive')}
                            className={`p-1 h-auto hover:scale-110 transition-transform ${
                              message.feedback === 'positive' ? 'text-green-400' : 'text-gray-400 hover:text-green-400'
                            }`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMessageFeedback(message.id, 'negative')}
                            className={`p-1 h-auto hover:scale-110 transition-transform ${
                              message.feedback === 'negative' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                            }`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="p-1 h-auto text-gray-400 hover:text-blue-400 hover:scale-110 transition-transform"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Enhanced Thinking Indicator - Responsive */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/30 p-3 sm:p-4 rounded-2xl flex items-center space-x-3 max-w-[85%] sm:max-w-[80%] lg:max-w-[85%] backdrop-blur-sm">
                    <div className="relative shrink-0">
                      <Brain className="h-5 w-5 text-purple-400" />
                      <motion.div
                        className="absolute -inset-1 rounded-full border border-purple-400/50"
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-purple-100 font-medium">
                        {ASSISTANT_PERSONALITIES[activePersonality].name} is analyzing...
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-purple-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Typing Indicator - Responsive */}
              {isTyping && !isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-700/80 p-3 rounded-2xl flex items-center space-x-3 max-w-[85%] sm:max-w-[80%] lg:max-w-[85%] backdrop-blur-sm">
                    <Bot className="h-4 w-4 text-cyan-400 shrink-0" />
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">Processing...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={chatEndRef} />
            </CardContent>

            {/* Enhanced Input Area - Responsive */}
            <div className="p-3 sm:p-4 border-t border-slate-600/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm shrink-0">
              {/* Enhanced Quick Actions - Responsive */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex space-x-1 flex-wrap gap-1">
                  {[
                    { key: 'help', icon: '❓', label: 'Help' },
                    { key: 'motivation', icon: '💪', label: 'Motivate' },
                    { key: 'progress', icon: '📊', label: 'Progress' },
                    { key: 'insight', icon: '💡', label: 'Insight' }
                  ].map((action) => (
                    <Button
                      key={action.key}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction(action.key)}
                      className="text-gray-400 hover:text-white text-xs h-8 px-2 hover:bg-slate-700/50 shrink-0"
                    >
                      <span className="mr-1">{action.icon}</span>
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  ))}
                  
                  {/* Advanced Voice Mode Toggle */}
                  <Button
                    variant={advancedVoiceMode ? "default" : "ghost"}
                    size="sm"
                    onClick={toggleAdvancedVoiceMode}
                    className={`text-xs h-8 px-2 shrink-0 ${
                      advancedVoiceMode 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="mr-1">🎤</span>
                    <span className="hidden sm:inline">{advancedVoiceMode ? 'Voice Chat' : 'Voice Mode'}</span>
                  </Button>
                </div>
                
                {/* Enhanced Session Info - Responsive */}
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  {advancedVoiceMode && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse">
                      <span className="hidden sm:inline">Voice Chat Active</span>
                      <span className="sm:hidden">Voice</span>
                    </Badge>
                  )}
                  <div className="hidden sm:flex items-center space-x-2">
                    {sessionStats.sessionDuration > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(sessionStats.sessionDuration)}</span>
                      </div>
                    )}
                    {sessionStats.helpfulnessScore > 0 && (
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-red-400" />
                        <span>{sessionStats.helpfulnessScore}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Message Input - Responsive */}
              <div className="flex items-end space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={messageInputRef}
                    value={currentMessage}
                    onChange={handleInputChange}
                    placeholder={`Ask ${ASSISTANT_PERSONALITIES[activePersonality].name} anything about your learning... (Type "/" for commands)`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className={`bg-white border-gray-300 text-gray-900 resize-none h-10 sm:h-12 pr-12 text-sm rounded-xl ${
                      showCommandMenu ? 'border-blue-500 ring-2 ring-blue-200' : ''
                    }`}
                    disabled={false}
                    rows={1}
                  />
                  
                  {/* Enhanced Voice Input - Responsive */}
                  {voiceEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoiceInput}
                      className={`absolute right-2 top-1 sm:top-2 h-8 w-8 p-0 ${
                        speechMode === 'listening' 
                          ? 'text-red-400 animate-pulse' 
                          : speechMode === 'speaking'
                          ? 'text-blue-400 animate-bounce'
                          : advancedVoiceMode
                          ? 'text-purple-400 hover:text-purple-300'
                          : 'text-gray-400 hover:text-cyan-400'
                      }`}
                    >
                      {speechMode === 'listening' ? (
                        <motion.div 
                          animate={{ scale: [1, 1.3, 1] }} 
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          <div className="relative">
                            <MicOff className="h-4 w-4" />
                            <motion.div
                              className="absolute -inset-1 rounded-full border border-red-400/50"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </div>
                        </motion.div>
                      ) : speechMode === 'speaking' ? (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Volume2 className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <div className="relative">
                          <Mic className="h-4 w-4" />
                          {advancedVoiceMode && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                          )}
                          {continuousListening && (
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                          )}
                        </div>
                      )}
                    </Button>
                  )}
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 h-10 w-10 sm:h-12 sm:w-12 p-0 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
                
                {/* Debug button - remove this later */}
                <Button
                  onClick={() => {
                    console.log('Manual command menu trigger, current state:', showCommandMenu)
                    setShowCommandMenu(!showCommandMenu)
                  }}
                  size="sm"
                  variant="outline"
                  className={`h-10 w-10 sm:h-12 sm:w-12 p-0 shrink-0 ${
                    showCommandMenu ? 'bg-blue-100 border-blue-500' : ''
                  }`}
                >
                  /
                </Button>
              </div>

              {/* Debug info - remove this later */}
              {showCommandMenu && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-2">
                  Command menu is open! Search query: "{commandSearchQuery}"
                </div>
              )}

              {/* Enhanced Action Buttons - Responsive */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-gray-400 hover:text-white h-8 px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addSmartInsight}
                    className="text-gray-400 hover:text-purple-400 h-8 px-2"
                    disabled={!smartInsights}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Insight</span>
                  </Button>
                </div>
                
                {/* Enhanced Context Indicator - Responsive */}
                {contextAware && context.currentModule && (
                  <div className="flex items-center space-x-1 sm:space-x-2 overflow-hidden">
                    <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600 max-w-[100px] sm:max-w-none">
                      <BookOpen className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{context.currentModule}</span>
                    </Badge>
                    {context.progress !== undefined && (
                      <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600 shrink-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {context.progress}%
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* Command Menu - Outside AnimatePresence to avoid conflicts */}
      <CommandMenu
        isOpen={showCommandMenu}
        onClose={() => {
          setShowCommandMenu(false)
          setCommandSearchQuery('')
          setCurrentMessage('')
        }}
        onSelect={handleCommandSelect}
        searchQuery={commandSearchQuery}
      />
    </>
  )
}