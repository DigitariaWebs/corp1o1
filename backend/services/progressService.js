const UserProgress = require('../models/UserProgress');
const LearningSession = require('../models/LearningSession');
const LearningModule = require('../models/LearningModule');
const LearningPath = require('../models/LearningPath');
const User = require('../models/User');

// Progress calculation and analytics service
class ProgressService {

  /**
   * Calculate comprehensive progress metrics for a user
   */
  static async calculateUserProgressMetrics(userId, timeRange = '30d') {
    try {
      const dateThreshold = this.getDateThreshold(timeRange);
      
      const [
        overallProgress,
        sessionData,
        pathProgress,
        moduleProgress
      ] = await Promise.all([
        this.getOverallProgressMetrics(userId),
        this.getSessionMetrics(userId, dateThreshold),
        this.getPathProgressMetrics(userId),
        this.getModuleProgressMetrics(userId, dateThreshold)
      ]);

      return {
        overall: overallProgress,
        sessions: sessionData,
        paths: pathProgress,
        modules: moduleProgress,
        trends: this.calculateTrends(sessionData),
        recommendations: await this.generateProgressRecommendations(userId, overallProgress)
      };

    } catch (error) {
      console.error('Progress metrics calculation error:', error);
      throw error;
    }
  }

  /**
   * Get overall progress metrics for user
   */
  static async getOverallProgressMetrics(userId) {
    const progressData = await UserProgress.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          pathEnrollments: { 
            $sum: { $cond: [{ $ne: ['$pathId', null] }, 1, 0] }
          },
          moduleEnrollments: { 
            $sum: { $cond: [{ $ne: ['$moduleId', null] }, 1, 0] }
          },
          completedPaths: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$pathId', null] }, '$progress.completed'] }, 
                1, 0
              ]
            }
          },
          completedModules: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ['$moduleId', null] }, '$progress.completed'] }, 
                1, 0
              ]
            }
          },
          totalTimeSpent: { $sum: '$analytics.totalTimeSpent' },
          totalSessions: { $sum: '$analytics.sessionsCount' },
          averageEngagement: { $avg: '$analytics.engagementScore' },
          averageAssessmentScore: { $avg: '$performance.averageScore' }
        }
      }
    ]);

    const metrics = progressData[0] || {
      totalEnrollments: 0,
      pathEnrollments: 0,
      moduleEnrollments: 0,
      completedPaths: 0,
      completedModules: 0,
      totalTimeSpent: 0,
      totalSessions: 0,
      averageEngagement: 0,
      averageAssessmentScore: 0
    };

    // Calculate derived metrics
    metrics.pathCompletionRate = metrics.pathEnrollments > 0 ? 
      (metrics.completedPaths / metrics.pathEnrollments) * 100 : 0;
    
    metrics.moduleCompletionRate = metrics.moduleEnrollments > 0 ? 
      (metrics.completedModules / metrics.moduleEnrollments) * 100 : 0;
    
    metrics.averageSessionTime = metrics.totalSessions > 0 ? 
      metrics.totalTimeSpent / metrics.totalSessions : 0;

    // Get learning streak
    metrics.learningStreak = await this.calculateLearningStreak(userId);

    return metrics;
  }

  /**
   * Get session-specific metrics
   */
  static async getSessionMetrics(userId, dateThreshold) {
    const sessions = await LearningSession.find({
      userId,
      startTime: { $gte: dateThreshold }
    }).sort({ startTime: -1 }).lean();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        averageDuration: 0,
        totalTime: 0,
        averageEngagement: 0,
        averageFocus: 0,
        sessionCompletionRate: 0,
        dailySessionData: []
      };
    }

    const metrics = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalTime: sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0),
      averageEngagement: sessions.reduce((sum, s) => 
        sum + (s.performance?.engagementScore || 0), 0) / sessions.length,
      averageFocus: sessions.reduce((sum, s) => 
        sum + (s.performance?.focusScore || 0), 0) / sessions.length,
      dailySessionData: this.groupSessionsByDay(sessions)
    };

    metrics.averageDuration = metrics.totalSessions > 0 ? 
      metrics.totalTime / metrics.totalSessions : 0;
    
    metrics.sessionCompletionRate = metrics.totalSessions > 0 ? 
      (metrics.completedSessions / metrics.totalSessions) * 100 : 0;

    return metrics;
  }

  /**
   * Get path-specific progress metrics
   */
  static async getPathProgressMetrics(userId) {
    const pathProgress = await UserProgress.find({
      userId,
      pathId: { $exists: true, $ne: null }
    })
    .populate('pathId', 'title category difficulty estimatedHours')
    .sort({ 'progress.lastAccessed': -1 })
    .lean();

    const metrics = {
      enrolledPaths: pathProgress.length,
      pathsByStatus: {
        in_progress: 0,
        completed: 0,
        paused: 0,
        abandoned: 0
      },
      pathsByDifficulty: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0
      },
      pathsByCategory: {},
      averageProgress: 0,
      mostActiveCategory: null
    };

    let totalProgress = 0;
    const categoryCount = {};
    const categoryProgress = {};

    pathProgress.forEach(progress => {
      // Status distribution
      metrics.pathsByStatus[progress.status] = 
        (metrics.pathsByStatus[progress.status] || 0) + 1;

      // Difficulty distribution
      if (progress.pathId && progress.pathId.difficulty) {
        metrics.pathsByDifficulty[progress.pathId.difficulty] = 
          (metrics.pathsByDifficulty[progress.pathId.difficulty] || 0) + 1;
      }

      // Category distribution and progress
      if (progress.pathId && progress.pathId.category) {
        const category = progress.pathId.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        
        if (!categoryProgress[category]) {
          categoryProgress[category] = { total: 0, count: 0 };
        }
        categoryProgress[category].total += progress.progress.percentage;
        categoryProgress[category].count += 1;
      }

      totalProgress += progress.progress.percentage;
    });

    // Calculate averages
    if (pathProgress.length > 0) {
      metrics.averageProgress = totalProgress / pathProgress.length;

      // Find most active category
      let maxCount = 0;
      Object.entries(categoryCount).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          metrics.mostActiveCategory = category;
        }
      });

      // Calculate category progress averages
      Object.entries(categoryProgress).forEach(([category, data]) => {
        metrics.pathsByCategory[category] = {
          count: data.count,
          averageProgress: data.total / data.count
        };
      });
    }

    return metrics;
  }

  /**
   * Get module-specific progress metrics
   */
  static async getModuleProgressMetrics(userId, dateThreshold) {
    const moduleProgress = await UserProgress.find({
      userId,
      moduleId: { $exists: true, $ne: null },
      lastActivityDate: { $gte: dateThreshold }
    })
    .populate('moduleId', 'title difficulty content.type content.duration')
    .lean();

    const metrics = {
      activeModules: moduleProgress.length,
      completedModules: moduleProgress.filter(p => p.progress.completed).length,
      averageModuleProgress: 0,
      modulesByDifficulty: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0
      },
      modulesByType: {},
      averageEngagementByType: {},
      strugglingModules: [],
      excellingModules: []
    };

    if (moduleProgress.length === 0) return metrics;

    let totalProgress = 0;
    const typeEngagement = {};
    const typeCount = {};

    moduleProgress.forEach(progress => {
      totalProgress += progress.progress.percentage;

      if (progress.moduleId) {
        // Difficulty distribution
        const difficulty = progress.moduleId.difficulty;
        if (difficulty) {
          metrics.modulesByDifficulty[difficulty] = 
            (metrics.modulesByDifficulty[difficulty] || 0) + 1;
        }

        // Type distribution and engagement
        const contentType = progress.moduleId.content?.type;
        if (contentType) {
          metrics.modulesByType[contentType] = 
            (metrics.modulesByType[contentType] || 0) + 1;

          if (!typeEngagement[contentType]) {
            typeEngagement[contentType] = 0;
            typeCount[contentType] = 0;
          }
          typeEngagement[contentType] += progress.analytics?.engagementScore || 0;
          typeCount[contentType] += 1;
        }

        // Identify struggling and excelling modules
        const engagementScore = progress.analytics?.engagementScore || 0;
        const progressPercentage = progress.progress.percentage;

        if (engagementScore < 50 || (progressPercentage < 30 && progress.analytics?.totalTimeSpent > 60)) {
          metrics.strugglingModules.push({
            id: progress.moduleId._id,
            title: progress.moduleId.title,
            difficulty: progress.moduleId.difficulty,
            progress: progressPercentage,
            engagement: engagementScore,
            timeSpent: progress.analytics?.totalTimeSpent || 0
          });
        } else if (engagementScore > 85 && progressPercentage > 80) {
          metrics.excellingModules.push({
            id: progress.moduleId._id,
            title: progress.moduleId.title,
            difficulty: progress.moduleId.difficulty,
            progress: progressPercentage,
            engagement: engagementScore,
            timeSpent: progress.analytics?.totalTimeSpent || 0
          });
        }
      }
    });

    metrics.averageModuleProgress = totalProgress / moduleProgress.length;

    // Calculate average engagement by content type
    Object.keys(typeEngagement).forEach(type => {
      metrics.averageEngagementByType[type] = 
        typeEngagement[type] / typeCount[type];
    });

    return metrics;
  }

  /**
   * Calculate learning streak for user
   */
  static async calculateLearningStreak(userId) {
    const recentSessions = await LearningSession.find({
      userId,
      status: 'completed',
      startTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    })
    .select('startTime')
    .sort({ startTime: -1 })
    .lean();

    if (recentSessions.length === 0) {
      return { current: 0, longest: 0, lastActive: null };
    }

    // Group sessions by date
    const sessionDates = recentSessions.map(session => {
      const date = new Date(session.startTime);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a);
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let checkDate = todayTime;
    for (const dateTime of uniqueDates) {
      if (checkDate - dateTime <= 24 * 60 * 60 * 1000) {
        currentStreak++;
        checkDate = dateTime;
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified approach)
    let longestStreak = currentStreak;
    let tempStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i-1] - uniqueDates[i] <= 24 * 60 * 60 * 1000) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActive: recentSessions[0] ? recentSessions[0].startTime : null
    };
  }

  /**
   * Group sessions by day for time series analysis
   */
  static groupSessionsByDay(sessions) {
    const dailyData = {};

    sessions.forEach(session => {
      const dateKey = session.startTime.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          sessions: 0,
          totalTime: 0,
          completedSessions: 0,
          averageEngagement: 0,
          averageFocus: 0,
          engagementSum: 0,
          focusSum: 0
        };
      }

      const dayData = dailyData[dateKey];
      dayData.sessions += 1;
      dayData.totalTime += session.totalDuration || 0;
      
      if (session.status === 'completed') {
        dayData.completedSessions += 1;
      }

      dayData.engagementSum += session.performance?.engagementScore || 0;
      dayData.focusSum += session.performance?.focusScore || 0;
    });

    // Calculate averages for each day
    return Object.values(dailyData).map(dayData => ({
      ...dayData,
      averageEngagement: dayData.sessions > 0 ? 
        Math.round(dayData.engagementSum / dayData.sessions) : 0,
      averageFocus: dayData.sessions > 0 ? 
        Math.round(dayData.focusSum / dayData.sessions) : 0,
      completionRate: dayData.sessions > 0 ? 
        (dayData.completedSessions / dayData.sessions) * 100 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Calculate trends from session data
   */
  static calculateTrends(sessionData) {
    const dailyData = sessionData.dailySessionData || [];
    
    if (dailyData.length < 7) {
      return {
        engagement: 'insufficient_data',
        focus: 'insufficient_data',
        sessionTime: 'insufficient_data',
        completion: 'insufficient_data'
      };
    }

    const recent = dailyData.slice(-7);
    const previous = dailyData.slice(-14, -7);

    const trends = {};
    
    ['averageEngagement', 'averageFocus', 'totalTime', 'completionRate'].forEach(metric => {
      const recentAvg = recent.reduce((sum, d) => sum + (d[metric] || 0), 0) / recent.length;
      const previousAvg = previous.length > 0 ? 
        previous.reduce((sum, d) => sum + (d[metric] || 0), 0) / previous.length : recentAvg;
      
      const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
      
      let trend = 'stable';
      if (change > 10) trend = 'improving';
      else if (change < -10) trend = 'declining';
      
      const mappedKey = metric === 'averageEngagement' ? 'engagement' :
                       metric === 'averageFocus' ? 'focus' :
                       metric === 'totalTime' ? 'sessionTime' : 'completion';
      
      trends[mappedKey] = {
        trend,
        change: Math.round(change),
        current: Math.round(recentAvg),
        previous: Math.round(previousAvg)
      };
    });

    return trends;
  }

  /**
   * Generate personalized progress recommendations
   */
  static async generateProgressRecommendations(userId, progressMetrics) {
    const recommendations = [];

    // Engagement recommendations
    if (progressMetrics.averageEngagement < 60) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        title: 'Improve Learning Engagement',
        description: 'Your engagement scores suggest trying different content types or learning environments',
        actions: [
          'Try interactive modules instead of video content',
          'Take breaks between study sessions',
          'Change your study environment',
          'Set smaller, achievable goals'
        ]
      });
    }

    // Completion rate recommendations
    if (progressMetrics.pathCompletionRate < 50) {
      recommendations.push({
        type: 'completion',
        priority: 'high',
        title: 'Focus on Completion',
        description: 'You have many started paths. Consider focusing on fewer paths to improve completion rates',
        actions: [
          'Choose 1-2 paths to focus on',
          'Set weekly completion goals',
          'Review and abandon paths that no longer interest you',
          'Break down large paths into smaller milestones'
        ]
      });
    }

    // Session time recommendations
    if (progressMetrics.averageSessionTime < 20) {
      recommendations.push({
        type: 'session_duration',
        priority: 'medium',
        title: 'Extend Learning Sessions',
        description: 'Longer sessions can improve retention and reduce cognitive switching costs',
        actions: [
          'Aim for 30-45 minute sessions',
          'Use the Pomodoro Technique',
          'Plan sessions in advance',
          'Eliminate distractions during study time'
        ]
      });
    }

    // Consistency recommendations
    if (progressMetrics.learningStreak.current < 3) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        title: 'Build Learning Consistency',
        description: 'Regular learning sessions lead to better retention and progress',
        actions: [
          'Set a daily learning reminder',
          'Start with just 15 minutes per day',
          'Choose a consistent time for learning',
          'Track your daily progress'
        ]
      });
    }

    // Assessment performance recommendations
    if (progressMetrics.averageAssessmentScore < 70) {
      recommendations.push({
        type: 'assessment',
        priority: 'high',
        title: 'Improve Assessment Performance',
        description: 'Review and practice more before taking assessments',
        actions: [
          'Review module content before assessments',
          'Take practice quizzes when available',
          'Focus on understanding concepts, not memorization',
          'Ask for help in areas where you struggle'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get date threshold based on time range
   */
  static getDateThreshold(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }

  /**
   * Update user progress based on session completion
   */
  static async updateProgressFromSession(sessionId, userId) {
    try {
      const session = await LearningSession.findOne({
        sessionId,
        userId,
        status: 'completed'
      }).populate('moduleId pathId');

      if (!session) {
        throw new Error('Session not found or not completed');
      }

      // Update module progress if exists
      if (session.moduleId) {
        await this.updateModuleProgress(userId, session);
      }

      // Update path progress if exists
      if (session.pathId) {
        await this.updatePathProgress(userId, session);
      }

      // Update user statistics
      await this.updateUserStatistics(userId, session);

      return { success: true, message: 'Progress updated successfully' };

    } catch (error) {
      console.error('Progress update error:', error);
      throw error;
    }
  }

  /**
   * Update module-specific progress
   */
  static async updateModuleProgress(userId, session) {
    const progress = await UserProgress.findOne({
      userId,
      moduleId: session.moduleId._id
    });

    if (progress) {
      // Record session data
      await progress.recordSession({
        timeSpent: session.totalDuration || 0,
        engagementScore: session.performance?.engagementScore,
        activeTime: session.activeDuration || 0
      });
    }
  }

  /**
   * Update path-level progress
   */
  static async updatePathProgress(userId, session) {
    const pathProgress = await UserProgress.findOne({
      userId,
      pathId: session.pathId._id,
      moduleId: { $exists: false }
    });

    if (pathProgress) {
      // Update path-level analytics
      pathProgress.analytics.totalTimeSpent += session.totalDuration || 0;
      pathProgress.analytics.sessionsCount += 1;
      pathProgress.lastActivityDate = new Date();

      await pathProgress.save();
    }
  }

  /**
   * Update overall user statistics
   */
  static async updateUserStatistics(userId, session) {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'statistics.totalLearningTime': session.totalDuration || 0
      },
      $set: {
        'statistics.lastActiveAt': new Date()
      }
    });
  }
}

module.exports = ProgressService;