"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { ConversationSidebar } from "@/components/chat/conversation-sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useConversationContext, Message, Conversation } from "@/hooks/use-conversation-context"
import { conversationApi } from "@/lib/conversation-api"
import { sendChat } from "@/lib/ai-client"
import { Brain, MessageSquare, Settings, HelpCircle } from "lucide-react"
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

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isSending) return

    setIsSending(true)
    
    try {
      // Add user message
      const userMessage = addMessage({
        role: 'user',
        content: content.trim()
      })

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

      // Add AI response with safe property access
      const aiContent = response?.reply || "I'm sorry, I couldn't process your message. Please try again."
      
      const aiResponse = addMessage({
        role: 'assistant',
        content: aiContent,
        metadata: {
          confidence: 85,
          responseTime: 1200,
          intent: 'general'
        }
      })
      
      setIsSending(false)

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
    try {
      const newConversation = await createConversation()
      setActiveConversation(newConversation.id)
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
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ 
            x: sidebarOpen ? 0 : -300, 
            opacity: sidebarOpen ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "w-80 bg-white border-r border-gray-200 flex-shrink-0 z-10",
            !sidebarOpen && "absolute"
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
        <div className="flex-1 flex flex-col min-w-0">
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
              loading={isSending}
              conversationTitle={getConversationTitle()}
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
    </div>
  )
}