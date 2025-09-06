const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Get user's portfolio
 * GET /api/portfolio
 */
const getUserPortfolio = catchAsync(async (req, res) => {
  const userId = req.user._id;

  console.log(`📁 Getting portfolio for user: ${userId}`);

  let portfolio = await Portfolio.findOne({ userId }).populate('userId', 'name email avatar');

  // Create portfolio if it doesn't exist
  if (!portfolio) {
    portfolio = new Portfolio({
      userId,
      headline: `${req.user.name}'s Professional Portfolio`,
      summary: 'Passionate professional with expertise in various domains.',
      settings: {
        isPublic: true,
        allowContact: true,
        theme: 'default',
      },
    });
    await portfolio.save();
    await portfolio.populate('userId', 'name email avatar');
  }

  // Get user's certificates to display
  const certificates = await Certificate.find({
    userId,
    status: 'issued',
    isValid: true,
  })
    .select('title type category issueDate skillsVerified assets')
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      portfolio: {
        ...portfolio.toObject(),
        certificates,
        totalCertificates: certificates.length,
      },
    },
  });
});

/**
 * Update user's portfolio
 * PUT /api/portfolio
 */
const updatePortfolio = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  console.log(`📝 Updating portfolio for user: ${userId}`);

  // Remove sensitive fields
  delete updateData.userId;
  delete updateData.analytics;
  delete updateData._id;

  const portfolio = await Portfolio.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, runValidators: true },
  ).populate('userId', 'name email avatar');

  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { portfolio },
    message: 'Portfolio updated successfully',
  });
});

/**
 * Get public portfolio by user ID
 * GET /api/portfolio/:userId
 */
const getPublicPortfolio = catchAsync(async (req, res) => {
  const { userId } = req.params;

  console.log(`👀 Getting public portfolio for user: ${userId}`);

  const portfolio = await Portfolio.findOne({
    userId,
    'settings.isPublic': true,
  }).populate('userId', 'name avatar');

  if (!portfolio) {
    throw new AppError('Portfolio not found or not public', 404);
  }

  // Increment view count
  await portfolio.incrementViews(req.get('Referer') || 'direct');

  // Get certificates if public
  const certificates = await Certificate.find({
    userId,
    status: 'issued',
    isValid: true,
  })
    .select('title type category issueDate skillsVerified')
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      portfolio: {
        ...portfolio.toObject(),
        certificates,
        totalCertificates: certificates.length,
      },
    },
  });
});

/**
 * Add project to portfolio
 * POST /api/portfolio/projects
 */
const addProject = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const projectData = req.body;

  console.log(`➕ Adding project to portfolio for user: ${userId}`);

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Validate project data
  if (!projectData.title || !projectData.description || !projectData.category) {
    throw new AppError('Title, description, and category are required', 400);
  }

  await portfolio.addProject(projectData);

  res.status(201).json({
    success: true,
    data: { portfolio },
    message: 'Project added successfully',
  });
});

/**
 * Update project in portfolio
 * PUT /api/portfolio/projects/:projectId
 */
const updateProject = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;
  const updateData = req.body;

  console.log(`✏️  Updating project ${projectId} for user: ${userId}`);

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  const project = portfolio.projects.id(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  Object.assign(project, updateData);
  await portfolio.save();

  res.status(200).json({
    success: true,
    data: { portfolio },
    message: 'Project updated successfully',
  });
});

/**
 * Delete project from portfolio
 * DELETE /api/portfolio/projects/:projectId
 */
const deleteProject = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  console.log(`🗑️  Deleting project ${projectId} for user: ${userId}`);

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  portfolio.projects.pull(projectId);
  await portfolio.save();

  res.status(200).json({
    success: true,
    data: { portfolio },
    message: 'Project deleted successfully',
  });
});

/**
 * Add work experience
 * POST /api/portfolio/experience
 */
const addWorkExperience = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const experienceData = req.body;

  console.log(`💼 Adding work experience for user: ${userId}`);

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Validate experience data
  if (!experienceData.company || !experienceData.position || !experienceData.startDate) {
    throw new AppError('Company, position, and start date are required', 400);
  }

  portfolio.workExperience.push(experienceData);
  await portfolio.save();

  res.status(201).json({
    success: true,
    data: { portfolio },
    message: 'Work experience added successfully',
  });
});

/**
 * Connect external platform
 * POST /api/portfolio/connect
 */
const connectExternalPlatform = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { platform, username, profileUrl } = req.body;

  console.log(`🔗 Connecting ${platform} for user: ${userId}`);

  if (!platform || !username || !profileUrl) {
    throw new AppError('Platform, username, and profile URL are required', 400);
  }

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Check if platform already connected
  const existingConnection = portfolio.externalConnections.find(
    (conn) => conn.platform === platform,
  );

  if (existingConnection) {
    existingConnection.username = username;
    existingConnection.profileUrl = profileUrl;
    existingConnection.syncStatus = 'pending';
  } else {
    portfolio.externalConnections.push({
      platform,
      username,
      profileUrl,
      syncStatus: 'pending',
    });
  }

  await portfolio.save();

  // TODO: Trigger external data sync
  // await portfolio.syncExternalData();

  res.status(200).json({
    success: true,
    data: { portfolio },
    message: `${platform} connected successfully`,
  });
});

/**
 * Disconnect external platform
 * DELETE /api/portfolio/connect/:platform
 */
const disconnectExternalPlatform = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { platform } = req.params;

  console.log(`🔌 Disconnecting ${platform} for user: ${userId}`);

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  portfolio.externalConnections = portfolio.externalConnections.filter(
    (conn) => conn.platform !== platform,
  );

  await portfolio.save();

  res.status(200).json({
    success: true,
    data: { portfolio },
    message: `${platform} disconnected successfully`,
  });
});

/**
 * Get portfolio analytics
 * GET /api/portfolio/analytics
 */
const getPortfolioAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = '30d' } = req.query;

  console.log(`📊 Getting portfolio analytics for user: ${userId}`);

  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Calculate analytics based on time range
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recentViews = portfolio.analytics.viewHistory.filter(
    (entry) => entry.date >= since,
  );

  const analytics = {
    totalViews: portfolio.analytics.views,
    uniqueVisitors: portfolio.analytics.uniqueVisitors,
    recentViews: recentViews.length,
    avgViewsPerDay: recentViews.length / days,
    topSources: recentViews.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + entry.views;
      return acc;
    }, {}),
    viewTrend: recentViews.map((entry) => ({
      date: entry.date,
      views: entry.views,
    })),
    portfolioScore: calculatePortfolioScore(portfolio),
  };

  res.status(200).json({
    success: true,
    data: { analytics },
  });
});

/**
 * Search public portfolios
 * GET /api/portfolio/search
 */
const searchPortfolios = catchAsync(async (req, res) => {
  const { q: query, skills, technologies, limit = 20, page = 1 } = req.query;

  console.log(`🔍 Searching portfolios with query: ${query}`);

  const filters = {};
  if (skills) filters.skills = skills.split(',');
  if (technologies) filters.technologies = technologies.split(',');

  const skip = (page - 1) * limit;

  let portfolios;
  if (query) {
    portfolios = await Portfolio.searchPortfolios(query, filters)
      .skip(skip)
      .limit(parseInt(limit));
  } else {
    portfolios = await Portfolio.getPublicPortfolios(parseInt(limit));
  }

  res.status(200).json({
    success: true,
    data: {
      portfolios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: portfolios.length,
      },
    },
  });
});

/**
 * Calculate portfolio completeness score
 */
function calculatePortfolioScore(portfolio) {
  let score = 0;
  const maxScore = 100;

  // Basic info (20 points)
  if (portfolio.headline) score += 5;
  if (portfolio.summary) score += 10;
  if (portfolio.location) score += 3;
  if (portfolio.website) score += 2;

  // Projects (30 points)
  const projectCount = portfolio.projects.filter((p) => p.isPublic).length;
  score += Math.min(projectCount * 6, 30);

  // Work experience (20 points)
  const expCount = portfolio.workExperience.filter((e) => e.isPublic).length;
  score += Math.min(expCount * 10, 20);

  // Skills (15 points)
  score += Math.min(portfolio.topSkills.length * 3, 15);

  // External connections (15 points)
  score += Math.min(portfolio.externalConnections.length * 3, 15);

  return Math.min(score, maxScore);
}

module.exports = {
  getUserPortfolio,
  updatePortfolio,
  getPublicPortfolio,
  addProject,
  updateProject,
  deleteProject,
  addWorkExperience,
  connectExternalPlatform,
  disconnectExternalPlatform,
  getPortfolioAnalytics,
  searchPortfolios,
};