import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { conversationApi, Conversation, Message } from '@/lib/conversation-api';
import { sendChat } from '@/lib/ai-client';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>; // conversationId -> messages
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  selectedConversationType: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL' | null;
  streamingMessageId: string | null; // ID of message currently being streamed
}

const initialState: ConversationState = {
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  isLoading: false,
  isSending: false,
  error: null,
  selectedConversationType: null,
  streamingMessageId: null,
};

// Async thunks
export const loadConversations = createAsyncThunk(
  'conversation/loadConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await conversationApi.getConversations({
        limit: 50,
        offset: 0,
      });
      
      let conversationsArray: Conversation[] = [];
      if (response && response.data) {
        if (Array.isArray(response.data.conversations)) {
          conversationsArray = response.data.conversations;
        } else if (Array.isArray(response.data)) {
          conversationsArray = response.data;
        }
      }
      
      return conversationsArray;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load conversations');
    }
  }
);

export const loadConversationMessages = createAsyncThunk(
  'conversation/loadMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const response = await conversationApi.getConversationMessages(conversationId, {
        limit: 100,
        offset: 0,
      });
      
      const messagesArray = response?.data?.messages && Array.isArray(response.data.messages)
        ? response.data.messages
        : [];
      
      return { conversationId, messages: messagesArray };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load messages');
    }
  }
);

export const createConversation = createAsyncThunk(
  'conversation/create',
  async (
    data: {
      title?: string;
      personality?: string;
      conversationType?: 'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await conversationApi.createConversation(data);
      const newConversation = response?.data?.conversation;
      
      if (!newConversation) {
        throw new Error('Failed to create conversation - no conversation data returned');
      }
      
      return newConversation;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create conversation');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'conversation/delete',
  async (conversationId: string, { rejectWithValue, getState }) => {
    try {
      await conversationApi.deleteConversation(conversationId);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  }
);

export const updateConversationTitle = createAsyncThunk(
  'conversation/updateTitle',
  async (
    { conversationId, newTitle }: { conversationId: string; newTitle: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await conversationApi.updateConversation(conversationId, {
        title: newTitle,
      });
      
      const updatedConversation = response?.data?.conversation;
      return { conversationId, conversation: updatedConversation };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async (
    {
      content,
      conversationId,
      onChunk,
    }: {
      content: string;
      conversationId?: string;
      onChunk?: (chunk: string) => void;
    },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { conversation: ConversationState };
      const { activeConversationId, selectedConversationType } = state.conversation;
      
      // Determine conversation ID
      let finalConversationId = conversationId || activeConversationId;
      
      // Create conversation if needed
      if (!finalConversationId && selectedConversationType) {
        const createResult = await dispatch(
          createConversation({
            title: `New ${selectedConversationType} Conversation`,
            conversationType: selectedConversationType,
          }) as any
        );
        
        if (createConversation.fulfilled.match(createResult)) {
          finalConversationId = createResult.payload.id;
          dispatch(setActiveConversation(finalConversationId));
        } else {
          throw new Error('Failed to create conversation');
        }
      }
      
      if (!finalConversationId) {
        throw new Error('No conversation ID available');
      }
      
      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      
      dispatch(addMessageToConversation({ conversationId: finalConversationId, message: userMessage }));
      
      // Add empty assistant message for streaming
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      
      dispatch(addMessageToConversation({ conversationId: finalConversationId, message: assistantMessage }));
      dispatch(setStreamingMessageId(assistantMessage.id));
      
      let fullContent = '';
      
      // Send to AI API with streaming enabled
      await sendChat(content.trim(), undefined, {
        stream: true,
        assistant: true,
        sessionId: finalConversationId || undefined,
        onChunk: (chunk: string) => {
          fullContent += chunk;
          // Update the assistant message with accumulated content
          dispatch(
            updateMessageInConversation({
              conversationId: finalConversationId!,
              messageId: assistantMessage.id,
              updates: { content: fullContent },
            })
          );
          // Call external onChunk if provided
          if (onChunk) {
            onChunk(chunk);
          }
        },
      });
      
      // Update final metadata when done
      dispatch(
        updateMessageInConversation({
          conversationId: finalConversationId!,
          messageId: assistantMessage.id,
          updates: {
            content: fullContent,
            metadata: {
              confidence: Math.floor(Math.random() * 20) + 80,
              responseTime: 0,
            },
          },
        })
      );
      
      // Clear streaming state - this will trigger formatting when isStreaming becomes false
      dispatch(setStreamingMessageId(null));
      
      return { conversationId: finalConversationId, fullContent };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send message');
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      // Clear selected type when setting active conversation
      if (action.payload) {
        state.selectedConversationType = null;
      }
    },
    
    setSelectedConversationType: (
      state,
      action: PayloadAction<'LEARNING' | 'EDUCATION' | 'PROBLEM_SOLVING' | 'PROGRAMMING' | 'MATHEMATICS' | 'GENERAL' | null>
    ) => {
      state.selectedConversationType = action.payload;
    },
    
    addMessageToConversation: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>
    ) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      state.messagesByConversation[conversationId].push(message);
    },
    
    updateMessageInConversation: (
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: string;
        updates: Partial<Message>;
      }>
    ) => {
      const { conversationId, messageId, updates } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        const index = messages.findIndex((msg) => msg.id === messageId);
        if (index !== -1) {
          messages[index] = { ...messages[index], ...updates };
        }
      }
    },
    
    deleteMessageFromConversation: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string }>
    ) => {
      const { conversationId, messageId } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        state.messagesByConversation[conversationId] = messages.filter((msg) => msg.id !== messageId);
      }
    },
    
    clearMessagesForConversation: (state, action: PayloadAction<string>) => {
      state.messagesByConversation[action.payload] = [];
    },
    
    setStreamingMessageId: (state, action: PayloadAction<string | null>) => {
      state.streamingMessageId = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load conversations
    builder
      .addCase(loadConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(loadConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.conversations = [];
      });
    
    // Load messages
    builder
      .addCase(loadConversationMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadConversationMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        state.messagesByConversation[conversationId] = messages;
      })
      .addCase(loadConversationMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Create conversation
    builder
      .addCase(createConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = [action.payload, ...state.conversations];
        state.activeConversationId = action.payload.id;
        state.messagesByConversation[action.payload.id] = [];
        state.selectedConversationType = null;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Delete conversation
    builder
      .addCase(deleteConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = state.conversations.filter((conv) => conv.id !== action.payload);
        if (state.activeConversationId === action.payload) {
          state.activeConversationId = null;
        }
        delete state.messagesByConversation[action.payload];
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Update conversation title
    builder
      .addCase(updateConversationTitle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateConversationTitle.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, conversation } = action.payload;
        if (conversation) {
          state.conversations = state.conversations.map((conv) =>
            conv.id === conversationId ? conversation : conv
          );
        }
      })
      .addCase(updateConversationTitle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.isSending = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
        state.streamingMessageId = null;
      });
  },
});

export const {
  setActiveConversation,
  setSelectedConversationType,
  addMessageToConversation,
  updateMessageInConversation,
  deleteMessageFromConversation,
  clearMessagesForConversation,
  setStreamingMessageId,
  setError,
  clearError,
} = conversationSlice.actions;

export default conversationSlice.reducer;

