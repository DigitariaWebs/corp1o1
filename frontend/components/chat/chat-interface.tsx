"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  Edit3,
  Trash2,
  Clock,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    intent?: string
    confidence?: number
    responseTime?: number
    feedback?: {
      rating?: number
      helpful?: boolean
      comment?: string
    }
  }
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  onMessageFeedback?: (messageId: string, feedback: { rating?: number; helpful?: boolean; comment?: string }) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  loading?: boolean
  conversationTitle?: string
  onTitleChange?: (newTitle: string) => void
  className?: string
}

export function ChatInterface({
  messages,
  onSendMessage,
  onMessageFeedback,
  onEditMessage,
  onDeleteMessage,
  loading = false,
  conversationTitle,
  onTitleChange,
  className
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ rating?: number; helpful?: boolean; comment?: string }>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const handleSendMessage = () => {
    if (!inputValue.trim() || loading) return
    
    onSendMessage(inputValue.trim())
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEditStart = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const handleEditSave = () => {
    if (editingMessageId && editContent.trim() && onEditMessage) {
      onEditMessage(editingMessageId, editContent.trim())
    }
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleFeedbackSubmit = (messageId: string) => {
    if (onMessageFeedback) {
      onMessageFeedback(messageId, feedback)
    }
    setShowFeedback(null)
    setFeedback({})
  }

  const getPersonalityIcon = (role: string) => {
    switch (role) {
      case 'assistant':
        return <Bot className="h-4 w-4 text-blue-500" />
      case 'user':
        return <User className="h-4 w-4 text-green-500" />
      case 'system':
        return <Sparkles className="h-4 w-4 text-purple-500" />
      default:
        return <Bot className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-semibold text-gray-900">
              {conversationTitle || "AI Assistant"}
            </h1>
          </div>
          {messages.length > 0 && (
            <div className="text-sm text-gray-500">
              {messages.length} messages
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bot className="h-12 w-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-center max-w-md">
                Ask me anything! I'm here to help with your learning journey, answer questions, 
                provide guidance, and support your growth.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-3 group",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role !== 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getPersonalityIcon(message.role)}
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 relative group/message",
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  )}>
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleEditSave}
                            className="h-7 px-3 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-7 px-3 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-0 group-hover/message:opacity-100 transition-opacity">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </span>
                          
                          {message.metadata?.responseTime && (
                            <span>
                              {message.metadata.responseTime}ms
                            </span>
                          )}
                          
                          {message.metadata?.confidence && (
                            <span>
                              {Math.round(message.metadata.confidence)}% confidence
                            </span>
                          )}
                        </div>
                        
                        {/* Message Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyMessage(message.content)}
                            className="h-6 w-6 p-0 hover:bg-white/20"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          
                          {message.role === 'user' && onEditMessage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditStart(message)}
                              className="h-6 w-6 p-0 hover:bg-white/20"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {onDeleteMessage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteMessage(message.id)}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {message.role === 'assistant' && onMessageFeedback && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowFeedback(showFeedback === message.id ? null : message.id)}
                              className="h-6 w-6 p-0 hover:bg-white/20"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowFeedback(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Rate this response</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        size="sm"
                        variant={feedback.rating === rating ? "default" : "outline"}
                        onClick={() => setFeedback({ ...feedback, rating })}
                        className="h-8 w-8 p-0"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Was this helpful?</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={feedback.helpful === true ? "default" : "outline"}
                      onClick={() => setFeedback({ ...feedback, helpful: true })}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={feedback.helpful === false ? "default" : "outline"}
                      onClick={() => setFeedback({ ...feedback, helpful: false })}
                      className="flex items-center gap-1"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      No
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                  <Textarea
                    value={feedback.comment || ""}
                    onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                    placeholder="Share your thoughts..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => handleFeedbackSubmit(showFeedback)}
                  className="flex-1"
                >
                  Submit Feedback
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(null)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-32 resize-none pr-12"
                disabled={loading}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {inputValue.length}/4000
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
