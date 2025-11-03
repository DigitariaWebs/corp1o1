"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Lightbulb, 
  BookOpen, 
  Target, 
  HelpCircle, 
  Code, 
  Calculator,
  Star,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ConversationTemplate {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: string
  conversationType: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL'
  color: string
  popularity: number
}

const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    id: "learning",
    title: "Learning",
    description: "Explain concepts with structured, educational content",
    icon: <Lightbulb className="h-5 w-5" />,
    category: "Learning",
    conversationType: "LEARNING",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    popularity: 95
  },
  {
    id: "education",
    title: "Education",
    description: "Create comprehensive lesson plans and teaching materials",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Education",
    conversationType: "EDUCATION",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    popularity: 90
  },
  {
    id: "problem-solving",
    title: "Problem Solving",
    description: "Solve problems with rigorous step-by-step reasoning",
    icon: <Target className="h-5 w-5" />,
    category: "Problem Solving",
    conversationType: "PROBLEM_SOLVING",
    color: "bg-green-50 border-green-200 text-green-800",
    popularity: 85
  },
  {
    id: "programming",
    title: "Programming",
    description: "Provide code-focused solutions with best practices",
    icon: <Code className="h-5 w-5" />,
    category: "Programming",
    conversationType: "PROGRAMMING",
    color: "bg-purple-50 border-purple-200 text-purple-800",
    popularity: 88
  },
  {
    id: "mathematics",
    title: "Mathematics",
    description: "Solve mathematical problems with detailed derivations",
    icon: <Calculator className="h-5 w-5" />,
    category: "Mathematics",
    conversationType: "MATHEMATICS",
    color: "bg-red-50 border-red-200 text-red-800",
    popularity: 82
  },
  {
    id: "general",
    title: "General",
    description: "Provide clear, informative explanations on any topic",
    icon: <HelpCircle className="h-5 w-5" />,
    category: "General",
    conversationType: "GENERAL",
    color: "bg-gray-50 border-gray-200 text-gray-800",
    popularity: 75
  }
]

interface ConversationTemplatesProps {
  onTemplateSelect: (template: ConversationTemplate) => void
  onClose: () => void
  className?: string
}

export function ConversationTemplates({
  onTemplateSelect,
  onClose,
  className
}: ConversationTemplatesProps) {
  return (
    <div className={cn("p-4 md:p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto max-h-[90vh] overflow-y-auto", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            Start a Conversation
          </h2>
          <p className="text-gray-600 mt-1">Select a conversation type to begin</p>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          ×
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {CONVERSATION_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105",
                  template.color
                )}
                onClick={() => {
                  onTemplateSelect(template)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {template.icon}
                    <h3 className="font-semibold">{template.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs">{template.popularity}%</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTemplateSelect(template)
                    }}
                  >
                    Start
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  )
}
