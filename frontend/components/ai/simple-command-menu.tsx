"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Plus,
  Sparkles,
  Zap,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Mic,
  Search,
  ChevronRight,
  Star,
  Clock,
  TrendingUp,
  CheckCircle
} from "lucide-react"
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

interface SimpleCommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: CommandItem) => void
  searchQuery?: string
  className?: string
}

export function SimpleCommandMenu({ 
  isOpen, 
  onClose, 
  onSelect, 
  searchQuery = "",
  className = "" 
}: SimpleCommandMenuProps) {
  const router = useRouter()
  const { user } = useAuth()

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
  const filteredCommands = searchQuery.trim() 
    ? allCommands.filter(command => 
        command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase()))
      )
    : allCommands

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
    navigation: Layout,
    assessment: Target,
    ai: Brain,
    quick: Zap
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm ${className}`} 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none bg-white">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-blue-600" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 font-medium"
                  value={searchQuery}
                  readOnly
                />
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                  {filteredCommands.length} commands
                </Badge>
              </div>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto bg-white">
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const Icon = categoryIcons[category as keyof typeof categoryIcons]
                        return <Icon className="h-4 w-4 text-blue-600" />
                      })()}
                      <span className="text-sm font-semibold text-gray-800">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </span>
                      <Badge variant="outline" className="text-xs bg-white text-gray-600 border-gray-300">
                        {commands.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {commands.map((command) => (
                    <div
                      key={command.id}
                      className="px-4 py-3 cursor-pointer hover:bg-blue-50/50 transition-all duration-200 border-l-2 border-transparent hover:border-blue-200"
                      onClick={() => onSelect(command)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 shadow-sm">
                          <command.icon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              {command.label}
                            </span>
                            {command.badge && (
                              <Badge 
                                variant={command.isNew ? 'default' : 'secondary'}
                                className={`text-xs ${
                                  command.isNew 
                                    ? 'bg-green-100 text-green-700 border-green-200' 
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                {command.badge}
                              </Badge>
                            )}
                            {command.isPopular && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {command.description}
                          </p>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-gray-400 hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">↑↓</span>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">↵</span>
                    <span>Select</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">⎋</span>
                    <span>Close</span>
                  </span>
                </div>
                <span className="text-blue-600 font-medium">Press / to open this menu anytime</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
