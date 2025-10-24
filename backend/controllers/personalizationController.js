const personalizationService = require('../services/personalizationService');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Generate personalized experience based on onboarding data
const generatePersonalizedExperience = catchAsync(async (req, res) => {
  const { onboardingData } = req.body;
  const userId = req.user._id;

  if (!onboardingData) {
    throw new AppError('Onboarding data is required', 400);
  }

  try {
    const personalizedExperience = await personalizationService.generatePersonalizedExperience(
      onboardingData,
      userId
    );

    // Update user with personalization data
    await User.findByIdAndUpdate(userId, {
      $set: {
        'personalization.generated': personalizedExperience,
        'personalization.lastUpdated': new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Personalized experience generated successfully',
      data: personalizedExperience,
    });
  } catch (error) {
    console.error('Personalization generation error:', error);
    throw new AppError('Failed to generate personalized experience', 500);
  }
});

// Get user's personalization data
const getPersonalization = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('personalization learningProfile');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      personalization: user.personalization || {},
      learningProfile: user.learningProfile || {},
    },
  });
});

// Update personalization settings
const updatePersonalization = catchAsync(async (req, res) => {
  const { preferences, settings } = req.body;
  const userId = req.user._id;

  const updateData = {};
  if (preferences) updateData['personalization.preferences'] = preferences;
  if (settings) updateData['personalization.settings'] = settings;
  
  updateData['personalization.lastUpdated'] = new Date();

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('personalization');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Personalization updated successfully',
    data: user.personalization,
  });
});

// Generate contextual content
const generateContextualContent = catchAsync(async (req, res) => {
  const { context, contentType } = req.body;
  const userId = req.user._id;

  if (!context) {
    throw new AppError('Context is required', 400);
  }

  try {
    const contextualContent = await personalizationService.generateContextualContent(
      context,
      contentType,
      userId
    );

    res.status(200).json({
      success: true,
      data: contextualContent,
    });
  } catch (error) {
    console.error('Contextual content generation error:', error);
    throw new AppError('Failed to generate contextual content', 500);
  }
});

// Reset personalization data
const resetPersonalization = catchAsync(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndUpdate(userId, {
    $unset: {
      personalization: 1,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Personalization data reset successfully',
  });
});

// Get personalization analytics
const getPersonalizationAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('personalization learningProfile');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const analytics = {
    hasPersonalization: !!user.personalization?.generated,
    lastUpdated: user.personalization?.lastUpdated,
    confidence: user.personalization?.generated?.confidence || 0,
    components: {
      hasContent: !!user.personalization?.generated?.personalizedContent,
      hasAssessmentPlan: !!user.personalization?.generated?.assessmentPlan,
      hasLearningPath: !!user.personalization?.generated?.learningPath,
      hasMotivationalProfile: !!user.personalization?.generated?.motivationalProfile,
    },
  };

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

module.exports = {
  generatePersonalizedExperience,
  getPersonalization,
  updatePersonalization,
  generateContextualContent,
  resetPersonalization,
  getPersonalizationAnalytics,
};
