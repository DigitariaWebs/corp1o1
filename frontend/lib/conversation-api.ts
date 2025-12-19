// lib/conversation-api.ts
export interface Message {
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

export interface Conversation {
  id: string
  title: string
  personality: string
  createdAt: string
  updatedAt: string
  messageCount: number
  status: string
  lastMessage?: {
    content: string
    timestamp: string
    role: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface PaginationInfo {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

class ConversationApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    console.log('ConversationApiClient initialized with baseUrl:', this.baseUrl)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    console.log('Making API request to:', url)
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API request failed:', response.status, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('API response received:', data)
      return data
    } catch (error) {
      console.error('API request error:', error)
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const helpfulError = new Error(
          `Failed to connect to API at ${url}. Please check:\n` +
          `1. Is the backend server running on ${this.baseUrl}?\n` +
          `2. Are there any CORS issues?\n` +
          `3. Check the browser console for network errors.`
        )
        helpfulError.name = 'NetworkError'
        throw helpfulError
      }
      throw error
    }
  }

  // Conversations
  async getConversations(params?: {
    limit?: number
    offset?: number
    personality?: string
  }): Promise<ApiResponse<{ conversations: Conversation[]; pagination: PaginationInfo }>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.personality) searchParams.set('personality', params.personality)

    const query = searchParams.toString()
    return this.request(`/api/conversations/public${query ? `?${query}` : ''}`)
  }

  async getConversation(conversationId: string): Promise<ApiResponse<{ conversation: Conversation }>> {
    return this.request(`/api/conversations/public/${conversationId}`)
  }

  async createConversation(data?: {
    title?: string
    personality?: string
    conversationType?: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL'
  }): Promise<ApiResponse<{ conversation: Conversation }>> {
    return this.request('/api/conversations/public', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  async updateConversation(
    conversationId: string,
    data: { title?: string }
  ): Promise<ApiResponse<{ conversation: Conversation }>> {
    return this.request(`/api/conversations/public/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteConversation(conversationId: string): Promise<ApiResponse<{ message: string; conversationId: string }>> {
    return this.request(`/api/conversations/public/${conversationId}`, {
      method: 'DELETE',
    })
  }

  // Messages
  async getConversationMessages(
    conversationId: string,
    params?: {
      limit?: number
      offset?: number
    }
  ): Promise<ApiResponse<{ messages: Message[]; pagination: PaginationInfo }>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    return this.request(`/api/conversations/public/${conversationId}/messages${query ? `?${query}` : ''}`)
  }

  async addMessage(
    conversationId: string,
    data: {
      content: string
      role: 'user' | 'assistant' | 'system'
    }
  ): Promise<ApiResponse<{ message: Message }>> {
    return this.request(`/api/conversations/public/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    data: { content?: string }
  ): Promise<ApiResponse<{ message: Message }>> {
    return this.request(`/api/conversations/public/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMessage(
    conversationId: string,
    messageId: string
  ): Promise<ApiResponse<{ message: string; messageId: string }>> {
    return this.request(`/api/conversations/public/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    })
  }

  // AI Chat
  async sendChatMessage(data: {
    message: string
    sessionId?: string
    personality?: string
    context?: any
  }): Promise<ApiResponse<{
    message: {
      id: string
      content: string
      role: string
      timestamp: string
      metadata: any
    }
    session: {
      id: string
      messageCount: number
      duration: number
    }
    context: any
    usage: any
  }>> {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Feedback
  async sendMessageFeedback(data: {
    messageId: string
    rating?: number
    helpful?: boolean
    comment?: string
  }): Promise<ApiResponse<{ message: string; messageId: string; feedback: any }>> {
    return this.request('/api/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Export singleton instance
export const conversationApi = new ConversationApiClient()
