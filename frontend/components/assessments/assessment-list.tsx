"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { startAssessment, setQuestions, generateAssessmentQuestions } from '@/lib/redux/slices/assessmentSlice';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  TrendingUp,
  Award,
  Target,
  Clock,
  Star,
  RotateCcw,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  BookOpen,
  Code,
  Users,
  Briefcase,
  BarChart3,
  MessageSquare,
  Palette,
  Globe,
  Zap,
  Loader2
} from 'lucide-react';
import AssessmentCard from "@/components/assessments/assessment-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
 
// Assessment categories with icons and colors
const ASSESSMENT_CATEGORIES = [
  { 
    id: 'all', 
    name: 'All Assessments', 
    icon: Grid3X3, 
    color: 'from-gray-500 to-gray-600',
    description: 'Browse all available assessments'
  },
  { 
    id: 'programming', 
    name: 'Programming', 
    icon: Code, 
    color: 'from-cyan-500 to-blue-600',
    description: 'Web development, algorithms, and coding'
  },
  { 
    id: 'data', 
    name: 'Data & Analytics', 
    icon: BarChart3, 
    color: 'from-purple-500 to-pink-600',
    description: 'Data science, analytics, and visualization'
  },
  { 
    id: 'leadership', 
    name: 'Leadership', 
    icon: Users, 
    color: 'from-amber-500 to-orange-600',
    description: 'Management and leadership skills'
  },
  { 
    id: 'business', 
    name: 'Business', 
    icon: Briefcase, 
    color: 'from-green-500 to-teal-600',
    description: 'Business strategy and operations'
  },
  { 
    id: 'design', 
    name: 'Design', 
    icon: Palette, 
    color: 'from-pink-500 to-rose-600',
    description: 'UI/UX and creative design'
  },
  { 
    id: 'communication', 
    name: 'Communication', 
    icon: MessageSquare, 
    color: 'from-indigo-500 to-purple-600',
    description: 'Written and verbal communication'
  }
];

// Mock assessments for different categories
const MOCK_ASSESSMENTS = [
  // Programming
  {
    id: 'prog-1',
    title: 'JavaScript Fundamentals',
    description: 'Test your core JavaScript knowledge including ES6+ features',
    type: 'skill_check',
    category: 'programming',
    difficulty: 'beginner',
    questionCount: 15,
    estimatedDuration: 30,
    passingScore: 70,
    tags: ['JavaScript', 'Web Dev', 'Frontend'],
    popularity: 95
  },
  {
    id: 'prog-2',
    title: 'React.js Advanced Patterns',
    description: 'Master React hooks, context, and performance optimization',
    type: 'skill_check',
    category: 'programming',
    difficulty: 'advanced',
    questionCount: 20,
    estimatedDuration: 45,
    passingScore: 75,
    tags: ['React', 'Frontend', 'Framework'],
    popularity: 88
  },
  {
    id: 'prog-3',
    title: 'Python for Data Science',
    description: 'Python programming with focus on data manipulation',
    type: 'skill_check',
    category: 'programming',
    difficulty: 'intermediate',
    questionCount: 18,
    estimatedDuration: 35,
    passingScore: 70,
    tags: ['Python', 'Data Science', 'Backend'],
    popularity: 92
  },
  // Data & Analytics
  {
    id: 'data-1',
    title: 'SQL Mastery',
    description: 'Advanced SQL queries and database optimization',
    type: 'skill_check',
    category: 'data',
    difficulty: 'intermediate',
    questionCount: 20,
    estimatedDuration: 40,
    passingScore: 75,
    tags: ['SQL', 'Database', 'Analytics'],
    popularity: 85
  },
  {
    id: 'data-2',
    title: 'Data Visualization Principles',
    description: 'Creating effective charts and dashboards',
    type: 'skill_check',
    category: 'data',
    difficulty: 'beginner',
    questionCount: 15,
    estimatedDuration: 25,
    passingScore: 70,
    tags: ['Visualization', 'Analytics', 'BI'],
    popularity: 78
  },
  // Leadership
  {
    id: 'lead-1',
    title: 'Team Management Essentials',
    description: 'Core principles of effective team leadership',
    type: 'skill_check',
    category: 'leadership',
    difficulty: 'intermediate',
    questionCount: 12,
    estimatedDuration: 30,
    passingScore: 70,
    tags: ['Management', 'Leadership', 'Soft Skills'],
    popularity: 82
  },
  {
    id: 'lead-2',
    title: 'Conflict Resolution Strategies',
    description: 'Handling workplace conflicts effectively',
    type: 'skill_check',
    category: 'leadership',
    difficulty: 'advanced',
    questionCount: 10,
    estimatedDuration: 25,
    passingScore: 75,
    tags: ['Communication', 'Leadership', 'HR'],
    popularity: 76
  },
  // Business
  {
    id: 'bus-1',
    title: 'Business Strategy Fundamentals',
    description: 'Understanding competitive advantage and market positioning',
    type: 'skill_check',
    category: 'business',
    difficulty: 'intermediate',
    questionCount: 15,
    estimatedDuration: 35,
    passingScore: 70,
    tags: ['Strategy', 'Business', 'Management'],
    popularity: 79
  },
  // Design
  {
    id: 'des-1',
    title: 'UI/UX Design Principles',
    description: 'Core concepts of user-centered design',
    type: 'skill_check',
    category: 'design',
    difficulty: 'beginner',
    questionCount: 12,
    estimatedDuration: 25,
    passingScore: 70,
    tags: ['Design', 'UX', 'UI'],
    popularity: 84
  },
  // Communication
  {
    id: 'comm-1',
    title: 'Professional Writing Skills',
    description: 'Business writing and email etiquette',
    type: 'skill_check',
    category: 'communication',
    difficulty: 'beginner',
    questionCount: 10,
    estimatedDuration: 20,
    passingScore: 70,
    tags: ['Writing', 'Communication', 'Business'],
    popularity: 73
  }
];

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
  tags?: string[];
  popularity?: number;
  userProgress?: {
    attempts: number;
    bestScore: number;
    hasPassed: boolean;
    canRetake: boolean;
  };
}

interface AssessmentListProps {
  initialAssessments?: Assessment[];
}

export function AssessmentList({ initialAssessments = [] }: AssessmentListProps) {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [retryCount, setRetryCount] = useState(0);

  // Fetch assessments with retry logic
  const fetchAssessments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Try to fetch from API
      try {
        const response = await fetch(`${BACKEND_URL}/api/assessments?limit=20&offset=0`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          const apiAssessments = data.data?.assessments || [];
          
          // Merge with mock assessments if API returns few results
          if (apiAssessments.length < 5) {
            setAssessments([...apiAssessments, ...MOCK_ASSESSMENTS]);
            toast.info('Showing all available assessments including samples');
          } else {
            setAssessments(apiAssessments);
          }
          setRetryCount(0);
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (apiError) {
        console.error('API fetch failed:', apiError);
        console.error('Backend URL expected:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
        
        // Use mock data as fallback
        setAssessments(MOCK_ASSESSMENTS);
        
        if (retryCount === 0) {
          toast.error('Backend server unavailable. Using sample data.', {
            description: 'Please start the backend server on port 3001'
          });
        } else if (retryCount < 3) {
          toast.warning('Still unable to connect to server. Using sample assessments.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
      setError('Unable to load assessments. Using sample data.');
      setAssessments(MOCK_ASSESSMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, retryCount]);

  // Initial load
  useEffect(() => {
    if (initialAssessments.length === 0) {
      fetchAssessments();
    } else {
      // Merge initial with mock if needed
      if (initialAssessments.length < 5) {
        setAssessments([...initialAssessments, ...MOCK_ASSESSMENTS]);
      }
    }
  }, []);

  // Handle planned custom assessment auto-start
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planned = params.get('planned');
    if (!planned) return;

    (async () => {
      try {
        const plan = JSON.parse(decodeURIComponent(planned));
        const assessmentId = `custom-${Date.now()}`;
        const title = plan.title || 'Custom Assessment';
        const category = (plan.targetSkills && plan.targetSkills[0]) || 'General';
        const difficulty = plan.difficulty || 'intermediate';
        const questionCount = plan.questionCount || 8;

        // Start session in Redux
        dispatch(startAssessment({
          assessmentId,
          assessmentTitle: title,
          aiPersonality: 'SAGE',
        }));

        // Navigate immediately so the assessment page can show its loading UI
        router.replace(`/assessments/${assessmentId}`);

        // Fire-and-forget question generation so UI updates instantly
        const token = await getToken();
        dispatch(
          generateAssessmentQuestions({
            assessmentId,
            title,
            category,
            difficulty,
            questionCount,
            token: token || null,
          })
        ).then((action: any) => {
          const generated = action.payload;
          if (Array.isArray(generated) && generated.length > 0) {
            dispatch(setQuestions(generated as any));
          } else {
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
          }
        }).catch(() => {
          // Keep navigating; page shows fallback if needed
        });
      } catch (e) {
        console.error('Failed to start planned assessment:', e);
        toast.error('Failed to start planned assessment');
      }
    })();
  }, []);

  // Refresh handler with retry
  const handleRefresh = async () => {
    setRefreshing(true);
    setRetryCount(prev => prev + 1);
    
    // Show loading toast
    const loadingToast = toast.loading('Refreshing assessments...');
    
    await fetchAssessments(false);
    
    toast.dismiss(loadingToast);
    toast.success('Assessments refreshed!');
  };

  // Try another assessment (generate new one)
  const handleTryAnother = (category: string) => {
    // Navigate to a new assessment generation page
    router.push(`/assessments/new?category=${category}&random=true`);
    toast.info('Generating a new assessment for you...');
  };

  // Filter and sort assessments
  const filteredAssessments = assessments
    .filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assessment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assessment.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || assessment.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
        case 'duration':
          return a.estimatedDuration - b.estimatedDuration;
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const handleStartAssessment = (assessmentId: string) => {
    router.push(`/assessments/${assessmentId}`);
  };

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced', 'expert'];

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              Assessment Categories
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                variant="outline"
                className="border-slate-600 hover:bg-slate-700"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push('/assessments/new')}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {ASSESSMENT_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "relative p-4 rounded-lg border transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-br from-slate-700/50 to-slate-600/30 border-cyan-400/50 scale-105" 
                      : "bg-slate-800/30 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-2",
                    isActive ? "from-cyan-500/30 to-blue-500/30" : "from-slate-700/50 to-slate-600/30"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-cyan-400" : "text-gray-400"
                    )} />
                  </div>
                  <p className={cn(
                    "text-xs font-medium",
                    isActive ? "text-white" : "text-gray-400"
                  )}>
                    {category.name.split(' ')[0]}
                  </p>
                  {isActive && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedCategory !== 'all' && (
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-sm text-gray-300">
                {ASSESSMENT_CATEGORIES.find(c => c.id === selectedCategory)?.description}
              </p>
              <Button
                onClick={() => handleTryAnother(selectedCategory)}
                size="sm"
                variant="ghost"
                className="mt-2 text-cyan-400 hover:text-cyan-300"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate New {ASSESSMENT_CATEGORIES.find(c => c.id === selectedCategory)?.name} Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search assessments or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-w-[150px]"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-w-[150px]"
            >
              <option value="popularity">Most Popular</option>
              <option value="title">Alphabetical</option>
              <option value="difficulty">By Difficulty</option>
              <option value="duration">By Duration</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-slate-600 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </p>
        {error && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </Badge>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-700 rounded w-5/6 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-700 rounded w-20" />
                <div className="h-6 bg-slate-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assessment Grid/List */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid gap-6",
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            )}
          >
            {filteredAssessments.map((assessment, index) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 hover:border-cyan-400/30 transition-all duration-200 h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{assessment.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{assessment.description}</p>
                      </div>
                      {assessment.popularity && (
                        <div className="ml-3 flex items-center gap-1 text-amber-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-xs">{assessment.popularity}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {assessment.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {assessment.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-slate-600 text-gray-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.estimatedDuration}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {assessment.questionCount} questions
                      </span>
                      <Badge className={cn(
                        "text-xs",
                        assessment.difficulty === 'beginner' && "bg-green-500/20 text-green-400",
                        assessment.difficulty === 'intermediate' && "bg-yellow-500/20 text-yellow-400",
                        assessment.difficulty === 'advanced' && "bg-orange-500/20 text-orange-400",
                        assessment.difficulty === 'expert' && "bg-red-500/20 text-red-400"
                      )}>
                        {assessment.difficulty}
                      </Badge>
                    </div>

                    {/* User Progress */}
                    {assessment.userProgress && (
                      <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Best Score</span>
                          <span className="text-white font-medium">{assessment.userProgress.bestScore}%</span>
                        </div>
                        {assessment.userProgress.hasPassed && (
                          <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-400/30 w-full justify-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passed
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-auto flex gap-2">
                      <Button
                        onClick={() => handleStartAssessment(assessment.id)}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        size="sm"
                      >
                        {assessment.userProgress?.attempts ? 'Retake' : 'Start'}
                      </Button>
                      <Button
                        onClick={() => handleTryAnother(assessment.category)}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 hover:bg-slate-700"
                        title="Try a different assessment in this category"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!loading && filteredAssessments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No assessments found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
              ? "Try adjusting your filters or search criteria"
              : "No assessments available at the moment"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              Clear Filters
            </Button>
            <Button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Assessments
            </Button>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      {selectedCategory === 'all' && !loading && assessments.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => router.push('/assessments/new?type=quick')}
                variant="outline"
                className="border-purple-400/30 hover:bg-purple-500/20 justify-start"
              >
                <Zap className="h-4 w-4 mr-2 text-amber-400" />
                Quick 5-min Assessment
              </Button>
              <Button
                onClick={() => router.push('/assessments/new?type=personalized')}
                variant="outline"
                className="border-purple-400/30 hover:bg-purple-500/20 justify-start"
              >
                <Brain className="h-4 w-4 mr-2 text-cyan-400" />
                AI Personalized Test
              </Button>
              <Button
                onClick={() => router.push('/assessments/new?type=random')}
                variant="outline"
                className="border-purple-400/30 hover:bg-purple-500/20 justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2 text-green-400" />
                Random Challenge
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}