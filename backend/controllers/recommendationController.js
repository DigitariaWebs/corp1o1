// controllers/recommendationController.js
const { catchAsync } = require("../middleware/errorHandler");
const RecommendationEngine = require("../models/RecommendationEngine");
const LearningAnalytics = require("../models/LearningAnalytics");
const User = require("../models/User");
const { recommendationService } = require("../services/recommendationService");
const { analyticsService } = require("../services/analyticsService");

/**
 * @desc    Get user's recommendations with filtering
 * @route   GET /api/recommendations
 * @access  Private
 */
const getRecommendations = catchAsync(async (req, res) => {
  const {
    type = "all",
    category = "all",
    status = "pending",
    priority = "all",
    limit = 10,
    offset = 0,
    sortBy = "relevance",
    includeExpired = false,
  } = req.query;
  const userId = req.user.id;

  // Build query
  const query = { user: userId };

  if (type !== "all") query.type = type;
  if (category !== "all") query.category = category;
  if (status !== "all") query["userInteraction.status"] = status;

  if (!includeExpired) {
    query["timing.validUntil"] = { $gt: new Date() };
  }

  // Handle priority filtering
  if (priority !== "all") {
    const priorityRanges = {
      high: { $gte: 80 },
      medium: { $gte: 50, $lt: 80 },
      low: { $lt: 50 },
    };
    query.priorityScore = priorityRanges[priority];
  }

  // Build sort options
  const sortOptions = {
    relevance: { overallScore: -1, "timing.generatedAt": -1 },
    date: { "timing.generatedAt": -1 },
    priority: { priorityScore: -1, overallScore: -1 },
    confidence: { confidenceScore: -1, overallScore: -1 },
  };

  const recommendations = await RecommendationEngine.find(query)
    .sort(sortOptions[sortBy])
    .skip(offset)
    .limit(limit)
    .populate("targeting.targetContent")
    .lean();

  // Get total count for pagination
  const totalCount = await RecommendationEngine.countDocuments(query);

  // Enhance recommendations with additional context
  const enhancedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      return {
        ...rec,
        timeRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(rec.timing.validUntil) - new Date()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        isUrgent: rec.timing.isUrgent || rec.timeRemaining <= 1,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      recommendations: enhancedRecommendations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        type,
        category,
        status,
        priority,
        sortBy,
      },
    },
  });
});

/**
 * @desc    Get specific recommendation details
 * @route   GET /api/recommendations/:id
 * @access  Private
 */
const getRecommendationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const recommendation = await RecommendationEngine.findOne({
    _id: id,
    user: userId,
  }).populate("targeting.targetContent");

  if (!recommendation) {
    return res.status(404).json({
      success: false,
      error: "Recommendation not found",
    });
  }

  // Mark as viewed if not already
  if (recommendation.userInteraction.status === "pending") {
    await recommendation.markAsViewed();
  }

  // Get related recommendations
  const relatedRecommendations = await RecommendationEngine.find({
    user: userId,
    _id: { $ne: id },
    $or: [
      { type: recommendation.type },
      { category: recommendation.category },
      {
        "targeting.targetSkills": {
          $in: recommendation.targeting.targetSkills,
        },
      },
    ],
    "userInteraction.status": { $in: ["pending", "viewed"] },
    "timing.validUntil": { $gt: new Date() },
  })
    .sort({ overallScore: -1 })
    .limit(3)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      recommendation,
      relatedRecommendations,
      metadata: {
        timeRemaining: Math.max(
          0,
          Math.ceil(
            (recommendation.timing.validUntil - new Date()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        isExpired: recommendation.timing.isExpired,
      },
    },
  });
});

/**
 * @desc    Respond to a recommendation
 * @route   PUT /api/recommendations/:id/respond
 * @access  Private
 */
const respondToRecommendation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { response, feedback, reason } = req.body;
  const userId = req.user.id;

  const recommendation = await RecommendationEngine.findOne({
    _id: id,
    user: userId,
  });

  if (!recommendation) {
    return res.status(404).json({
      success: false,
      error: "Recommendation not found",
    });
  }

  if (
    recommendation.userInteraction.status === "accepted" ||
    recommendation.userInteraction.status === "declined"
  ) {
    return res.status(409).json({
      success: false,
      error: "Already responded to this recommendation",
    });
  }

  if (recommendation.timing.isExpired) {
    return res.status(410).json({
      success: false,
      error: "Recommendation has expired",
    });
  }

  // Record the response
  await recommendation.recordResponse(response, feedback);

  // If accepted, trigger follow-up actions
  if (response === "accepted") {
    await recommendationService.handleAcceptedRecommendation(recommendation);
  }

  // Update recommendation effectiveness tracking
  await recommendationService.updateRecommendationMetrics(
    recommendation,
    response
  );

  res.status(200).json({
    success: true,
    data: {
      recommendation,
      message: `Recommendation ${response} successfully`,
      nextSteps:
        response === "accepted"
          ? await recommendationService.getNextSteps(recommendation)
          : null,
    },
  });
});

/**
 * @desc    Get recommendations by specific type
 * @route   GET /api/recommendations/type/:type
 * @access  Private
 */
const getRecommendationsByType = catchAsync(async (req, res) => {
  const { type } = req.params;
  const { limit = 5 } = req.query;
  const userId = req.user.id;

  const recommendations = await RecommendationEngine.getRecommendationsByType(
    userId,
    type,
    parseInt(limit)
  );

  // Enhance with additional context
  const enhancedRecommendations =
    await recommendationService.enhanceRecommendations(recommendations, userId);

  res.status(200).json({
    success: true,
    data: {
      recommendations: enhancedRecommendations,
      type,
      count: recommendations.length,
    },
  });
});

/**
 * @desc    Generate personalized recommendations
 * @route   POST /api/recommendations/generate
 * @access  Private
 */
const generatePersonalizedRecommendations = catchAsync(async (req, res) => {
  const {
    context,
    maxRecommendations = 5,
    includeScheduling = true,
    prioritizeWeakAreas = true,
  } = req.body;
  const userId = req.user.id;

  // Get user analytics for context
  const analytics = await LearningAnalytics.getLatestAnalytics(userId);
  const user = await User.findById(userId);

  if (!analytics) {
    return res.status(400).json({
      success: false,
      error: "Insufficient user data",
      message:
        "Complete more learning activities to generate personalized recommendations",
    });
  }

  // Generate recommendations
  const recommendations =
    await recommendationService.generatePersonalizedRecommendations(userId, {
      ...context,
      analytics,
      user,
      maxRecommendations,
      includeScheduling,
      prioritizeWeakAreas,
    });

  res.status(200).json({
    success: true,
    data: {
      recommendations,
      context: {
        userLevel:
          analytics.progress.completionRate > 75
            ? "advanced"
            : analytics.progress.completionRate > 40
            ? "intermediate"
            : "beginner",
        primaryFocus: context.category || "General",
        recommendationCount: recommendations.length,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        basedOn: "User analytics, learning patterns, and preferences",
      },
    },
  });
});

/**
 * @desc    Get personalized next learning steps
 * @route   GET /api/recommendations/next-steps
 * @access  Private
 */
const getNextSteps = catchAsync(async (req, res) => {
  const { limit = 3, category } = req.query;
  const userId = req.user.id;

  const nextSteps = await recommendationService.getPersonalizedNextSteps(
    userId,
    {
      limit: parseInt(limit),
      category,
    }
  );

  res.status(200).json({
    success: true,
    data: {
      nextSteps,
      message:
        nextSteps.length > 0
          ? "Here are your personalized next steps"
          : "Complete current activities to unlock next steps",
    },
  });
});

/**
 * @desc    Get content recommendations for specific module
 * @route   GET /api/recommendations/content/:moduleId
 * @access  Private
 */
const getContentRecommendations = catchAsync(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user.id;

  const contentRecommendations =
    await recommendationService.getContentRecommendations(userId, moduleId);

  res.status(200).json({
    success: true,
    data: {
      recommendations: contentRecommendations,
      moduleId,
    },
  });
});

/**
 * @desc    Get optimal learning timing recommendations
 * @route   GET /api/recommendations/timing
 * @access  Private
 */
const getTimingRecommendations = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const timingRecommendations =
    await recommendationService.getTimingRecommendations(userId);

  res.status(200).json({
    success: true,
    data: timingRecommendations,
  });
});

/**
 * @desc    Get skill development recommendations
 * @route   GET /api/recommendations/skills
 * @access  Private
 */
const getSkillRecommendations = catchAsync(async (req, res) => {
  const { targetSkill, currentLevel } = req.query;
  const userId = req.user.id;

  const skillRecommendations =
    await recommendationService.getSkillRecommendations(userId, {
      targetSkill,
      currentLevel,
    });

  res.status(200).json({
    success: true,
    data: skillRecommendations,
  });
});

/**
 * @desc    Mark recommendation as viewed
 * @route   PUT /api/recommendations/:id/viewed
 * @access  Private
 */
const markAsViewed = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const recommendation = await RecommendationEngine.findOne({
    _id: id,
    user: userId,
  });

  if (!recommendation) {
    return res.status(404).json({
      success: false,
      error: "Recommendation not found",
    });
  }

  await recommendation.markAsViewed();

  res.status(200).json({
    success: true,
    data: {
      message: "Recommendation marked as viewed",
      recommendation,
    },
  });
});

/**
 * @desc    Provide detailed feedback on recommendation
 * @route   PUT /api/recommendations/:id/feedback
 * @access  Private
 */
const provideFeedback = catchAsync(async (req, res) => {
  const { id } = req.params;
  const feedback = req.body;
  const userId = req.user.id;

  const recommendation = await RecommendationEngine.findOne({
    _id: id,
    user: userId,
  });

  if (!recommendation) {
    return res.status(404).json({
      success: false,
      error: "Recommendation not found",
    });
  }

  // Update feedback
  recommendation.userInteraction.feedback = feedback;
  await recommendation.save();

  // Process feedback for system learning
  await recommendationService.processFeedback(recommendation, feedback);

  res.status(200).json({
    success: true,
    data: {
      message: "Feedback recorded successfully",
      feedback,
    },
  });
});

/**
 * @desc    Get user's recommendation history
 * @route   GET /api/recommendations/history/user
 * @access  Private
 */
const getRecommendationHistory = catchAsync(async (req, res) => {
  const { timeRange = "30d", status = "all", limit = 20 } = req.query;
  const userId = req.user.id;

  // Calculate date range
  const days = parseInt(timeRange.replace("d", "")) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const query = {
    user: userId,
    "timing.generatedAt": { $gte: startDate },
  };

  if (status !== "all") {
    query["userInteraction.status"] = status;
  }

  const history = await RecommendationEngine.find(query)
    .sort({ "timing.generatedAt": -1 })
    .limit(parseInt(limit))
    .lean();

  // Calculate summary statistics
  const stats = {
    total: history.length,
    accepted: history.filter((r) => r.userInteraction.response === "accepted")
      .length,
    declined: history.filter((r) => r.userInteraction.response === "declined")
      .length,
    dismissed: history.filter((r) => r.userInteraction.status === "dismissed")
      .length,
  };

  stats.acceptanceRate =
    stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      history,
      stats,
      timeRange,
    },
  });
});

/**
 * @desc    Get user's recommendation statistics
 * @route   GET /api/recommendations/stats/user
 * @access  Private
 */
const getRecommendationStats = catchAsync(async (req, res) => {
  const {
    timeRange = "30d",
    includeComparison = false,
    groupBy = "type",
  } = req.query;
  const userId = req.user.id;

  const stats = await recommendationService.getUserRecommendationStats(userId, {
    timeRange,
    groupBy,
  });

  let comparison = null;
  if (includeComparison) {
    comparison = await recommendationService.getRecommendationComparison(
      userId
    );
  }

  res.status(200).json({
    success: true,
    data: {
      stats,
      comparison,
      insights: await recommendationService.generateStatsInsights(stats),
    },
  });
});

/**
 * @desc    Dismiss/delete a recommendation
 * @route   DELETE /api/recommendations/:id
 * @access  Private
 */
const dismissRecommendation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const recommendation = await RecommendationEngine.findOne({
    _id: id,
    user: userId,
  });

  if (!recommendation) {
    return res.status(404).json({
      success: false,
      error: "Recommendation not found",
    });
  }

  // Mark as dismissed instead of deleting
  recommendation.userInteraction.status = "dismissed";
  recommendation.userInteraction.respondedAt = new Date();
  await recommendation.save();

  res.status(200).json({
    success: true,
    data: {
      message: "Recommendation dismissed successfully",
    },
  });
});

/**
 * @desc    Request specific type of recommendation
 * @route   POST /api/recommendations/request
 * @access  Private
 */
const requestSpecificRecommendation = catchAsync(async (req, res) => {
  const { requestType, details, urgency = "medium" } = req.body;
  const userId = req.user.id;

  const recommendation =
    await recommendationService.createSpecificRecommendation(
      userId,
      requestType,
      details,
      urgency
    );

  res.status(201).json({
    success: true,
    data: {
      recommendation,
      message: "Custom recommendation generated successfully",
    },
  });
});

/**
 * @desc    Get optimal learning path recommendations
 * @route   GET /api/recommendations/learning-path
 * @access  Private
 */
const getOptimalLearningPath = catchAsync(async (req, res) => {
  const { goal, timeframe, intensity } = req.query;
  const userId = req.user.id;

  const pathRecommendations =
    await recommendationService.getOptimalLearningPath(userId, {
      goal,
      timeframe,
      intensity,
    });

  res.status(200).json({
    success: true,
    data: pathRecommendations,
  });
});

/**
 * @desc    Perform batch actions on multiple recommendations
 * @route   POST /api/recommendations/batch-action
 * @access  Private
 */
const getBatchRecommendations = catchAsync(async (req, res) => {
  const { recommendationIds, action, feedback } = req.body;
  const userId = req.user.id;

  const results = await recommendationService.performBatchAction(
    userId,
    recommendationIds,
    action,
    feedback
  );

  res.status(200).json({
    success: true,
    data: {
      results,
      message: `Batch action '${action}' completed on ${results.processed} recommendations`,
    },
  });
});

module.exports = {
  getRecommendations,
  getRecommendationById,
  respondToRecommendation,
  getRecommendationsByType,
  generatePersonalizedRecommendations,
  getNextSteps,
  getContentRecommendations,
  getTimingRecommendations,
  getSkillRecommendations,
  markAsViewed,
  provideFeedback,
  getRecommendationHistory,
  getRecommendationStats,
  dismissRecommendation,
  requestSpecificRecommendation,
  getOptimalLearningPath,
  getBatchRecommendations,
};
