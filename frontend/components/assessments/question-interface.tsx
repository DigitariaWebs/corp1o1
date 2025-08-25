"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Code, 
  FileText, 
  CheckCircle,
  Circle,
  Edit3,
  Terminal,
  Lightbulb,
  Zap,
  Clock,
  Target,
  Eye,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Question {
  questionId: string;
  type: 'multiple_choice' | 'essay' | 'coding_challenge' | 'ai_evaluation';
  question: string;
  options?: Array<{ id: string; text: string; }>;
  points: number;
  estimatedTimeMinutes: number;
  codeTemplate?: string;
  language?: string;
  testCases?: Array<{ input: string; expectedOutput: string; }>;
}

interface QuestionInterfaceProps {
  question: Question;
  answer: any;
  onAnswerChange: (answer: any) => void;
  questionNumber: number;
  totalQuestions: number;
  aiInsights?: {
    difficulty: string;
    expectedTime: number;
    hint?: string;
  };
}

const QuestionInterface: React.FC<QuestionInterfaceProps> = ({
  question,
  answer,
  onAnswerChange,
  questionNumber,
  totalQuestions,
  aiInsights
}) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [codeExecuting, setCodeExecuting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Timer for tracking time spent on current question
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset timer when question changes
  useEffect(() => {
    setTimeSpent(0);
    setShowHint(false);
    setTestResults([]);
  }, [question.questionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case 'multiple_choice': return CheckCircle;
      case 'essay': return FileText;
      case 'coding_challenge': return Code;
      case 'ai_evaluation': return Brain;
      default: return Target;
    }
  };

  const getQuestionTypeColor = () => {
    switch (question.type) {
      case 'multiple_choice': return 'from-blue-500 to-cyan-600';
      case 'essay': return 'from-green-500 to-teal-600';
      case 'coding_challenge': return 'from-purple-500 to-pink-600';
      case 'ai_evaluation': return 'from-amber-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getQuestionTypeLabel = () => {
    switch (question.type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'essay': return 'Essay Question';
      case 'coding_challenge': return 'Coding Challenge';
      case 'ai_evaluation': return 'AI Evaluation';
      default: return 'Question';
    }
  };

  const handleMultipleChoiceAnswer = (optionId: string) => {
    onAnswerChange(optionId);
  };

  const handleEssayAnswer = (text: string) => {
    onAnswerChange(text);
  };

  const handleCodeAnswer = (code: string) => {
    onAnswerChange(code);
  };

  const executeCode = async () => {
    if (!answer || question.type !== 'coding_challenge') return;
    
    setCodeExecuting(true);
    try {
      // Mock code execution - in real implementation, this would call a code execution API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = question.testCases?.map((testCase, index) => ({
        index: index + 1,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: testCase.expectedOutput, // Mock passing all tests
        passed: Math.random() > 0.3, // Random pass/fail for demo
        executionTime: Math.floor(Math.random() * 100) + 10
      })) || [];
      
      setTestResults(mockResults);
    } catch (error) {
      console.error('Code execution failed:', error);
    } finally {
      setCodeExecuting(false);
    }
  };

  const TypeIcon = getQuestionTypeIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg overflow-hidden"
    >
      {/* Question Header */}
      <div className={`bg-gradient-to-r ${getQuestionTypeColor()} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TypeIcon className="h-8 w-8 text-white mr-3" />
            <div>
              <h2 className="text-white font-bold text-xl">
                Question {questionNumber} of {totalQuestions}
              </h2>
              <p className="text-white/80 text-sm">{getQuestionTypeLabel()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-white font-bold text-lg">{question.points}</div>
              <div className="text-white/80 text-xs">Points</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">{formatTime(timeSpent)}</div>
              <div className="text-white/80 text-xs">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">{question.estimatedTimeMinutes}m</div>
              <div className="text-white/80 text-xs">Estimated</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Question Text */}
        <div className="mb-6">
          <h3 className="text-white font-semibold text-lg mb-3">{question.question}</h3>
          
          {/* AI Insights */}
          {aiInsights && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center mb-2">
                <Brain className="h-4 w-4 text-purple-400 mr-2" />
                <span className="text-purple-400 font-medium text-sm">AI Analysis</span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-300">
                <span>Difficulty: <Badge variant="secondary">{aiInsights.difficulty}</Badge></span>
                <span>Expected Time: {aiInsights.expectedTime}m</span>
                {aiInsights.hint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs h-auto p-1"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    {showHint ? 'Hide' : 'Show'} Hint
                  </Button>
                )}
              </div>
              
              {showHint && aiInsights.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-2 bg-amber-900/20 border border-amber-500/30 rounded text-amber-200 text-sm"
                >
                  💡 {aiInsights.hint}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Answer Interface */}
        <AnimatePresence mode="wait">
          {question.type === 'multiple_choice' && question.options && (
            <motion.div
              key="multiple-choice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleMultipleChoiceAnswer(option.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    answer === option.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answer === option.id
                        ? 'border-cyan-500 bg-cyan-500'
                        : 'border-gray-400'
                    }`}>
                      {answer === option.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-white font-medium">{option.id.toUpperCase()}.</span>
                    <span className="text-gray-300 ml-2">{option.text}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {question.type === 'essay' && (
            <motion.div
              key="essay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative">
                <Textarea
                  value={answer || ''}
                  onChange={(e) => handleEssayAnswer(e.target.value)}
                  placeholder="Type your detailed answer here..."
                  className="min-h-[200px] bg-slate-700 border-slate-600 text-white resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {(answer || '').length} characters
                </div>
              </div>
              
              {/* Real-time AI feedback */}
              <div className="p-3 bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <Activity className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-green-400 font-medium text-sm">Real-time Analysis</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Clarity:</span>
                    <div className="flex items-center">
                      <div className="flex-1 h-1 bg-slate-600 rounded mr-2">
                        <div className="h-1 bg-green-400 rounded" style={{ width: '75%' }} />
                      </div>
                      <span className="text-white">75%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Depth:</span>
                    <div className="flex items-center">
                      <div className="flex-1 h-1 bg-slate-600 rounded mr-2">
                        <div className="h-1 bg-yellow-400 rounded" style={{ width: '60%' }} />
                      </div>
                      <span className="text-white">60%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Relevance:</span>
                    <div className="flex items-center">
                      <div className="flex-1 h-1 bg-slate-600 rounded mr-2">
                        <div className="h-1 bg-cyan-400 rounded" style={{ width: '85%' }} />
                      </div>
                      <span className="text-white">85%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {question.type === 'coding_challenge' && (
            <motion.div
              key="coding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Code Editor */}
              <div className="bg-slate-900 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between p-3 border-b border-slate-600">
                  <div className="flex items-center">
                    <Terminal className="h-4 w-4 text-cyan-400 mr-2" />
                    <span className="text-white font-medium">
                      {question.language || 'JavaScript'}
                    </span>
                  </div>
                  <Button
                    onClick={executeCode}
                    disabled={codeExecuting || !answer}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {codeExecuting ? (
                      <Activity className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-1" />
                    )}
                    Run Code
                  </Button>
                </div>
                
                <Textarea
                  value={answer || question.codeTemplate || ''}
                  onChange={(e) => handleCodeAnswer(e.target.value)}
                  className="min-h-[300px] bg-transparent border-none text-white font-mono text-sm resize-none rounded-none"
                  placeholder="// Write your code here..."
                />
              </div>

              {/* Test Cases */}
              {question.testCases && question.testCases.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg border border-slate-600/50 p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Test Cases
                  </h4>
                  <div className="space-y-2">
                    {question.testCases.map((testCase, index) => (
                      <div key={index} className="p-2 bg-slate-700/50 rounded text-sm">
                        <div className="text-gray-400">Input: <span className="text-cyan-300 font-mono">{testCase.input}</span></div>
                        <div className="text-gray-400">Expected: <span className="text-green-300 font-mono">{testCase.expectedOutput}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 rounded-lg border border-slate-600/50 p-4"
                >
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Test Results
                  </h4>
                  <div className="space-y-2">
                    {testResults.map((result) => (
                      <div key={result.index} className={`p-3 rounded border ${
                        result.passed 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-red-900/20 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                            Test Case {result.index}: {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                          <span className="text-gray-400 text-xs">{result.executionTime}ms</span>
                        </div>
                        <div className="mt-1 text-sm">
                          <div className="text-gray-400">Input: <span className="text-cyan-300 font-mono">{result.input}</span></div>
                          <div className="text-gray-400">Expected: <span className="text-green-300 font-mono">{result.expected}</span></div>
                          <div className="text-gray-400">Actual: <span className={`font-mono ${result.passed ? 'text-green-300' : 'text-red-300'}`}>{result.actual}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {question.type === 'ai_evaluation' && (
            <motion.div
              key="ai-evaluation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-purple-400 mr-2" />
                  <span className="text-purple-400 font-medium">AI-Powered Evaluation</span>
                </div>
                <p className="text-gray-300 text-sm">
                  This question will be evaluated by our advanced AI system. Provide a comprehensive answer 
                  that demonstrates your understanding and reasoning process.
                </p>
              </div>
              
              <Textarea
                value={answer || ''}
                onChange={(e) => handleEssayAnswer(e.target.value)}
                placeholder="Provide your detailed response here. The AI will evaluate your understanding, reasoning, and application of concepts..."
                className="min-h-[250px] bg-slate-700 border-slate-600 text-white resize-none"
              />
              
              <div className="text-xs text-gray-400">
                AI evaluation considers: concept understanding, practical application, reasoning quality, and completeness.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Question Progress</span>
            <span>{questionNumber} of {totalQuestions}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <motion.div
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionInterface;