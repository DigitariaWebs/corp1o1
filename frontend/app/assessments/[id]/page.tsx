"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Send,
  Sparkles,
  User,
  Award,
  Target,
  BookOpen,
  Lightbulb,
  Heart,
  Zap,
  MessageSquare,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { MainNavigation } from "@/components/navigation/main-navigation";
import { AssessmentTimer } from "@/components/assessments/assessment-timer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { RootState, AppDispatch } from '@/lib/redux/store';
import {
  startAssessment,
  setQuestions,
  answerQuestion,
  nextQuestion,
  previousQuestion,
  completeAssessment,
  abandonAssessment,
  resetAssessment,
  generateAssessmentQuestions,
  evaluateAnswer,
  setEvaluationResult
} from '@/lib/redux/slices/assessmentSlice';

// AI Personality configurations
const AI_PERSONALITIES = {
  ARIA: {
    name: "ARIA",
    icon: Heart,
    color: "text-pink-400",
    bgColor: "bg-gradient-to-br from-pink-500/20 to-purple-500/20",
    borderColor: "border-pink-400/30",
    description: "Encouraging & Supportive",
    traits: ["Motivational", "Patient", "Empathetic"],
    greeting: "Hi there! I'm ARIA, your supportive learning companion. I'm here to encourage you every step of the way! 🌟",
  },
  SAGE: {
    name: "SAGE",
    icon: BookOpen,
    color: "text-cyan-400",
    bgColor: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-400/30",
    description: "Analytical & Detailed",
    traits: ["Precise", "Thorough", "Knowledgeable"],
    greeting: "Greetings! I'm SAGE, your analytical guide. I'll provide detailed insights and comprehensive explanations.",
  },
  COACH: {
    name: "COACH",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-400/30",
    description: "Motivational & Goal-Oriented",
    traits: ["Dynamic", "Results-focused", "Challenging"],
    greeting: "Ready to excel? I'm COACH, and I'm here to push you towards your peak performance! Let's achieve greatness together! 💪",
  }
};

export default function ReduxAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, getToken } = useAuth();
  
  // Redux state
  const { 
    currentSession,
    isLoading,
    isGeneratingQuestions,
    isEvaluating,
    evaluationResults,
    error 
  } = useSelector((state: RootState) => state.assessment);

  // Local state
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [selectedPersonality, setSelectedPersonality] = useState<keyof typeof AI_PERSONALITIES>('ARIA');
  const [aiMessages, setAiMessages] = useState<Array<{role: 'ai' | 'user', content: string}>>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Mock user for navigation
  const mockUser = {
    name: user?.name || "Student",
    avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  };

  // Check for existing session on mount and handle refresh
  useEffect(() => {
    // Check if there's an existing session
    if (currentSession && currentSession.assessmentId === params.id) {
      // Session exists, check if it's from a refresh
      const sessionAge = Date.now() - new Date(currentSession.startTime).getTime();
      if (sessionAge > 3600000) { // More than 1 hour old
        // Reset old session
        dispatch(resetAssessment());
        toast.error("Your previous session has expired. Starting a new assessment.");
      } else {
        // Resume existing session
        toast.info("Resuming your assessment session");
      }
    }

    // Handle page refresh warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentSession && currentSession.status === 'in_progress') {
        e.preventDefault();
        e.returnValue = 'Your assessment progress will be lost if you leave. Are you sure?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSession, params.id, dispatch]);

  // Start assessment and generate questions
  const handleStartAssessment = async () => {
    setIsStarting(true);
    
    try {
      // Start the assessment session
      dispatch(startAssessment({
        assessmentId: params.id as string,
        assessmentTitle: "Assessment", // Placeholder until details fetched
        aiPersonality: selectedPersonality
      }));

      // Generate questions using AI
      const token = await getToken();
      const generated = await dispatch(generateAssessmentQuestions({
        assessmentId: params.id as string,
        title: "Assessment",
        category: "General",
        difficulty: "intermediate",
        questionCount: 10,
        token: token || null
      })).unwrap();

      // Explicitly set questions in case extraReducers didn't run yet
      if (!generated || !Array.isArray(generated) || generated.length === 0) {
        // Synthesize minimal fallback UI question to keep flow
        dispatch(setQuestions([
          {
            id: 'fallback_q1',
            type: 'multiple_choice',
            question: 'Fallback question: which option is correct?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            points: 10,
            difficulty: 'easy',
            timeLimit: 120,
            hints: ['Try picking A'],
            explanation: 'Fallback generated while AI was unavailable.'
          }
        ] as any));
      } else {
        dispatch(setQuestions(generated as any));
      }

      // Initialize AI greeting
      const personality = AI_PERSONALITIES[selectedPersonality];
      setAiMessages([{
        role: 'ai',
        content: personality.greeting
      }]);

      toast.success("Assessment started! Good luck!");
    } catch (error) {
      console.error('Failed to start assessment:', error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (currentSession) {
      const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
      dispatch(answerQuestion({ 
        questionId: currentQuestion.id, 
        answer 
      }));
    }
  };

  // Handle text answer change
  const handleTextAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAnswer(e.target.value);
  };

  // Evaluate current answer
  const handleEvaluateAnswer = async () => {
    if (!currentSession) return;
    
    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    const answer = currentQuestion.type === 'text' || currentQuestion.type === 'essay' 
      ? textAnswer 
      : selectedAnswer;

    if (!answer) {
      toast.error("Please provide an answer before submitting");
      return;
    }

    try {
      // Save answer
      dispatch(answerQuestion({ 
        questionId: currentQuestion.id, 
        answer 
      }));

      // For text/essay questions, evaluate with AI
      if (currentQuestion.type === 'text' || currentQuestion.type === 'essay') {
        const token = await getToken();
        const result = await dispatch(evaluateAnswer({
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          answer: textAnswer,
          personality: selectedPersonality,
          difficulty: currentQuestion.difficulty,
          points: currentQuestion.points,
          token: token || null
        })).unwrap();

        // Show AI feedback
        setAiMessages(prev => [...prev, {
          role: 'ai',
          content: result.evaluation.feedback || "Great answer! Keep up the good work!"
        }]);
      } else if (currentQuestion.type === 'multiple_choice') {
        // For multiple choice, check immediately
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        const personality = AI_PERSONALITIES[selectedPersonality];
        
        dispatch(setEvaluationResult({
          questionId: currentQuestion.id,
          result: {
            correct: isCorrect,
            score: isCorrect ? currentQuestion.points : 0,
            feedback: isCorrect 
              ? `Excellent! ${personality.traits[0]} approach!`
              : `Not quite. The correct answer was "${currentQuestion.correctAnswer}". Keep learning!`
          }
        }));

        setAiMessages(prev => [...prev, {
          role: 'ai',
          content: isCorrect 
            ? `✅ Correct! Well done!`
            : `Let's learn from this. The correct answer was "${currentQuestion.correctAnswer}".`
        }]);
      }

      setShowFeedback(true);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      toast.error("Failed to evaluate answer. Please try again.");
    }
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (!currentSession) return;
    
    if (currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
      dispatch(nextQuestion());
      setSelectedAnswer("");
      setTextAnswer("");
      setShowFeedback(false);
    } else {
      // Complete assessment
      handleCompleteAssessment();
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    dispatch(previousQuestion());
    setSelectedAnswer("");
    setTextAnswer("");
    setShowFeedback(false);
  };

  // Complete assessment
  const handleCompleteAssessment = async () => {
    if (!currentSession) return;

    // Calculate final score
    const totalPoints = currentSession.questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = Object.entries(evaluationResults).reduce((sum, [qId, result]: [string, any]) => {
      return sum + (result.score || 0);
    }, 0);
    const finalScore = Math.round((earnedPoints / totalPoints) * 100);

    dispatch(completeAssessment({
      score: finalScore,
      feedback: evaluationResults
    }));

    toast.success(`Assessment complete! Your score: ${finalScore}%`);
    router.push('/assessments');
  };

  // Handle time up
  const handleTimeUp = () => {
    toast.warning("Time's up! Submitting your assessment...");
    handleCompleteAssessment();
  };

  // Handle assessment abandonment
  const handleAbandonAssessment = () => {
    if (confirm("Are you sure you want to abandon this assessment? All progress will be lost.")) {
      dispatch(abandonAssessment());
      router.push('/assessments');
    }
  };

  // Show loading or empty state
  if (isLoading || isGeneratingQuestions || isStarting || (currentSession && currentSession.questions.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation user={mockUser} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center h-96">
            <Brain className="h-12 w-12 text-cyan-400 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {"AI is generating your personalized questions..."}
            </h2>
            <p className="text-gray-400">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen if no session
  if (!currentSession || currentSession.status === 'not_started') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <MainNavigation user={mockUser} />
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Button 
            onClick={() => router.push('/assessments')} 
            variant="ghost" 
            className="text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
            <div className="p-8">
              <div className="text-center mb-8">
                <Target className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">Ready to Start Your Assessment?</h1>
                <p className="text-gray-400">Choose your AI companion and begin your personalized assessment</p>
              </div>

              {/* AI Personality Selector */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Choose Your AI Assistant</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(AI_PERSONALITIES).map(([key, personality]) => {
                    const Icon = personality.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedPersonality(key as keyof typeof AI_PERSONALITIES)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all",
                          selectedPersonality === key
                            ? `${personality.bgColor} ${personality.borderColor}`
                            : "bg-slate-700/50 border-slate-600/30 hover:bg-slate-700"
                        )}
                      >
                        <Icon className={cn("h-8 w-8 mx-auto mb-2", personality.color)} />
                        <div className="font-semibold text-white">{personality.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{personality.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2 justify-center">
                          {personality.traits.map((trait, idx) => (
                            <Badge key={idx} className="text-xs" variant="outline">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleStartAssessment}
                  disabled={isStarting}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Assessment with {AI_PERSONALITIES[selectedPersonality].name}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main assessment interface
  const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
  const progressPercentage = ((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100;
  const currentEvaluation = evaluationResults[currentQuestion?.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header with Timer */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <Button 
              onClick={handleAbandonAssessment} 
              variant="ghost" 
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Assessment
            </Button>
            
            <AssessmentTimer 
              duration={currentSession.questions.length * 120} // 2 minutes per question
              onTimeUp={handleTimeUp}
              showWarning={true}
              className="max-w-sm"
            />
          </div>
          
          {/* Progress */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">{currentSession.assessmentTitle}</h2>
              <Badge className="bg-cyan-500/20 text-cyan-400">
                Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <div className="p-6">
                {currentQuestion && (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-medium text-white flex-1">
                        {currentQuestion.question}
                      </h3>
                      <div className="flex gap-2 ml-4">
                        <Badge className={cn(
                          "text-xs",
                          currentQuestion.difficulty === 'easy' && "bg-green-500/20 text-green-400",
                          currentQuestion.difficulty === 'medium' && "bg-yellow-500/20 text-yellow-400",
                          currentQuestion.difficulty === 'hard' && "bg-red-500/20 text-red-400"
                        )}>
                          {currentQuestion.difficulty}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {currentQuestion.points} pts
                        </Badge>
                      </div>
                    </div>

                    {/* Answer Area */}
                    {currentQuestion.type === 'multiple_choice' && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 && (
                      <RadioGroup 
                        value={selectedAnswer} 
                        onValueChange={handleAnswerSelect}
                        disabled={showFeedback}
                      >
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={option} 
                                id={`option-${index}`}
                                disabled={showFeedback}
                              />
                              <Label 
                                htmlFor={`option-${index}`} 
                                className={cn(
                                  "text-gray-300 cursor-pointer hover:text-white transition-colors flex-1",
                                  showFeedback && option === currentQuestion.correctAnswer && "text-green-400",
                                  showFeedback && option === selectedAnswer && option !== currentQuestion.correctAnswer && "text-red-400"
                                )}
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    {(currentQuestion.type === 'text' || currentQuestion.type === 'essay') && (
                      <Textarea
                        value={textAnswer}
                        onChange={handleTextAnswerChange}
                        placeholder={currentQuestion.type === 'essay' 
                          ? "Write your detailed answer here..." 
                          : "Type your answer here..."}
                        className="min-h-[200px] bg-slate-700 border-slate-600 text-white"
                        disabled={showFeedback}
                      />
                    )}

                    {/* Hints */}
                    {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5" />
                          <div>
                            <p className="text-blue-400 text-sm font-medium mb-1">Hint</p>
                            <p className="text-gray-300 text-sm">{currentQuestion.hints[0]}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feedback Section */}
                    <AnimatePresence>
                      {showFeedback && currentEvaluation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "mt-4 p-4 rounded-lg",
                            currentEvaluation.correct ? "bg-green-500/20 border border-green-400/30" : "bg-amber-500/20 border border-amber-400/30"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {currentEvaluation.correct ? (
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-white font-medium mb-1">
                                {currentEvaluation.score !== undefined 
                                  ? `Score: ${currentEvaluation.score}/${currentQuestion.points} points`
                                  : currentEvaluation.correct ? 'Correct!' : 'Not quite right'}
                              </p>
                              <p className="text-gray-300 text-sm">{currentEvaluation.feedback}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex justify-between mt-6">
                      <Button
                        onClick={handlePreviousQuestion}
                        variant="outline"
                        disabled={currentSession.currentQuestionIndex === 0}
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>

                      {!showFeedback ? (
                        <Button
                          onClick={handleEvaluateAnswer}
                          disabled={
                            isEvaluating || 
                            (currentQuestion.type === 'multiple_choice' && !selectedAnswer) ||
                            ((currentQuestion.type === 'text' || currentQuestion.type === 'essay') && !textAnswer.trim())
                          }
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              Submit Answer
                              <Send className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNextQuestion}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                          {currentSession.currentQuestionIndex === currentSession.questions.length - 1 ? 'Finish' : 'Next'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* AI Assistant Sidebar */}
          <div className="space-y-4">
            {/* AI Chat */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  {AI_PERSONALITIES[currentSession.aiPersonality].name} Assistant
                </h3>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                  {aiMessages.map((message, index) => {
                    const personality = AI_PERSONALITIES[currentSession.aiPersonality];
                    const Icon = message.role === 'ai' ? personality.icon : User;
                    return (
                      <div key={index} className={cn(
                        "flex gap-3",
                        message.role === 'user' && "flex-row-reverse"
                      )}>
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          message.role === 'ai' ? personality.bgColor : "bg-slate-700"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            message.role === 'ai' ? personality.color : "text-gray-400"
                          )} />
                        </div>
                        <div className={cn(
                          "flex-1 p-3 rounded-lg",
                          message.role === 'ai' 
                            ? "bg-slate-700/50 border border-slate-600/30" 
                            : "bg-cyan-500/20 border border-cyan-400/30"
                        )}>
                          <p className="text-sm text-gray-300">{message.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Personality Traits */}
                <div className="border-t border-slate-600/30 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {AI_PERSONALITIES[currentSession.aiPersonality].traits.map((trait, index) => (
                      <Badge 
                        key={index}
                        className={cn(
                          "text-xs",
                          AI_PERSONALITIES[currentSession.aiPersonality].bgColor,
                          AI_PERSONALITIES[currentSession.aiPersonality].borderColor
                        )}
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Question Navigation */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Questions</h3>
                <div className="grid grid-cols-5 gap-2">
                  {currentSession.questions.map((q, idx) => {
                    const isAnswered = currentSession.answers[q.id] !== undefined;
                    const isCurrent = idx === currentSession.currentQuestionIndex;
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          if (idx !== currentSession.currentQuestionIndex) {
                            setSelectedAnswer("");
                            setTextAnswer("");
                            setShowFeedback(false);
                            // Navigate to question
                            for (let i = currentSession.currentQuestionIndex; i !== idx; ) {
                              if (i < idx) {
                                dispatch(nextQuestion());
                                i++;
                              } else {
                                dispatch(previousQuestion());
                                i--;
                              }
                            }
                          }
                        }}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                          isCurrent && "ring-2 ring-cyan-400 bg-cyan-500/20 text-cyan-400",
                          !isCurrent && isAnswered && "bg-green-500/20 text-green-400",
                          !isCurrent && !isAnswered && "bg-slate-700/50 text-gray-400 hover:bg-slate-700"
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}