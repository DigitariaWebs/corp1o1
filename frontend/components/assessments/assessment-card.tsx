"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Clock, 
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  Play,
  Star,
  TrendingUp,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AssessmentCardProps {
  assessment: {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    difficulty: string;
    questionCount: number;
    estimatedDuration: number;
    passingScore: number;
    userProgress?: {
      attempts: number;
      bestScore: number;
      hasPassed: boolean;
      canRetake: boolean;
    };
    analytics?: {
      averageScore: number;
      passRate: number;
      totalAttempts: number;
    };
  };
  onStart: (assessmentId: string) => void;
  className?: string;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ 
  assessment, 
  onStart, 
  className = "" 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'from-green-500 to-green-600';
      case 'intermediate': return 'from-yellow-500 to-orange-600';
      case 'advanced': return 'from-orange-500 to-red-600';
      case 'expert': return 'from-red-500 to-purple-600';
      default: return 'from-cyan-500 to-blue-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'certification': return Award;
      case 'skill_check': return Target;
      case 'practice': return TrendingUp;
      default: return Brain;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const TypeIcon = getTypeIcon(assessment.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`group cursor-pointer ${className}`}
    >
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg overflow-hidden hover:border-slate-500/50 transition-all duration-300 h-full">
        {/* Header with gradient background */}
        <div className={`h-32 bg-gradient-to-r ${getDifficultyColor(assessment.difficulty)} relative`}>
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <Badge className="bg-black/30 text-white border-0">
              <Brain className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
            
            {assessment.userProgress?.hasPassed && (
              <Badge className="bg-green-500/80 text-white border-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Passed
              </Badge>
            )}
          </div>

          {/* Bottom title and icon */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg line-clamp-1">
                  {assessment.title}
                </h3>
                <p className="text-white/80 text-sm">{assessment.category}</p>
              </div>
              <TypeIcon className="h-8 w-8 text-white/90 ml-2" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {assessment.description}
          </p>

          {/* Assessment details */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Duration
              </span>
              <span className="text-white">{formatDuration(assessment.estimatedDuration)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Questions
              </span>
              <span className="text-white">{assessment.questionCount}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Difficulty</span>
              <Badge variant={
                assessment.difficulty === 'expert' ? 'destructive' :
                assessment.difficulty === 'advanced' ? 'default' :
                assessment.difficulty === 'intermediate' ? 'secondary' : 
                'outline'
              }>
                {assessment.difficulty}
              </Badge>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Passing Score</span>
              <span className="text-white">{assessment.passingScore}%</span>
            </div>
          </div>

          {/* User progress */}
          {assessment.userProgress && (
            <div className="mb-4 p-3 bg-slate-800/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-sm font-medium">Your Progress</span>
                {assessment.userProgress.bestScore > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-white text-sm font-bold">
                      {assessment.userProgress.bestScore}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>Attempts: {assessment.userProgress.attempts}</span>
                {assessment.userProgress.hasPassed ? (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                  </span>
                ) : assessment.userProgress.attempts > 0 ? (
                  <span className="text-amber-400 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Retry Available
                  </span>
                ) : (
                  <span className="text-gray-400">Not Started</span>
                )}
              </div>
            </div>
          )}

          {/* Analytics */}
          {assessment.analytics && (
            <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
              <p className="text-gray-400 text-xs mb-2 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Community Stats
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Avg Score:</span>
                  <span className="text-white ml-1">{assessment.analytics.averageScore}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Pass Rate:</span>
                  <span className="text-white ml-1">{assessment.analytics.passRate}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <Button 
            onClick={() => onStart(assessment.id)}
            className="w-full group-hover:scale-105 transition-transform duration-300"
            variant={assessment.userProgress?.hasPassed ? "outline" : "default"}
          >
            <Play className="h-4 w-4 mr-2" />
            {assessment.userProgress?.attempts === 0 ? 'Start Assessment' :
             assessment.userProgress?.hasPassed && !assessment.userProgress?.canRetake ? 'View Results' :
             'Continue Assessment'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssessmentCard;