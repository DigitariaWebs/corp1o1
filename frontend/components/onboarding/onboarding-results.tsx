"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Star,
  Sparkles,
  Clock,
  Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface OnboardingResultsProps {
  results: {
    aiProfile: any;
    generatedAssessments: any[];
    answers: any[];
  };
  onStartAssessments: () => void;
  onViewProfile: () => void;
}

export function OnboardingResults({ results, onStartAssessments, onViewProfile }: OnboardingResultsProps) {
  const { aiProfile, generatedAssessments, answers } = results;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="h-8 w-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">
            Your AI Profile is Ready!
          </h1>
          <Sparkles className="h-8 w-8 text-yellow-400" />
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Based on your responses, we've created a personalized learning experience 
          with {generatedAssessments.length} custom assessments and tailored recommendations.
        </p>
      </motion.div>

      {/* AI Profile Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">Your AI-Generated Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Style */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Learning Style</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Primary Style</span>
                    <span className="text-white font-medium">{aiProfile.learningStyle.primary}</span>
                  </div>
                  <Progress value={aiProfile.learningStyle.confidence} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Secondary Style</span>
                    <span className="text-white font-medium">{aiProfile.learningStyle.secondary}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic">
                  "{aiProfile.learningStyle.reasoning}"
                </p>
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Experience Level</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Overall Level</span>
                    <span className="text-white font-medium capitalize">{aiProfile.experienceLevel.overall}</span>
                  </div>
                  <Progress value={aiProfile.experienceLevel.confidence} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Technical: </span>
                    <span className="text-white capitalize">{aiProfile.experienceLevel.technical}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Business: </span>
                    <span className="text-white capitalize">{aiProfile.experienceLevel.business}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 italic">
                  "{aiProfile.experienceLevel.reasoning}"
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <h3 className="text-lg font-medium text-white mb-3">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-purple-400 mb-2">Strengths</h4>
                <div className="space-y-1">
                  {aiProfile.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-2">Areas for Growth</h4>
                <div className="space-y-1">
                  {aiProfile.areasForGrowth.map((area: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <TrendingUp className="h-3 w-3 text-blue-400" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Personalized Assessments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">Your Personalized Assessments</h2>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {generatedAssessments.length} Custom Created
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedAssessments.map((assessment, index) => (
              <motion.div
                key={assessment.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30 hover:border-blue-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        assessment.priority === 1 ? 'border-red-500/50 text-red-400' :
                        assessment.priority === 2 ? 'border-yellow-500/50 text-yellow-400' :
                        'border-green-500/50 text-green-400'
                      }`}
                    >
                      Priority {assessment.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {assessment.difficulty}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-white mb-2">{assessment.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {assessment.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {assessment.estimatedDuration} min
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Target className="h-3 w-3" />
                      {assessment.questionCount} questions
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 italic">
                    "{assessment.reason}"
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Career Goals & Interests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-yellow-500/10 border border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-400" />
            <h2 className="text-2xl font-semibold text-white">Career Goals & Interests</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Career Goals</h3>
              <div className="space-y-2">
                {aiProfile.careerGoals.map((goal: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {goal}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">Key Interests</h3>
              <div className="space-y-2">
                {aiProfile.interests.map((interest: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-gray-300">
                    <Star className="h-4 w-4 text-yellow-400" />
                    {interest}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-green-500/20">
            <h3 className="text-lg font-medium text-white mb-3">Motivation & Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2">Primary Motivation</h4>
                <p className="text-sm text-gray-300">{aiProfile.motivation}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2">Time Availability</h4>
                <p className="text-sm text-gray-300 capitalize">{aiProfile.timeAvailability}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2">Preferred Format</h4>
                <p className="text-sm text-gray-300 capitalize">{aiProfile.preferredFormat}</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button
          onClick={onStartAssessments}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg px-8 py-4"
        >
          <Target className="h-5 w-5 mr-2" />
          Start Your Assessments
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>

        <Button
          onClick={onViewProfile}
          variant="outline"
          size="lg"
          className="text-lg px-8 py-4 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <Users className="h-5 w-5 mr-2" />
          View Full Profile
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="p-4 text-center bg-gradient-to-br from-slate-800/30 to-slate-700/20 border border-slate-600/30">
          <div className="text-2xl font-bold text-blue-400">{answers.length}</div>
          <div className="text-sm text-gray-400">Questions Answered</div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-slate-800/30 to-slate-700/20 border border-slate-600/30">
          <div className="text-2xl font-bold text-purple-400">{generatedAssessments.length}</div>
          <div className="text-sm text-gray-400">Personalized Assessments</div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-slate-800/30 to-slate-700/20 border border-slate-600/30">
          <div className="text-2xl font-bold text-green-400">{aiProfile.recommendedPaths.length}</div>
          <div className="text-sm text-gray-400">Recommended Paths</div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-slate-800/30 to-slate-700/20 border border-slate-600/30">
          <div className="text-2xl font-bold text-yellow-400">AI</div>
          <div className="text-sm text-gray-400">Powered Analysis</div>
        </Card>
      </motion.div>
    </div>
  );
}
