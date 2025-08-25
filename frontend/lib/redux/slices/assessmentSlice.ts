import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface Question {
  id: string;
  type: 'multiple_choice' | 'text' | 'code' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // in seconds
  category?: string;
  hints?: string[];
  explanation?: string;
}

export interface AssessmentSession {
  sessionId: string;
  assessmentId: string;
  assessmentTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, any>;
  startTime: string;
  endTime?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  feedback?: Record<string, any>;
  aiPersonality: 'ARIA' | 'SAGE' | 'COACH';
  totalTimeSpent: number;
  questionStartTime?: number;
}

interface AssessmentState {
  currentSession: AssessmentSession | null;
  isLoading: boolean;
  error: string | null;
  isGeneratingQuestions: boolean;
  isEvaluating: boolean;
  evaluationResults: Record<string, any>;
  sessionHistory: AssessmentSession[];
}

const initialState: AssessmentState = {
  currentSession: null,
  isLoading: false,
  error: null,
  isGeneratingQuestions: false,
  isEvaluating: false,
  evaluationResults: {},
  sessionHistory: [],
};

// Async thunk to generate questions using AI
export const generateAssessmentQuestions = createAsyncThunk(
  'assessment/generateQuestions',
  async ({ 
    assessmentId, 
    title, 
    category, 
    difficulty, 
    questionCount,
    token
  }: {
    assessmentId: string;
    title: string;
    category: string;
    difficulty: string;
    questionCount: number;
    token: string | null;
  }) => {
    const response = await fetch('/api/assessments/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        assessmentId,
        title,
        category,
        difficulty,
        questionCount,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      const message = (data && (data.error || data.message)) || 'Failed to generate questions';
      throw new Error(message);
    }
    return Array.isArray(data?.data?.questions) ? data.data.questions : [];
  }
);

// Async thunk to evaluate an answer using AI
export const evaluateAnswer = createAsyncThunk(
  'assessment/evaluateAnswer',
  async ({ 
    questionId,
    question, 
    answer, 
    personality,
    difficulty,
    points,
    token
  }: {
    questionId: string;
    question: string;
    answer: string;
    personality: 'ARIA' | 'SAGE' | 'COACH';
    difficulty: string;
    points: number;
    token: string | null;
  }) => {
    const response = await fetch('/api/assessments/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question,
        answer,
        personality,
        difficulty,
        points,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || 'Failed to evaluate answer');
    }

    const data = await response.json();
    return { questionId, evaluation: data.data };
  }
);

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    startAssessment: (state, action: PayloadAction<{
      assessmentId: string;
      assessmentTitle: string;
      aiPersonality: 'ARIA' | 'SAGE' | 'COACH';
    }>) => {
      // Reset any existing session when starting new
      if (state.currentSession && state.currentSession.status === 'in_progress') {
        state.currentSession.status = 'abandoned';
        state.sessionHistory.push(state.currentSession);
      }

      state.currentSession = {
        sessionId: `session_${Date.now()}`,
        assessmentId: action.payload.assessmentId,
        assessmentTitle: action.payload.assessmentTitle,
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        startTime: new Date().toISOString(),
        status: 'in_progress',
        aiPersonality: action.payload.aiPersonality,
        totalTimeSpent: 0,
        questionStartTime: Date.now(),
      };
      state.error = null;
    },

    setQuestions: (state, action: PayloadAction<Question[]>) => {
      if (state.currentSession) {
        state.currentSession.questions = action.payload;
      }
    },

    answerQuestion: (state, action: PayloadAction<{ questionId: string; answer: any }>) => {
      if (state.currentSession) {
        state.currentSession.answers[action.payload.questionId] = action.payload.answer;
        
        // Update time spent on current question
        if (state.currentSession.questionStartTime) {
          const timeSpent = Date.now() - state.currentSession.questionStartTime;
          state.currentSession.totalTimeSpent += timeSpent;
        }
      }
    },

    nextQuestion: (state) => {
      if (state.currentSession && 
          state.currentSession.currentQuestionIndex < state.currentSession.questions.length - 1) {
        state.currentSession.currentQuestionIndex += 1;
        state.currentSession.questionStartTime = Date.now();
      }
    },

    previousQuestion: (state) => {
      if (state.currentSession && state.currentSession.currentQuestionIndex > 0) {
        state.currentSession.currentQuestionIndex -= 1;
        state.currentSession.questionStartTime = Date.now();
      }
    },

    goToQuestion: (state, action: PayloadAction<number>) => {
      if (state.currentSession && 
          action.payload >= 0 && 
          action.payload < state.currentSession.questions.length) {
        state.currentSession.currentQuestionIndex = action.payload;
        state.currentSession.questionStartTime = Date.now();
      }
    },

    completeAssessment: (state, action: PayloadAction<{ score: number; feedback: any }>) => {
      if (state.currentSession) {
        state.currentSession.status = 'completed';
        state.currentSession.endTime = new Date().toISOString();
        state.currentSession.score = action.payload.score;
        state.currentSession.feedback = action.payload.feedback;
        state.sessionHistory.push(state.currentSession);
      }
    },

    abandonAssessment: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'abandoned';
        state.currentSession.endTime = new Date().toISOString();
        state.sessionHistory.push(state.currentSession);
        state.currentSession = null;
      }
    },

    resetAssessment: (state) => {
      if (state.currentSession) {
        // Save current session to history before resetting
        state.currentSession.status = 'abandoned';
        state.sessionHistory.push(state.currentSession);
      }
      state.currentSession = null;
      state.evaluationResults = {};
      state.error = null;
    },

    setEvaluationResult: (state, action: PayloadAction<{ questionId: string; result: any }>) => {
      state.evaluationResults[action.payload.questionId] = action.payload.result;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate questions
    builder
      .addCase(generateAssessmentQuestions.pending, (state) => {
        state.isGeneratingQuestions = true;
        state.error = null;
      })
      .addCase(generateAssessmentQuestions.fulfilled, (state, action) => {
        state.isGeneratingQuestions = false;
        if (state.currentSession) {
          state.currentSession.questions = action.payload;
        }
      })
      .addCase(generateAssessmentQuestions.rejected, (state, action) => {
        state.isGeneratingQuestions = false;
        state.error = action.error.message || 'Failed to generate questions';
      });

    // Evaluate answer
    builder
      .addCase(evaluateAnswer.pending, (state) => {
        state.isEvaluating = true;
        state.error = null;
      })
      .addCase(evaluateAnswer.fulfilled, (state, action) => {
        state.isEvaluating = false;
        state.evaluationResults[action.payload.questionId] = action.payload.evaluation;
      })
      .addCase(evaluateAnswer.rejected, (state, action) => {
        state.isEvaluating = false;
        state.error = action.error.message || 'Failed to evaluate answer';
      });
  },
});

export const {
  startAssessment,
  setQuestions,
  answerQuestion,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  completeAssessment,
  abandonAssessment,
  resetAssessment,
  setEvaluationResult,
  clearError,
} = assessmentSlice.actions;

export default assessmentSlice.reducer;