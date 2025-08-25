"use client"

import React, { useState } from 'react';
import { IntelligentSignup } from '@/components/onboarding/intelligent-signup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, CheckCircle, Target } from 'lucide-react';

export default function OnboardingDemoPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [personalizationResult, setPersonalizationResult] = useState<any>(null);

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    
    // Simulate AI personalization result
    const mockPersonalization = {
      confidence: 92,
      personalizedContent: {
        welcomeMessage: `Welcome ${data.currentRole}! Based on your goal of ${data.primaryGoal?.replace('_', ' ')}, we've created a personalized learning journey.`,
        prioritySkills: ['JavaScript ES6+', 'React Hooks', 'API Integration', 'Testing', 'Performance Optimization'],
        quickWins: [
          'Complete JavaScript fundamentals assessment',
          'Build a simple React component',
          'Practice API calls with fetch',
          'Write your first unit test'
        ],
        focusAreas: data.preferredDomains || ['programming'],
        difficultyLevel: data.experience === '0-1' ? 'beginner' : data.experience === '2-3' ? 'intermediate' : 'advanced'
      },
      assessmentPlan: {
        initialDifficulty: data.experience === '0-1' ? 'beginner' : 'intermediate',
        assessmentSequence: [
          {
            title: 'JavaScript Fundamentals',
            difficulty: 'beginner',
            estimatedTime: 30,
            priority: 'high'
          },
          {
            title: 'React Basics',
            difficulty: 'intermediate',
            estimatedTime: 45,
            priority: 'high'
          }
        ]
      },
      learningPath: {
        pathName: `Personalized ${data.preferredDomains?.[0] || 'Development'} Journey`,
        estimatedDuration: data.timeCommitment === '15min' ? '8 weeks' : '4 weeks',
        modules: [
          {
            title: 'Foundation Skills',
            duration: '1 week',
            difficulty: 'beginner'
          },
          {
            title: 'Practical Projects',
            duration: '2 weeks',
            difficulty: 'intermediate'
          }
        ]
      }
    };
    
    setPersonalizationResult(mockPersonalization);
    setShowOnboarding(false);
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <IntelligentSignup
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <Brain className="h-10 w-10 mr-4 text-cyan-400" />
            AI-Powered Onboarding Demo
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience how Corp1o1 uses AI to create personalized learning experiences from the moment you sign up.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {!personalizationResult ? (
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Sparkles className="h-6 w-6 mr-3 text-purple-400" />
                  Try the Intelligent Onboarding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-300 text-lg">
                  Our AI-powered onboarding asks strategic questions to understand your goals, experience, 
                  and learning preferences, then creates a completely personalized experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">What We Collect:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Professional background & goals</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Experience level & time availability</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Learning preferences & interests</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Preferred domains & skill areas</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">What AI Creates:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-300">
                        <Brain className="h-4 w-4 text-cyan-400 mr-2" />
                        <span>Personalized assessment plan</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Brain className="h-4 w-4 text-cyan-400 mr-2" />
                        <span>Custom learning paths</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Brain className="h-4 w-4 text-cyan-400 mr-2" />
                        <span>Tailored content recommendations</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Brain className="h-4 w-4 text-cyan-400 mr-2" />
                        <span>Motivational strategy</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => setShowOnboarding(true)}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8 py-4 text-lg"
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Start Intelligent Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center">
                    <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                    Personalization Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg text-white">AI Confidence:</span>
                    <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
                      {personalizationResult.confidence}%
                    </Badge>
                  </div>
                  <p className="text-gray-300">{personalizationResult.personalizedContent.welcomeMessage}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="h-5 w-5 mr-2 text-cyan-400" />
                      Priority Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {personalizationResult.personalizedContent.prioritySkills.map((skill: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <div className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <span className="text-gray-300">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
                      Quick Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {personalizationResult.personalizedContent.quickWins.map((win: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-gray-300">{win}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-cyan-400" />
                    Your Personalized Learning Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-semibold">{personalizationResult.learningPath.pathName}</h3>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {personalizationResult.learningPath.estimatedDuration}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {personalizationResult.learningPath.modules.map((module: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div>
                            <span className="text-white font-medium">{module.title}</span>
                            <p className="text-gray-400 text-sm">{module.duration}</p>
                          </div>
                          <Badge className={
                            module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            module.difficulty === 'intermediate' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }>
                            {module.difficulty}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button 
                  onClick={() => {
                    setPersonalizationResult(null);
                    setShowOnboarding(true);
                  }}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700 mr-4"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}