// controllers/personalizationController.js
const { personalizationService } = require('../services/personalizationService');
const User = require('../models/User');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Generate personalized experience during onboarding
 * POST /api/personalization/generate
 */
const generatePersonalizedExperience = catchAsync(async (req, res) => {
  console.log(`🎯 [CONTROLLER] generatePersonalizedExperience started`);
  console.log(`🎯 [CONTROLLER] req.user:`, req.user ? req.user._id : 'NO USER');
  console.log(`🎯 [CONTROLLER] req.body:`, JSON.stringify(req.body, null, 2));
  
  const userId = req.user._id;
  const { onboardingData } = req.body;

  console.log(`🎯 [CONTROLLER] Generating personalized experience for user: ${userId}`);
  console.log(`🎯 [CONTROLLER] Onboarding data:`, JSON.stringify(onboardingData, null, 2));

  // Generate personalized content using AI
  const personalizedExperience = await personalizationService.generatePersonalizedExperience(
    onboardingData,
    userId
  );

  // Update user with onboarding data and personalization
  await User.findByIdAndUpdate(userId, {
    $set: {
      'onboardingData': onboardingData,
      'personalization': personalizedExperience,
      'onboardingCompleted': true,
      'personalizedAt': new Date()
    }
  });

  console.log(`✅ [CONTROLLER] Personalized experience generated with ${personalizedExperience.confidence}% confidence`);

  const responseData = {
    success: true,
    data: {
      personalization: personalizedExperience,
      message: 'Personalized experience generated successfully'
    }
  };

  console.log(`🎯 [CONTROLLER] Sending response:`, JSON.stringify(responseData, null, 2));

  res.status(200).json(responseData);
});

/**
 * Get user's current personalization
 * GET /api/personalization
 */
const getPersonalization = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('personalization onboardingData');
  
  if (!user || !user.personalization) {
    return res.status(404).json({
      success: false,
      message: 'No personalization found. Please complete onboarding first.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      personalization: user.personalization,
      onboardingData: user.onboardingData
    }
  });
});

/**
 * Update personalization based on user behavior
 * PUT /api/personalization/update
 */
const updatePersonalization = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { behaviorData, feedbackData } = req.body;

  console.log(`🔄 Updating personalization for user: ${userId}`);

  // Get current personalization
  const user = await User.findById(userId).select('personalization');
  if (!user || !user.personalization) {
    return res.status(404).json({
      success: false,
      message: 'No personalization found to update'
    });
  }

  // Generate updated personalization
  const updates = await personalizationService.updatePersonalization(
    userId,
    behaviorData,
    feedbackData
  );

  // Update user's personalization
  const updatedPersonalization = {
    ...user.personalization,
    lastUpdated: new Date(),
    behaviorBasedUpdates: updates,
    confidence: Math.min(100, user.personalization.confidence + 5) // Improve confidence with more data
  };

  await User.findByIdAndUpdate(userId, {
    $set: {
      'personalization': updatedPersonalization
    }
  });

  res.status(200).json({
    success: true,
    data: {
      updates,
      personalization: updatedPersonalization,
      message: 'Personalization updated successfully'
    }
  });
});

/**
 * Generate contextual content based on current progress
 * POST /api/personalization/contextual
 */
const generateContextualContent = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { currentContext } = req.body;

  console.log(`🎯 Generating contextual content for user: ${userId}`);

  const contextualContent = await personalizationService.generateContextualContent(
    userId,
    currentContext
  );

  res.status(200).json({
    success: true,
    data: {
      contextualContent,
      generatedAt: new Date()
    }
  });
});

/**
 * Reset personalization (start over)
 * DELETE /api/personalization/reset
 */
const resetPersonalization = catchAsync(async (req, res) => {
  const userId = req.user._id;

  console.log(`🔄 Resetting personalization for user: ${userId}`);

  await User.findByIdAndUpdate(userId, {
    $unset: {
      'personalization': 1,
      'onboardingData': 1
    },
    $set: {
      'onboardingCompleted': false
    }
  });

  res.status(200).json({
    success: true,
    message: 'Personalization reset successfully. User can complete onboarding again.'
  });
});

/**
 * Get personalization analytics
 * GET /api/personalization/analytics
 */
const getPersonalizationAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('personalization onboardingData personalizedAt');
  
  if (!user || !user.personalization) {
    return res.status(404).json({
      success: false,
      message: 'No personalization data found'
    });
  }

  const analytics = {
    confidence: user.personalization.confidence,
    completeness: calculateDataCompleteness(user.onboardingData),
    personalizationAge: user.personalizedAt ? 
      Math.floor((Date.now() - new Date(user.personalizedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    updateCount: user.personalization.behaviorBasedUpdates ? 
      Object.keys(user.personalization.behaviorBasedUpdates).length : 0,
    domains: user.onboardingData?.preferredDomains || [],
    learningStyle: user.onboardingData?.preferredLearningStyle || 'not_set',
    goals: user.onboardingData?.primaryGoal || 'not_set'
  };

  res.status(200).json({
    success: true,
    data: { analytics }
  });
});

/**
 * Helper function to calculate data completeness
 */
function calculateDataCompleteness(onboardingData) {
  if (!onboardingData) return 0;
  
  const fields = [
    'primaryGoal', 'currentRole', 'experience', 
    'timeCommitment', 'preferredLearningStyle', 'preferredDomains'
  ];
  
  const completed = fields.filter(field => {
    const value = onboardingData[field];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });
  
  return Math.round((completed.length / fields.length) * 100);
}

module.exports = {
  generatePersonalizedExperience,
  getPersonalization,
  updatePersonalization,
  generateContextualContent,
  resetPersonalization,
  getPersonalizationAnalytics
};