// controllers/analyticsController.js
const { catchAsync } = require("../middleware/errorHandler");
const LearningAnalytics = require("../models/LearningAnalytics");
const UserProgress = require("../models/UserProgress");
const LearningSession = require("../models/LearningSession");
const AISession = require("../models/AISession");
const { analyticsService } = require("../services/analyticsService");
const { predictionService } = require("../services/predictionService");
const { dataAnalyzer } = require("../utils/dataAnalyzer");
const { patternDetector } = require("../utils/patternDetector");

/**
 * @desc    Get personalized analytics dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboard = catchAsync(async (req, res) => {
  const { timeRange = "month", widgets } = req.query;
  const userId = req.user.id;

  // Get latest analytics
  const latestAnalytics = await LearningAnalytics.getLatestAnalytics(userId);
  
  if (!latestAnalytics) {
    return res.status(200).json({
      success: true,
      data: {
        message: "Start learning to unlock your personalized dashboard",
        hasData: false,
        suggestions: [
          "Enroll in a learning path",
          "Complete your first module",
          "Interact with the AI assistant"
        ]
      }
    });
  }

  // Build dashboard based on requested widgets
  const dashboardData = {};

  if (widgets.includes("progress_overview")) {
    dashboardData.progressOverview = {
      completionRate: latestAnalytics.progress.completionRate,
      modulesCompleted: latestAnalytics.progress.modulesCompleted,
      pathsEnrolled: latestAnalytics.progress.pathsEnrolled,
      averageScore: latestAnalytics.progress.averageModuleScore,
      learningVelocity: latestAnalytics.calculateLearningVelocity()
    };
  }

  if (widgets.includes("engagement_metrics")) {
    dashboardData.engagementMetrics = {
      totalSessionTime: latestAnalytics.engagement.totalSessionTime,
      averageSessionDuration: latestAnalytics.engagement.averageSessionDuration,
      focusScore: latestAnalytics.engagement.focusScore,
      sessionCount: latestAnalytics.engagement.sessionCount,
      engagementTrend: latestAnalytics.calculateEngagementTrend()
    };
  }

  if (widgets.includes("recent_achievements")) {
    const recentAchievements = await analyticsService.getRecentAchievements(userId, 5);
    dashboardData.recentAchievements = recentAchievements;
  }

  if (widgets.includes("learning_streak")) {
    const streakData = await analyticsService.getLearningStreak(userId);
    dashboardData.learningStreak = streakData;
  }

  if (widgets.includes("ai_interactions")) {
    dashboardData.aiInteractions = {
      totalInteractions: latestAnalytics.aiInteraction.totalInteractions,
      satisfactionScore: latestAnalytics.aiInteraction.satisfactionScore,
      effectivenessScore: latestAnalytics.aiInteraction.effectivenessScore,
      personalityUsage: latestAnalytics.aiInteraction.personalityUsage
    };
  }

  if (widgets.includes("performance_trends")) {
    const trends = await analyticsService.getPerformanceTrends(userId, timeRange);
    dashboardData.performanceTrends = trends;
  }

  if (widgets.includes("upcoming_goals")) {
    const goals = await analyticsService.getUpcomingGoals(userId);
    dashboardData.upcomingGoals = goals;
  }

  if (widgets.includes("recommendations")) {
    const RecommendationEngine = require("../models/RecommendationEngine");
    const recommendations = await RecommendationEngine.getActiveRecommendations(userId, 3);
    dashboardData.recommendations = recommendations;
  }

  res.status(200).json({
    success: true,
    data: {
      dashboard: dashboardData,
      lastUpdated: latestAnalytics.calculatedAt,
      hasData: true,
      insights: latestAnalytics.identifyLearningPatterns()
    }
  });
});

/**
 * @desc    Get detailed performance analytics
 * @route   GET /api/analytics/performance
 * @access  Private
 */
const getPerformanceAnalytics = catchAsync(async (req, res) => {
  const { timeRange = "30d", pathId, moduleId, includeAIAnalysis = true, metrics } = req.query;
  const userId = req.user.id;

  // Get performance data
  const performanceData = await analyticsService.getPerformanceAnalytics(userId, {
    timeRange,
    pathId,
    moduleId,
    metrics
  });

  // Get AI insights if requested
  let aiInsights = null;
  if (includeAIAnalysis) {
    aiInsights = await analyticsService.generatePerformanceInsights(userId, performanceData);
  }

  // Get comparison data
  const comparisonData = await analyticsService.getPerformanceComparison(userId, {
    timeRange,
    pathId
  });

  res.status(200).json({
    success: true,
    data: {
      performance: performanceData,
      aiInsights,
      comparison: comparisonData,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * @desc    Get learning pattern analysis
 * @route   GET /api/analytics/patterns
 * @access  Private
 */
const getLearningPatterns = catchAsync(async (req, res) => {
  const { timeRange = "30d", patternTypes, minConfidence = 60 } = req.query;
  const userId = req.user.id;

  // Detect learning patterns
  const patterns = await patternDetector.detectPatterns(userId, {
    timeRange,
    patternTypes,
    minConfidence
  });

  // Get optimal timing patterns
  const timingPatterns = await patternDetector.detectOptimalTiming(userId);

  // Get engagement patterns
  const engagementPatterns = await patternDetector.detectEngagementPatterns(userId);

  // Get struggle patterns
  const strugglePatterns = await patternDetector.detectStrugglePatterns(userId);

  res.status(200).json({
    success: true,
    data: {
      patterns: {
        overall: patterns,
        timing: timingPatterns,
        engagement: engagementPatterns,
        struggles: strugglePatterns
      },
      metadata: {
        analysisTimeRange: timeRange,
        minimumConfidence: minConfidence,
        generatedAt: new Date().toISOString()
      }
    }
  });
});

/**
 * @desc    Get AI-powered learning predictions
 * @route   GET /api/analytics/predictions
 * @access  Private
 */
const getPredictions = catchAsync(async (req, res) => {
  const { predictionTypes, horizon = "1month", includeRecommendations = true } = req.query;
  const userId = req.user.id;

  // Generate predictions
  const predictions = {};

  if (predictionTypes.includes("completion_likelihood")) {
    predictions.completionLikelihood = await predictionService.predictCompletionLikelihood(userId);
  }

  if (predictionTypes.includes("time_to_completion")) {
    predictions.timeToCompletion = await predictionService.predictTimeToCompletion(userId);
  }

  if (predictionTypes.includes("performance_forecast")) {
    predictions.performanceForecast = await predictionService.forecastPerformance(userId, horizon);
  }

  if (predictionTypes.includes("engagement_forecast")) {
    predictions.engagementForecast = await predictionService.forecastEngagement(userId, horizon);
  }

  if (predictionTypes.includes("risk_assessment")) {
    predictions.riskAssessment = await predictionService.assessRisks(userId);
  }

  if (predictionTypes.includes("optimal_next_steps")) {
    predictions.optimalNextSteps = await predictionService.suggestOptimalNextSteps(userId);
  }

  // Generate recommendations based on predictions
  let recommendations = null;
  if (includeRecommendations) {
    const RecommendationEngine = require("../models/RecommendationEngine");
    const context = {
      userId,
      predictions,
      category: "General"
    };
    recommendations = await RecommendationEngine.generateRecommendations(userId, context, 3);
  }

  res.status(200).json({
    success: true,
    data: {
      predictions,
      recommendations,
      metadata: {
        horizon,
        confidenceNote: "Predictions are based on current data and may change as you progress",
        generatedAt: new Date().toISOString()
      }
    }
  });
});

/**
 * @desc    Get AI-generated personalized insights
 * @route   GET /api/analytics/insights
 * @access  Private
 */
const getInsights = catchAsync(async (req, res) => {
  const { timeRange = "30d", category = "all", format = "summary" } = req.query;
  const userId = req.user.id;

  // Generate AI insights
  const insights = await analyticsService.generatePersonalizedInsights(userId, {
    timeRange,
    category,
    format
  });

  // Get actionable recommendations
  const actionableItems = await analyticsService.getActionableInsights(userId);

  // Get learning optimization suggestions
  const optimizations = await analyticsService.getOptimizationSuggestions(userId);

  res.status(200).json({
    success: true,
    data: {
      insights,
      actionableItems,
      optimizations,
      metadata: {
        insightType: format,
        timeRange,
        category,
        generatedAt: new Date().toISOString()
      }
    }
  });
});

/**
 * @desc    Get engagement metrics and trends
 * @route   GET /api/analytics/engagement
 * @access  Private
 */
const getEngagementMetrics = catchAsync(async (req, res) => {
  const { timeRange = "30d", granularity = "day", includeComparison = false } = req.query;
  const userId = req.user.id;

  // Get engagement metrics
  const engagementMetrics = await analyticsService.getEngagementMetrics(userId, {
    timeRange,
    granularity
  });

  // Get engagement trends
  const trends = await analyticsService.getEngagementTrends(userId, timeRange);

  // Get comparison data if requested
  let comparison = null;
  if (includeComparison) {
    comparison = await analyticsService.getEngagementComparison(userId);
  }

  res.status(200).json({
    success: true,
    data: {
      metrics: engagementMetrics,
      trends,
      comparison,
      insights: {
        optimalEngagementTime: trends.optimalTime,
        engagementScore: trends.overallScore,
        improvementAreas: trends.improvementAreas
      }
    }
  });
});

/**
 * @desc    Get progress trends and milestones
 * @route   GET /api/analytics/progress
 * @access  Private
 */
const getProgressTrends = catchAsync(async (req, res) => {
  const { timeRange = "30d", category = "all", difficulty = "all" } = req.query;
  const userId = req.user.id;

  // Get progress trends
  const progressTrends = await analyticsService.getProgressTrends(userId, {
    timeRange,
    category,
    difficulty
  });

  // Get milestone achievements
  const milestones = await analyticsService.getMilestoneProgress(userId);

  // Get learning velocity
  const velocity = await analyticsService.getLearningVelocity(userId);

  res.status(200).json({
    success: true,
    data: {
      trends: progressTrends,
      milestones,
      velocity,
      projections: {
        estimatedCompletion: velocity.estimatedCompletion,
        recommendedPace: velocity.recommendedPace
      }
    }
  });
});

/**
 * @desc    Get comparative analytics (peer comparison)
 * @route   GET /api/analytics/comparison
 * @access  Private
 */
const getComparisonAnalytics = catchAsync(async (req, res) => {
  const { timeRange = "30d", category = "all" } = req.query;
  const userId = req.user.id;

  // Get peer comparison data (anonymized)
  const comparison = await analyticsService.getPeerComparison(userId, {
    timeRange,
    category
  });

  // Get percentile rankings
  const rankings = await analyticsService.getPercentileRankings(userId);

  res.status(200).json({
    success: true,
    data: {
      comparison,
      rankings,
      note: "All comparison data is anonymized and aggregated for privacy protection"
    }
  });
});

/**
 * @desc    Get time-based learning analytics
 * @route   GET /api/analytics/time
 * @access  Private
 */
const getTimeAnalytics = catchAsync(async (req, res) => {
  const { timeRange = "30d", granularity = "day" } = req.query;
  const userId = req.user.id;

  // Get time-based analytics
  const timeAnalytics = await analyticsService.getTimeBasedAnalytics(userId, {
    timeRange,
    granularity
  });

  // Detect optimal learning times
  const optimalTimes = await patternDetector.detectOptimalTiming(userId);

  res.status(200).json({
    success: true,
    data: {
      timeAnalytics,
      optimalTimes,
      recommendations: {
        bestDayOfWeek: optimalTimes.bestDay,
        bestTimeOfDay: optimalTimes.bestHour,
        idealSessionLength: optimalTimes.idealSessionLength
      }
    }
  });
});

/**
 * @desc    Get skill development analytics
 * @route   GET /api/analytics/skills
 * @access  Private
 */
const getSkillAnalytics = catchAsync(async (req, res) => {
  const { timeRange = "30d", category = "all" } = req.query;
  const userId = req.user.id;

  // Get skill development data
  const skillAnalytics = await analyticsService.getSkillAnalytics(userId, {
    timeRange,
    category
  });

  // Get skill gaps and recommendations
  const skillGaps = await analyticsService.identifySkillGaps(userId);

  // Get skill progression forecast
  const progression = await predictionService.forecastSkillProgression(userId);

  res.status(200).json({
    success: true,
    data: {
      skills: skillAnalytics,
      gaps: skillGaps,
      progression,
      recommendations: await analyticsService.getSkillRecommendations(userId)
    }
  });
});

/**
 * @desc    Get AI interaction effectiveness analytics
 * @route   GET /api/analytics/ai-effectiveness
 * @access  Private
 */
const getAIEffectivenessAnalytics = catchAsync(async (req, res) => {
  const { timeRange = "30d", includeComparison = false } = req.query;
  const userId = req.user.id;

  // Get AI effectiveness metrics
  const aiEffectiveness = await analyticsService.getAIEffectiveness(userId, timeRange);

  // Get personality performance comparison
  const personalityComparison = await analyticsService.getAIPersonalityComparison(userId);

  // Get optimization suggestions
  const optimizations = await analyticsService.getAIOptimizationSuggestions(userId);

  res.status(200).json({
    success: true,
    data: {
      effectiveness: aiEffectiveness,
      personalityComparison,
      optimizations,
      insights: {
        mostEffectivePersonality: personalityComparison.mostEffective,
        improvementPotential: aiEffectiveness.improvementPotential
      }
    }
  });
});

/**
 * @desc    Get highly personalized insights with recommendations
 * @route   GET /api/analytics/personalized
 * @access  Private
 */
const getPersonalizedInsights = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Generate comprehensive personalized insights
  const personalizedInsights = await analyticsService.generateComprehensiveInsights(userId);

  res.status(200).json({
    success: true,
    data: personalizedInsights
  });
});

/**
 * @desc    Get goal progress and achievement analytics
 * @route   GET /api/analytics/goals
 * @access  Private
 */
const getGoalProgress = catchAsync(async (req, res) => {
  const { timeRange = "30d" } = req.query;
  const userId = req.user.id;

  // Get goal progress
  const goalProgress = await analyticsService.getGoalProgress(userId, timeRange);

  res.status(200).json({
    success: true,
    data: goalProgress
  });
});

/**
 * @desc    Get learning path optimization insights
 * @route   GET /api/analytics/learning-path
 * @access  Private
 */
const getLearningPath = catchAsync(async (req, res) => {
  const { pathId } = req.query;
  const userId = req.user.id;

  // Get learning path insights
  const pathInsights = await analyticsService.getLearningPathInsights(userId, pathId);

  res.status(200).json({
    success: true,
    data: pathInsights
  });
});

/**
 * @desc    Get historical analytics data
 * @route   GET /api/analytics/history
 * @access  Private
 */
const getAnalyticsHistory = catchAsync(async (req, res) => {
  const { timeRange = "90d", granularity = "week" } = req.query;
  const userId = req.user.id;

  // Get historical analytics
  const history = await LearningAnalytics.getUserAnalytics(userId, granularity, 20);

  // Process for visualization
  const processedHistory = await analyticsService.processHistoricalData(history);

  res.status(200).json({
    success: true,
    data: {
      history: processedHistory,
      metadata: {
        timeRange,
        granularity,
        dataPoints: history.length
      }
    }
  });
});

/**
 * @desc    Generate comprehensive analytics report
 * @route   POST /api/analytics/reports
 * @access  Private
 */
const generateReport = catchAsync(async (req, res) => {
  const { reportType, timeRange, format, includeCharts, includeTables, includeInsights, customSections } = req.body;
  const userId = req.user.id;

  // Generate report
  const report = await analyticsService.generateReport(userId, {
    reportType,
    timeRange,
    format,
    includeCharts,
    includeTables,
    includeInsights,
    customSections
  });

  if (format === "pdf" || format === "html") {
    res.setHeader("Content-Type", format === "pdf" ? "application/pdf" : "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="learning-report.${format}"`);
    return res.send(report);
  }

  res.status(200).json({
    success: true,
    data: {
      report,
      metadata: {
        reportType,
        timeRange,
        format,
        generatedAt: new Date().toISOString()
      }
    }
  });
});

/**
 * @desc    Export analytics data in various formats
 * @route   POST /api/analytics/export
 * @access  Private
 */
const exportAnalyticsData = catchAsync(async (req, res) => {
  const { timeRange, dataTypes, format, includePersonalData } = req.body;
  const userId = req.user.id;

  // Export data
  const exportData = await analyticsService.exportData(userId, {
    timeRange,
    dataTypes,
    format,
    includePersonalData
  });

  // Set appropriate headers
  const contentType = {
    json: "application/json",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }[format];

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="analytics-export.${format}"`);

  if (format === "json") {
    return res.json(exportData);
  }

  res.send(exportData);
});

module.exports = {
  getDashboard,
  getPerformanceAnalytics,
  getLearningPatterns,
  getPredictions,
  getInsights,
  getEngagementMetrics,
  getProgressTrends,
  getComparisonAnalytics,
  getTimeAnalytics,
  getSkillAnalytics,
  getAIEffectivenessAnalytics,
  getPersonalizedInsights,
  getGoalProgress,
  getLearningPath,
  getAnalyticsHistory,
  generateReport,
  exportAnalyticsData
};