"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface OnboardingQuestion {
  questionId: string;
  question: string;
  description: string;
  type: 'multiple_choice' | 'multiple_select' | 'short_answer' | 'essay';
  category: string;
  options?: Array<{
    id: string;
    text: string;
    value: any;
  }>;
  expectedLength?: {
    min: number;
    max: number;
  };
  flow: {
    order: number;
    required: boolean;
  };
}

interface OnboardingAnswer {
  questionId: string;
  answer: any;
  timeSpent: number;
}

interface OnboardingFlowProps {
  sessionId: string;
  questions: OnboardingQuestion[];
  onComplete: (results: any) => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ sessionId, questions, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setCurrentAnswer(null);
    setAiAnalysis(null);
  }, [currentQuestionIndex]);

  const handleAnswerChange = (value: any) => {
    setCurrentAnswer(value);
  };

  const handleNext = async () => {
    if (!currentAnswer && currentQuestion.flow.required) {
      return; // Don't proceed without answer for required questions
    }

    setIsSubmitting(true);

    try {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      
      // Submit answer to backend
      const response = await fetch(`/api/onboarding/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.questionId,
          answer: currentAnswer,
          timeSpent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const result = await response.json();
      
      // Store answer locally
      setAnswers(prev => [...prev, {
        questionId: currentQuestion.questionId,
        answer: currentAnswer,
        timeSpent
      }]);

      // Show AI analysis if available
      if (result.data.aiAnalysis) {
        setAiAnalysis(result.data.aiAnalysis);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Show analysis for 2 seconds
      }

      // Move to next question or complete
      if (isLastQuestion) {
        await handleComplete();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    try {
      // Wait for backend to complete onboarding processing
      const maxWaitTime = 30000; // 30 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        const statusResponse = await fetch(`/api/onboarding/sessions/${sessionId}/status`);
        const statusData = await statusResponse.json();
        
        if (statusData.data.status === 'completed') {
          // Get final results
          const resultsResponse = await fetch(`/api/onboarding/sessions/${sessionId}/results`);
          const resultsData = await resultsResponse.json();
          
          onComplete(resultsData.data);
          return;
        }
        
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error('Onboarding processing timeout');
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.id} />
                  <Label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'multiple_select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={Array.isArray(currentAnswer) ? currentAnswer.includes(option.value) : false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleAnswerChange([...(currentAnswer || []), option.value]);
                    } else {
                      handleAnswerChange((currentAnswer || []).filter((v: any) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <Textarea
            placeholder="Type your answer here..."
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="min-h-[100px]"
            maxLength={currentQuestion.expectedLength?.max}
          />
        );

      case 'essay':
        return (
          <Textarea
            placeholder="Write your detailed response here..."
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="min-h-[150px]"
            maxLength={currentQuestion.expectedLength?.max}
          />
        );

      default:
        return null;
    }
  };

  const renderAIAnalysis = () => {
    if (!aiAnalysis) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">AI Analysis</span>
        </div>
        <div className="space-y-2">
          {aiAnalysis.insights?.map((insight: string, index: number) => (
            <div key={index} className="text-sm text-gray-300">
              • {insight}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (isProcessing) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-blue-400" />
        </motion.div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            <Sparkles className="inline h-5 w-5 mr-2 text-purple-400" />
            AI is analyzing your responses
          </h3>
          <p className="text-gray-400">
            Creating your personalized learning profile and assessments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">
              Let's personalize your experience
            </h2>
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>Getting to know you</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.questionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.category.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.type.replace('_', ' ')}
                </Badge>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">
                {currentQuestion.question}
              </h3>
              
              {currentQuestion.description && (
                <p className="text-gray-400 text-sm">
                  {currentQuestion.description}
                </p>
              )}
            </div>

            {/* Question Input */}
            <div className="mb-6">
              {renderQuestionInput()}
            </div>

            {/* AI Analysis Display */}
            {renderAIAnalysis()}

            {/* Character Count for Text Inputs */}
            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && 
             currentQuestion.expectedLength && (
              <div className="text-xs text-gray-500 text-right mb-4">
                {currentAnswer?.length || 0} / {currentQuestion.expectedLength.max} characters
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {onSkip && currentQuestionIndex === 0 && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-gray-400 hover:text-white"
                  >
                    Skip onboarding
                  </Button>
                )}
              </div>

              <Button
                onClick={handleNext}
                disabled={!currentAnswer && currentQuestion.flow.required || isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Complete
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/30 to-slate-700/20 border border-slate-600/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Quick Tips</span>
        </div>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Be honest - this helps us create the best experience for you</li>
          <li>• Take your time - there are no wrong answers</li>
          <li>• Your responses help AI generate personalized assessments</li>
        </ul>
      </div>
    </div>
  );
}
