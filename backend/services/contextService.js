// services/contextService.js
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");
const LearningPath = require("../models/LearningPath");
const LearningModule = require("../models/LearningModule");
const LearningSession = require("../models/LearningSession");
const AISession = require("../models/AISession");
const { AppError } = require("../middleware/errorHandler");

class ContextService {
  /**
   * Assemble complete user context for AI interactions
   * @param {string} userId - User ID
   * @param {Object} sessionData - Optional session data
   * @returns {Promise<Object>} Complete user context
   */
  async assembleUserContext(userId, sessionData = {}) {
    try {
      console.log(`🧠 Assembling context for user: ${userId}`);

      // Fetch all required data in parallel for performance
      const [
        user,
        progressSummary,
        currentLearningContext,
        performanceContext,
        recentAIActivity,
        learningPatterns,
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getProgressSummary(userId),
        this.getCurrentLearningContext(userId),
        this.getPerformanceContext(userId),
        this.getRecentAIActivity(userId),
        this.getLearningPatterns(userId),
      ]);

      // Assemble the complete context
      const context = {
        user: user,
        progress: progressSummary,
        currentLearning: currentLearningContext,
        performance: performanceContext,
        session: {
          ...sessionData,
          timestamp: new Date(),
          deviceType: sessionData.deviceType || "unknown",
        },
        aiHistory: recentAIActivity,
        patterns: learningPatterns,
        metadata: {
          contextGeneratedAt: new Date(),
          contextVersion: "1.0",
          userId: userId,
        },
      };

      // Add derived insights
      context.insights = this.generateContextInsights(context);

      console.log(
        `✅ Context assembled: ${Object.keys(context).length} sections`
      );
      return context;
    } catch (error) {
      console.error("❌ Error assembling user context:", error);
      throw new AppError("Failed to assemble user context", 500);
    }
  }

  /**
   * Get user profile with learning preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId)
      .select(
        "firstName lastName email learningProfile subscription preferences statistics"
      )
      .lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      learningStyle: user.learningProfile?.learningStyle || "visual",
      preferredPace: user.learningProfile?.preferredPace || "moderate",
      aiPersonality: user.learningProfile?.aiPersonality || "ARIA",
      motivationFactors: user.learningProfile?.motivationFactors || [],
      learningGoals: user.learningProfile?.learningGoals || [],
      preferredTimeOfDay: user.preferences?.learningTime || "any",
      difficultyPreference:
        user.learningProfile?.difficultyPreference || "moderate",
      subscription: user.subscription?.tier || "basic",
      joinedDate: user.statistics?.joinDate,
      totalLearningTime: user.statistics?.totalLearningTime || 0,
      streakCount: user.statistics?.currentStreak || 0,
    };
  }

  /**
   * Get user's overall progress summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Progress summary
   */
  async getProgressSummary(userId) {
    const progressSummary = await UserProgress.getUserProgressSummary(userId);

    // Get active paths
    const activePaths = await UserProgress.find({
      userId,
      status: "in_progress",
    })
      .populate("pathId", "title category difficulty estimatedHours")
      .limit(5)
      .lean();

    // Get recently completed paths
    const recentCompletions = await UserProgress.find({
      userId,
      status: "completed",
      "progress.completedAt": {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    })
      .populate("pathId", "title category")
      .sort({ "progress.completedAt": -1 })
      .limit(3)
      .lean();

    return {
      ...progressSummary,
      activePaths: activePaths.length,
      recentCompletions: recentCompletions.length,
      activePathDetails: activePaths.map((p) => ({
        title: p.pathId?.title,
        category: p.pathId?.category,
        progress: p.progress?.percentage || 0,
        lastAccessed: p.progress?.lastAccessed,
      })),
      recentAchievements: recentCompletions.map((p) => ({
        title: p.pathId?.title,
        completedAt: p.progress?.completedAt,
        category: p.pathId?.category,
      })),
    };
  }

  /**
   * Get current learning context (active module/path)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Current learning context
   */
  async getCurrentLearningContext(userId) {
    // Find most recent active learning session
    const activeSession = await LearningSession.findOne({
      userId,
      status: { $in: ["active", "paused"] },
    })
      .populate("pathId", "title category difficulty skills")
      .populate(
        "moduleId",
        "title description content learningObjectives estimatedDuration"
      )
      .sort({ startTime: -1 })
      .lean();

    if (!activeSession) {
      return {
        hasActiveSession: false,
        lastLearningActivity: await this.getLastLearningActivity(userId),
      };
    }

    // Get progress for this specific module
    const moduleProgress = await UserProgress.findOne({
      userId,
      moduleId: activeSession.moduleId._id,
    }).lean();

    return {
      hasActiveSession: true,
      sessionId: activeSession._id,
      sessionDuration: Math.round(
        (new Date() - activeSession.startTime) / (1000 * 60)
      ), // minutes
      currentPath: {
        title: activeSession.pathId?.title,
        category: activeSession.pathId?.category,
        difficulty: activeSession.pathId?.difficulty,
        skills: activeSession.pathId?.skills || [],
      },
      currentModule: {
        title: activeSession.moduleId?.title,
        description: activeSession.moduleId?.description,
        estimatedDuration: activeSession.moduleId?.estimatedDuration,
        objectives: activeSession.moduleId?.learningObjectives || [],
        contentTypes: this.extractContentTypes(activeSession.moduleId?.content),
      },
      progress: {
        moduleProgress: moduleProgress?.progress?.percentage || 0,
        timeSpent: moduleProgress?.progress?.timeSpent || 0,
        engagementScore: moduleProgress?.analytics?.engagementScore || 0,
        lastAccessed: moduleProgress?.progress?.lastAccessed,
      },
    };
  }

  /**
   * Get user's performance context
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceContext(userId) {
    // Get recent progress records for performance analysis
    const recentProgress = await UserProgress.find({
      userId,
      lastActivityDate: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    })
      .populate("pathId", "title category difficulty")
      .populate("moduleId", "title difficulty")
      .sort({ lastActivityDate: -1 })
      .limit(20)
      .lean();

    if (recentProgress.length === 0) {
      return {
        hasRecentActivity: false,
        averageEngagement: 0,
        strugglingAreas: [],
        strengths: [],
      };
    }

    // Calculate performance metrics
    const averageEngagement =
      recentProgress.reduce(
        (sum, p) => sum + (p.analytics?.engagementScore || 0),
        0
      ) / recentProgress.length;

    const averagePerformance =
      recentProgress.reduce(
        (sum, p) => sum + (p.performance?.averageScore || 0),
        0
      ) / recentProgress.length;

    // Identify struggling areas (low engagement or low scores)
    const strugglingAreas = recentProgress
      .filter(
        (p) =>
          (p.analytics?.engagementScore || 0) < 60 ||
          (p.performance?.averageScore || 0) < 70
      )
      .map((p) => ({
        area: p.pathId?.category || p.moduleId?.title,
        difficulty: p.pathId?.difficulty || p.moduleId?.difficulty,
        engagementScore: p.analytics?.engagementScore,
        performanceScore: p.performance?.averageScore,
      }))
      .slice(0, 3);

    // Identify strengths (high engagement and high scores)
    const strengths = recentProgress
      .filter(
        (p) =>
          (p.analytics?.engagementScore || 0) > 85 &&
          (p.performance?.averageScore || 0) > 85
      )
      .map((p) => ({
        area: p.pathId?.category || p.moduleId?.title,
        engagementScore: p.analytics?.engagementScore,
        performanceScore: p.performance?.averageScore,
      }))
      .slice(0, 3);

    return {
      hasRecentActivity: true,
      averageEngagement: Math.round(averageEngagement),
      averagePerformance: Math.round(averagePerformance),
      strugglingAreas,
      strengths,
      activityLevel: this.calculateActivityLevel(recentProgress),
      lastAssessmentScore: this.getLastAssessmentScore(recentProgress),
      improvementTrend: this.calculateImprovementTrend(recentProgress),
    };
  }

  /**
   * Get recent AI interaction history
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Recent AI activity
   */
  async getRecentAIActivity(userId) {
    const recentSessions = await AISession.find({
      userId,
      startTime: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })
      .sort({ startTime: -1 })
      .limit(3)
      .lean();

    if (recentSessions.length === 0) {
      return {
        hasRecentActivity: false,
        preferredPersonality: null,
        commonTopics: [],
        averageSatisfaction: 0,
      };
    }

    // Analyze recent sessions
    const personalities = recentSessions.map((s) => s.aiPersonality);
    const preferredPersonality = this.getMostFrequent(personalities);

    const allTopics = recentSessions.flatMap(
      (s) => s.analytics?.topicsDiscussed || []
    );
    const commonTopics = this.getMostFrequentTopics(allTopics, 3);

    const satisfactionScores = recentSessions
      .map((s) => s.outcomes?.userSatisfaction)
      .filter((score) => score !== null && score !== undefined);

    const averageSatisfaction =
      satisfactionScores.length > 0
        ? satisfactionScores.reduce((a, b) => a + b, 0) /
          satisfactionScores.length
        : 0;

    return {
      hasRecentActivity: true,
      recentSessionCount: recentSessions.length,
      preferredPersonality,
      commonTopics,
      averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      lastInteractionDate: recentSessions[0]?.startTime,
      totalConversationMessages: recentSessions.reduce(
        (sum, s) => sum + s.messages.length,
        0
      ),
    };
  }

  /**
   * Get user's learning patterns
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Learning patterns
   */
  async getLearningPatterns(userId) {
    // Get learning sessions from last 30 days
    const sessions = await LearningSession.find({
      userId,
      startTime: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    })
      .sort({ startTime: -1 })
      .lean();

    if (sessions.length === 0) {
      return { hasPatternData: false };
    }

    // Analyze time patterns
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    sessions.forEach((session) => {
      const hour = session.startTime.getHours();
      const day = session.startTime.getDay();
      hourlyActivity[hour]++;
      dailyActivity[day]++;
    });

    const preferredHours = this.getTopHours(hourlyActivity, 3);
    const preferredDays = this.getTopDays(dailyActivity, 3);

    // Analyze session duration patterns
    const durations = sessions.map((s) => s.duration || 0);
    const averageDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      hasPatternData: true,
      sessionCount: sessions.length,
      preferredLearningHours: preferredHours,
      preferredLearningDays: preferredDays,
      averageSessionDuration: Math.round(averageDuration),
      consistencyScore: this.calculateConsistencyScore(sessions),
      peakPerformanceHour: preferredHours[0],
    };
  }

  /**
   * Generate contextual insights from assembled data
   * @param {Object} context - Complete user context
   * @returns {Object} Generated insights
   */
  generateContextInsights(context) {
    const insights = {
      userState: this.determineUserState(context),
      recommendedApproach: this.getRecommendedApproach(context),
      strugglingIndicators: this.getStrugglingIndicators(context),
      motivationLevel: this.assessMotivationLevel(context),
      optimalInteractionStyle: this.determineOptimalInteractionStyle(context),
    };

    return insights;
  }

  /**
   * Determine user's current state
   * @param {Object} context - User context
   * @returns {string} User state
   */
  determineUserState(context) {
    const engagement = context.performance?.averageEngagement || 0;
    const recentActivity = context.patterns?.sessionCount || 0;
    const strugglingAreas = context.performance?.strugglingAreas?.length || 0;

    if (strugglingAreas > 2 && engagement < 50) return "struggling";
    if (engagement > 85 && recentActivity > 10) return "highly_engaged";
    if (engagement > 70 && recentActivity > 5) return "motivated";
    if (recentActivity === 0) return "inactive";
    if (engagement < 40) return "low_engagement";

    return "stable";
  }

  /**
   * Get recommended AI interaction approach
   * @param {Object} context - User context
   * @returns {string} Recommended approach
   */
  getRecommendedApproach(context) {
    const userState = context.insights?.userState;
    const personality = context.user?.aiPersonality;

    const approaches = {
      struggling: "supportive_detailed",
      highly_engaged: "challenging_advanced",
      motivated: "encouraging_progressive",
      inactive: "motivating_gentle",
      low_engagement: "engaging_interactive",
      stable: "balanced_adaptive",
    };

    return approaches[userState] || "balanced_adaptive";
  }

  /**
   * Helper methods for pattern analysis
   */
  getMostFrequent(array) {
    if (array.length === 0) return null;

    const frequency = {};
    array.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.keys(frequency).reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b
    );
  }

  getMostFrequentTopics(topics, limit = 3) {
    const frequency = {};
    topics.forEach((topic) => {
      frequency[topic] = (frequency[topic] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([topic]) => topic);
  }

  getTopHours(hourlyActivity, limit = 3) {
    return hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => item.hour);
  }

  getTopDays(dailyActivity, limit = 3) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return dailyActivity
      .map((count, day) => ({ day: dayNames[day], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => item.day);
  }

  extractContentTypes(content) {
    if (!content || !content.materials) return [];

    return [...new Set(content.materials.map((material) => material.type))];
  }

  calculateActivityLevel(progressRecords) {
    const activeDays = new Set(
      progressRecords.map((p) => p.lastActivityDate.toDateString())
    ).size;

    if (activeDays >= 10) return "high";
    if (activeDays >= 5) return "moderate";
    if (activeDays >= 1) return "low";
    return "inactive";
  }

  getLastAssessmentScore(progressRecords) {
    const withScores = progressRecords
      .filter((p) => p.performance?.lastAssessmentScore)
      .sort((a, b) => b.lastActivityDate - a.lastActivityDate);

    return withScores[0]?.performance?.lastAssessmentScore || null;
  }

  calculateImprovementTrend(progressRecords) {
    if (progressRecords.length < 2) return "insufficient_data";

    const sortedByDate = progressRecords.sort(
      (a, b) => a.lastActivityDate - b.lastActivityDate
    );
    const recent = sortedByDate.slice(-3);
    const earlier = sortedByDate.slice(0, 3);

    const recentAvg =
      recent.reduce((sum, p) => sum + (p.performance?.averageScore || 0), 0) /
      recent.length;
    const earlierAvg =
      earlier.reduce((sum, p) => sum + (p.performance?.averageScore || 0), 0) /
      earlier.length;

    if (recentAvg > earlierAvg + 5) return "improving";
    if (recentAvg < earlierAvg - 5) return "declining";
    return "stable";
  }

  calculateConsistencyScore(sessions) {
    if (sessions.length < 3) return 0;

    // Calculate consistency based on regular intervals between sessions
    const intervals = [];
    for (let i = 1; i < sessions.length; i++) {
      const interval =
        Math.abs(sessions[i].startTime - sessions[i - 1].startTime) /
        (1000 * 60 * 60); // hours
      intervals.push(interval);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
        0
      ) / intervals.length;

    // Lower variance means higher consistency
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    return Math.round(consistencyScore);
  }

  async getLastLearningActivity(userId) {
    const lastActivity = await UserProgress.findOne({
      userId,
    })
      .sort({ lastActivityDate: -1 })
      .populate("pathId moduleId")
      .lean();

    if (!lastActivity) return null;

    return {
      type: lastActivity.pathId ? "path" : "module",
      title: lastActivity.pathId?.title || lastActivity.moduleId?.title,
      date: lastActivity.lastActivityDate,
      progress: lastActivity.progress?.percentage || 0,
    };
  }

  getStrugglingIndicators(context) {
    const indicators = [];

    if (context.performance?.averageEngagement < 50) {
      indicators.push("low_engagement");
    }

    if (context.performance?.strugglingAreas?.length > 2) {
      indicators.push("multiple_struggle_areas");
    }

    if (context.patterns?.consistencyScore < 30) {
      indicators.push("inconsistent_learning");
    }

    return indicators;
  }

  assessMotivationLevel(context) {
    let score = 50; // baseline

    // Recent activity boosts motivation
    if (context.patterns?.sessionCount > 15) score += 20;
    else if (context.patterns?.sessionCount > 8) score += 10;
    else if (context.patterns?.sessionCount === 0) score -= 30;

    // Engagement affects motivation
    score += (context.performance?.averageEngagement - 50) * 0.4;

    // Achievements boost motivation
    if (context.progress?.recentCompletions > 0) score += 15;

    // Streak affects motivation
    if (context.user?.streakCount > 7) score += 10;
    else if (context.user?.streakCount === 0) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  determineOptimalInteractionStyle(context) {
    const personality = context.user?.aiPersonality;
    const userState = context.insights?.userState;
    const motivationLevel = context.insights?.motivationLevel || 50;

    if (userState === "struggling") {
      return personality === "COACH"
        ? "motivational_supportive"
        : "gentle_encouraging";
    }

    if (userState === "highly_engaged" && motivationLevel > 80) {
      return "challenging_expert";
    }

    if (motivationLevel < 30) {
      return "inspiring_motivational";
    }

    return "balanced_adaptive";
  }
}

// Export singleton instance
const contextService = new ContextService();

module.exports = {
  contextService,
  ContextService,
};
