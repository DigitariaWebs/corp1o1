import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import assessmentReducer from './slices/assessmentSlice';
import userReducer from './slices/userSlice';
import timerReducer from './slices/timerSlice';
import conversationReducer from './slices/conversationSlice';

// Persist configuration for assessment state
const assessmentPersistConfig = {
  key: 'assessment',
  storage,
  whitelist: ['currentSessionId', 'currentQuestionIndex'], // Only persist essential data
};

// Persist configuration for conversation state
const conversationPersistConfig = {
  key: 'conversation',
  storage,
  whitelist: ['conversations', 'activeConversationId', 'selectedConversationType'], // Persist conversations and active ID
};

// Root reducer
const rootReducer = combineReducers({
  assessment: persistReducer(assessmentPersistConfig, assessmentReducer),
  user: userReducer,
  timer: timerReducer,
  conversation: persistReducer(conversationPersistConfig, conversationReducer),
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;