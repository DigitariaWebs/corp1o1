"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Target,
  Brain,
  Activity,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  Zap,
  Save,
  Wifi,
  WifiOff,
  TrendingUp,
  BarChart3,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProgressTrackerProps {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  hasTimeLimit: boolean;
  warningTime: number; // Time in seconds when to show warning
  isAutoSaving?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  aiInsights?: {
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    estimatedScore: number;
    timeEfficiency: number;
    adaptiveRecommendations: string[];
  };
  connectionStatus?: 'connected' | 'disconnected' | 'unstable';
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentQuestion,
  totalQuestions,
  timeRemaining,
  hasTimeLimit,
  warningTime,
  isAutoSaving = false,
  isPaused = false,
  onPause,
  onResume,
  aiInsights,
  connectionStatus = 'connected'
}) => {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());

  const completionPercentage = (currentQuestion / totalQuestions) * 100;
  const isTimeWarning = hasTimeLimit && timeRemaining <= warningTime && timeRemaining > 0;
  const isTimeUp = hasTimeLimit && timeRemaining <= 0;

  // Update last save time when auto-saving
  useEffect(() => {
    if (isAutoSaving) {
      setLastSaveTime(new Date());
    }
  }, [isAutoSaving]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (isTimeUp) return 'text-red-400';
    if (isTimeWarning) return 'text-amber-400';
    return 'text-white';
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-cyan-400';
      case 'average': return 'text-yellow-400';
      case 'needs_improvement': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-400" />;
      case 'unstable': return <Wifi className="h-4 w-4 text-yellow-400" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-6 mb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2 text-cyan-400" />
              Progress
            </h3>
            <Badge variant="outline">
              {currentQuestion} of {totalQuestions}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completion</span>
              <span className="text-white font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalQuestions }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index + 1 < currentQuestion
                    ? 'bg-green-400'
                    : index + 1 === currentQuestion
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Time Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center">
              <Clock className={`h-5 w-5 mr-2 ${getTimeColor()}`} />
              Time
            </h3>
            
            {(onPause || onResume) && (
              <Button
                variant="outline"
                size="sm"
                onClick={isPaused ? onResume : onPause}
                className="flex items-center"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </div>

          {hasTimeLimit && (
            <>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-gray-400 text-sm">
                  {isTimeUp ? 'Time expired' : isPaused ? 'Paused' : 'Time remaining'}
                </div>
              </div>

              {isTimeWarning && !isTimeUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2 bg-amber-900/20 border border-amber-500/30 rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-amber-400 mr-2" />
                    <span className="text-amber-400 text-sm font-medium">Time warning!</span>
                  </div>
                </motion.div>
              )}

              {isTimeUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2 bg-red-900/20 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                    <span className="text-red-400 text-sm font-medium">Time expired!</span>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {!hasTimeLimit && (
            <div className="text-center">
              <div className="text-gray-400 text-sm">No time limit</div>
              <div className="text-white text-lg">Take your time</div>
            </div>
          )}
        </div>

        {/* Status & AI Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-400" />
              Status
            </h3>
            
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              {isAutoSaving && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="h-4 w-4 text-green-400" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Connection</span>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Auto-save</span>
              <div className="flex items-center">
                {isAutoSaving ? (
                  <Badge variant="default">Saving...</Badge>
                ) : (
                  <span className="text-green-400 text-xs">
                    Last saved: {lastSaveTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {aiInsights && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIInsights(!showAIInsights)}
                  className="w-full flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-purple-400" />
                    AI Insights
                  </span>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showAIInsights && aiInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-6 border-t border-slate-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-cyan-400" />
                  Performance
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Level</span>
                    <span className={`font-medium ${getPerformanceColor(aiInsights.performanceLevel)}`}>
                      {aiInsights.performanceLevel.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Score</span>
                    <span className="text-white font-medium">{aiInsights.estimatedScore}%</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time Efficiency</span>
                      <span className="text-white">{aiInsights.timeEfficiency}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-1 rounded-full"
                        style={{ width: `${aiInsights.timeEfficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Recommendations */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-white font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                  AI Recommendations
                </h4>
                
                <div className="space-y-2">
                  {aiInsights.adaptiveRecommendations.map((recommendation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-2 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded text-sm"
                    >
                      <div className="flex items-start">
                        <Zap className="h-3 w-3 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{recommendation}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Alert */}
      {connectionStatus === 'disconnected' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
        >
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-red-400 font-medium text-sm">Connection lost!</span>
            <span className="text-gray-300 text-sm ml-2">
              Your answers are saved locally and will sync when connection is restored.
            </span>
          </div>
        </motion.div>
      )}

      {connectionStatus === 'unstable' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-yellow-400 font-medium text-sm">Unstable connection</span>
            <span className="text-gray-300 text-sm ml-2">
              Auto-save may be delayed.
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProgressTracker;