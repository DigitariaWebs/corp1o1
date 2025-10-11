"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Layout,
  Target,
  BookOpen,
  Award,
  Code,
  FileCheck,
  BarChart3,
  Store,
  Users,
  Building,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  Settings,
  HelpCircle,
  ChevronRight,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Globe,
  Shield,
  Activity,
  Briefcase,
  MapPin,
  Calendar,
  Edit,
  Coffee,
  AlertCircle,
  Info,
  Play,
  Pause,
  MoreHorizontal,
  Cpu,
  Timer,
  Flame,
  Mic,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  Heart,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/contexts/auth-context"

interface CommandItem {
  id: string
  label: string
  description: string
  icon: any
  href?: string
  action?: () => void
  category: 'navigation' | 'assessment' | 'ai' | 'quick'
  keywords: string[]
  badge?: string
  isNew?: boolean
  isPopular?: boolean
}

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: CommandItem) => void
  searchQuery?: string
  className?: string
}

export function CommandMenu({ 
  isOpen, 
  onClose, 
  onSelect, 
  searchQuery = "",
  className = "" 
}: CommandMenuProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Define all available commands
  const allCommands: CommandItem[] = [
    // Navigation Commands
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'View your learning dashboard and progress',
      icon: Layout,
      href: user?.role === "admin" ? "/admin" : user?.role === "enterprise" ? "/enterprise" : "/main",
      category: 'navigation',
      keywords: ['dashboard', 'home', 'main', 'overview', 'progress'],
      isPopular: true
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      description: 'Chat with our AI learning assistant',
      icon: Brain,
      href: '/ai-assistant',
      category: 'navigation',
      keywords: ['ai', 'assistant', 'chat', 'help', 'support', 'aria'],
      isPopular: true
    },
    {
      id: 'learning',
      label: 'Learning Paths',
      description: 'Explore available learning paths and modules',
      icon: BookOpen,
      href: '/learning',
      category: 'navigation',
      keywords: ['learning', 'paths', 'modules', 'courses', 'education'],
      isPopular: true
    },
    {
      id: 'skills',
      label: 'Skills Assessment',
      description: 'Test and improve your skills',
      icon: Target,
      href: '/skills',
      category: 'navigation',
      keywords: ['skills', 'assessment', 'test', 'evaluation', 'competencies']
    },
    {
      id: 'assessments',
      label: 'My Assessments',
      description: 'View and manage your assessments',
      icon: FileCheck,
      href: '/assessments',
      category: 'navigation',
      keywords: ['assessments', 'tests', 'evaluations', 'results', 'scores']
    },
    {
      id: 'certificates',
      label: 'Certificates',
      description: 'View your earned certificates and achievements',
      icon: Award,
      href: '/certificates',
      category: 'navigation',
      keywords: ['certificates', 'achievements', 'badges', 'credentials', 'awards']
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      description: 'Manage your professional portfolio',
      icon: Code,
      href: '/portfolio',
      category: 'navigation',
      keywords: ['portfolio', 'projects', 'github', 'behance', 'linkedin', 'work']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View detailed learning analytics and insights',
      icon: BarChart3,
      href: '/analytics',
      category: 'navigation',
      keywords: ['analytics', 'stats', 'insights', 'progress', 'performance', 'data']
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      description: 'Discover talents and opportunities',
      icon: Store,
      href: '/marketplace',
      category: 'navigation',
      keywords: ['marketplace', 'jobs', 'opportunities', 'talents', 'careers']
    },

    // Assessment Creation Commands
    {
      id: 'create-assessment',
      label: 'Create Custom Assessment',
      description: 'Create a personalized assessment for your skills',
      icon: Plus,
      action: () => {
        router.push('/assessments/new')
        onClose()
      },
      category: 'assessment',
      keywords: ['create', 'custom', 'assessment', 'test', 'new', 'build', 'make'],
      badge: 'New',
      isNew: true
    },
    {
      id: 'quick-assessment',
      label: 'Quick Skill Check',
      description: 'Take a quick 5-minute skill assessment',
      icon: Zap,
      action: () => {
        router.push('/assessments/quick')
        onClose()
      },
      category: 'assessment',
      keywords: ['quick', 'fast', 'skill', 'check', 'rapid', 'instant'],
      badge: '5 min'
    },
    {
      id: 'ai-assessment',
      label: 'AI-Generated Assessment',
      description: 'Let AI create a personalized assessment for you',
      icon: Sparkles,
      action: () => {
        router.push('/assessments/ai-generate')
        onClose()
      },
      category: 'assessment',
      keywords: ['ai', 'generated', 'personalized', 'smart', 'automatic'],
      badge: 'AI',
      isNew: true
    },

    // AI Assistant Commands
    {
      id: 'ai-help',
      label: 'AI Help & Support',
      description: 'Get help from our AI assistant',
      icon: HelpCircle,
      action: () => {
        router.push('/ai-assistant')
        onClose()
      },
      category: 'ai',
      keywords: ['help', 'support', 'assistance', 'guide', 'tutorial']
    },
    {
      id: 'ai-learning-plan',
      label: 'Generate Learning Plan',
      description: 'Create a personalized learning plan with AI',
      icon: Lightbulb,
      action: () => {
        // This could trigger a specific AI conversation
        onSelect({
          id: 'ai-learning-plan',
          label: 'Generate Learning Plan',
          description: 'Create a personalized learning plan with AI',
          icon: Lightbulb,
          category: 'ai',
          keywords: []
        })
        onClose()
      },
      category: 'ai',
      keywords: ['plan', 'learning', 'personalized', 'curriculum', 'roadmap'],
      badge: 'AI'
    },
    {
      id: 'ai-skill-analysis',
      label: 'AI Skill Analysis',
      description: 'Get AI-powered analysis of your skills',
      icon: TrendingUp,
      action: () => {
        onSelect({
          id: 'ai-skill-analysis',
          label: 'AI Skill Analysis',
          description: 'Get AI-powered analysis of your skills',
          icon: TrendingUp,
          category: 'ai',
          keywords: []
        })
        onClose()
      },
      category: 'ai',
      keywords: ['analysis', 'skills', 'ai', 'insights', 'evaluation'],
      badge: 'AI'
    },

    // Quick Actions
    {
      id: 'new-conversation',
      label: 'New Conversation',
      description: 'Start a fresh conversation with AI',
      icon: MessageSquare,
      action: () => {
        router.push('/ai-assistant')
        onClose()
      },
      category: 'quick',
      keywords: ['new', 'conversation', 'chat', 'fresh', 'start']
    },
    {
      id: 'voice-mode',
      label: 'Toggle Voice Mode',
      description: 'Enable or disable voice interaction',
      icon: Mic,
      action: () => {
        // This would toggle voice mode in the parent component
        onSelect({
          id: 'voice-mode',
          label: 'Toggle Voice Mode',
          description: 'Enable or disable voice interaction',
          icon: Mic,
          category: 'quick',
          keywords: []
        })
        onClose()
      },
      category: 'quick',
      keywords: ['voice', 'mic', 'audio', 'speech', 'talk']
    }
  ]

  // Filter commands based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCommands(allCommands)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allCommands.filter(command => 
        command.label.toLowerCase().includes(query) ||
        command.description.toLowerCase().includes(query) ||
        command.keywords.some(keyword => keyword.includes(query))
      )
      setFilteredCommands(filtered)
    }
    setSelectedIndex(0)
  }, [searchQuery])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose])

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels = {
    navigation: 'Navigation',
    assessment: 'Assessments',
    ai: 'AI Assistant',
    quick: 'Quick Actions'
  }

  const categoryIcons = {
    navigation: Globe,
    assessment: Target,
    ai: Brain,
    quick: Zap
  }

  console.log('CommandMenu render - isOpen:', isOpen, 'searchQuery:', searchQuery)

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-[9999] flex items-start justify-center pt-20 ${className}`} onClick={onClose}>
      <motion.div
        ref={menuRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
          <Card className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl">
            <CardContent className="p-0">
              {/* Search Input */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search commands..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
                    value={searchQuery}
                    readOnly
                  />
                  <Badge variant="secondary" className="text-xs">
                    {filteredCommands.length} commands
                  </Badge>
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto">
                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="border-b border-gray-50 last:border-b-0">
                    <div className="px-4 py-2 bg-gray-50/50">
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const Icon = categoryIcons[category as keyof typeof categoryIcons]
                          return <Icon className="h-4 w-4 text-gray-600" />
                        })()}
                        <span className="text-sm font-medium text-gray-700">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {commands.length}
                        </Badge>
                      </div>
                    </div>
                    
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      const isSelected = globalIndex === selectedIndex
                      
                      return (
                        <motion.div
                          key={command.id}
                          whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => onSelect(command)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <command.icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {command.label}
                                </span>
                                {command.badge && (
                                  <Badge 
                                    variant={command.isNew ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {command.badge}
                                  </Badge>
                                )}
                                {command.isPopular && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <p className={`text-sm ${
                                isSelected ? 'text-blue-700' : 'text-gray-600'
                              }`}>
                                {command.description}
                              </p>
                            </div>
                            
                            <ChevronRight className={`h-4 w-4 ${
                              isSelected ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>↑↓ Navigate</span>
                    <span>↵ Select</span>
                    <span>⎋ Close</span>
                  </div>
                  <span>Press / to open this menu anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
