const LearningPath = require('../models/LearningPath');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get all learning paths with filtering and search
const getAllLearningPaths = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort = 'rating',
    order = 'desc',
    category,
    difficulty,
    search,
    featured,
    trending,
    minRating,
    maxHours,
    skills,
  } = req.query;

  // Build query
  const query = {
    status: 'published',
    isActive: true,
  };

  // Apply filters
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (minRating) query['metadata.rating'] = { $gte: parseFloat(minRating) };
  if (maxHours) query.estimatedHours = { $lte: parseInt(maxHours) };
  if (featured === 'true') query['metadata.featured'] = true;
  if (trending === 'true') query['metadata.trending'] = true;
  if (skills) {
    const skillsArray = skills.split(',');
    query.skills = { $in: skillsArray };
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Build sort object
  const sortOptions = {};
  switch (sort) {
  case 'rating':
    sortOptions['metadata.rating'] = order === 'asc' ? 1 : -1;
    break;
  case 'popularity':
    sortOptions['metadata.studentsEnrolled'] = order === 'asc' ? 1 : -1;
    break;
  case 'newest':
    sortOptions.createdAt = order === 'asc' ? 1 : -1;
    break;
  case 'duration':
    sortOptions.estimatedHours = order === 'asc' ? 1 : -1;
    break;
  default:
    sortOptions['metadata.rating'] = -1;
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  const paths = await LearningPath.find(query)
    .populate('modules', 'title duration difficulty')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const total = await LearningPath.countDocuments(query);

  // If user is authenticated, get their progress for each path
  let userProgress = {};
  if (req.user) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: { $in: paths.map((path) => path._id) },
    }).lean();

    userProgress = progressData.reduce((acc, progress) => {
      acc[progress.pathId.toString()] = progress;
      return acc;
    }, {});
  }

  // Enhance paths with user progress
  const pathsWithProgress = paths.map((path) => ({
    ...path,
    userProgress: userProgress[path._id.toString()] || null,
    isEnrolled: !!userProgress[path._id.toString()],
    moduleCount: path.modules.length,
  }));

  res.status(200).json({
    success: true,
    data: {
      paths: pathsWithProgress,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
      filters: {
        category,
        difficulty,
        search,
        featured,
        trending,
      },
    },
  });
});

// Get specific learning path by ID
const getLearningPath = catchAsync(async (req, res) => {
  const { pathId } = req.params;

  const path = await LearningPath.findById(pathId)
    .populate(
      'modules',
      'title description duration difficulty order prerequisites hasAssessment',
    )
    .populate('prerequisites.pathId', 'title difficulty')
    .lean();

  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  if (path.status !== 'published' || !path.isActive) {
    throw new AppError('Learning path is not available', 403);
  }

  // Increment view count
  await LearningPath.findByIdAndUpdate(pathId, {
    $inc: { 'analytics.viewCount': 1 },
  });

  // Get user's progress if authenticated
  let userProgress = null;
  let prerequisites = { met: true, missing: [] };

  if (req.user) {
    userProgress = await UserProgress.findOne({
      userId: req.user._id,
      pathId: pathId,
    }).lean();

    // Check prerequisites
    const userCompletedPaths = await UserProgress.find({
      userId: req.user._id,
      'progress.completed': true,
    }).distinct('pathId');

    prerequisites = {
      met: path.prerequisites.every(
        (prereq) =>
          !prereq.required || userCompletedPaths.includes(prereq.pathId._id),
      ),
      missing: path.prerequisites.filter(
        (prereq) =>
          prereq.required && !userCompletedPaths.includes(prereq.pathId._id),
      ),
    };
  }

  // Get related paths
  const relatedPaths = await LearningPath.find({
    _id: { $ne: pathId },
    $or: [{ category: path.category }, { skills: { $in: path.skills } }],
    status: 'published',
    isActive: true,
  })
    .select(
      'title difficulty estimatedHours metadata.rating metadata.studentsEnrolled',
    )
    .limit(4)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      path: {
        ...path,
        moduleCount: path.modules.length,
        userProgress,
        isEnrolled: !!userProgress,
        prerequisites,
        canEnroll: prerequisites.met,
      },
      relatedPaths,
    },
  });
});

// Get featured learning paths
const getFeaturedPaths = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const featuredPaths = await LearningPath.getFeatured(limit);

  // Get user progress if authenticated
  let userProgress = {};
  if (req.user) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: { $in: featuredPaths.map((path) => path._id) },
    }).lean();

    userProgress = progressData.reduce((acc, progress) => {
      acc[progress.pathId.toString()] = progress;
      return acc;
    }, {});
  }

  const pathsWithProgress = featuredPaths.map((path) => ({
    ...path.toObject(),
    userProgress: userProgress[path._id.toString()] || null,
    isEnrolled: !!userProgress[path._id.toString()],
  }));

  res.status(200).json({
    success: true,
    data: {
      featuredPaths: pathsWithProgress,
    },
  });
});

// Get trending learning paths
const getTrendingPaths = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const trendingPaths = await LearningPath.getTrending(limit);

  // Get user progress if authenticated
  let userProgress = {};
  if (req.user) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: { $in: trendingPaths.map((path) => path._id) },
    }).lean();

    userProgress = progressData.reduce((acc, progress) => {
      acc[progress.pathId.toString()] = progress;
      return acc;
    }, {});
  }

  const pathsWithProgress = trendingPaths.map((path) => ({
    ...path.toObject(),
    userProgress: userProgress[path._id.toString()] || null,
    isEnrolled: !!userProgress[path._id.toString()],
  }));

  res.status(200).json({
    success: true,
    data: {
      trendingPaths: pathsWithProgress,
    },
  });
});

// Get learning paths by category
const getPathsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const limit = parseInt(req.query.limit) || 12;

  const paths = await LearningPath.getByCategory(category, limit);

  if (paths.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        paths: [],
        category,
        message: 'No paths found in this category',
      },
    });
  }

  // Get user progress if authenticated
  let userProgress = {};
  if (req.user) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: { $in: paths.map((path) => path._id) },
    }).lean();

    userProgress = progressData.reduce((acc, progress) => {
      acc[progress.pathId.toString()] = progress;
      return acc;
    }, {});
  }

  const pathsWithProgress = paths.map((path) => ({
    ...path.toObject(),
    userProgress: userProgress[path._id.toString()] || null,
    isEnrolled: !!userProgress[path._id.toString()],
  }));

  res.status(200).json({
    success: true,
    data: {
      paths: pathsWithProgress,
      category,
    },
  });
});

// Enroll user in a learning path
const enrollInPath = catchAsync(async (req, res) => {
  const { pathId } = req.params;
  const userId = req.user._id;

  // Check if path exists and is available
  const path = await LearningPath.findById(pathId);
  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  if (path.status !== 'published' || !path.isActive) {
    throw new AppError('Learning path is not available for enrollment', 403);
  }

  // Check if user is already enrolled
  const existingProgress = await UserProgress.findOne({
    userId,
    pathId,
  });

  if (existingProgress) {
    return res.status(200).json({
      success: true,
      message: 'Already enrolled in this learning path',
      data: {
        progress: existingProgress,
        alreadyEnrolled: true,
      },
    });
  }

  // Check prerequisites
  const userCompletedPaths = await UserProgress.find({
    userId,
    'progress.completed': true,
  }).distinct('pathId');

  const prerequisites = path.prerequisites || [];
  const unmetPrerequisites = prerequisites.filter(
    (prereq) => prereq.required && !userCompletedPaths.includes(prereq.pathId),
  );

  if (unmetPrerequisites.length > 0) {
    const prereqPaths = await LearningPath.find({
      _id: { $in: unmetPrerequisites.map((prereq) => prereq.pathId) },
    })
      .select('title')
      .lean();

    throw new AppError(
      `Prerequisites not met. Please complete: ${prereqPaths
        .map((p) => p.title)
        .join(', ')}`,
      400,
    );
  }

  // Create user progress record
  const userProgress = new UserProgress({
    userId,
    pathId,
    status: 'in_progress',
    enrollmentDate: new Date(),
    goals: {
      dailyTimeGoal: req.user.learningProfile.optimalSessionDuration || 30,
      targetCompletionDate: null, // Will be calculated based on path duration
    },
  });

  await userProgress.save();

  // Update path enrollment statistics
  await LearningPath.findByIdAndUpdate(pathId, {
    $inc: { 'metadata.studentsEnrolled': 1 },
  });

  // Update user statistics
  await User.findByIdAndUpdate(userId, {
    $inc: { 'statistics.pathsEnrolled': 1 },
  });

  console.log(`✅ User ${req.user.email} enrolled in path: ${path.title}`);

  res.status(201).json({
    success: true,
    message: 'Successfully enrolled in learning path',
    data: {
      progress: userProgress,
      path: {
        id: path._id,
        title: path.title,
        difficulty: path.difficulty,
        estimatedHours: path.estimatedHours,
      },
    },
  });
});

// Unenroll from learning path
const unenrollFromPath = catchAsync(async (req, res) => {
  const { pathId } = req.params;
  const userId = req.user._id;

  // Find user's progress
  const userProgress = await UserProgress.findOne({
    userId,
    pathId,
  });

  if (!userProgress) {
    throw new AppError('You are not enrolled in this learning path', 404);
  }

  if (userProgress.progress.completed) {
    throw new AppError('Cannot unenroll from a completed learning path', 400);
  }

  // Update status instead of deleting (for analytics)
  userProgress.status = 'abandoned';
  userProgress.lastActivityDate = new Date();
  await userProgress.save();

  // Update path enrollment statistics
  await LearningPath.findByIdAndUpdate(pathId, {
    $inc: { 'metadata.studentsEnrolled': -1 },
  });

  // Update user statistics
  await User.findByIdAndUpdate(userId, {
    $inc: { 'statistics.pathsEnrolled': -1 },
  });

  res.status(200).json({
    success: true,
    message: 'Successfully unenrolled from learning path',
  });
});

// Get user's enrolled learning paths
const getEnrolledPaths = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { status = 'all' } = req.query;

  // Build query
  const query = { userId };
  if (status !== 'all') {
    query.status = status;
  }

  const enrolledPaths = await UserProgress.find(query)
    .populate(
      'pathId',
      'title description category difficulty estimatedHours metadata modules',
    )
    .sort({ 'progress.lastAccessed': -1 })
    .lean();

  // Filter out paths that no longer exist
  const validPaths = enrolledPaths.filter((progress) => progress.pathId);

  // Organize by status
  const pathsByStatus = {
    in_progress: [],
    completed: [],
    paused: [],
    abandoned: [],
  };

  validPaths.forEach((progress) => {
    const pathData = {
      ...progress.pathId,
      userProgress: {
        percentage: progress.progress.percentage,
        completed: progress.progress.completed,
        timeSpent: progress.progress.timeSpent,
        lastAccessed: progress.progress.lastAccessed,
        engagementScore: progress.progress.engagementScore,
        enrollmentDate: progress.enrollmentDate,
      },
      moduleCount: progress.pathId.modules ? progress.pathId.modules.length : 0,
    };

    pathsByStatus[progress.status].push(pathData);
  });

  res.status(200).json({
    success: true,
    data: {
      enrolled: pathsByStatus,
      summary: {
        total: validPaths.length,
        in_progress: pathsByStatus.in_progress.length,
        completed: pathsByStatus.completed.length,
        paused: pathsByStatus.paused.length,
        abandoned: pathsByStatus.abandoned.length,
      },
    },
  });
});

// Get personalized learning path recommendations
const getRecommendations = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  let userProfile = {};

  if (req.user) {
    // Build user profile for recommendations
    const user = await User.findById(req.user._id).lean();
    const userProgress = await UserProgress.find({
      userId: req.user._id,
    })
      .populate('pathId', 'category skills difficulty')
      .lean();

    userProfile = {
      skillLevel:
        user.learningProfile.preferredPace === 'fast'
          ? 'advanced'
          : user.learningProfile.preferredPace === 'slow'
            ? 'beginner'
            : 'intermediate',
      interestedCategories: [
        ...new Set(userProgress.map((p) => p.pathId?.category).filter(Boolean)),
      ],
      targetSkills: [], // Could be enhanced with user preferences
      completedPaths: userProgress
        .filter((p) => p.progress.completed)
        .map((p) => p.pathId._id),
    };
  }

  const recommendations = await LearningPath.getRecommendations(
    userProfile,
    limit,
  );

  // Get user progress for recommendations
  let userProgressData = {};
  if (req.user) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: { $in: recommendations.map((path) => path._id) },
    }).lean();

    userProgressData = progressData.reduce((acc, progress) => {
      acc[progress.pathId.toString()] = progress;
      return acc;
    }, {});
  }

  const recommendationsWithProgress = recommendations.map((path) => ({
    ...path.toObject(),
    userProgress: userProgressData[path._id.toString()] || null,
    isEnrolled: !!userProgressData[path._id.toString()],
    recommendationScore: path.getPersonalizationScore(userProfile),
  }));

  res.status(200).json({
    success: true,
    data: {
      recommendations: recommendationsWithProgress,
      userProfile: req.user
        ? {
          learningStyle: req.user.learningProfile.learningStyle,
          preferredPace: req.user.learningProfile.preferredPace,
          skillLevel: userProfile.skillLevel,
        }
        : null,
    },
  });
});

// Search learning paths
const searchPaths = catchAsync(async (req, res) => {
  const { q: query, ...filters } = req.query;
  const limit = parseInt(req.query.limit) || 12;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  if (!query || query.trim().length === 0) {
    throw new AppError('Search query is required', 400);
  }

  const searchResults = await LearningPath.searchPaths(query, filters)
    .populate('modules', 'title duration')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await LearningPath.searchPaths(query, filters).countDocuments();

  // Get user progress if authenticated
  let userProgress = {};
  if (req.user && searchResults.length > 0) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: { $in: searchResults.map((path) => path._id) },
    }).lean();

    userProgress = progressData.reduce((acc, progress) => {
      acc[progress.pathId.toString()] = progress;
      return acc;
    }, {});
  }

  const pathsWithProgress = searchResults.map((path) => ({
    ...path,
    userProgress: userProgress[path._id.toString()] || null,
    isEnrolled: !!userProgress[path._id.toString()],
    moduleCount: path.modules.length,
  }));

  res.status(200).json({
    success: true,
    data: {
      paths: pathsWithProgress,
      search: {
        query,
        total,
        showing: searchResults.length,
        filters,
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    },
  });
});

module.exports = {
  getAllLearningPaths,
  getLearningPath,
  getFeaturedPaths,
  getTrendingPaths,
  getPathsByCategory,
  enrollInPath,
  unenrollFromPath,
  getEnrolledPaths,
  getRecommendations,
  searchPaths,
};
