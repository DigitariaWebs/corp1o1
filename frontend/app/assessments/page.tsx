"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp,
  Award,
  Target,
  Star,
  Sparkles
} from 'lucide-react';
import { MainNavigation } from "@/components/navigation/main-navigation";
import { AssessmentList } from "@/components/assessments/assessment-list";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    totalTaken: 0,
    totalPassed: 0,
    averageScore: 0,
    successRate: 0
  });

  // Mock user for navigation
  const mockUser = {
    name: user?.name || "Student",
    avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  };

  // Load user stats
  useEffect(() => {
    // This would normally fetch from API
    setUserStats({
      totalTaken: 5,
      totalPassed: 3,
      averageScore: 78,
      successRate: 60
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                Skills Assessments
                <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </h1>
              <p className="text-xl text-gray-300 mt-2">
                Evaluate and validate your skills with AI-powered assessments
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-cyan-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Assessments Taken</p>
                <p className="text-white text-2xl font-bold">{userStats.totalTaken}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Passed</p>
                <p className="text-white text-2xl font-bold">{userStats.totalPassed}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-white text-2xl font-bold">{userStats.averageScore}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-white text-2xl font-bold">{userStats.successRate}%</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Assessment List Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AssessmentList />
        </motion.div>
      </div>
    </div>
  );
}