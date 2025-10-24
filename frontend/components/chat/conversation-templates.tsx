"use client"

import { useState } from "react"
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
  Globe,
  Zap,
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
  prompt: string
  color: string
  popularity: number
}

const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    id: "explain-concept",
    title: "Explain a Concept",
    description: "Get a clear, simple explanation of any topic",
    icon: <Lightbulb className="h-5 w-5" />,
    category: "Learning",
    prompt: "Explain this concept in simple terms:",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    popularity: 95
  },
  {
    id: "study-help",
    title: "Study Assistance",
    description: "Get help with your studies and homework",
    icon: <BookOpen className="h-5 w-5" />,
    category: "Education",
    prompt: "Help me understand:",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    popularity: 90
  },
  {
    id: "problem-solving",
    title: "Problem Solving",
    description: "Work through complex problems step by step",
    icon: <Target className="h-5 w-5" />,
    category: "Problem Solving",
    prompt: "Help me solve this problem:",
    color: "bg-green-50 border-green-200 text-green-800",
    popularity: 85
  },
  {
    id: "code-help",
    title: "Coding Help",
    description: "Get assistance with programming and code",
    icon: <Code className="h-5 w-5" />,
    category: "Programming",
    prompt: "Help me with this code:",
    color: "bg-purple-50 border-purple-200 text-purple-800",
    popularity: 88
  },
  {
    id: "math-help",
    title: "Math Support",
    description: "Get help with mathematical problems",
    icon: <Calculator className="h-5 w-5" />,
    category: "Mathematics",
    prompt: "Solve this math problem:",
    color: "bg-red-50 border-red-200 text-red-800",
    popularity: 82
  },
  {
    id: "general-help",
    title: "General Help",
    description: "Ask any question and get helpful answers",
    icon: <HelpCircle className="h-5 w-5" />,
    category: "General",
    prompt: "I need help with:",
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = ["all", ...Array.from(new Set(CONVERSATION_TEMPLATES.map(t => t.category)))]

  const filteredTemplates = CONVERSATION_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesSearch = !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className={cn("p-4 md:p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto max-h-[90vh] overflow-y-auto", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            Start a Conversation
          </h2>
          <p className="text-gray-600 mt-1">Choose a template to get started quickly</p>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          ×
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => (
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
                onClick={() => onTemplateSelect(template)}
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
                  >
                    Use Template
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No templates found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
