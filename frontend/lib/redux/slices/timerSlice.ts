import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimerState {
  startTime: number | null;
  elapsedTime: number;
  isRunning: boolean;
  totalDuration: number; // Total assessment duration in seconds
  warningTime: number; // Time to show warning (e.g., 5 minutes left)
  isWarning: boolean;
  isExpired: boolean;
}

const initialState: TimerState = {
  startTime: null,
  elapsedTime: 0,
  isRunning: false,
  totalDuration: 1800, // Default 30 minutes
  warningTime: 300, // Warning at 5 minutes
  isWarning: false,
  isExpired: false,
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state, action: PayloadAction<{ duration?: number }>) => {
      state.startTime = Date.now();
      state.elapsedTime = 0;
      state.isRunning = true;
      state.isWarning = false;
      state.isExpired = false;
      if (action.payload.duration) {
        state.totalDuration = action.payload.duration;
      }
    },

    stopTimer: (state) => {
      if (state.isRunning && state.startTime) {
        state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
      }
      state.isRunning = false;
    },

    pauseTimer: (state) => {
      if (state.isRunning && state.startTime) {
        state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
        state.isRunning = false;
      }
    },

    resumeTimer: (state) => {
      if (!state.isRunning) {
        state.startTime = Date.now() - (state.elapsedTime * 1000);
        state.isRunning = true;
      }
    },

    updateTimer: (state) => {
      if (state.isRunning && state.startTime) {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        state.elapsedTime = elapsed;

        // Check for warning time
        const timeRemaining = state.totalDuration - elapsed;
        if (timeRemaining <= state.warningTime && timeRemaining > 0 && !state.isWarning) {
          state.isWarning = true;
        }

        // Check for expiration
        if (timeRemaining <= 0 && !state.isExpired) {
          state.isExpired = true;
          state.isRunning = false;
        }
      }
    },

    resetTimer: (state) => {
      state.startTime = null;
      state.elapsedTime = 0;
      state.isRunning = false;
      state.isWarning = false;
      state.isExpired = false;
    },

    setDuration: (state, action: PayloadAction<number>) => {
      state.totalDuration = action.payload;
    },

    setWarningTime: (state, action: PayloadAction<number>) => {
      state.warningTime = action.payload;
    },
  },
});

export const {
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
  updateTimer,
  resetTimer,
  setDuration,
  setWarningTime,
} = timerSlice.actions;

export default timerSlice.reducer;