"use client"

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { 
  startTimer, 
  stopTimer, 
  pauseTimer, 
  resumeTimer, 
  updateTimer, 
  resetTimer 
} from '@/lib/redux/slices/timerSlice';

interface AssessmentTimerProps {
  duration?: number; // in seconds
  onTimeUp?: () => void;
  allowPause?: boolean;
  showWarning?: boolean;
  className?: string;
}

export function AssessmentTimer({
  duration = 1800, // 30 minutes default
  onTimeUp,
  allowPause = false,
  showWarning = true,
  className
}: AssessmentTimerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    elapsedTime, 
    isRunning, 
    totalDuration, 
    isWarning, 
    isExpired 
  } = useSelector((state: RootState) => state.timer);

  // Calculate remaining time
  const remainingTime = Math.max(0, totalDuration - elapsedTime);
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progress = (elapsedTime / totalDuration) * 100;

  // Start timer on mount
  useEffect(() => {
    dispatch(startTimer({ duration }));
    
    // Cleanup on unmount
    return () => {
      dispatch(stopTimer());
    };
  }, [dispatch, duration]);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        dispatch(updateTimer());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, isRunning]);

  // Handle time expiration
  useEffect(() => {
    if (isExpired && onTimeUp) {
      onTimeUp();
    }
  }, [isExpired, onTimeUp]);

  // Handle page visibility change (pause when tab is not visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        dispatch(pauseTimer());
      } else if (!document.hidden && !isRunning && elapsedTime > 0 && !isExpired) {
        dispatch(resumeTimer());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch, isRunning, elapsedTime, isExpired]);

  // Handle page unload (save state before leaving)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning && !isExpired) {
        e.preventDefault();
        e.returnValue = 'Your assessment is in progress. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, isExpired]);

  const handlePauseResume = () => {
    if (isRunning) {
      dispatch(pauseTimer());
    } else {
      dispatch(resumeTimer());
    }
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-500';
    if (isWarning) return 'text-amber-500';
    return 'text-cyan-400';
  };

  const getProgressColor = () => {
    if (isExpired) return 'bg-red-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-cyan-500';
  };

  return (
    <div className={cn("relative", className)}>
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isExpired ? "bg-red-500/20" : isWarning ? "bg-amber-500/20" : "bg-cyan-500/20"
            )}>
              <Clock className={cn("h-5 w-5", getTimerColor())} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Time Remaining</span>
                {isWarning && !isExpired && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warning
                  </Badge>
                )}
                {isExpired && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-400/30 text-xs">
                    Time's Up!
                  </Badge>
                )}
              </div>
              
              <div className={cn("text-2xl font-bold font-mono", getTimerColor())}>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {allowPause && !isExpired && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePauseResume}
              className="text-gray-400 hover:text-white"
            >
              {isRunning ? (
                <>
                  <PauseCircle className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Resume
                </>
              )}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={cn("absolute inset-y-0 left-0", getProgressColor())}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Warning animation */}
        <AnimatePresence>
          {isWarning && !isExpired && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
            >
              <p className="text-amber-400 text-sm flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Less than 5 minutes remaining! Save your progress.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expired message */}
        <AnimatePresence>
          {isExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-400 font-medium text-center">
                Time has expired! Your assessment will be auto-submitted.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause overlay */}
        {!isRunning && !isExpired && elapsedTime > 0 && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PauseCircle className="h-12 w-12 text-amber-400 mx-auto mb-2" />
              <p className="text-white font-medium">Assessment Paused</p>
              <p className="text-gray-400 text-sm">Click resume to continue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}