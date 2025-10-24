"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Search, 
  MoreHorizontal,
  Clock,
  Bot,
  User,
  Sparkles,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  TrendingUp,
  Star,
  Archive,
  Pin,
  Tag,
  ChevronDown,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  title: string
  personality: string
  createdAt: string
  updatedAt: string
  messageCount: number
  status: string
  isPinned?: boolean
  isArchived?: boolean
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  lastMessage?: {
    content: string
    timestamp: string
    role: string
  }
}

interface ConversationSidebarProps {
  conversations?: Conversation[]
  activeConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  onRenameConversation: (conversationId: string, newTitle: string) => void
  loading?: boolean
  className?: string
}

export function ConversationSidebar({
  conversations = [],
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  loading = false,
  className
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'messageCount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'pinned' | 'archived' | 'recent'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState<string>('all')

  // Enhanced filtering and sorting logic
  const filteredConversations = (conversations || [])
    .filter(conv => {
      // Search filter
      const matchesSearch = !searchQuery || 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Status filter
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'pinned' && conv.isPinned) ||
        (filterBy === 'archived' && conv.isArchived) ||
        (filterBy === 'recent' && new Date(conv.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      
      // Personality filter
      const matchesPersonality = selectedPersonality === 'all' || conv.personality === selectedPersonality
      
      return matchesSearch && matchesFilter && matchesPersonality
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'messageCount':
          comparison = a.messageCount - b.messageCount
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Calculate conversation statistics
  const stats = {
    total: conversations.length,
    pinned: conversations.filter(c => c.isPinned).length,
    archived: conversations.filter(c => c.isArchived).length,
    recent: conversations.filter(c => 
      new Date(c.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0)
  }

  const handleEditStart = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const handleEditSave = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'ARIA':
        return <Sparkles className="h-3.5 w-3.5 text-pink-600" />
      case 'SAGE':
        return <Bot className="h-3.5 w-3.5 text-blue-600" />
      case 'COACH':
        return <User className="h-3.5 w-3.5 text-green-600" />
      case 'MENTOR':
        return <Star className="h-3.5 w-3.5 text-purple-600" />
      default:
        return <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
    }
  }

  const getPersonalityColor = (personality: string) => {
    // This function is no longer needed as we use dynamic colors in the card itself
    return ''
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200",
      "md:w-80 w-full", // Responsive width
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Conversations
            </h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.total} total
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.recent} recent
              </span>
            </div>
          </div>
          <Button
            onClick={onNewConversation}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>
        
        {/* Enhanced Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations, messages, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Filter and Sort Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-xs"
            >
              <Filter className="h-3 w-3" />
              Filters
              <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-7 w-7 p-0"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
              </Button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'messageCount')}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="messageCount">Messages</option>
              </select>
            </div>
          </div>
          
          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Filter by</label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as 'all' | 'pinned' | 'archived' | 'recent')}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All</option>
                      <option value="pinned">Pinned</option>
                      <option value="archived">Archived</option>
                      <option value="recent">Recent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Personality</label>
                    <select
                      value={selectedPersonality}
                      onChange={(e) => setSelectedPersonality(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All</option>
                      <option value="ARIA">ARIA</option>
                      <option value="SAGE">SAGE</option>
                      <option value="COACH">COACH</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">No conversations found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence>
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={cn(
                      "relative group rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                      "backdrop-blur-sm shadow-md hover:shadow-xl",
                      activeConversationId === conversation.id
                        ? "border-blue-400 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg ring-2 ring-blue-300/50"
                        : "border-gray-200 hover:border-blue-300 bg-gradient-to-br from-white to-gray-50/50 hover:from-blue-50/30 hover:to-indigo-50/30",
                      conversation.isPinned && "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md",
                      conversation.isArchived && "opacity-60 grayscale"
                    )}
                    onClick={() => onConversationSelect(conversation.id)}
                    onMouseEnter={() => setHoveredId(conversation.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Decorative gradient overlay */}
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-opacity duration-300",
                      activeConversationId === conversation.id
                        ? "from-blue-400 via-indigo-400 to-purple-400 opacity-100"
                        : conversation.isPinned
                        ? "from-amber-400 via-yellow-400 to-orange-400 opacity-100"
                        : "from-gray-300 to-gray-400 opacity-0 group-hover:opacity-100"
                    )} />
                    
                    <div className="p-3 relative">
                      {editingId === conversation.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave()
                              if (e.key === 'Escape') handleEditCancel()
                            }}
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={handleEditSave}
                              className="h-6 px-2 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {conversation.isPinned && (
                                <div className="p-1 rounded-full bg-amber-100 animate-pulse">
                                  <Pin className="h-3 w-3 text-amber-600 flex-shrink-0" />
                                </div>
                              )}
                              <div className={cn(
                                "p-1.5 rounded-lg flex-shrink-0 shadow-sm transition-all duration-200",
                                activeConversationId === conversation.id
                                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md scale-110"
                                  : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-indigo-100"
                              )}>
                                {getPersonalityIcon(conversation.personality)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={cn(
                                  "text-sm font-semibold truncate block transition-colors",
                                  activeConversationId === conversation.id
                                    ? "text-blue-900"
                                    : "text-gray-900 group-hover:text-blue-800"
                                )}>
                                  {conversation.title}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] px-1.5 py-0 font-medium border transition-colors",
                                    activeConversationId === conversation.id
                                      ? "bg-blue-100 border-blue-300 text-blue-700"
                                      : "bg-gray-50 border-gray-300 text-gray-600 group-hover:bg-blue-50 group-hover:border-blue-200"
                                  )}>
                                    {conversation.personality}
                                  </Badge>
                                  {conversation.priority === 'high' && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                                      High Priority
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditStart(conversation)
                                }}
                                className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-all hover:scale-110"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteConversation(conversation.id)
                                }}
                                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all hover:scale-110"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {conversation.tags && conversation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {conversation.tags.slice(0, 3).map((tag, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-medium transition-all",
                                    "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200",
                                    "hover:from-purple-200 hover:to-pink-200 hover:scale-105"
                                  )}
                                >
                                  <Tag className="h-2.5 w-2.5 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {conversation.tags.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border-gray-300">
                                  +{conversation.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {conversation.lastMessage && (
                            <div className={cn(
                              "space-y-2 p-2.5 rounded-lg transition-all",
                              activeConversationId === conversation.id
                                ? "bg-white/60 backdrop-blur-sm"
                                : "bg-gray-50/80 group-hover:bg-white/80"
                            )}>
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "p-1 rounded-md flex-shrink-0",
                                  conversation.lastMessage.role === 'user'
                                    ? "bg-blue-100"
                                    : "bg-purple-100"
                                )}>
                                  {conversation.lastMessage.role === 'user' 
                                    ? <User className="h-2.5 w-2.5 text-blue-600" />
                                    : <Bot className="h-2.5 w-2.5 text-purple-600" />
                                  }
                                </div>
                                <p className={cn(
                                  "text-xs leading-relaxed truncate flex-1",
                                  activeConversationId === conversation.id
                                    ? "text-gray-700 font-medium"
                                    : "text-gray-600"
                                )}>
                                  {conversation.lastMessage.content}
                                </p>
                              </div>
                              <div className={cn(
                                "flex items-center gap-2 text-[10px] font-medium",
                                activeConversationId === conversation.id
                                  ? "text-blue-600"
                                  : "text-gray-500"
                              )}>
                                <div className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>
                                    {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">
                                  <MessageSquare className="h-2.5 w-2.5" />
                                  <span>{conversation.messageCount}</span>
                                </div>
                                {conversation.isArchived && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1 bg-orange-100 rounded-full px-2 py-0.5">
                                      <Archive className="h-2.5 w-2.5 text-orange-600" />
                                      <span className="text-orange-600">Archived</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
