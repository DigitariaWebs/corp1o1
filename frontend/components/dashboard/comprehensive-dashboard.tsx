"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Briefcase,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Shield,
  Zap,
  Brain,
  Trophy,
  FileText,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Users,
  Globe,
  Lock,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
  verified: boolean;
  lastAssessed?: string;
}

interface LearningPath {
  id: string;
  title: string;
  progress: number;
  modules: number;
  completedModules: number;
  nextLesson?: string;
  estimatedTime?: string;
}

interface Assessment {
  id: string;
  title: string;
  score?: number;
  status: 'pending' | 'completed' | 'in_progress';
  date?: string;
  difficulty: string;
}

interface Certificate {
  id: string;
  title: string;
  issueDate: string;
  verificationCode: string;
  type: string;
}

export function ComprehensiveDashboard() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  
  // States for different sections
  const [skills, setSkills] = useState<Skill[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  // Generation dialog state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [fileToDownload, setFileToDownload] = useState<string | null>(null);
  // Effect to simulate generation progress
  useEffect(() => {
    if (generateOpen) {
      setGenerateProgress(0);
      const interval = setInterval(() => {
        setGenerateProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Trigger download when progress completes
            if (fileToDownload) {
              const link = document.createElement('a');
              link.href = fileToDownload;
              // Extract file name from path for download attribute
              link.download = fileToDownload.split('/').pop() || 'certificate.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            // Close dialog shortly after download starts
            setTimeout(() => setGenerateOpen(false), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [generateOpen, fileToDownload]);

  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API calls - replace with actual API calls
      setTimeout(() => {
        // Mock skills data
        setSkills([
          { id: '1', name: 'JavaScript', level: 75, category: 'Programming', verified: true, lastAssessed: '2024-01-15' },
          { id: '2', name: 'React', level: 60, category: 'Frameworks', verified: true, lastAssessed: '2024-01-10' },
          { id: '3', name: 'Leadership', level: 45, category: 'Soft Skills', verified: false },
        ]);

        // Mock learning paths
        setLearningPaths([
          { 
            id: '1', 
            title: 'Full-Stack Development', 
            progress: 35, 
            modules: 12, 
            completedModules: 4,
            nextLesson: 'Advanced React Patterns',
            estimatedTime: '2 hours'
          },
          { 
            id: '2', 
            title: 'Data Science Fundamentals', 
            progress: 10, 
            modules: 8, 
            completedModules: 1,
            nextLesson: 'Introduction to Pandas',
            estimatedTime: '3 hours'
          }
        ]);

        // Mock assessments
        setAssessments([
          { id: '1', title: 'JavaScript Fundamentals', score: 85, status: 'completed', date: '2024-01-20', difficulty: 'intermediate' },
          { id: '2', title: 'React Advanced Concepts', status: 'pending', difficulty: 'advanced' },
          { id: '3', title: 'Python Basics', status: 'in_progress', difficulty: 'beginner' }
        ]);

        // Mock certificates
        setCertificates([
          { id: '1', title: 'JavaScript Developer', issueDate: '2024-01-15', verificationCode: 'CERT-JS-2024', type: 'completion' },
          { id: '2', title: 'React Specialist', issueDate: '2024-01-10', verificationCode: 'CERT-REACT-2024', type: 'mastery' }
        ]);

        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  // Calculate stats
  const totalSkills = skills.length;
  const verifiedSkills = skills.filter(s => s.verified).length;
  const averageSkillLevel = skills.length > 0 
    ? Math.round(skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length)
    : 0;
  const activeLearningPaths = learningPaths.filter(lp => lp.progress > 0 && lp.progress < 100).length;
  const completedAssessments = assessments.filter(a => a.status === 'completed').length;
  const averageScore = assessments
    .filter(a => a.score !== undefined)
    .reduce((sum, a) => sum + (a.score || 0), 0) / (completedAssessments || 1);

  // Profile data
  const profileData = {
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    role: user?.role || 'Learner',
    joinDate: user?.createdAt || '2024-01-01',
    location: 'San Francisco, CA',
    company: user?.company || 'Tech Corp',
    bio: 'Passionate about learning and growing my skills in technology and leadership.',
    avatar: user?.avatar || '/placeholder.svg?height=100&width=100'
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
       

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {profileData.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-400">
              Here's your learning progress and achievements overview
            </p>
          </motion.div>

          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-slate-700">
                <Target className="w-4 h-4 mr-2" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="learning" className="data-[state=active]:bg-slate-700">
                <BookOpen className="w-4 h-4 mr-2" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="assessments" className="data-[state=active]:bg-slate-700">
                <FileText className="w-4 h-4 mr-2" />
                Assessments
              </TabsTrigger>
              <TabsTrigger value="certificates" className="data-[state=active]:bg-slate-700">
                <Award className="w-4 h-4 mr-2" />
                Certificates
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-400/20 hover:border-cyan-400/40 transition-all cursor-pointer"
                      onClick={() => router.push('/assessments')}>
                  <CardContent className="p-6">
                    <Target className="w-8 h-8 text-cyan-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">Take Assessment</h3>
                    <p className="text-gray-400 text-sm">Test your skills and get certified</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/20 hover:border-purple-400/40 transition-all cursor-pointer"
                      onClick={() => router.push('/learning')}>
                  <CardContent className="p-6">
                    <BookOpen className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">Continue Learning</h3>
                    <p className="text-gray-400 text-sm">Resume your learning paths</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/20 hover:border-amber-400/40 transition-all cursor-pointer"
                      onClick={() => router.push('/skills')}>
                  <CardContent className="p-6">
                    <Trophy className="w-8 h-8 text-amber-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">View Skills</h3>
                    <p className="text-gray-400 text-sm">Track your skill progress</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-cyan-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assessments.slice(0, 3).map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            assessment.status === 'completed' ? "bg-green-500/20" : 
                            assessment.status === 'in_progress' ? "bg-amber-500/20" : "bg-gray-500/20"
                          )}>
                            {assessment.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                             assessment.status === 'in_progress' ? <Clock className="w-5 h-5 text-amber-400" /> :
                             <AlertCircle className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{assessment.title}</p>
                            <p className="text-gray-400 text-sm">
                              {assessment.status === 'completed' ? `Score: ${assessment.score}%` : 
                               assessment.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-cyan-400" />
                      Your Skills
                    </span>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Skill
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="space-y-4">
                      {skills.map((skill) => (
                        <div key={skill.id} className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium">{skill.name}</h4>
                              {skill.verified && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-gray-400 border-gray-600">
                                {skill.category}
                              </Badge>
                            </div>
                            <span className="text-cyan-400 font-bold">{skill.level}%</span>
                          </div>
                          <Progress value={skill.level} className="h-2 mb-2" />
                          {skill.lastAssessed && (
                            <p className="text-gray-400 text-sm">
                              Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Skills Added Yet</h3>
                      <p className="text-gray-400 mb-6">Start by taking an assessment to discover and validate your skills</p>
                      <Button onClick={() => router.push('/assessments')} className="bg-cyan-500 hover:bg-cyan-600">
                        <Target className="w-4 h-4 mr-2" />
                        Take Your First Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
                      Learning Paths
                    </span>
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                      <Plus className="w-4 h-4 mr-1" />
                      Browse Paths
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {learningPaths.length > 0 ? (
                    <div className="space-y-4">
                      {learningPaths.map((path) => (
                        <div key={path.id} className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-medium">{path.title}</h4>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30">
                              {path.completedModules}/{path.modules} Modules
                            </Badge>
                          </div>
                          <Progress value={path.progress} className="h-2 mb-3" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{path.progress}% Complete</span>
                            {path.nextLesson && (
                              <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-cyan-400" />
                                <span className="text-cyan-400">Next: {path.nextLesson}</span>
                              </div>
                            )}
                          </div>
                          {path.estimatedTime && (
                            <p className="text-gray-400 text-sm mt-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {path.estimatedTime} to complete
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Active Learning Paths</h3>
                      <p className="text-gray-400 mb-6">Explore our learning paths to start your journey</p>
                      <Button onClick={() => router.push('/learning')} className="bg-purple-500 hover:bg-purple-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Browse Learning Paths
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-amber-400" />
                      Assessments
                    </span>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4 mr-1" />
                      New Assessment
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assessments.length > 0 ? (
                    <div className="space-y-4">
                      {assessments.map((assessment) => (
                        <div key={assessment.id} className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              assessment.status === 'completed' ? "bg-green-500/20" :
                              assessment.status === 'in_progress' ? "bg-amber-500/20" : "bg-gray-500/20"
                            )}>
                              {assessment.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-400" /> :
                               assessment.status === 'in_progress' ? <Clock className="w-6 h-6 text-amber-400" /> :
                               <AlertCircle className="w-6 h-6 text-gray-400" />}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{assessment.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Badge variant="outline" className="text-xs">
                                  {assessment.difficulty}
                                </Badge>
                                {assessment.date && <span>{new Date(assessment.date).toLocaleDateString()}</span>}
                                {assessment.score !== undefined && (
                                  <span className="text-cyan-400 font-medium">Score: {assessment.score}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={assessment.status === 'completed' ? 'outline' : 'default'}
                            className={assessment.status === 'completed' ? 'border-slate-600' : ''}
                            onClick={() => router.push(`/assessments/${assessment.id}`)}
                          >
                            {assessment.status === 'completed' ? 'View Results' :
                             assessment.status === 'in_progress' ? 'Continue' : 'Start'}
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Assessments Yet</h3>
                      <p className="text-gray-400 mb-6">Take assessments to validate your skills and earn certificates</p>
                      <Button onClick={() => router.push('/assessments')} className="bg-amber-500 hover:bg-amber-600">
                        <Target className="w-4 h-4 mr-2" />
                        Browse Assessments
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Award className="w-5 h-5 mr-2 text-green-400" />
                      Certificates
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setFileToDownload('/Sema_Intelligence_Certificate.pdf');
                          setGenerateOpen(true);
                        }}>
                        Generate Intelligence Certificate
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setFileToDownload('/Intelligence_Evolution.pdf');
                          setGenerateOpen(true);
                        }}>
                        Generate Evolution Certificate
                      </Button>
                      {certificates.length > 0 && (
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Globe className="w-4 h-4 mr-1" />
                          Public Profile
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {certificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="bg-gradient-to-br from-slate-700/50 to-slate-600/30 rounded-lg p-4 border border-slate-600/30">
                          <div className="flex items-start justify-between mb-3">
                            <Award className="w-8 h-8 text-green-400" />
                            <Badge className={cn(
                              "text-xs",
                              cert.type === 'mastery' ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400"
                            )}>
                              {cert.type}
                            </Badge>
                          </div>
                          <h4 className="text-white font-medium mb-2">{cert.title}</h4>
                          <p className="text-gray-400 text-sm mb-3">
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center justify-between">
                            <code className="text-xs text-cyan-400 bg-slate-800 px-2 py-1 rounded">
                              {cert.verificationCode}
                            </code>
                            <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                              View
                              <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Certificates Earned Yet</h3>
                      <p className="text-gray-400 mb-6">Complete assessments and learning paths to earn verified certificates</p>
                      <Button onClick={() => router.push('/assessments')} className="bg-green-500 hover:bg-green-600">
                        <Target className="w-4 h-4 mr-2" />
                        Start Earning Certificates
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Generation Dialog */}
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogContent className="bg-slate-800 border-slate-600 text-white">
                <DialogHeader>
                  <DialogTitle>Generating Certificate...</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Progress value={generateProgress} className="h-3" />
                  <p className="text-center text-sm text-gray-300">{generateProgress}%</p>
                </div>
              </DialogContent>
            </Dialog>

          </Tabs>
        </div>
      </div>
    </div>
  );
}