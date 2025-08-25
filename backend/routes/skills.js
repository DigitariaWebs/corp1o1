// routes/skills.js
const express = require("express");
const router = express.Router();
const Joi = require("joi");

// Import middleware
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { AppError, catchAsync } = require("../middleware/errorHandler");

// Import models
const User = require("../models/User");
const SkillCategory = require("../models/SkillCategory");
const AssessmentSession = require("../models/AssessmentSession");

// Validation schemas
const progressQuerySchema = Joi.object({
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Category ID must be a valid MongoDB ObjectId",
    }),

  includeHistory: Joi.boolean().default(false),
  
  includeRecommendations: Joi.boolean().default(true),
  
  timeRange: Joi.string()
    .valid("7d", "30d", "90d", "1y", "all")
    .default("30d"),
    
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// All skills routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/skills/progress
 * @desc    Get user skill progression and analytics
 * @access  Private
 * @query   categoryId, includeHistory, includeRecommendations, timeRange, limit
 */
const getSkillProgress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { 
    categoryId, 
    includeHistory, 
    includeRecommendations, 
    timeRange, 
    limit 
  } = req.query;

  console.log(`📊 Getting skill progress for user: ${userId}`);

  // Get user with populated skill progress
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Get user's skills summary
  const skillsSummary = user.getSkillsSummary();

  // Filter by category if specified
  let skillAssessments = user.skillsProgress.skillAssessments;
  if (categoryId) {
    skillAssessments = skillAssessments.filter(
      skill => skill.categoryId.toString() === categoryId
    );
  }

  // Get skill categories for context
  const categoryFilter = categoryId ? { _id: categoryId } : {};
  const skillCategories = await SkillCategory.find({
    ...categoryFilter,
    isActive: true,
    isPublic: true
  }).select('name displayName icon color type skills difficultyLevels');

  // Create category lookup
  const categoryLookup = {};
  skillCategories.forEach(cat => {
    categoryLookup[cat._id.toString()] = cat;
  });

  // Enhanced skill progress with category details
  const detailedSkillProgress = skillAssessments.map(skill => {
    const category = categoryLookup[skill.categoryId.toString()];
    return {
      categoryId: skill.categoryId,
      categoryName: skill.categoryName,
      category: category ? {
        name: category.name,
        displayName: category.displayName,
        icon: category.icon,
        color: category.color,
        type: category.type
      } : null,
      currentLevel: skill.currentLevel,
      lastScore: skill.lastScore,
      bestScore: skill.bestScore,
      attemptCount: skill.attemptCount,
      lastAssessmentAt: skill.lastAssessmentAt,
      firstAssessmentAt: skill.firstAssessmentAt,
      progression: skill.levelHistory || [],
      nextRecommendedLevel: skill.nextRecommendedLevel,
      aiInsights: skill.aiInsights
    };
  });

  // Get assessment history if requested
  let assessmentHistory = [];
  if (includeHistory) {
    const dateThreshold = getDateThreshold(timeRange);
    const historyQuery = {
      userId,
      status: 'completed',
      endTime: { $gte: dateThreshold }
    };
    
    if (categoryId) {
      historyQuery.categoryId = categoryId;
    }

    assessmentHistory = await AssessmentSession.find(historyQuery)
      .populate('assessmentId', 'title type category difficulty')
      .sort({ endTime: -1 })
      .limit(parseInt(limit))
      .select('sessionId assessmentId results.finalScore results.passed endTime timeTracking.totalTimeSpent')
      .lean();
  }

  // Generate recommendations if requested
  let recommendations = [];
  if (includeRecommendations) {
    recommendations = await generateSkillRecommendations(user, skillCategories);
  }

  // Calculate learning velocity and trends
  const learningAnalytics = await calculateLearningAnalytics(userId, timeRange);

  res.status(200).json({
    success: true,
    data: {
      summary: skillsSummary,
      skillProgress: detailedSkillProgress,
      categories: skillCategories,
      assessmentHistory: includeHistory ? assessmentHistory : undefined,
      recommendations: includeRecommendations ? recommendations : undefined,
      analytics: learningAnalytics,
      metadata: {
        timeRange,
        categoryFilter: categoryId || null,
        totalCategories: skillCategories.length,
        assessedCategories: skillAssessments.length,
        lastUpdated: user.skillsProgress.improvementMetrics?.lastUpdated || user.updatedAt
      }
    }
  });
});

/**
 * @route   GET /api/skills/categories
 * @desc    Get all available skill categories
 * @access  Private
 * @query   type, featured, limit
 */
const getSkillCategories = catchAsync(async (req, res) => {
  const { type, featured, limit = 50 } = req.query;
  
  console.log("📂 Getting skill categories");

  const filters = {
    isActive: true,
    isPublic: true
  };

  if (type) filters.type = type;
  if (featured === 'true') filters.isFeatured = true;

  const categories = await SkillCategory.find(filters)
    .select('name displayName description icon color type skills statistics isFeatured sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .limit(parseInt(limit));

  // Get user's progress for each category
  const userId = req.user._id;
  const user = await User.findById(userId).select('skillsProgress');
  
  const categoriesWithProgress = categories.map(category => {
    const userSkill = user?.skillsProgress?.skillAssessments?.find(
      skill => skill.categoryId.toString() === category._id.toString()
    );

    return {
      id: category._id,
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      icon: category.icon,
      color: category.color,
      type: category.type,
      skillCount: category.skills?.length || 0,
      isFeatured: category.isFeatured,
      statistics: category.statistics,
      userProgress: userSkill ? {
        currentLevel: userSkill.currentLevel,
        lastScore: userSkill.lastScore,
        bestScore: userSkill.bestScore,
        attemptCount: userSkill.attemptCount,
        lastAssessmentAt: userSkill.lastAssessmentAt
      } : null
    };
  });

  res.status(200).json({
    success: true,
    data: {
      categories: categoriesWithProgress,
      pagination: {
        total: categoriesWithProgress.length,
        limit: parseInt(limit),
        filters: { type, featured }
      }
    }
  });
});

/**
 * @route   GET /api/skills/recommendations
 * @desc    Get personalized skill recommendations
 * @access  Private
 * @query   type, limit
 */
const getSkillRecommendations = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { type = 'all', limit = 10 } = req.query;
  
  console.log(`🎯 Getting skill recommendations for user: ${userId}`);

  const user = await User.findById(userId);
  const categories = await SkillCategory.find({
    isActive: true,
    isPublic: true
  });

  const recommendations = await generateSkillRecommendations(user, categories, type, limit);

  res.status(200).json({
    success: true,
    data: {
      recommendations,
      metadata: {
        userId,
        type,
        generatedAt: new Date(),
        algorithm: 'skill_gap_analysis_v1'
      }
    }
  });
});

/**
 * @route   PUT /api/skills/goals
 * @desc    Set or update skill learning goals
 * @access  Private
 * @body    goals
 */
const updateSkillGoals = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { goals } = req.body;
  
  console.log(`🎯 Updating skill goals for user: ${userId}`);

  // Validate goals structure
  if (!Array.isArray(goals)) {
    throw new AppError("Goals must be an array", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Update user's learning goals (you may need to add this field to User model)
  user.learningProfile.goals = goals.map(goal => ({
    categoryId: goal.categoryId,
    targetLevel: goal.targetLevel,
    deadline: goal.deadline ? new Date(goal.deadline) : null,
    priority: goal.priority || 'medium',
    status: 'active',
    createdAt: new Date()
  }));

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      message: "Skill goals updated successfully",
      goals: user.learningProfile.goals
    }
  });
});

// Helper functions

/**
 * Get date threshold based on time range
 */
function getDateThreshold(timeRange) {
  const date = new Date();
  switch (timeRange) {
    case '7d':
      date.setDate(date.getDate() - 7);
      break;
    case '30d':
      date.setDate(date.getDate() - 30);
      break;
    case '90d':
      date.setDate(date.getDate() - 90);
      break;
    case '1y':
      date.setFullYear(date.getFullYear() - 1);
      break;
    case 'all':
    default:
      date.setFullYear(2020); // Far enough back to include everything
  }
  return date;
}

/**
 * Generate personalized skill recommendations
 */
async function generateSkillRecommendations(user, categories, type = 'all', limit = 10) {
  const recommendations = [];
  
  // Get user's current skills
  const userSkills = user.skillsProgress?.skillAssessments || [];
  const userSkillMap = {};
  userSkills.forEach(skill => {
    userSkillMap[skill.categoryId.toString()] = skill;
  });

  for (const category of categories) {
    const userSkill = userSkillMap[category._id.toString()];
    
    if (!userSkill) {
      // Recommend starting this skill
      recommendations.push({
        type: 'new_skill',
        categoryId: category._id,
        categoryName: category.displayName,
        recommendedLevel: 'beginner',
        reason: 'Expand your skill portfolio',
        priority: category.isFeatured ? 'high' : 'medium',
        estimatedTime: '2-4 weeks',
        benefits: [`Learn ${category.displayName}`, 'Broaden expertise', 'Career advancement']
      });
    } else if (userSkill.currentLevel !== 'expert') {
      // Recommend advancing current skill
      const nextLevel = getNextLevel(userSkill.currentLevel);
      recommendations.push({
        type: 'skill_advancement',
        categoryId: category._id,
        categoryName: category.displayName,
        currentLevel: userSkill.currentLevel,
        recommendedLevel: nextLevel,
        reason: `Advance from ${userSkill.currentLevel} to ${nextLevel}`,
        priority: userSkill.lastScore >= 80 ? 'high' : 'medium',
        estimatedTime: '3-6 weeks',
        benefits: [`Master ${category.displayName}`, 'Higher skill certification', 'Expert recognition']
      });
    }
  }

  // Sort by priority and limit results
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  
  return recommendations.slice(0, parseInt(limit));
}

/**
 * Get next skill level
 */
function getNextLevel(currentLevel) {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(currentLevel);
  return levels[currentIndex + 1] || 'expert';
}

/**
 * Calculate learning analytics
 */
async function calculateLearningAnalytics(userId, timeRange) {
  const dateThreshold = getDateThreshold(timeRange);
  
  const analytics = await AssessmentSession.aggregate([
    {
      $match: {
        userId,
        status: 'completed',
        endTime: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: null,
        totalAssessments: { $sum: 1 },
        averageScore: { $avg: '$results.finalScore' },
        totalTimeSpent: { $sum: '$timeTracking.totalTimeSpent' },
        passedAssessments: {
          $sum: { $cond: ['$results.passed', 1, 0] }
        },
        scoreProgression: {
          $push: {
            date: '$endTime',
            score: '$results.finalScore'
          }
        }
      }
    }
  ]);

  const result = analytics[0] || {
    totalAssessments: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    passedAssessments: 0,
    scoreProgression: []
  };

  return {
    totalAssessments: result.totalAssessments,
    averageScore: Math.round(result.averageScore * 100) / 100,
    totalTimeSpent: Math.round(result.totalTimeSpent / 60), // hours
    passRate: result.totalAssessments > 0 ? 
      Math.round((result.passedAssessments / result.totalAssessments) * 100) : 0,
    scoreProgression: result.scoreProgression.slice(-20), // Last 20 scores
    timeRange
  };
}

// Route definitions
router.get(
  '/progress',
  validate(progressQuerySchema, 'query'),
  getSkillProgress
);

router.get(
  '/categories',
  validate(Joi.object({
    type: Joi.string().valid('technical', 'creative', 'business', 'soft-skills', 'language', 'certification').optional(),
    featured: Joi.string().valid('true', 'false').optional(),
    limit: Joi.number().integer().min(1).max(100).default(50)
  }), 'query'),
  getSkillCategories
);

router.get(
  '/recommendations',
  validate(Joi.object({
    type: Joi.string().valid('all', 'new_skill', 'skill_advancement', 'weak_areas').default('all'),
    limit: Joi.number().integer().min(1).max(20).default(10)
  }), 'query'),
  getSkillRecommendations
);

router.put(
  '/goals',
  validate(Joi.object({
    goals: Joi.array().items(
      Joi.object({
        categoryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        targetLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
        deadline: Joi.date().optional(),
        priority: Joi.string().valid('low', 'medium', 'high').default('medium')
      })
    ).required()
  })),
  updateSkillGoals
);

module.exports = router;