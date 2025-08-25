"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Briefcase, 
  GraduationCap,
  TrendingUp,
  Users,
  Code,
  Palette,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Clock,
  Award,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { AILoading } from '@/components/loading/ai-loading';

interface OnboardingData {
  // Professional Background
  currentRole?: string;
  experience?: string;
  industry?: string;
  company?: string;
  
  // Goals & Aspirations
  primaryGoal?: string;
  careerGoals?: string[];
  timeCommitment?: string;
  preferredLearningStyle?: string;
  
  // Skills & Interests
  currentSkills?: string[];
  skillsToImprove?: string[];
  preferredDomains?: string[];
  
  // AI Personalization Preferences
  assessmentDifficulty?: string;
  contentType?: string;
  motivationStyle?: string;
  feedbackPreference?: string;
}

interface IntelligentSignupProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export function IntelligentSignup({ onComplete, onSkip }: IntelligentSignupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isGeneratingPersonalization, setIsGeneratingPersonalization] = useState(false);
  const [aiLoadingStage, setAiLoadingStage] = useState("Analyzing your profile");

  const totalSteps = 5;

  const primaryGoals = [
    { id: 'career_growth', label: 'Career Growth', icon: TrendingUp, description: 'Advance in my current field' },
    { id: 'skill_development', label: 'Skill Development', icon: Target, description: 'Learn new technical skills' },
    { id: 'career_change', label: 'Career Change', icon: Briefcase, description: 'Transition to a new field' },
    { id: 'certification', label: 'Certification', icon: Award, description: 'Earn industry certifications' },
    { id: 'leadership', label: 'Leadership', icon: Users, description: 'Develop leadership abilities' },
    { id: 'entrepreneurship', label: 'Entrepreneurship', icon: Lightbulb, description: 'Start my own business' }
  ];

  const skillDomains = [
    { id: 'programming', label: 'Programming & Development', icon: Code, color: 'from-cyan-500 to-blue-600' },
    { id: 'design', label: 'Design & Creativity', icon: Palette, color: 'from-purple-500 to-pink-600' },
    { id: 'analytics', label: 'Data & Analytics', icon: BarChart3, color: 'from-amber-500 to-orange-600' },
    { id: 'communication', label: 'Communication & Marketing', icon: MessageSquare, color: 'from-green-500 to-teal-600' },
    { id: 'leadership', label: 'Leadership & Management', icon: Users, color: 'from-red-500 to-pink-600' },
    { id: 'business', label: 'Business & Strategy', icon: Briefcase, color: 'from-indigo-500 to-purple-600' }
  ];

  const learningStyles = [
    { id: 'hands_on', label: 'Hands-on Practice', icon: Target, description: 'Learn by doing projects and exercises' },
    { id: 'structured', label: 'Structured Learning', icon: GraduationCap, description: 'Follow step-by-step courses' },
    { id: 'bite_sized', label: 'Bite-sized Content', icon: Clock, description: 'Short, focused lessons' },
    { id: 'interactive', label: 'Interactive & Gamified', icon: Zap, description: 'Engaging, game-like experience' }
  ];

  const timeCommitments = [
    { id: '15min', label: '15 mins/day', description: 'Quick daily sessions' },
    { id: '30min', label: '30 mins/day', description: 'Moderate daily commitment' },
    { id: '1hour', label: '1 hour/day', description: 'Focused daily learning' },
    { id: 'weekends', label: 'Weekends only', description: 'Intensive weekend sessions' },
    { id: 'flexible', label: 'Flexible schedule', description: 'When I have time' }
  ];

  const updateOnboardingData = (key: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayToggle = (key: keyof OnboardingData, value: string) => {
    const currentArray = (onboardingData[key] as string[]) || [];
    const updated = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateOnboardingData(key, updated);
  };

  const generateAIPersonalization = async () => {
    setIsGeneratingPersonalization(true);
    
    try {
      // Stage 1: Analyzing profile
      setAiLoadingStage("Analyzing your profile");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Stage 2: Identifying goals
      setAiLoadingStage("Identifying learning goals");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Stage 3: Creating curriculum
      setAiLoadingStage("Creating personalized curriculum");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Stage 4: Optimizing path
      setAiLoadingStage("Optimizing learning path");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Stage 5: Finalizing
      setAiLoadingStage("Finalizing your experience");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the completion callback with onboarding data
      // The parent component will handle the actual API call
      onComplete(onboardingData);
    } catch (error) {
      console.error('Error during AI personalization:', error);
      setIsGeneratingPersonalization(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      generateAIPersonalization();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.primaryGoal && onboardingData.currentRole;
      case 2:
        return onboardingData.preferredDomains && onboardingData.preferredDomains.length > 0;
      case 3:
        return onboardingData.experience && onboardingData.timeCommitment;
      case 4:
        return onboardingData.preferredLearningStyle;
      case 5:
        return true; // Final confirmation step
      default:
        return false;
    }
  };

  if (isGeneratingPersonalization) {
    return <AILoading stage={aiLoadingStage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-cyan-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Welcome to Corp1o1</h1>
          </div>
          <p className="text-xl text-gray-300 mb-6">
            Let's personalize your learning experience with AI
          </p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i + 1 <= currentStep ? 'bg-cyan-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Goals & Role */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <Target className="h-6 w-6 mr-3 text-cyan-400" />
                      What's your primary goal?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {primaryGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => updateOnboardingData('primaryGoal', goal.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            onboardingData.primaryGoal === goal.id
                              ? 'border-cyan-400 bg-cyan-400/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start">
                            <goal.icon className="h-6 w-6 text-cyan-400 mr-3 mt-1" />
                            <div>
                              <h3 className="text-white font-medium">{goal.label}</h3>
                              <p className="text-gray-400 text-sm">{goal.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <label className="text-white font-medium">What's your current role?</label>
                      <Input
                        placeholder="e.g., Software Engineer, Marketing Manager, Student..."
                        value={onboardingData.currentRole || ''}
                        onChange={(e) => updateOnboardingData('currentRole', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Skill Domains */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <Sparkles className="h-6 w-6 mr-3 text-purple-400" />
                      Which areas interest you most?
                    </CardTitle>
                    <p className="text-gray-400">Select all that apply - this helps us customize your assessments</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillDomains.map((domain) => (
                        <button
                          key={domain.id}
                          onClick={() => handleArrayToggle('preferredDomains', domain.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            (onboardingData.preferredDomains || []).includes(domain.id)
                              ? 'border-cyan-400 bg-cyan-400/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${domain.color} flex items-center justify-center mr-4`}>
                              <domain.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-white font-medium">{domain.label}</h3>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Experience & Time */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <Clock className="h-6 w-6 mr-3 text-amber-400" />
                      Tell us about your experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-white font-medium">Years of professional experience</label>
                      <select
                        value={onboardingData.experience || ''}
                        onChange={(e) => updateOnboardingData('experience', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="">Select experience level</option>
                        <option value="0-1">0-1 years (Entry level)</option>
                        <option value="2-3">2-3 years (Junior)</option>
                        <option value="4-6">4-6 years (Mid-level)</option>
                        <option value="7-10">7-10 years (Senior)</option>
                        <option value="10+">10+ years (Expert)</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="text-white font-medium">How much time can you dedicate to learning?</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {timeCommitments.map((time) => (
                          <button
                            key={time.id}
                            onClick={() => updateOnboardingData('timeCommitment', time.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              onboardingData.timeCommitment === time.id
                                ? 'border-cyan-400 bg-cyan-400/10'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <h3 className="text-white font-medium">{time.label}</h3>
                            <p className="text-gray-400 text-sm">{time.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Learning Style */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <GraduationCap className="h-6 w-6 mr-3 text-green-400" />
                      How do you prefer to learn?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {learningStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => updateOnboardingData('preferredLearningStyle', style.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            onboardingData.preferredLearningStyle === style.id
                              ? 'border-cyan-400 bg-cyan-400/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start">
                            <style.icon className="h-6 w-6 text-cyan-400 mr-3 mt-1" />
                            <div>
                              <h3 className="text-white font-medium">{style.label}</h3>
                              <p className="text-gray-400 text-sm">{style.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <Sparkles className="h-6 w-6 mr-3 text-purple-400" />
                      Ready to create your personalized experience?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                      <h3 className="text-white font-semibold mb-4">Your preferences:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Primary goal:</span>
                          <p className="text-white capitalize">{onboardingData.primaryGoal?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Current role:</span>
                          <p className="text-white">{onboardingData.currentRole}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Experience:</span>
                          <p className="text-white">{onboardingData.experience} years</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Time commitment:</span>
                          <p className="text-white">{timeCommitments.find(t => t.id === onboardingData.timeCommitment)?.label}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-400">Interested domains:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(onboardingData.preferredDomains || []).map(domain => (
                              <Badge key={domain} className="bg-cyan-500/20 text-cyan-400">
                                {skillDomains.find(d => d.id === domain)?.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-cyan-400" />
                        What happens next?
                      </h4>
                      <div className="space-y-2 text-gray-300">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>AI will generate personalized assessments based on your goals</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Custom learning paths will be created for your interests</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Content difficulty will match your experience level</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Recommendations will align with your preferred learning style</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-4">
              {currentStep > 1 && (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              
              <Button
                onClick={onSkip}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Skip for now
              </Button>
            </div>

            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {currentStep === totalSteps ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create My Experience
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}