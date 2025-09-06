const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  validateMongoId,
  validatePagination,
} = require('../middleware/validation');

// Import controllers
const {
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
} = require('../controllers/learningPathController');

// Public routes (optional authentication for personalization)

/**
 * @route   GET /api/learning-paths
 * @desc    Get all learning paths with filtering and search
 * @access  Public (enhanced with auth)
 * @query   page, limit, sort, order, category, difficulty, search, featured, trending, minRating, maxHours, skills
 */
router.get('/', optionalAuth, validatePagination, getAllLearningPaths);

/**
 * @route   GET /api/learning-paths/search
 * @desc    Search learning paths by query and filters
 * @access  Public (enhanced with auth)
 * @query   q (required), category, difficulty, page, limit
 */
router.get('/search', optionalAuth, validatePagination, searchPaths);

/**
 * @route   GET /api/learning-paths/featured
 * @desc    Get featured learning paths
 * @access  Public (enhanced with auth)
 * @query   limit
 */
router.get('/featured', optionalAuth, getFeaturedPaths);

/**
 * @route   GET /api/learning-paths/trending
 * @desc    Get trending learning paths
 * @access  Public (enhanced with auth)
 * @query   limit
 */
router.get('/trending', optionalAuth, getTrendingPaths);

/**
 * @route   GET /api/learning-paths/recommendations
 * @desc    Get personalized learning path recommendations
 * @access  Public (enhanced with auth)
 * @query   limit
 */
router.get('/recommendations', optionalAuth, getRecommendations);

/**
 * @route   GET /api/learning-paths/category/:category
 * @desc    Get learning paths by category
 * @access  Public (enhanced with auth)
 * @query   limit
 */
router.get('/category/:category', optionalAuth, getPathsByCategory);

// Protected routes (authentication required)

/**
 * @route   GET /api/learning-paths/enrolled
 * @desc    Get user's enrolled learning paths
 * @access  Private
 * @query   status (all, in_progress, completed, paused, abandoned)
 */
router.get('/enrolled', authenticate, getEnrolledPaths);

/**
 * @route   POST /api/learning-paths/:pathId/enroll
 * @desc    Enroll user in a learning path
 * @access  Private
 */
router.post('/:pathId/enroll', authenticate, validateMongoId, enrollInPath);

/**
 * @route   DELETE /api/learning-paths/:pathId/enroll
 * @desc    Unenroll user from a learning path
 * @access  Private
 */
router.delete(
  '/:pathId/enroll',
  authenticate,
  validateMongoId,
  unenrollFromPath,
);

/**
 * @route   GET /api/learning-paths/:pathId
 * @desc    Get specific learning path details
 * @access  Public (enhanced with auth)
 * @note    Must come after specific routes to avoid conflicts
 */
router.get('/:pathId', optionalAuth, validateMongoId, getLearningPath);

// Health check for learning paths routes
router.get('/health/check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Learning paths service is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      public: [
        'GET /api/learning-paths',
        'GET /api/learning-paths/search',
        'GET /api/learning-paths/featured',
        'GET /api/learning-paths/trending',
        'GET /api/learning-paths/recommendations',
        'GET /api/learning-paths/category/:category',
        'GET /api/learning-paths/:pathId',
      ],
      private: [
        'GET /api/learning-paths/enrolled',
        'POST /api/learning-paths/:pathId/enroll',
        'DELETE /api/learning-paths/:pathId/enroll',
      ],
    },
    features: [
      'Path browsing and search',
      'Personalized recommendations',
      'Enrollment management',
      'Progress tracking integration',
      'Category-based filtering',
    ],
  });
});

module.exports = router;
