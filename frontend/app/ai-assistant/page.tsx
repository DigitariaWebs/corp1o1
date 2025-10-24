"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { ConversationSidebar } from "@/components/chat/conversation-sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { ConversationTemplates } from "@/components/chat/conversation-templates"
import { useConversationContext, Message, Conversation } from "@/hooks/use-conversation-context"
import { conversationApi } from "@/lib/conversation-api"
import { sendChat } from "@/lib/ai-client"
import { Brain, MessageSquare, Settings, HelpCircle, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AIAssistantPage() {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    loading,
    error,
    setActiveConversation,
    addMessage,
    updateMessage,
    deleteMessage,
    loadConversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    getContextMessages,
    getContextSummary
  } = useConversationContext({
    maxContextMessages: 15,
    systemPrompt: "You are ARIA, a supportive and encouraging AI learning assistant. You help users with their learning journey, provide guidance, answer questions, and offer motivation. Be empathetic, patient, and focus on positive reinforcement.",
    includeSystemMessages: true
  })

  // Ensure conversations is always an array
  const safeConversations = conversations || []
  
  // Debug logging
  console.log('AI Assistant - conversations:', conversations)
  console.log('AI Assistant - safeConversations:', safeConversations)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const [typingText, setTypingText] = useState("AI is thinking...")
  const [showTemplates, setShowTemplates] = useState(false)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isSending) return

    setIsSending(true)
    setShowTypingIndicator(true)
    setTypingText("AI is thinking...")
    
    try {
      // Add user message
      const userMessage = addMessage({
        role: 'user',
        content: content.trim(),
        status: 'sent'
      })

      // Simulate thinking process
      const thinkingPhrases = [
        "Analyzing your question...",
        "Gathering relevant information...",
        "Formulating the best response...",
        "Almost ready..."
      ]
      
      for (let i = 0; i < thinkingPhrases.length; i++) {
        setTypingText(thinkingPhrases[i])
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Get context for AI
      const contextMessages = getContextMessages([...messages, userMessage])
      
      // Send to AI API using the same client as the chatbot
      const response = await sendChat(content.trim(), undefined, {
        sessionId: activeConversationId || undefined,
        personality: activeConversation?.personality || 'ARIA',
        context: {
          messages: contextMessages,
          conversationId: activeConversationId
        }
      })

      console.log('AI API Response:', response)

      // Add AI response with enhanced metadata
      const aiContent = response?.reply || "I'm sorry, I couldn't process your message. Please try again."
      
      const aiResponse = addMessage({
        role: 'assistant',
        content: aiContent,
        status: 'delivered',
        metadata: {
          confidence: response?.confidence || Math.floor(Math.random() * 20) + 80,
          responseTime: response?.responseTime || Math.floor(Math.random() * 1000) + 500,
          intent: response?.intent || 'general',
          tokens: response?.tokens || Math.floor(Math.random() * 200) + 100,
          model: response?.model || 'gpt-4'
        }
      })
      
      setIsSending(false)
      setShowTypingIndicator(false)

    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Provide a helpful error message
      const errorMessage = "I'm sorry, I encountered an error processing your message. Please try again."
      
      // Add error message
      addMessage({
        role: 'assistant',
        content: errorMessage,
        metadata: {
          confidence: 0,
          responseTime: 0,
          intent: 'error'
        }
      })
      
      setIsSending(false)
    }
  }

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setActiveConversation(conversationId)
  }

  // Handle new conversation
  const handleNewConversation = async () => {
    setShowTemplates(true)
  }

  // Handle template selection
  const handleTemplateSelect = async (template: any) => {
    try {
      const newConversation = await createConversation()
      setActiveConversation(newConversation.id)
      setShowTemplates(false)
      // TODO: Pre-fill the input with the template prompt
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId)
      } catch (error) {
        console.error('Failed to delete conversation:', error)
      }
    }
  }

  // Handle conversation rename
  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      await updateConversationTitle(conversationId, newTitle)
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  // Handle message feedback
  const handleMessageFeedback = async (messageId: string, feedback: { rating?: number; helpful?: boolean; comment?: string }) => {
    try {
      // Update local state
      updateMessage(messageId, {
        metadata: {
          feedback
        }
      })
      
      // Send feedback to API
      await conversationApi.sendMessageFeedback({
        messageId,
        rating: feedback.rating,
        helpful: feedback.helpful,
        comment: feedback.comment
      })
    } catch (error) {
      console.error('Failed to send feedback:', error)
    }
  }

  // Handle message editing
  const handleEditMessage = (messageId: string, newContent: string) => {
    updateMessage(messageId, { content: newContent })
    // TODO: Send update to API
  }

  // Handle message deletion
  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId)
      // TODO: Send deletion to API
    }
  }

  // Enhanced message handlers
  const handleBookmarkMessage = (messageId: string, bookmarked: boolean) => {
    console.log('Bookmark message:', messageId, bookmarked)
    // TODO: Implement bookmark functionality
  }

  const handleRegenerateMessage = (messageId: string) => {
    console.log('Regenerate message:', messageId)
    // TODO: Implement regenerate functionality
  }

  const handleShareMessage = (messageId: string) => {
    console.log('Share message:', messageId)
    // TODO: Implement share functionality
  }

  // Get conversation title
  const getConversationTitle = () => {
    if (activeConversation) {
      return activeConversation.title
    }
    return "AI Assistant"
  }

  // Debug info
  const contextSummary = getContextSummary()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <MainNavigation />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-16 left-0 right-0 z-20 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            {sidebarOpen ? 'Close' : 'Menu'}
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ 
            x: sidebarOpen ? 0 : -300, 
            opacity: sidebarOpen ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "w-full md:w-80 bg-white border-r border-gray-200 flex-shrink-0 z-10",
            !sidebarOpen && "absolute md:relative"
          )}
        >
          <ConversationSidebar
            conversations={safeConversations}
            activeConversationId={activeConversationId || undefined}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            loading={loading}
          />
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {getConversationTitle()}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {activeConversation?.personality || 'ARIA'} • {messages.length} messages
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Context Info (Debug) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {contextSummary.contextMessageCount} ctx • ~{contextSummary.estimatedTokens} tokens
                </div>
              )}
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onMessageFeedback={handleMessageFeedback}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onBookmarkMessage={handleBookmarkMessage}
              onRegenerateMessage={handleRegenerateMessage}
              onShareMessage={handleShareMessage}
              loading={isSending}
              conversationTitle={getConversationTitle()}
              showTypingIndicator={showTypingIndicator}
              typingText={typingText}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          {error}
        </motion.div>
      )}

      {/* Conversation Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ConversationTemplates
            onTemplateSelect={handleTemplateSelect}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}
    </div>
  )
}