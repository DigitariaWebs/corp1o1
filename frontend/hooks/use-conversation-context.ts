import { useState, useCallback, useMemo } from 'react'
import { conversationApi, Conversation, Message } from '@/lib/conversation-api'

// Re-export types from API client
export type { Message, Conversation } from '@/lib/conversation-api'

interface ConversationContextOptions {
  maxContextMessages?: number
  systemPrompt?: string
  includeSystemMessages?: boolean
}

export function useConversationContext(options: ConversationContextOptions = {}) {
  const {
    maxContextMessages = 15,
    systemPrompt = "You are a helpful AI assistant focused on learning and education.",
    includeSystemMessages = true
  } = options

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ensure conversations is always an array
  const safeConversations = conversations || []

  // Get current conversation
  const activeConversation = useMemo(() => {
    return safeConversations.find(conv => conv.id === activeConversationId) || null
  }, [safeConversations, activeConversationId])

  // Get context messages for AI (sliding window approach)
  const getContextMessages = useCallback((allMessages: Message[] = messages) => {
    const contextMessages: Array<{ role: string; content: string }> = []
    
    // Add system prompt if enabled
    if (includeSystemMessages && systemPrompt) {
      contextMessages.push({
        role: 'system',
        content: systemPrompt
      })
    }

    // Get the last N messages for context (excluding system messages from count)
    const userAssistantMessages = allMessages.filter(msg => 
      msg.role === 'user' || msg.role === 'assistant'
    )
    
    const recentMessages = userAssistantMessages.slice(-maxContextMessages)
    
    // Add recent messages to context
    recentMessages.forEach(msg => {
      contextMessages.push({
        role: msg.role,
        content: msg.content
      })
    })

    return contextMessages
  }, [messages, maxContextMessages, systemPrompt, includeSystemMessages])

  // Get token count estimate for context
  const getContextTokenCount = useCallback((contextMessages: Array<{ role: string; content: string }>) => {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = contextMessages.reduce((sum, msg) => 
      sum + msg.content.length + msg.role.length + 10, // +10 for formatting
      0
    )
    return Math.ceil(totalChars / 4)
  }, [])

  // Add message to current conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMessage])
    return newMessage
  }, [])

  // Update message
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    )
  }, [])

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // Clear current conversation
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Set active conversation
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId)
    if (conversationId) {
      // Load messages for this conversation
      loadConversationMessages(conversationId)
    } else {
      setMessages([])
    }
  }, [])

  // Load conversation messages
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await conversationApi.getConversationMessages(conversationId, {
        limit: 100,
        offset: 0
      })
      const messagesArray = response?.data?.messages && Array.isArray(response.data.messages) 
        ? response.data.messages 
        : []
      setMessages(messagesArray)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load conversations list
  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // In development, skip API call if backend is not available
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
      console.log('Development mode: Using mock conversations (no API URL configured)')
      setConversations([])
      setLoading(false)
      return
    }
    
    try {
      console.log('Loading conversations...')
      const response = await conversationApi.getConversations({
        limit: 50,
        offset: 0
      })
      console.log('Conversations response:', response)
      
      // Safely extract conversations from response with multiple fallbacks
      let conversationsArray = []
      
      if (response && response.data) {
        if (Array.isArray(response.data.conversations)) {
          conversationsArray = response.data.conversations
        } else if (Array.isArray(response.data)) {
          conversationsArray = response.data
        }
      }
      
      console.log('Extracted conversations:', conversationsArray)
      setConversations(conversationsArray)
    } catch (err) {
      console.error('Failed to load conversations:', err)
      
      // In development, provide mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock conversations for development')
        setConversations([])
        setError(null) // Don't show error in dev mode
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
        setConversations([]) // Ensure we always have an array
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new conversation
  const createConversation = useCallback(async (title?: string, personality?: string, conversationType?: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await conversationApi.createConversation({
        title,
        personality,
        conversationType
      })
      const newConversation = response?.data?.conversation
      
      if (!newConversation) {
        throw new Error('Failed to create conversation - no conversation data returned')
      }
      
      setConversations(prev => {
        const currentConversations = Array.isArray(prev) ? prev : []
        return [newConversation, ...currentConversations]
      })
      setActiveConversationId(newConversation.id)
      setMessages([])
      
      return newConversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await conversationApi.deleteConversation(conversationId)
      
      setConversations(prev => {
        const currentConversations = Array.isArray(prev) ? prev : []
        return currentConversations.filter(conv => conv.id !== conversationId)
      })
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null)
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
    } finally {
      setLoading(false)
    }
  }, [activeConversationId])

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await conversationApi.updateConversation(conversationId, {
        title: newTitle
      })
      
      const updatedConversation = response?.data?.conversation
      
      setConversations(prev => {
        const currentConversations = Array.isArray(prev) ? prev : []
        return currentConversations.map(conv => 
          conv.id === conversationId 
            ? updatedConversation || conv
            : conv
        )
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation')
    } finally {
      setLoading(false)
    }
  }, [])

  // Get context summary for debugging
  const getContextSummary = useCallback(() => {
    const contextMessages = getContextMessages()
    const tokenCount = getContextTokenCount(contextMessages)
    
    return {
      messageCount: messages.length,
      contextMessageCount: contextMessages.length,
      estimatedTokens: tokenCount,
      maxContextMessages,
      activeConversationId,
      hasSystemPrompt: includeSystemMessages && !!systemPrompt
    }
  }, [messages, getContextMessages, getContextTokenCount, maxContextMessages, activeConversationId, includeSystemMessages, systemPrompt])

  return {
    // State
    conversations: safeConversations,
    activeConversation,
    activeConversationId,
    messages,
    loading,
    error,
    
    // Actions
    setActiveConversation,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    loadConversations,
    loadConversationMessages,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    
    // Context management
    getContextMessages,
    getContextTokenCount,
    getContextSummary,
    
    // Utilities
    setError
  }
}
