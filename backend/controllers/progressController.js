const UserProgress = require('../models/UserProgress');
// const LearningPath = require('../models/LearningPath'); // ❌ Removed - deleted by user
// const Question = require('../models/Question'); // Not used in current implementation
// const User = require('../models/User'); // Not used in current implementation
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

  // Format paths for response
  const formattedPaths = enrolledPaths.map((progress) => ({
    id: progress.pathId?._id,
    title: progress.pathId?.title || 'Unknown Path',
    category: progress.pathId?.category,
    difficulty: progress.pathId?.difficulty,
    estimatedHours: progress.pathId?.estimatedHours,
    progress: {
      percentage: progress.progress.percentage,
      completed: progress.progress.completed,
      timeSpent: progress.progress.timeSpent,
      engagementScore: progress.analytics?.engagementScore || 0,
      lastAccessed: progress.progress.lastAccessed,
      enrollmentDate: progress.enrollmentDate,
      status: progress.status,
    },
  }));

  // Calculate weekly learning time
  const calculateWeeklyLearningTime = async (userId) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklySessions = await UserProgress.find({
      userId,
      lastActivityDate: { $gte: oneWeekAgo },
    }).lean();

    return weeklySessions.reduce((total, session) => total + (session.progress.timeSpent || 0), 0);
  };

  // Calculate average session rating
  const calculateAverageSessionRating = async (userId) => {
    const sessions = await UserProgress.find({
      userId,
      'analytics.sessionRating': { $exists: true },
    }).lean();

    if (sessions.length === 0) return 0;
    const totalRating = sessions.reduce((sum, session) => sum + (session.analytics.sessionRating || 0), 0);
    return totalRating / sessions.length;
  };

  res.status(200).json({
    success: true,
    data: {
      summary: progressSummary,
      enrolledPaths: formattedPaths,
      statistics: {
        totalPaths: formattedPaths.length,
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
  // Learning paths functionality has been removed
  throw new AppError('Learning paths functionality is no longer available', 410);
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
    query.lastActivityDate = {};
    if (startDate) query.lastActivityDate.$gte = new Date(startDate);
    if (endDate) query.lastActivityDate.$lte = new Date(endDate);
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get sessions
  const sessions = await UserProgress.find(query)
    .populate('pathId', 'title category')
    .populate('moduleId', 'title type')
    .sort({ lastActivityDate: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count
  const total = await UserProgress.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      sessions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    },
  });
});

// Record session data
const recordSessionData = catchAsync(async (req, res) => {
  const { sessionId, activityType, data = {}, timestamp } = req.body;
  const userId = req.user._id;

  if (!sessionId || !activityType) {
    throw new AppError('Session ID and activity type are required', 400);
  }

  // Find or create session
  let session = await UserProgress.findById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Update session with new data
  const updateData = {
    lastActivityDate: timestamp ? new Date(timestamp) : new Date(),
    [`analytics.${activityType}`]: data,
  };

  await UserProgress.findByIdAndUpdate(sessionId, { $set: updateData });

  res.status(200).json({
    success: true,
    message: 'Session data recorded successfully',
  });
});

// Get learning analytics
const getLearningAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { period = '30d' } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate;
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get analytics data
  const sessions = await UserProgress.find({
    userId,
    lastActivityDate: { $gte: startDate },
  }).lean();

  const analytics = {
    totalSessions: sessions.length,
    totalTimeSpent: sessions.reduce((sum, s) => sum + (s.progress.timeSpent || 0), 0),
    averageEngagement: sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.analytics?.engagementScore || 0), 0) / sessions.length 
      : 0,
    completionRate: sessions.length > 0 
      ? (sessions.filter(s => s.progress.completed).length / sessions.length) * 100 
      : 0,
  };

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

// Get learning milestones
const getMilestones = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Get user's progress milestones
  const milestones = await UserProgress.find({
    userId,
    'milestones.achieved': true,
  })
    .populate('pathId', 'title category')
    .sort({ 'milestones.achievedAt': -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      milestones: milestones.map(m => ({
        id: m._id,
        title: m.milestones.title,
        description: m.milestones.description,
        achievedAt: m.milestones.achievedAt,
        pathTitle: m.pathId?.title,
        category: m.pathId?.category,
      })),
    },
  });
});

module.exports = {
  getProgressOverview,
  getPathProgress,
  getSessionsHistory,
  recordSessionData,
  getLearningAnalytics,
  getMilestones,
};