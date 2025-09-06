const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateWithClerk, authorizeOwnership, authenticate } = require('../middleware/auth');
const {
  validateProfileUpdate,
  validateLearningProfileUpdate,
  validateMongoId,
} = require('../middleware/validation');

// Import controllers
const {
  getProfile,
  updateProfile,
  updateLearningProfile,
  getUserStatistics,
  deleteAccount,
  uploadProfileImage,
  getPreferences,
  updatePreferences,
  getDashboardData,
  exportUserData,
  updateActivity,
  getSettings,
  updateSettings,
  getOnboardingStatus,
  updateOnboardingStep,
  uploadAvatar,
} = require('../controllers/userController');

// All user routes require Clerk authentication
router.use(authenticateWithClerk);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile information
 * @access  Private
 */
router.put('/profile', validateProfileUpdate, updateProfile);

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get specific user profile (must be own profile or admin)
 * @access  Private
 */
router.get(
  '/profile/:userId',
  validateMongoId,
  authorizeOwnership('userId'),
  getProfile,
);

/**
 * @route   PUT /api/users/profile/:userId
 * @desc    Update specific user profile (must be own profile or admin)
 * @access  Private
 */
router.put(
  '/profile/:userId',
  validateMongoId,
  authorizeOwnership('userId'),
  validateProfileUpdate,
  updateProfile,
);

/**
 * @route   GET /api/users/learning-profile
 * @desc    Get user learning preferences and AI settings
 * @access  Private
 */
router.get('/learning-profile', (req, res) => {
  // Redirect to preferences endpoint for consistency
  req.url = '/preferences';
  getPreferences(req, res);
});

/**
 * @route   PUT /api/users/learning-profile
 * @desc    Update user learning profile and AI preferences
 * @access  Private
 */
router.put(
  '/learning-profile',
  validateLearningProfileUpdate,
  updateLearningProfile,
);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user learning statistics and metrics
 * @access  Private
 */
router.get('/statistics', getUserStatistics);

/**
 * @route   GET /api/users/statistics/:userId
 * @desc    Get specific user statistics (must be own or admin)
 * @access  Private
 */
router.get(
  '/statistics/:userId',
  validateMongoId,
  authorizeOwnership('userId'),
  getUserStatistics,
);

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', getDashboardData);

/**
 * @route   GET /api/users/preferences
 * @desc    Get all user preferences (profile, learning, notifications)
 * @access  Private
 */
router.get('/preferences', getPreferences);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', updatePreferences);

/**
 * @route   GET /api/users/settings
 * @desc    Get all user settings (profile, learning, notifications, privacy)
 * @access  Private
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/users/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', updateSettings);

/**
 * @route   GET /api/users/onboarding-status
 * @desc    Get user onboarding progress and status
 * @access  Private
 */
router.get('/onboarding-status', getOnboardingStatus);

/**
 * @route   PUT /api/users/onboarding-step
 * @desc    Update onboarding step completion
 * @access  Private
 */
router.put('/onboarding-step', updateOnboardingStep);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar/profile image
 * @access  Private
 */
router.post('/avatar', uploadAvatar);

/**
 * @route   POST /api/users/upload-image
 * @desc    Upload user profile image
 * @access  Private
 */
router.post('/upload-image', uploadProfileImage);

/**
 * @route   POST /api/users/activity
 * @desc    Update user last active timestamp
 * @access  Private
 */
router.post('/activity', updateActivity);

/**
 * @route   GET /api/users/export
 * @desc    Export all user data (GDPR compliance)
 * @access  Private
 */
router.get('/export', exportUserData);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/account', deleteAccount);

/**
 * @route   DELETE /api/users/delete-account
 * @desc    Delete user account permanently
 * @access  Private
 */
router.delete('/delete-account', deleteAccount);

// Health check for user routes
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User service is healthy',
    timestamp: new Date().toISOString(),
    user: {
      id: req.userId,
      authenticated: !!req.user,
    },
    endpoints: {
      profile: [
        'GET /api/users/profile',
        'PUT /api/users/profile',
        'GET /api/users/profile/:userId',
        'PUT /api/users/profile/:userId',
        'POST /api/users/avatar',
      ],
      learning: [
        'GET /api/users/learning-profile',
        'PUT /api/users/learning-profile',
        'GET /api/users/statistics',
        'GET /api/users/statistics/:userId',
      ],
      preferences: ['GET /api/users/preferences', 'PUT /api/users/preferences'],
      settings: ['GET /api/users/settings', 'PUT /api/users/settings'],
      onboarding: [
        'GET /api/users/onboarding-status',
        'PUT /api/users/onboarding-step',
      ],
      data: [
        'GET /api/users/dashboard',
        'GET /api/users/export',
        'POST /api/users/activity',
      ],
      account: ['POST /api/users/upload-image', 'DELETE /api/users/account'],
    },
  });
});

module.exports = router;
