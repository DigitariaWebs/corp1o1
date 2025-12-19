import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import type { RootState, AppDispatch } from '@/lib/redux/store';
import {
  setActiveConversation,
  setSelectedConversationType,
  loadConversations,
  loadConversationMessages,
  createConversation,
  deleteConversation,
  updateConversationTitle,
  sendMessage,
  addMessageToConversation,
  updateMessageInConversation,
  deleteMessageFromConversation,
  clearMessagesForConversation,
  setError,
  clearError,
} from '@/lib/redux/slices/conversationSlice';
import type { Message, Conversation } from '@/lib/conversation-api';

export function useConversationRedux() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const conversations = useSelector((state: RootState) => state.conversation.conversations);
  const activeConversationId = useSelector((state: RootState) => state.conversation.activeConversationId);
  const messagesByConversation = useSelector((state: RootState) => state.conversation.messagesByConversation);
  const isLoading = useSelector((state: RootState) => state.conversation.isLoading);
  const isSending = useSelector((state: RootState) => state.conversation.isSending);
  const error = useSelector((state: RootState) => state.conversation.error);
  const selectedConversationType = useSelector((state: RootState) => state.conversation.selectedConversationType);
  const streamingMessageId = useSelector((state: RootState) => state.conversation.streamingMessageId);
  
  // Computed values
  const activeConversation = useMemo(() => {
    return conversations.find((conv) => conv.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);
  
  const messages = useMemo(() => {
    if (!activeConversationId) return [];
    return messagesByConversation[activeConversationId] || [];
  }, [activeConversationId, messagesByConversation]);
  
  // Actions
  const handleSetActiveConversation = useCallback(
    (conversationId: string | null) => {
      dispatch(setActiveConversation(conversationId));
      if (conversationId) {
        // Load messages if not already loaded
        if (!messagesByConversation[conversationId]) {
          dispatch(loadConversationMessages(conversationId));
        }
      }
    },
    [dispatch, messagesByConversation]
  );
  
  const handleLoadConversations = useCallback(() => {
    dispatch(loadConversations());
  }, [dispatch]);
  
  const handleCreateConversation = useCallback(
    async (data?: {
      title?: string;
      personality?: string;
      conversationType?: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL';
    }) => {
      const result = await dispatch(createConversation(data || {}));
      if (createConversation.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );
  
  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      const result = await dispatch(deleteConversation(conversationId));
      if (deleteConversation.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    },
    [dispatch]
  );
  
  const handleUpdateConversationTitle = useCallback(
    async (conversationId: string, newTitle: string) => {
      const result = await dispatch(updateConversationTitle({ conversationId, newTitle }));
      if (updateConversationTitle.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    },
    [dispatch]
  );
  
  const handleSendMessage = useCallback(
    async (content: string, onChunk?: (chunk: string) => void) => {
      const result = await dispatch(
        sendMessage({
          content,
          conversationId: activeConversationId || undefined,
          onChunk,
        })
      );
      if (sendMessage.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    },
    [dispatch, activeConversationId]
  );
  
  const handleAddMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>) => {
      if (!activeConversationId) return null;
      
      const newMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      
      dispatch(addMessageToConversation({ conversationId: activeConversationId, message: newMessage }));
      return newMessage;
    },
    [dispatch, activeConversationId]
  );
  
  const handleUpdateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      if (!activeConversationId) return;
      dispatch(
        updateMessageInConversation({
          conversationId: activeConversationId,
          messageId,
          updates,
        })
      );
    },
    [dispatch, activeConversationId]
  );
  
  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (!activeConversationId) return;
      dispatch(deleteMessageFromConversation({ conversationId: activeConversationId, messageId }));
    },
    [dispatch, activeConversationId]
  );
  
  const handleSetSelectedConversationType = useCallback(
    (type: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL' | null) => {
      dispatch(setSelectedConversationType(type));
    },
    [dispatch]
  );
  
  // Context helpers (for compatibility)
  const getContextMessages = useCallback(
    (allMessages: Message[] = messages) => {
      const contextMessages: Array<{ role: string; content: string }> = [];
      
      // Add system prompt
      contextMessages.push({
        role: 'system',
        content: "You are ARIA, a supportive and encouraging AI learning assistant. You help users with their learning journey, provide guidance, answer questions, and offer motivation. Be empathetic, patient, and focus on positive reinforcement.",
      });
      
      // Get the last 15 messages for context
      const userAssistantMessages = allMessages.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant'
      );
      const recentMessages = userAssistantMessages.slice(-15);
      
      recentMessages.forEach((msg) => {
        contextMessages.push({
          role: msg.role,
          content: msg.content,
        });
      });
      
      return contextMessages;
    },
    [messages]
  );
  
  const getContextSummary = useCallback(() => {
    const contextMessages = getContextMessages();
    const totalChars = contextMessages.reduce((sum, msg) => sum + msg.content.length + msg.role.length + 10, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    
    return {
      messageCount: messages.length,
      contextMessageCount: contextMessages.length,
      estimatedTokens,
      maxContextMessages: 15,
      activeConversationId,
      hasSystemPrompt: true,
    };
  }, [messages, getContextMessages, activeConversationId]);
  
  return {
    // State
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    loading: isLoading,
    isSending,
    error,
    selectedConversationType,
    streamingMessageId,
    
    // Actions
    setActiveConversation: handleSetActiveConversation,
    loadConversations: handleLoadConversations,
    createConversation: handleCreateConversation,
    deleteConversation: handleDeleteConversation,
    updateConversationTitle: handleUpdateConversationTitle,
    sendMessage: handleSendMessage,
    addMessage: handleAddMessage,
    updateMessage: handleUpdateMessage,
    deleteMessage: handleDeleteMessage,
    setSelectedConversationType: handleSetSelectedConversationType,
    setError: (error: string | null) => dispatch(setError(error)),
    clearError: () => dispatch(clearError()),
    
    // Context helpers
    getContextMessages,
    getContextSummary,
  };
}

