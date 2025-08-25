"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy,
  Star,
  Target,
  TrendingUp,
  TrendingDown,
  Brain,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Download,
  Share,
  RotateCcw,
  ArrowLeft,
  Lightbulb,
  Zap,
  Users,
  Calendar,
  FileText,
  Badge as BadgeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  questionCount: number;
  estimatedDuration: number;
  passingScore: number;
}

interface AssessmentResults {
  finalScore: number;
  passed: boolean;
  grade: string;
  totalTimeSpent: number;
  scoreByDifficulty: Record<string, number>;
  scoreBySkill?: Array<{
    skill: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  aiInsights: {
    overallAssessment: string;
    nextSteps: string[];
    estimatedImprovementTime: number;
    skillGaps?: string[];
    careerRecommendations?: string[];
  };
}

interface ResultsDashboardProps {
  results: AssessmentResults;
  assessment: Assessment;
  onRetakeAssessment: () => void;
  onBackToAssessments: () => void;
  certificateAvailable?: boolean;
  shareEnabled?: boolean;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  assessment,
  onRetakeAssessment,
  onBackToAssessments,
  certificateAvailable = false,
  shareEnabled = true
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'insights' | 'recommendations'>('overview');
  const [showCelebration, setShowCelebration] = useState(results.passed);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (grade: string) => {
    const gradeColors: Record<string, string> = {
      'A+': 'text-green-400',
      'A': 'text-green-400',
      'A-': 'text-green-400',
      'B+': 'text-cyan-400',
      'B': 'text-cyan-400',
      'B-': 'text-cyan-400',
      'C+': 'text-yellow-400',
      'C': 'text-yellow-400',
      'C-': 'text-yellow-400',
      'D': 'text-orange-400',
      'F': 'text-red-400'
    };
    return gradeColors[grade] || 'text-gray-400';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-400', icon: Trophy };
    if (score >= 80) return { level: 'Good', color: 'text-cyan-400', icon: Star };
    if (score >= 70) return { level: 'Satisfactory', color: 'text-yellow-400', icon: Target };
    if (score >= 60) return { level: 'Needs Improvement', color: 'text-orange-400', icon: TrendingUp };
    return { level: 'Unsatisfactory', color: 'text-red-400', icon: TrendingDown };
  };

  const performance = getPerformanceLevel(results.finalScore);
  const PerformanceIcon = performance.icon;

  const handleDownloadCertificate = () => {
    // In real implementation, this would generate and download a certificate
    console.log('Downloading certificate...');
  };

  const handleShareResults = () => {
    // In real implementation, this would open share dialog
    console.log('Sharing results...');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'details', label: 'Detailed Analysis', icon: PieChart },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'recommendations', label: 'Next Steps', icon: Lightbulb }
  ];

  return (
    <div className="space-y-6">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && results.passed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-8 text-center border border-green-500/30"
            >
              <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Congratulations!</h2>
              <p className="text-gray-300">You passed the assessment!</p>
              <Button onClick={() => setShowCelebration(false)} className="mt-4">
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${
          results.passed ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
        } flex items-center justify-center`}>
          {results.passed ? (
            <CheckCircle className="h-10 w-10 text-white" />
          ) : (
            <AlertTriangle className="h-10 w-10 text-white" />
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Assessment Complete</h1>
        <p className="text-xl text-gray-300">{assessment.title}</p>
        
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getGradeColor(results.grade)}`}>
              {results.finalScore}%
            </div>
            <div className="text-gray-400 text-sm">Final Score</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getGradeColor(results.grade)}`}>
              {results.grade}
            </div>
            <div className="text-gray-400 text-sm">Grade</div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${performance.color}`}>
              {performance.level}
            </div>
            <div className="text-gray-400 text-sm">Performance</div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 mt-6">
          <Badge variant={results.passed ? 'default' : 'destructive'}>
            {results.passed ? 'PASSED' : 'FAILED'}
          </Badge>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(results.totalTimeSpent)}
          </Badge>
          <Badge variant="outline">
            <Target className="h-3 w-3 mr-1" />
            {assessment.questionCount} Questions
          </Badge>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <Button onClick={onBackToAssessments} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Button>
        
        <Button onClick={onRetakeAssessment} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Assessment
        </Button>
        
        {certificateAvailable && results.passed && (
          <Button onClick={handleDownloadCertificate} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        )}
        
        {shareEnabled && (
          <Button onClick={handleShareResults} variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg overflow-hidden"
      >
        <div className="flex border-b border-slate-600">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 p-4 flex items-center justify-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-cyan-400" />
                      Score by Difficulty
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(results.scoreByDifficulty).map(([difficulty, score]) => (
                        <div key={difficulty} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400 capitalize">{difficulty}</span>
                            <span className="text-white font-medium">{score}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-green-400" />
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-center">
                          <PerformanceIcon className={`h-6 w-6 mx-auto mb-1 ${performance.color}`} />
                          <div className={`font-semibold ${performance.color}`}>{performance.level}</div>
                          <div className="text-gray-400 text-xs">Performance</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-center">
                          <Clock className="h-6 w-6 mx-auto mb-1 text-cyan-400" />
                          <div className="text-white font-semibold">{formatTime(results.totalTimeSpent)}</div>
                          <div className="text-gray-400 text-xs">Time Taken</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-center">
                          <BadgeIcon className="h-6 w-6 mx-auto mb-1 text-purple-400" />
                          <div className="text-white font-semibold">{results.grade}</div>
                          <div className="text-gray-400 text-xs">Grade</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-center">
                          <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
                          <div className="text-white font-semibold">{assessment.passingScore}%</div>
                          <div className="text-gray-400 text-xs">Required</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                      Strengths
                    </h3>
                    <div className="space-y-2">
                      {results.strengths.map((strength, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center p-2 bg-green-900/20 border border-green-500/30 rounded"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{strength}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2 text-amber-400" />
                      Areas for Improvement
                    </h3>
                    <div className="space-y-2">
                      {results.weaknesses.map((weakness, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center p-2 bg-amber-900/20 border border-amber-500/30 rounded"
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{weakness}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'details' && results.scoreBySkill && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-cyan-400" />
                  Skill-by-Skill Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.scoreBySkill.map((skill, index) => (
                    <motion.div
                      key={skill.skill}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-medium">{skill.skill}</h4>
                        <Badge variant="outline">{skill.percentage}%</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Score: {skill.score}/{skill.maxScore}</span>
                          <span>{skill.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-400" />
                    AI Overall Assessment
                  </h3>
                  <p className="text-gray-300">{results.aiInsights.overallAssessment}</p>
                </div>

                {results.aiInsights.skillGaps && (
                  <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-red-400" />
                      Identified Skill Gaps
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {results.aiInsights.skillGaps.map((gap, index) => (
                        <div key={index} className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                          <span className="text-gray-300 text-sm">{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.aiInsights.careerRecommendations && (
                  <div>
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-cyan-400" />
                      Career Recommendations
                    </h3>
                    <div className="space-y-3">
                      {results.aiInsights.careerRecommendations.map((recommendation, index) => (
                        <div key={index} className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded">
                          <span className="text-gray-300 text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'recommendations' && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="p-6 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-amber-400" />
                    Estimated Improvement Time
                  </h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-400 mb-2">
                      {results.aiInsights.estimatedImprovementTime} days
                    </div>
                    <p className="text-gray-300">With consistent practice and learning</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
                    Recommended Next Steps
                  </h3>
                  <div className="space-y-3">
                    {results.aiInsights.nextSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start p-3 bg-yellow-900/20 border border-yellow-500/30 rounded"
                      >
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-gray-300 text-sm">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Start Learning Plan
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultsDashboard;