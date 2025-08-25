"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Brain, 
  TrendingUp, 
  Calendar, 
  Share2, 
  Download, 
  Eye, 
  Star, 
  CheckCircle, 
  Zap, 
  Heart, 
  Users, 
  MessageSquare, 
  Palette, 
  Shield, 
  Globe, 
  Target,
  Clock,
  Github,
  Linkedin,
  Instagram,
  Youtube,
  BarChart3,
  Sparkles,
  Crown,
  Building,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Code
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Portfolio {
  _id: string;
  userId: string;
  headline?: string;
  summary?: string;
  location?: string;
  website?: string;
  resume?: {
    url?: string;
    lastUpdated?: string;
  };
  externalConnections: ExternalConnection[];
  projects: Project[];
  workExperience: WorkExperience[];
  topSkills: TopSkill[];
  analytics: {
    views: number;
    uniqueVisitors: number;
    lastViewed?: string;
    viewHistory: ViewHistoryEntry[];
  };
  settings: {
    isPublic: boolean;
    allowContact: boolean;
    theme: string;
    customDomain?: string;
  };
  certificates?: Certificate[];
  totalCertificates?: number;
  portfolioUrl?: string;
  totalProjects?: number;
  yearsOfExperience?: number;
}

interface ExternalConnection {
  platform: string;
  username: string;
  profileUrl: string;
  isVerified: boolean;
  lastSync?: string;
  syncStatus: string;
  stats: {
    repositories?: number;
    followers?: number;
    contributions?: number;
    projects?: number;
    connections?: number;
    likes?: number;
  };
}

interface Project {
  _id: string;
  title: string;
  description: string;
  technologies: string[];
  category: string;
  status: string;
  startDate: string;
  endDate?: string;
  urls: {
    live?: string;
    github?: string;
    demo?: string;
    case_study?: string;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  skills: string[];
  achievements: string[];
  metrics: {
    users?: number;
    downloads?: number;
    stars?: number;
    performance_improvement?: string;
  };
  isPublic: boolean;
  isFeatured: boolean;
}

interface WorkExperience {
  _id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  achievements: string[];
  technologies: string[];
  skills: string[];
  companyLogo?: string;
  isPublic: boolean;
}

interface TopSkill {
  name: string;
  level: string;
  yearsOfExperience?: number;
  isVerified: boolean;
}

interface ViewHistoryEntry {
  date: string;
  views: number;
  source: string;
}

interface Certificate {
  _id: string;
  title: string;
  type: string;
  category: string;
  issueDate: string;
  skillsVerified: number;
  assets: {
    pdf?: string;
    image?: string;
    thumbnail?: string;
  };
}

const Corp1o1UserPortfolio = () => {
  const { getToken, user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Load portfolio data from API
  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch user portfolio
      const portfolioResponse = await fetch('/api/portfolio', { headers });
      if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio');
      const portfolioData = await portfolioResponse.json();
      
      setPortfolio(portfolioData.data.portfolio);

      // Fetch analytics
      const analyticsResponse = await fetch('/api/portfolio/analytics', { headers });
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data.analytics);
      }

    } catch (err) {
      console.error('Error loading portfolio:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load portfolio';
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch portfolio')) {
          errorMessage = 'Unable to load portfolio. Your professional portfolio will be created automatically when you complete assessments and learning paths.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication error. Please sign in again.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied. Please ensure you have completed your profile setup.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPlatform = async (platform: string, username: string, profileUrl: string) => {
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('/api/portfolio/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ platform, username, profileUrl })
      });

      if (response.ok) {
        await loadPortfolioData(); // Refresh data
        console.log(`${platform} connected successfully`);
      } else {
        throw new Error('Failed to connect platform');
      }
    } catch (err) {
      console.error('Error connecting platform:', err);
    }
  };

  const handleAddProject = async (projectData: Partial<Project>) => {
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('/api/portfolio/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        await loadPortfolioData(); // Refresh data
        console.log('Project added successfully');
      } else {
        throw new Error('Failed to add project');
      }
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  const handleUpdatePortfolio = async (updateData: Partial<Portfolio>) => {
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadPortfolioData(); // Refresh data
        console.log('Portfolio updated successfully');
      } else {
        throw new Error('Failed to update portfolio');
      }
    } catch (err) {
      console.error('Error updating portfolio:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-xl">Loading your portfolio...</div>
          <div className="text-gray-400 text-sm mt-2">Gathering your professional achievements</div>
        </div>
      </div>
    );
  }

  if (error) {
    const isNoPortfolioError = error.includes('professional portfolio') || 
                              error.includes('complete assessments') ||
                              error.includes('learning paths');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-16">
            <div className={`${isNoPortfolioError ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg p-12 max-w-4xl mx-auto`}>
              {isNoPortfolioError ? (
                <Eye className="h-20 w-20 text-blue-400 mx-auto mb-6" />
              ) : (
                <Shield className="h-20 w-20 text-red-400 mx-auto mb-6" />
              )}
              
              <h1 className={`text-3xl font-bold mb-4 ${isNoPortfolioError ? 'text-blue-300' : 'text-red-300'}`}>
                {isNoPortfolioError ? 'Build Your Professional Portfolio' : 'Error Loading Portfolio'}
              </h1>
              
              <p className={`text-lg mb-8 ${isNoPortfolioError ? 'text-blue-200' : 'text-red-400'}`}>
                {isNoPortfolioError ? 
                  'Your professional portfolio showcases your verified skills, certificates, and achievements. Complete assessments and learning paths to automatically build your portfolio.' :
                  error
                }
              </p>
              
              <div className="space-y-4">
                {!isNoPortfolioError && (
                  <Button onClick={loadPortfolioData} className="bg-red-500 hover:bg-red-600 px-8 py-3">
                    <Shield className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/assessments'} 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8 py-3"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {isNoPortfolioError ? 'Take Skill Assessments' : 'Start with Assessments'}
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/learning'} 
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-3"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explore Learning Paths
                  </Button>
                </div>
                
                {isNoPortfolioError && (
                  <div className="mt-8 p-6 bg-slate-700/30 rounded-lg">
                    <h4 className="text-white font-medium mb-3">Your Portfolio Will Include:</h4>
                    <div className="text-left text-gray-300 space-y-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                        <span>Verified certificates from completed assessments</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                        <span>Skills progression and competency tracking</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                        <span>Professional project showcase and achievements</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</div>
                        <span>Integration with LinkedIn, GitHub, and other platforms</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Portfolio not found</div>
      </div>
    );
  }

  // Platform icon mapping
  const platformIcons = {
    linkedin: Linkedin,
    github: Github,
    behance: Palette,
    dribbble: Palette,
    website: Globe,
    codepen: Code,
    stackoverflow: MessageSquare,
    medium: BookOpen
  };

  // Platform colors
  const platformColors = {
    linkedin: 'from-blue-500 to-blue-700',
    github: 'from-gray-600 to-gray-800',
    behance: 'from-blue-600 to-purple-600',
    dribbble: 'from-pink-500 to-purple-600',
    website: 'from-green-500 to-teal-600',
    codepen: 'from-gray-700 to-gray-900',
    stackoverflow: 'from-orange-500 to-red-600',
    medium: 'from-gray-600 to-gray-800'
  };

  // Level colors
  const levelColors = {
    beginner: 'from-green-500 to-green-600',
    intermediate: 'from-blue-500 to-blue-600',
    advanced: 'from-purple-500 to-purple-600',
    expert: 'from-amber-500 to-orange-600'
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks}sem`;
  };

  const getSkillLevelPercentage = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 25;
      case 'intermediate': return 50;
      case 'advanced': return 75;
      case 'expert': return 95;
      default: return 0;
    }
  };

  const categoryColors = {
    web: 'from-cyan-500 to-blue-600',
    mobile: 'from-green-500 to-teal-600',
    desktop: 'from-purple-500 to-pink-600',
    data: 'from-amber-500 to-orange-600',
    design: 'from-pink-500 to-purple-600',
    research: 'from-blue-500 to-indigo-600',
    writing: 'from-gray-500 to-slate-600',
    other: 'from-slate-500 to-gray-600'
  };

  const statusColors = {
    completed: 'text-green-400',
    in_progress: 'text-blue-400',
    planned: 'text-amber-400',
    archived: 'text-gray-400'
  };

  const Progress = ({ value, className = "", color = "from-cyan-500 to-blue-600" }) => (
    <div className={`w-full bg-slate-700 rounded-full h-2 ${className}`}>
      <motion.div
        className={`bg-gradient-to-r ${color} h-2 rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );

  // Use the imported Badge component from shadcn/ui

  // Use the imported Button component from shadcn/ui

  // Use the imported Card components from shadcn/ui

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Professional Portfolio</h1>
              <p className="text-gray-300">Showcase your verified skills and achievements</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share Portfolio
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center border-4 border-slate-800">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold">{user?.name || 'Professional'}</h1>
                    <Badge className="bg-green-500/20 text-green-400 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xl text-cyan-400 mb-4">{portfolio.headline || 'Building Professional Portfolio'}</p>
                  <p className="text-gray-300 mb-4 max-w-2xl">{portfolio.summary || 'Professional focused on continuous skill development and verified competencies.'}</p>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                    {portfolio.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {portfolio.location}
                      </div>
                    )}
                    {portfolio.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        <a href={portfolio.website} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">
                          Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {portfolio.analytics.views} views
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">{portfolio.totalCertificates || 0}</div>
                    <div className="text-sm text-gray-400">Certificates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{portfolio.totalProjects || 0}</div>
                    <div className="text-sm text-gray-400">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">{portfolio.topSkills.length}</div>
                    <div className="text-sm text-gray-400">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-400">{portfolio.yearsOfExperience || 0}</div>
                    <div className="text-sm text-gray-400">Years Exp.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-8 bg-slate-800/50 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'projects', label: 'Projects', icon: Eye },
            { id: 'skills', label: 'Skills', icon: Brain },
            { id: 'certificates', label: 'Certificates', icon: Award },
            { id: 'connections', label: 'Connections', icon: ExternalLink }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Compétences Maîtrisées', value: userProfile.totalSkills, icon: Brain, color: 'from-cyan-500 to-blue-600' },
                  { label: 'Certificats Obtenus', value: userProfile.certificates, icon: Award, color: 'from-amber-500 to-orange-600' },
                  { label: 'Confiance IA Moyenne', value: `${userProfile.aiConfidence}%`, icon: Sparkles, color: 'from-purple-500 to-pink-600' },
                  { label: 'Domaines Expertisés', value: '4', icon: Target, color: 'from-green-500 to-teal-600' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 hover:border-slate-500/50 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">{stat.label}</p>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Achievements */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Star className="h-6 w-6 mr-3 text-amber-400" />
                  Réalisations Récentes
                </h3>
                <div className="space-y-4">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg bg-slate-800/30"
                    >
                      <achievement.icon className={`h-6 w-6 ${achievement.color} mt-1`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-semibold">{achievement.title}</h4>
                          <span className="text-gray-400 text-sm">{achievement.date}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{achievement.description}</p>
                        <Badge className="mt-2">{achievement.type}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedCertificate(cert)}
                    className="cursor-pointer"
                  >
                    <Card className="overflow-hidden hover:scale-105 transition-all duration-300 hover:border-slate-500/50">
                      <div className={`h-32 bg-gradient-to-r ${cert.color} relative`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-4 right-4">
                          {cert.nft && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                              <Zap className="h-3 w-3 mr-1" />
                              NFT
                            </Badge>
                          )}
                        </div>
                        <div className="absolute top-4 left-4">
                          <Badge className={`bg-gradient-to-r ${rarityColors[cert.rarity]} text-white border-0`}>
                            {cert.rarity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white font-bold text-lg">{cert.title}</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="info">{cert.level}</Badge>
                          <div className="flex items-center text-cyan-400">
                            <Shield className="h-4 w-4 mr-1" />
                            {cert.confidence}%
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{cert.domain}</p>
                        <div className="flex flex-wrap gap-2">
                          {cert.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill}>{skill}</Badge>
                          ))}
                          {cert.skills.length > 3 && (
                            <Badge variant="outline">+{cert.skills.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {skillDomains.map((domain, index) => (
                  <motion.div
                    key={domain.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-center mb-6">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${domain.color} flex items-center justify-center mr-4`}>
                          <domain.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{domain.name}</h3>
                          <div className="flex items-center mt-1">
                            <Progress value={domain.progress} className="flex-1 mr-3" />
                            <span className="text-cyan-400 font-medium">{domain.progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {domain.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex items-center justify-between">
                            <span className="text-gray-300">{skill.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">{skill.level}%</span>
                              <div className="w-16">
                                <Progress value={skill.level} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <Card className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Intégrations Portfolio</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {portfolioConnections.map((connection, index) => (
                    <motion.div
                      key={connection.platform}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-6 border-slate-600/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${connection.color} flex items-center justify-center`}>
                            <connection.icon className="h-6 w-6 text-white" />
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <h4 className="text-white font-semibold mb-2">{connection.platform}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Compétences détectées</span>
                            <span className="text-white">{connection.skillsDetected}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Confiance IA</span>
                            <span className="text-cyan-400">{connection.confidence}%</span>
                          </div>
                          <Progress value={connection.confidence} className="mt-2" />
                          <p className="text-gray-500 text-xs mt-2">{connection.lastAnalysis}</p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Certificate Modal */}
        <AnimatePresence>
          {selectedCertificate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedCertificate(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`h-48 bg-gradient-to-r ${selectedCertificate.color} relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    {selectedCertificate.nft && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                        <Zap className="h-4 w-4 mr-1" />
                        NFT
                      </Badge>
                    )}
                    <Badge className={`bg-gradient-to-r ${rarityColors[selectedCertificate.rarity]} text-white border-0`}>
                      {selectedCertificate.rarity.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedCertificate.title}</h2>
                    <p className="text-white/80">{selectedCertificate.domain}</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm">Niveau</p>
                      <p className="text-white font-semibold">{selectedCertificate.level}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Confiance IA</p>
                      <p className="text-cyan-400 font-semibold">{selectedCertificate.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Date d'émission</p>
                      <p className="text-white font-semibold">{selectedCertificate.issueDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Rareté</p>
                      <p className="text-amber-400 font-semibold capitalize">{selectedCertificate.rarity}</p>
                    </div>
                  </div>

                  {selectedCertificate.blockchain && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 mb-6">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="text-purple-400 font-semibold">Vérifié Blockchain</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Réseau</p>
                          <p className="text-white">{selectedCertificate.blockchain.network}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Token ID</p>
                          <p className="text-white font-mono">{selectedCertificate.blockchain.tokenId}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-white font-semibold mb-3">Compétences Validées</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCertificate.skills.map((skill) => (
                        <Badge key={skill} variant="info">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedCertificate(null)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Corp1o1UserPortfolio;