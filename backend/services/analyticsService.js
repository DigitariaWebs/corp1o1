// services/analyticsService.js
const LearningAnalytics = require("../models/LearningAnalytics");
const UserProgress = require("../models/UserProgress");
const LearningSession = require("../models/LearningSession");
const AISession = require("../models/AISession");
const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
const LearningModule = require("../models/LearningModule");
const { openAIService } = require("./openaiService");
const { dataAnalyzer } = require("../utils/dataAnalyzer");

class AnalyticsService {
  /**
   * Health check for analytics service
   */
  async healthCheck() {
    try {
      // Check if we can access analytics collections
      await LearningAnalytics.findOne().limit(1);
      return true;
    } catch (error) {
      console.error("Analytics service health check failed:", error);
      return false;
    }
  }

  /**
   * Calculate and store analytics for a user
   */
  async calculateUserAnalytics(userId, periodType = "daily") {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      // Define period boundaries
      const { startDate, endDate } = this.getPeriodBoundaries(periodType);

      // Get user data for the period
      const progressData = await this.getUserProgressData(
        userId,
        startDate,
        endDate
      );
      const sessionData = await this.getUserSessionData(
        userId,
        startDate,
        endDate
      );
      const aiData = await this.getUserAIData(userId, startDate, endDate);

      // Calculate analytics
      const analytics = {
        user: userId,
        period: {
          type: periodType,
          startDate,
          endDate,
        },
        engagement: this.calculateEngagementMetrics(sessionData),
        progress: this.calculateProgressMetrics(progressData),
        performance: await this.calculatePerformanceMetrics(
          userId,
          progressData,
          sessionData
        ),
        aiInteraction: this.calculateAIMetrics(aiData),
        predictions: await this.calculatePredictions(
          userId,
          progressData,
          sessionData
        ),
        recommendations: await this.calculateRecommendationMetrics(userId),
      };

      // Save or update analytics
      const existingAnalytics = await LearningAnalytics.findOne({
        user: userId,
        "period.type": periodType,
        "period.startDate": startDate,
        "period.endDate": endDate,
      });

      if (existingAnalytics) {
        Object.assign(existingAnalytics, analytics);
        await existingAnalytics.save();
        return existingAnalytics;
      } else {
        const newAnalytics = new LearningAnalytics(analytics);
        await newAnalytics.save();
        return newAnalytics;
      }
    } catch (error) {
      console.error("Error calculating user analytics:", error);
      throw error;
    }
  }

  /**
   * Get performance analytics for user
   */
  async getPerformanceAnalytics(userId, options = {}) {
    const { timeRange = "30d", pathId, moduleId, metrics = [] } = options;

    const { startDate, endDate } = this.parseTimeRange(timeRange);

    // Build query
    const query = {
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (pathId) query.learningPath = pathId;
    if (moduleId) query.learningModule = moduleId;

    // Get progress data
    const progressData = await UserProgress.find(query)
      .populate("learningPath", "title category difficulty")
      .populate("learningModule", "title difficulty estimatedDuration")
      .sort({ createdAt: -1 });

    // Calculate metrics
    const performance = {
      overview: this.calculatePerformanceOverview(progressData),
      trends: this.calculatePerformanceTrends(progressData),
      breakdown: this.calculatePerformanceBreakdown(progressData),
      recommendations: await this.generatePerformanceRecommendations(
        userId,
        progressData
      ),
    };

    return performance;
  }

  /**
   * Generate performance insights using AI
   */
  async generatePerformanceInsights(userId, performanceData) {
    try {
      const prompt = `
        Analyze this user's learning performance data and provide actionable insights:

        Performance Overview:
        - Completion Rate: ${performanceData.overview.completionRate}%
        - Average Score: ${performanceData.overview.averageScore}%
        - Learning Velocity: ${performanceData.overview.learningVelocity} modules/week
        - Time Efficiency: ${performanceData.overview.timeEfficiency}%

        Trends:
        - Performance Trend: ${performanceData.trends.direction}
        - Consistency Score: ${performanceData.trends.consistency}%
        - Improvement Rate: ${performanceData.trends.improvementRate}%

        Provide 3-4 specific, actionable insights in this format:
        {
          "insights": [
            {
              "type": "strength|weakness|opportunity|concern",
              "title": "Brief insight title",
              "description": "Detailed explanation",
              "actionableSteps": ["step1", "step2"],
              "priority": "high|medium|low"
            }
          ]
        }
      `;

      const aiResponse = await openAIService.generateCompletion(prompt, {
        maxTokens: 800,
        temperature: 0.7,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      console.error("Error generating performance insights:", error);
      return {
        insights: [
          {
            type: "opportunity",
            title: "Continue Your Learning Journey",
            description:
              "Keep building on your current progress with consistent practice.",
            actionableSteps: [
              "Set a regular learning schedule",
              "Focus on areas needing improvement",
            ],
            priority: "medium",
          },
        ],
      };
    }
  }

  /**
   * Get engagement metrics and trends
   */
  async getEngagementMetrics(userId, options = {}) {
    const { timeRange = "30d", granularity = "day" } = options;
    const { startDate, endDate } = this.parseTimeRange(timeRange);

    // Get session data
    const sessions = await LearningSession.find({
      user: userId,
      startTime: { $gte: startDate, $lte: endDate },
    }).sort({ startTime: 1 });

    // Calculate engagement metrics
    const metrics = {
      totalSessions: sessions.length,
      totalTime: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      averageSessionDuration:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
            sessions.length
          : 0,
      engagementScore: this.calculateEngagementScore(sessions),
      consistencyScore: this.calculateConsistencyScore(sessions),
      focusScore: this.calculateFocusScore(sessions),
    };

    // Get time-series data for trends
    const timeSeriesData = this.groupSessionsByGranularity(
      sessions,
      granularity
    );

    return {
      metrics,
      timeSeries: timeSeriesData,
      insights: this.generateEngagementInsights(metrics, timeSeriesData),
    };
  }

  /**
   * Get recent achievements for user
   */
  async getRecentAchievements(userId, limit = 5) {
    const recentProgress = await UserProgress.find({
      user: userId,
      completionStatus: "completed",
    })
      .populate("learningModule", "title category difficulty")
      .sort({ completedAt: -1 })
      .limit(limit);

    return recentProgress.map((progress) => ({
      id: progress._id,
      type: "module_completion",
      title: `Completed: ${progress.learningModule.title}`,
      description: `Successfully completed ${progress.learningModule.category} module`,
      achievedAt: progress.completedAt,
      category: progress.learningModule.category,
      difficulty: progress.learningModule.difficulty,
      score: progress.finalScore,
    }));
  }

  /**
   * Get learning streak data
   */
  async getLearningStreak(userId) {
    const sessions = await LearningSession.find({
      user: userId,
    })
      .sort({ startTime: -1 })
      .limit(90); // Last 90 days

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    // Group sessions by date
    const sessionsByDate = {};
    sessions.forEach((session) => {
      const date = session.startTime.toISOString().split("T")[0];
      sessionsByDate[date] = true;
    });

    // Calculate current streak from today backwards
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (sessionsByDate[dateStr]) {
        if (
          i === 0 ||
          (lastDate && this.isConsecutiveDay(lastDate, checkDate))
        ) {
          currentStreak++;
          tempStreak++;
        } else {
          break;
        }
        lastDate = checkDate;
      } else if (i === 0) {
        break; // No activity today breaks current streak
      }
    }

    // Calculate longest streak
    const dates = Object.keys(sessionsByDate).sort().reverse();
    tempStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i]);
      const previous = new Date(dates[i - 1]);

      if (this.isConsecutiveDay(current, previous)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      activeDays: Object.keys(sessionsByDate).length,
      lastActivityDate: sessions.length > 0 ? sessions[0].startTime : null,
    };
  }

  /**
   * Get performance trends for user
   */
  async getPerformanceTrends(userId, timeRange = "30d") {
    const { startDate, endDate } = this.parseTimeRange(timeRange);

    const analytics = await LearningAnalytics.find({
      user: userId,
      "period.startDate": { $gte: startDate },
      "period.endDate": { $lte: endDate },
    }).sort({ "period.startDate": 1 });

    if (analytics.length === 0) {
      return {
        trends: [],
        summary: {
          direction: "stable",
          strength: "insufficient_data",
        },
      };
    }

    const trends = {
      completion: analytics.map((a) => ({
        date: a.period.startDate,
        value: a.progress.completionRate,
      })),
      engagement: analytics.map((a) => ({
        date: a.period.startDate,
        value: a.engagement.focusScore,
      })),
      performance: analytics.map((a) => ({
        date: a.period.startDate,
        value: a.progress.averageModuleScore,
      })),
    };

    const summary = {
      direction: this.calculateTrendDirection(trends.performance),
      strength: this.calculateTrendStrength(trends.performance),
      improvementAreas: this.identifyImprovementAreas(analytics),
    };

    return { trends, summary };
  }

  /**
   * Generate comprehensive insights for user
   */
  async generateComprehensiveInsights(userId) {
    try {
      const latestAnalytics = await LearningAnalytics.getLatestAnalytics(
        userId
      );
      if (!latestAnalytics) {
        return {
          message: "Complete more learning activities to unlock insights",
          hasInsights: false,
        };
      }

      // Generate AI-powered insights
      const insights = await this.generateAIInsights(userId, latestAnalytics);

      // Get personalized recommendations
      const RecommendationEngine = require("../models/RecommendationEngine");
      const recommendations =
        await RecommendationEngine.getActiveRecommendations(userId, 3);

      // Get goal progress
      const goalProgress = await this.getGoalProgress(userId);

      // Get optimal next steps
      const nextSteps = await this.getOptimalNextSteps(userId);

      return {
        insights,
        recommendations,
        goalProgress,
        nextSteps,
        hasInsights: true,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating comprehensive insights:", error);
      throw error;
    }
  }

  /**
   * Generate personalized insights using AI
   */
  async generateAIInsights(userId, analytics) {
    try {
      const user = await User.findById(userId);

      const prompt = `
        Generate personalized learning insights for this user:

        User Profile:
        - Learning Style: ${user.learningProfile.learningStyle}
        - AI Personality: ${user.learningProfile.aiPersonality}
        - Goals: ${user.learningProfile.goals.join(", ")}

        Recent Analytics:
        - Completion Rate: ${analytics.progress.completionRate}%
        - Engagement Score: ${analytics.engagement.focusScore}/100
        - Learning Velocity: ${analytics.calculateLearningVelocity()} modules/week
        - AI Satisfaction: ${analytics.aiInteraction.satisfactionScore}/5

        Learning Patterns:
        ${JSON.stringify(analytics.identifyLearningPatterns())}

        Provide personalized insights in this format:
        {
          "insights": [
            {
              "category": "performance|engagement|goals|optimization",
              "insight": "Personalized insight text",
              "recommendation": "Specific actionable recommendation",
              "impact": "high|medium|low"
            }
          ],
          "keyStrengths": ["strength1", "strength2"],
          "improvementAreas": ["area1", "area2"],
          "personalizedTip": "One specific tip based on their learning style and patterns"
        }
      `;

      const aiResponse = await openAIService.generateCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.8,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return {
        insights: [],
        keyStrengths: ["Consistent learning engagement"],
        improvementAreas: ["Continue building learning habits"],
        personalizedTip: "Keep up your great learning momentum!",
      };
    }
  }

  /**
   * Export analytics data for user
   */
  async exportData(userId, options = {}) {
    const {
      timeRange = "30d",
      dataTypes = [],
      format = "json",
      includePersonalData = false,
    } = options;
    const { startDate, endDate } = this.parseTimeRange(timeRange);

    const exportData = {};

    if (dataTypes.includes("learning_sessions")) {
      exportData.sessions = await LearningSession.find({
        user: userId,
        startTime: { $gte: startDate, $lte: endDate },
      }).select(includePersonalData ? {} : "-user -personalNotes");
    }

    if (dataTypes.includes("progress_data")) {
      exportData.progress = await UserProgress.find({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .populate("learningModule", "title category")
        .select(includePersonalData ? {} : "-user");
    }

    if (dataTypes.includes("ai_interactions")) {
      exportData.aiInteractions = await AISession.find({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
      }).select(includePersonalData ? {} : "-user -messages.userMessage");
    }

    if (dataTypes.includes("engagement_metrics")) {
      exportData.analytics = await LearningAnalytics.find({
        user: userId,
        "period.startDate": { $gte: startDate },
      }).select("-user");
    }

    // Format based on requested format
    if (format === "csv") {
      return this.convertToCSV(exportData);
    } else if (format === "xlsx") {
      return this.convertToXLSX(exportData);
    }

    return exportData;
  }

  // Helper methods

  getPeriodBoundaries(periodType) {
    const now = new Date();
    let startDate, endDate;

    switch (periodType) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case "weekly":
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    return { startDate, endDate };
  }

  parseTimeRange(timeRange) {
    const now = new Date();
    let startDate;

    if (timeRange.endsWith("d")) {
      const days = parseInt(timeRange.replace("d", ""));
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (timeRange.endsWith("m")) {
      const months = parseInt(timeRange.replace("m", ""));
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - months);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    }

    return { startDate, endDate: now };
  }

  async getUserProgressData(userId, startDate, endDate) {
    return UserProgress.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  async getUserSessionData(userId, startDate, endDate) {
    return LearningSession.find({
      user: userId,
      startTime: { $gte: startDate, $lte: endDate },
    });
  }

  async getUserAIData(userId, startDate, endDate) {
    return AISession.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  calculateEngagementMetrics(sessionData) {
    if (sessionData.length === 0) {
      return {
        totalSessionTime: 0,
        averageSessionDuration: 0,
        sessionCount: 0,
        interactionRate: 0,
        focusScore: 0,
      };
    }

    const totalTime = sessionData.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const avgDuration = totalTime / sessionData.length;
    const totalInteractions = sessionData.reduce(
      (sum, session) => sum + (session.interactionCount || 0),
      0
    );
    const interactionRate =
      totalTime > 0 ? totalInteractions / (totalTime / 60) : 0;

    // Calculate focus score based on session consistency and interaction patterns
    const focusScore = this.calculateFocusScore(sessionData);

    return {
      totalSessionTime: Math.round(totalTime),
      averageSessionDuration: Math.round(avgDuration),
      sessionCount: sessionData.length,
      interactionRate: Math.round(interactionRate * 100) / 100,
      focusScore: Math.round(focusScore),
    };
  }

  calculateProgressMetrics(progressData) {
    if (progressData.length === 0) {
      return {
        modulesStarted: 0,
        modulesCompleted: 0,
        pathsEnrolled: 0,
        pathsCompleted: 0,
        completionRate: 0,
        averageModuleScore: 0,
      };
    }

    const completed = progressData.filter(
      (p) => p.completionStatus === "completed"
    );
    const scores = progressData
      .filter((p) => p.finalScore > 0)
      .map((p) => p.finalScore);
    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    return {
      modulesStarted: progressData.length,
      modulesCompleted: completed.length,
      pathsEnrolled: [...new Set(progressData.map((p) => p.learningPath))]
        .length,
      pathsCompleted: 0, // Would need additional logic to determine path completion
      completionRate:
        progressData.length > 0
          ? (completed.length / progressData.length) * 100
          : 0,
      averageModuleScore: Math.round(avgScore),
    };
  }

  calculateFocusScore(sessions) {
    if (sessions.length === 0) return 0;

    // Focus score based on session consistency, duration, and interaction patterns
    const avgDuration =
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
    const durationScore = Math.min(avgDuration / 30, 1) * 40; // Up to 40 points for 30+ min avg

    const consistencyScore = this.calculateConsistencyScore(sessions) * 0.3; // Up to 30 points

    const interactionScore =
      (sessions.reduce((sum, s) => {
        const rate =
          s.duration > 0 ? (s.interactionCount || 0) / (s.duration / 60) : 0;
        return sum + Math.min(rate / 2, 1); // 2 interactions per minute is good
      }, 0) /
        sessions.length) *
      30; // Up to 30 points

    return Math.round(durationScore + consistencyScore + interactionScore);
  }

  calculateConsistencyScore(sessions) {
    if (sessions.length < 2) return 100;

    // Group sessions by day
    const sessionsByDay = {};
    sessions.forEach((session) => {
      const day = session.startTime.toISOString().split("T")[0];
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });

    const totalDays = Object.keys(sessionsByDay).length;
    const avgSessionsPerDay = sessions.length / totalDays;

    // Consistency is high when user has regular daily sessions
    const variance =
      Object.values(sessionsByDay).reduce((sum, count) => {
        return sum + Math.pow(count - avgSessionsPerDay, 2);
      }, 0) / totalDays;

    const consistency = Math.max(0, 100 - variance * 20);
    return Math.round(consistency);
  }

  isConsecutiveDay(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  calculateTrendDirection(dataPoints) {
    if (dataPoints.length < 2) return "stable";

    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return "improving";
    if (change < -5) return "declining";
    return "stable";
  }

  calculateTrendStrength(dataPoints) {
    if (dataPoints.length < 3) return "weak";

    // Calculate correlation coefficient to determine trend strength
    // Simplified version - in production might use more sophisticated analysis
    const n = dataPoints.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;

    dataPoints.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumX2 += index * index;
      sumY2 += point.value * point.value;
    });

    const correlation =
      (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    const absCorr = Math.abs(correlation);
    if (absCorr > 0.7) return "strong";
    if (absCorr > 0.4) return "moderate";
    return "weak";
  }

  // Additional helper methods would go here...
  // (convertToCSV, convertToXLSX, etc.)
}

const analyticsService = new AnalyticsService();
module.exports = { analyticsService };
