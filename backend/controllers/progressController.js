const UserProgress = require('../models/UserProgress');
const LearningPath = require('../models/LearningPath');
const LearningModule = require('../models/LearningModule');
const LearningSession = require('../models/LearningSession');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get overall progress overview for user
const getProgressOverview = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Get progress summary
  const progressSummary = await UserProgress.getUserProgressSummary(userId);

  // Get enrolled paths with progress
  const enrolledPaths = await UserProgress.find({
    userId,
    pathId: { $exists: true, $ne: null },
    status: { $in: ['in_progress', 'completed', 'paused'] },
  })
    .populate('pathId', 'title category difficulty estimatedHours metadata')
    .sort({ 'progress.lastAccessed': -1 })
    .limit(10)
    .lean();

  // Get recent learning activity
  const recentSessions = await LearningSession.find({
    userId,
    status: { $in: ['completed', 'active'] },
  })
    .populate('moduleId', 'title')
    .populate('pathId', 'title')
    .sort({ startTime: -1 })
    .limit(5)
    .lean();

  // Calculate streak information
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentActivity = await UserProgress.find({
    userId,
    lastActivityDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  })
    .sort({ lastActivityDate: -1 })
    .lean();

  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate = null;

  if (recentActivity.length > 0) {
    lastActiveDate = recentActivity[0].lastActivityDate;

    // Calculate current streak
    const activityDates = recentActivity.map((activity) => {
      const date = new Date(activity.lastActivityDate);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a);

    let streakDate = today.getTime();
    for (const date of uniqueDates) {
      if (streakDate - date <= 24 * 60 * 60 * 1000) {
        currentStreak++;
        streakDate = date;
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, 7); // Placeholder calculation
  }

  // Format enrolled paths data
  const formattedPaths = enrolledPaths
    .filter((progress) => progress.pathId) // Filter out null paths
    .map((progress) => ({
      id: progress.pathId._id,
      title: progress.pathId.title,
      category: progress.pathId.category,
      difficulty: progress.pathId.difficulty,
      progress: {
        percentage: progress.progress.percentage,
        completed: progress.progress.completed,
        timeSpent: progress.progress.timeSpent,
        lastAccessed: progress.progress.lastAccessed,
      },
      status: progress.status,
      enrollmentDate: progress.enrollmentDate,
    }));

  // Format recent sessions
  const formattedSessions = recentSessions.map((session) => ({
    id: session._id,
    startTime: session.startTime,
    duration: session.totalDuration,
    module: session.moduleId
      ? {
        id: session.moduleId._id,
        title: session.moduleId.title,
      }
      : null,
    path: session.pathId
      ? {
        id: session.pathId._id,
        title: session.pathId.title,
      }
      : null,
    status: session.status,
    engagementScore: session.performance?.engagementScore || 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...progressSummary,
        currentStreak,
        longestStreak,
        lastActiveDate,
      },
      enrolledPaths: formattedPaths,
      recentSessions: formattedSessions,
      stats: {
        pathsInProgress: formattedPaths.filter(
          (p) => p.status === 'in_progress',
        ).length,
        pathsCompleted: formattedPaths.filter((p) => p.status === 'completed')
          .length,
        totalTimeThisWeek: await calculateWeeklyLearningTime(userId),
        averageSessionRating: await calculateAverageSessionRating(userId),
      },
    },
  });
});

// Get detailed progress for specific learning path
const getPathProgress = catchAsync(async (req, res) => {
  const { pathId } = req.params;
  const userId = req.user._id;

  // Get path details
  const path = await LearningPath.findById(pathId);
  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  // Get user's overall path progress
  const pathProgress = await UserProgress.findOne({
    userId,
    pathId,
    moduleId: { $exists: false },
  }).lean();

  if (!pathProgress) {
    throw new AppError('You are not enrolled in this learning path', 404);
  }

  // Get all modules for this path
  const modules = await LearningModule.find({ pathId })
    .sort({ order: 1 })
    .lean();

  // Get user's progress for each module
  const moduleProgress = await UserProgress.find({
    userId,
    pathId,
    moduleId: { $exists: true },
  }).lean();

  const progressMap = moduleProgress.reduce((acc, progress) => {
    acc[progress.moduleId.toString()] = progress;
    return acc;
  }, {});

  // Combine module data with progress
  const modulesWithProgress = modules.map((module) => {
    const progress = progressMap[module._id.toString()];

    return {
      id: module._id,
      title: module.title,
      description: module.shortDescription || module.description,
      order: module.order,
      duration: module.content.duration,
      difficulty: module.difficulty,
      type: module.content.type,
      hasAssessment: module.hasAssessment,
      isOptional: module.isOptional,
      isLocked: module.isLocked,
      progress: progress
        ? {
          percentage: progress.progress.percentage,
          completed: progress.progress.completed,
          timeSpent: progress.progress.timeSpent,
          engagementScore: progress.analytics?.engagementScore || 0,
          lastAccessed: progress.progress.lastAccessed,
          firstAccessed: progress.progress.firstAccessed,
          assessmentScore: progress.performance?.bestScore || 0,
          status: progress.status,
        }
        : {
          percentage: 0,
          completed: false,
          timeSpent: 0,
          engagementScore: 0,
          lastAccessed: null,
          firstAccessed: null,
          assessmentScore: 0,
          status: 'not_started',
        },
    };
  });

  // Calculate detailed statistics
  const completedModules = modulesWithProgress.filter(
    (m) => m.progress.completed,
  );
  const totalModules = modules.length;
  const totalDuration = modules.reduce((sum, m) => sum + m.content.duration, 0);
  const timeSpent = moduleProgress.reduce(
    (sum, p) => sum + p.progress.timeSpent,
    0,
  );

  // Get learning sessions for this path
  const recentSessions = await LearningSession.find({
    userId,
    pathId,
    startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  })
    .populate('moduleId', 'title')
    .sort({ startTime: -1 })
    .limit(10)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      path: {
        id: path._id,
        title: path.title,
        description: path.description,
        category: path.category,
        difficulty: path.difficulty,
        estimatedHours: path.estimatedHours,
      },
      progress: {
        percentage: pathProgress.progress.percentage,
        completed: pathProgress.progress.completed,
        timeSpent,
        enrollmentDate: pathProgress.enrollmentDate,
        lastAccessed: pathProgress.progress.lastAccessed,
        status: pathProgress.status,
        currentStreak: pathProgress.progress.currentStreak || 0,
      },
      modules: modulesWithProgress,
      statistics: {
        totalModules,
        completedModules: completedModules.length,
        completionRate: Math.round(
          (completedModules.length / totalModules) * 100,
        ),
        totalDuration,
        timeSpent,
        timeRemaining: Math.max(0, totalDuration - timeSpent),
        averageEngagement:
          moduleProgress.length > 0
            ? Math.round(
              moduleProgress.reduce(
                (sum, p) => sum + (p.analytics?.engagementScore || 0),
                0,
              ) / moduleProgress.length,
            )
            : 0,
        estimatedCompletionDate: calculateEstimatedCompletion(
          pathProgress,
          totalDuration,
          timeSpent,
        ),
      },
      recentSessions: recentSessions.map((session) => ({
        id: session._id,
        startTime: session.startTime,
        duration: session.totalDuration,
        module: session.moduleId
          ? {
            id: session.moduleId._id,
            title: session.moduleId.title,
          }
          : null,
        engagementScore: session.performance?.engagementScore || 0,
        status: session.status,
      })),
    },
  });
});

// Get learning sessions history
const getSessionsHistory = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 20,
    pathId,
    moduleId,
    startDate,
    endDate,
    status,
  } = req.query;

  // Build query
  const query = { userId };

  if (pathId) query.pathId = pathId;
  if (moduleId) query.moduleId = moduleId;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate) query.startTime.$lte = new Date(endDate);
  }

  // Execute query with pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sessions = await LearningSession.find(query)
    .populate('pathId', 'title category')
    .populate('moduleId', 'title difficulty')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await LearningSession.countDocuments(query);

  // Format sessions data
  const formattedSessions = sessions.map((session) => ({
    id: session._id,
    sessionId: session.sessionId,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.totalDuration,
    activeDuration: session.activeDuration,
    status: session.status,
    path: session.pathId
      ? {
        id: session.pathId._id,
        title: session.pathId.title,
        category: session.pathId.category,
      }
      : null,
    module: session.moduleId
      ? {
        id: session.moduleId._id,
        title: session.moduleId.title,
        difficulty: session.moduleId.difficulty,
      }
      : null,
    performance: {
      engagementScore: session.performance?.engagementScore || 0,
      focusScore: session.performance?.focusScore || 0,
      progressMade: session.performance?.progressMade || 0,
    },
    contentInteractions: session.contentInteractions?.length || 0,
    notesCount: session.notes?.length || 0,
    helpRequestsCount: session.helpRequests?.length || 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      sessions: formattedSessions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
      filters: {
        pathId,
        moduleId,
        startDate,
        endDate,
        status,
      },
    },
  });
});

// Record session data (for real-time updates during learning)
const recordSessionData = catchAsync(async (req, res) => {
  const { sessionId, activityType, data = {}, timestamp } = req.body;

  const session = await LearningSession.findOne({
    sessionId,
    userId: req.user._id,
  });

  if (!session) {
    throw new AppError('Learning session not found', 404);
  }

  // Add activity to session
  session.addActivity(activityType, data, timestamp);

  // Update session performance based on activity
  if (activityType === 'content_view') {
    session.performance.engagementScore = Math.min(
      100,
      session.performance.engagementScore + 2,
    );
  } else if (activityType === 'help_request') {
    session.performance.focusScore = Math.max(
      0,
      session.performance.focusScore - 5,
    );
  }

  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session data recorded successfully',
    data: {
      sessionId,
      currentPerformance: session.performance,
    },
  });
});

// Get learning analytics
const getLearningAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = '30d' } = req.query;

  // Get session analytics
  const sessionAnalytics = await LearningSession.getUserSessionAnalytics(
    userId,
    timeRange,
  );

  // Get learning analytics from progress
  const learningAnalytics = await UserProgress.getLearningAnalytics(
    userId,
    timeRange,
  );

  // Calculate additional metrics
  const totalSessions = sessionAnalytics[0]?.totalSessions || 0;
  const totalTime = sessionAnalytics[0]?.totalTime || 0;
  const avgEngagement = sessionAnalytics[0]?.avgEngagement || 0;

  // Get time-series data for charts
  const timeSeriesData = await generateTimeSeriesData(userId, timeRange);

  // Get skill development data
  const skillProgress = await getSkillProgressData(userId);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalSessions,
        totalTime,
        averageSessionLength: sessionAnalytics[0]?.avgSessionLength || 0,
        averageEngagement: Math.round(avgEngagement),
        averageFocus: Math.round(sessionAnalytics[0]?.avgFocus || 0),
        completedSessions: sessionAnalytics[0]?.completedSessions || 0,
      },
      timeSeries: timeSeriesData,
      skillProgress,
      performance: {
        engagementTrend: calculateTrend(timeSeriesData, 'engagement'),
        focusTrend: calculateTrend(timeSeriesData, 'focus'),
        productivityScore: calculateProductivityScore(
          sessionAnalytics[0] || {},
        ),
        learningEfficiency: calculateLearningEfficiency(
          totalTime,
          learningAnalytics.length,
        ),
      },
      recommendations: await generateAnalyticsRecommendations(
        userId,
        sessionAnalytics[0] || {},
      ),
    },
  });
});

// Get user milestones and achievements
const getMilestones = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Get all progress records to extract milestones
  const progressRecords = await UserProgress.find({ userId })
    .populate('pathId', 'title category')
    .populate('moduleId', 'title')
    .lean();

  // Collect all milestones
  const allMilestones = [];

  progressRecords.forEach((progress) => {
    if (progress.milestones && progress.milestones.length > 0) {
      progress.milestones.forEach((milestone) => {
        allMilestones.push({
          ...milestone,
          pathTitle: progress.pathId?.title,
          moduleTitle: progress.moduleId?.title,
          category: progress.pathId?.category,
        });
      });
    }
  });

  // Sort by achievement date
  allMilestones.sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));

  // Get learning sessions for additional achievements
  const recentSessions = await LearningSession.find({
    userId,
    achievements: { $exists: true, $not: { $size: 0 } },
  })
    .select('achievements startTime')
    .sort({ startTime: -1 })
    .limit(20)
    .lean();

  const sessionAchievements = recentSessions.flatMap((session) =>
    session.achievements.map((achievement) => ({
      ...achievement,
      source: 'session',
      sessionDate: session.startTime,
    })),
  );

  // Combine and format all achievements
  const allAchievements = [...allMilestones, ...sessionAchievements].sort(
    (a, b) =>
      new Date(b.achievedAt || b.earnedAt) -
      new Date(a.achievedAt || a.earnedAt),
  );

  res.status(200).json({
    success: true,
    data: {
      milestones: allAchievements,
      summary: {
        total: allAchievements.length,
        thisMonth: allAchievements.filter((a) => {
          const date = new Date(a.achievedAt || a.earnedAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return date >= monthAgo;
        }).length,
        pathsCompleted: allMilestones.filter(
          (m) => m.type === 'completed' && m.pathTitle,
        ).length,
        modulesCompleted: allMilestones.filter(
          (m) => m.type === 'completed' && m.moduleTitle,
        ).length,
      },
    },
  });
});

// Helper functions

const calculateWeeklyLearningTime = async (userId) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessions = await LearningSession.find({
    userId,
    startTime: { $gte: weekAgo },
  })
    .select('totalDuration')
    .lean();

  return sessions.reduce(
    (total, session) => total + (session.totalDuration || 0),
    0,
  );
};

const calculateAverageSessionRating = async (userId) => {
  const sessions = await LearningSession.find({
    userId,
    'feedback.overallSatisfaction': { $exists: true },
  })
    .select('feedback.overallSatisfaction')
    .lean();

  if (sessions.length === 0) return 0;

  const total = sessions.reduce(
    (sum, session) => sum + (session.feedback?.overallSatisfaction || 0),
    0,
  );

  return Math.round((total / sessions.length) * 10) / 10;
};

const calculateEstimatedCompletion = (
  pathProgress,
  totalDuration,
  timeSpent,
) => {
  if (pathProgress.progress.percentage === 100) return null;

  const remainingTime = totalDuration - timeSpent;
  const weeklyGoal = pathProgress.goals?.weeklyTimeGoal || 210; // 3.5 hours default
  const weeksRemaining = Math.ceil(remainingTime / weeklyGoal);

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + weeksRemaining * 7);

  return estimatedDate;
};

const generateTimeSeriesData = async (userId, timeRange) => {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const sessions = await LearningSession.find({
    userId,
    startTime: { $gte: dateThreshold },
  })
    .select('startTime totalDuration performance')
    .lean();

  // Group by date
  const dailyData = {};

  sessions.forEach((session) => {
    const dateKey = session.startTime.toISOString().split('T')[0];
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        sessions: 0,
        totalTime: 0,
        avgEngagement: 0,
        avgFocus: 0,
      };
    }

    dailyData[dateKey].sessions++;
    dailyData[dateKey].totalTime += session.totalDuration || 0;
    dailyData[dateKey].avgEngagement +=
      session.performance?.engagementScore || 0;
    dailyData[dateKey].avgFocus += session.performance?.focusScore || 0;
  });

  // Calculate averages and fill missing dates
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    if (dailyData[dateKey]) {
      const data = dailyData[dateKey];
      result.push({
        ...data,
        avgEngagement: Math.round(data.avgEngagement / data.sessions),
        avgFocus: Math.round(data.avgFocus / data.sessions),
      });
    } else {
      result.push({
        date: dateKey,
        sessions: 0,
        totalTime: 0,
        avgEngagement: 0,
        avgFocus: 0,
      });
    }
  }

  return result;
};

const getSkillProgressData = async (userId) => {
  const progressRecords = await UserProgress.find({
    userId,
    'performance.skillDevelopment': { $exists: true, $not: { $size: 0 } },
  })
    .select('performance.skillDevelopment pathId')
    .populate('pathId', 'title category')
    .lean();

  const skillMap = {};

  progressRecords.forEach((progress) => {
    if (progress.performance.skillDevelopment) {
      progress.performance.skillDevelopment.forEach((skill) => {
        if (!skillMap[skill.skill]) {
          skillMap[skill.skill] = {
            skill: skill.skill,
            initialLevel: skill.initialLevel,
            currentLevel: skill.currentLevel,
            targetLevel: skill.targetLevel,
            progressRate: skill.progressRate,
            paths: [],
          };
        }

        if (progress.pathId) {
          skillMap[skill.skill].paths.push({
            title: progress.pathId.title,
            category: progress.pathId.category,
          });
        }
      });
    }
  });

  return Object.values(skillMap);
};

const calculateTrend = (timeSeriesData, metric) => {
  if (timeSeriesData.length < 2) return 'stable';

  const recent =
    timeSeriesData.slice(-7).reduce((sum, d) => sum + (d[metric] || 0), 0) / 7;
  const previous =
    timeSeriesData.slice(0, -7).reduce((sum, d) => sum + (d[metric] || 0), 0) /
    Math.max(1, timeSeriesData.length - 7);

  const change = ((recent - previous) / Math.max(previous, 1)) * 100;

  if (change > 10) return 'improving';
  if (change < -10) return 'declining';
  return 'stable';
};

const calculateProductivityScore = (analytics) => {
  const efficiency =
    analytics.avgSessionLength > 0
      ? (analytics.totalTime /
          (analytics.totalSessions * analytics.avgSessionLength)) *
        100
      : 0;
  const completion =
    analytics.totalSessions > 0
      ? (analytics.completedSessions / analytics.totalSessions) * 100
      : 0;
  const engagement = analytics.avgEngagement || 0;

  return Math.round(efficiency * 0.3 + completion * 0.4 + engagement * 0.3);
};

const calculateLearningEfficiency = (totalTime, pathsCount) => {
  if (pathsCount === 0) return 0;
  const hoursPerPath = totalTime / (pathsCount * 60); // Convert to hours
  // Assume 20 hours per path is optimal
  return Math.min(100, Math.round((20 / Math.max(hoursPerPath, 1)) * 100));
};

const generateAnalyticsRecommendations = async (userId, analytics) => {
  const recommendations = [];

  if (analytics.avgEngagement < 60) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      title: 'Improve Learning Engagement',
      description:
        'Try interactive content or change your learning environment',
      action: 'explore_content_types',
    });
  }

  if (analytics.avgSessionLength && analytics.avgSessionLength < 20) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      title: 'Extend Learning Sessions',
      description: 'Longer sessions can improve retention and efficiency',
      action: 'set_session_goals',
    });
  }

  if (
    analytics.completedSessions / Math.max(analytics.totalSessions, 1) <
    0.7
  ) {
    recommendations.push({
      type: 'completion',
      priority: 'high',
      title: 'Improve Session Completion',
      description: 'Focus on finishing sessions you start',
      action: 'review_goals',
    });
  }

  return recommendations;
};

module.exports = {
  getProgressOverview,
  getPathProgress,
  getSessionsHistory,
  recordSessionData,
  getLearningAnalytics,
  getMilestones,
};
