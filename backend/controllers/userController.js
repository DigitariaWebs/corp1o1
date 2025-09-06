const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const {
  validateName,
  validateTextContent,
  sanitizeUserInput,
} = require('../utils/validators');

// Helper function to find user by either Clerk ID or MongoDB ID
const findUserByRequest = async (req) => {
  if (req.clerkUserId) {
    // If we have a Clerk ID, use it (more reliable)
    return await User.findOne({ clerkUserId: req.clerkUserId });
  } else {
    // Fallback to MongoDB ID
    return await User.findById(req.userId);
  }
};

// Get user profile
const getProfile = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update last active timestamp
  user.statistics.lastActiveAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const { firstName, lastName, bio, timezone, preferredLanguage } = req.body;

  const user = await findUserByRequest(req);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Validate and sanitize name fields if provided
  if (firstName) {
    const nameValidation = validateName(firstName, 'First name');
    if (!nameValidation.isValid) {
      throw new AppError(nameValidation.errors.join(', '), 400);
    }
    user.firstName = nameValidation.sanitized;
  }

  if (lastName) {
    const nameValidation = validateName(lastName, 'Last name');
    if (!nameValidation.isValid) {
      throw new AppError(nameValidation.errors.join(', '), 400);
    }
    user.lastName = nameValidation.sanitized;
  }

  // Validate and sanitize bio if provided
  if (bio !== undefined) {
    const bioValidation = validateTextContent(bio, {
      maxLength: 500,
      allowEmpty: true,
      fieldName: 'Bio',
    });
    if (!bioValidation.isValid) {
      throw new AppError(bioValidation.errors.join(', '), 400);
    }
    user.bio = bioValidation.sanitized;
  }

  // Update other fields
  if (timezone) user.timezone = timezone;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;

  await user.save();

  console.log(`✅ Profile updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Update learning profile
const updateLearningProfile = catchAsync(async (req, res) => {
  const {
    learningStyle,
    preferredPace,
    optimalSessionDuration,
    aiPersonality,
    adaptiveMode,
    voiceEnabled,
    bestLearningHours,
    notificationSettings,
  } = req.body;

  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update learning profile fields
  if (learningStyle) user.learningProfile.learningStyle = learningStyle;
  if (preferredPace) user.learningProfile.preferredPace = preferredPace;
  if (optimalSessionDuration)
    user.learningProfile.optimalSessionDuration = optimalSessionDuration;
  if (aiPersonality) user.learningProfile.aiPersonality = aiPersonality;
  if (adaptiveMode !== undefined)
    user.learningProfile.adaptiveMode = adaptiveMode;
  if (voiceEnabled !== undefined)
    user.learningProfile.voiceEnabled = voiceEnabled;
  if (bestLearningHours)
    user.learningProfile.bestLearningHours = bestLearningHours;

  // Update notification settings
  if (notificationSettings) {
    user.learningProfile.notificationSettings = {
      ...user.learningProfile.notificationSettings,
      ...notificationSettings,
    };
  }

  await user.save();

  console.log(`✅ Learning profile updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Learning profile updated successfully',
    data: {
      learningProfile: user.learningProfile,
    },
  });
});

// Get user statistics
const getUserStatistics = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate additional statistics
  const accountAge = Math.floor(
    (new Date() - user.createdAt) / (1000 * 60 * 60 * 24),
  );
  const avgLearningTimePerDay =
    accountAge > 0
      ? Math.round(user.statistics.totalLearningTime / accountAge)
      : 0;

  const stats = {
    basic: {
      accountCreated: user.createdAt,
      accountAge: `${accountAge} days`,
      lastActive: user.statistics.lastActiveAt,
      lastLogin: user.statistics.lastLoginAt,
      totalLogins: user.statistics.totalLoginCount,
    },
    learning: {
      totalLearningTime: `${Math.round(
        user.statistics.totalLearningTime,
      )} minutes`,
      averagePerDay: `${avgLearningTimePerDay} minutes/day`,
      pathsEnrolled: user.statistics.pathsEnrolled,
      pathsCompleted: user.statistics.pathsCompleted,
      certificatesEarned: user.statistics.certificatesEarned,
      completionRate:
        user.statistics.pathsEnrolled > 0
          ? Math.round(
            (user.statistics.pathsCompleted / user.statistics.pathsEnrolled) *
                100,
          )
          : 0,
    },
    preferences: {
      learningStyle: user.learningProfile.learningStyle,
      preferredPace: user.learningProfile.preferredPace,
      aiPersonality: user.learningProfile.aiPersonality,
      adaptiveMode: user.learningProfile.adaptiveMode,
    },
  };

  res.status(200).json({
    success: true,
    data: {
      statistics: stats,
    },
  });
});

// Delete user account (soft delete)
const deleteAccount = catchAsync(async (req, res) => {
  const { confirmPassword } = req.body;

  // Check if this is a hard delete request (from /delete-account endpoint)
  const isHardDelete = req.originalUrl.includes('/delete-account');

  // Get user 
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // For hard delete, we don't require password confirmation (Clerk handles auth)
  // For soft delete, verify password if provided
  if (!isHardDelete && confirmPassword) {
    let userWithPassword;
    if (req.clerkUserId) {
      userWithPassword = await User.findOne({ clerkUserId: req.clerkUserId }).select('+password');
    } else {
      userWithPassword = await User.findById(req.userId).select('+password');
    }
    const isPasswordValid = await userWithPassword.comparePassword(confirmPassword);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 400);
    }
  }

  if (isHardDelete) {
    // HARD DELETE - Permanently remove user and all data
    console.log(`🗑️ HARD DELETE: Permanently removing user account: ${user.email} (ID: ${user._id})`);
    
    try {
      // Delete user from Clerk first (if clerkUserId exists)
      if (user.clerkUserId) {
        const { clerkClient } = require('@clerk/clerk-sdk-node');
        await clerkClient.users.deleteUser(user.clerkUserId);
        console.log(`✅ User deleted from Clerk: ${user.clerkUserId}`);
      }
    } catch (clerkError) {
      console.warn(`⚠️ Failed to delete user from Clerk: ${clerkError.message}`);
      // Continue with database deletion even if Clerk fails
    }
    
    // Delete user completely from database
    await User.findByIdAndDelete(req.userId);

    console.log(`✅ User account permanently deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account has been permanently deleted',
    });
  } else {
    // SOFT DELETE - Deactivate account instead of permanent deletion
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;

    // Revoke all refresh tokens
    user.revokeAllRefreshTokens();

    await user.save();

    console.log(`🗑️ User account deactivated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account has been deactivated successfully',
    });
  }
});

// Upload profile image (placeholder for future implementation)
const uploadProfileImage = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // TODO: Implement file upload logic with cloud storage
  res.status(200).json({
    success: true,
    message: 'Profile image upload will be implemented in a future update',
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Get user preferences for AI and learning
const getPreferences = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const preferences = {
    profile: {
      timezone: user.timezone,
      preferredLanguage: user.preferredLanguage,
    },
    learning: user.learningProfile,
    subscription: user.subscription,
  };

  res.status(200).json({
    success: true,
    data: {
      preferences,
    },
  });
});

// Update user preferences
const updatePreferences = catchAsync(async (req, res) => {
  const { timezone, preferredLanguage, learningProfile, notificationSettings } =
    req.body;

  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update basic preferences
  if (timezone) user.timezone = timezone;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;

  // Update learning profile
  if (learningProfile) {
    user.learningProfile = {
      ...user.learningProfile,
      ...learningProfile,
    };
  }

  // Update notification settings
  if (notificationSettings) {
    user.learningProfile.notificationSettings = {
      ...user.learningProfile.notificationSettings,
      ...notificationSettings,
    };
  }

  await user.save();

  console.log(`✅ Preferences updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: {
        timezone: user.timezone,
        preferredLanguage: user.preferredLanguage,
        learningProfile: user.learningProfile,
      },
    },
  });
});

// Get user dashboard data
const getDashboardData = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate streak (placeholder - will be enhanced in future phases)
  const daysSinceLastActive = user.statistics.lastActiveAt
    ? Math.floor(
      (new Date() - user.statistics.lastActiveAt) / (1000 * 60 * 60 * 24),
    )
    : null;

  const currentStreak =
    daysSinceLastActive === 0 ? 1 : daysSinceLastActive === 1 ? 1 : 0;

  const dashboardData = {
    user: {
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      aiPersonality: user.learningProfile.aiPersonality,
    },
    stats: {
      totalLearningTime: user.statistics.totalLearningTime,
      pathsEnrolled: user.statistics.pathsEnrolled,
      pathsCompleted: user.statistics.pathsCompleted,
      certificatesEarned: user.statistics.certificatesEarned,
      currentStreak: currentStreak,
    },
    recentActivity: {
      lastActive: user.statistics.lastActiveAt,
      lastLogin: user.statistics.lastLoginAt,
    },
    preferences: {
      learningStyle: user.learningProfile.learningStyle,
      preferredPace: user.learningProfile.preferredPace,
      adaptiveMode: user.learningProfile.adaptiveMode,
    },
    subscription: {
      tier: user.subscription.tier,
      features: user.subscription.features,
    },
  };

  res.status(200).json({
    success: true,
    data: {
      dashboard: dashboardData,
    },
  });
});

// Export learning data (GDPR compliance)
const exportUserData = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const userData = {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      timezone: user.timezone,
      preferredLanguage: user.preferredLanguage,
      accountCreated: user.createdAt,
      lastActive: user.statistics.lastActiveAt,
    },
    learningProfile: user.learningProfile,
    statistics: user.statistics,
    subscription: user.subscription,
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
  };

  console.log(`📤 Data export requested for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'User data exported successfully',
    data: userData,
  });
});

// Update user activity timestamp (for tracking active sessions)
const updateActivity = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.statistics.lastActiveAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Activity updated',
    data: {
      lastActiveAt: user.statistics.lastActiveAt,
    },
  });
});

// Get user settings
const getSettings = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const settings = {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      timezone: user.timezone,
      preferredLanguage: user.preferredLanguage,
      profileImage: user.profileImage,
    },
    learning: user.learningProfile,
    notifications: user.learningProfile.notificationSettings,
    account: {
      role: user.role,
      subscription: user.subscription,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    },
    privacy: {
      profileVisibility: 'public', // Default for now
      shareProgress: true, // Default for now
    },
  };

  res.status(200).json({
    success: true,
    data: { settings },
  });
});

// Update user settings
const updateSettings = catchAsync(async (req, res) => {
  const { profile, learning, notifications, privacy } = req.body;

  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update profile settings
  if (profile) {
    if (profile.firstName) {
      const nameValidation = validateName(profile.firstName, 'First name');
      if (!nameValidation.isValid) {
        throw new AppError(nameValidation.errors.join(', '), 400);
      }
      user.firstName = nameValidation.sanitized;
    }

    if (profile.lastName) {
      const nameValidation = validateName(profile.lastName, 'Last name');
      if (!nameValidation.isValid) {
        throw new AppError(nameValidation.errors.join(', '), 400);
      }
      user.lastName = nameValidation.sanitized;
    }

    if (profile.bio !== undefined) {
      const bioValidation = validateTextContent(profile.bio, {
        maxLength: 500,
        allowEmpty: true,
        fieldName: 'Bio',
      });
      if (!bioValidation.isValid) {
        throw new AppError(bioValidation.errors.join(', '), 400);
      }
      user.bio = bioValidation.sanitized;
    }

    if (profile.timezone) user.timezone = profile.timezone;
    if (profile.preferredLanguage) user.preferredLanguage = profile.preferredLanguage;
  }

  // Update learning settings
  if (learning) {
    user.learningProfile = {
      ...user.learningProfile,
      ...learning,
    };
  }

  // Update notification settings
  if (notifications) {
    user.learningProfile.notificationSettings = {
      ...user.learningProfile.notificationSettings,
      ...notifications,
    };
  }

  // Privacy settings would be stored separately in future
  // For now, just acknowledge them

  await user.save();

  console.log(`✅ Settings updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      user: user.toSafeObject(),
    },
  });
});

// Get onboarding status
const getOnboardingStatus = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate onboarding progress based on user data
  const onboardingSteps = {
    profileComplete: !!(user.firstName && user.lastName && user.bio),
    learningProfileSet: !!(user.learningProfile.learningStyle && user.learningProfile.preferredPace),
    firstAssessment: user.statistics.pathsEnrolled > 0,
    firstCertificate: user.statistics.certificatesEarned > 0,
  };

  const completedSteps = Object.values(onboardingSteps).filter(Boolean).length;
  const totalSteps = Object.keys(onboardingSteps).length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  const status = {
    isComplete: progress === 100,
    progress,
    completedSteps,
    totalSteps,
    steps: onboardingSteps,
    nextStep: getNextOnboardingStep(onboardingSteps),
  };

  res.status(200).json({
    success: true,
    data: { onboardingStatus: status },
  });
});

// Update onboarding step
const updateOnboardingStep = catchAsync(async (req, res) => {
  const { step, completed } = req.body;

  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update the specific onboarding step
  if (step === 'hasCompletedWelcome') {
    user.onboarding.hasCompletedWelcome = completed;
  } else if (step === 'hasCompletedTour') {
    user.onboarding.hasCompletedTour = completed;
  } else if (step === 'hasSetLearningProfile') {
    user.onboarding.hasSetLearningProfile = completed;
  } else if (step === 'hasCompletedFirstAssessment') {
    user.onboarding.hasCompletedFirstAssessment = completed;
  }

  // Add to completed steps if not already there
  if (completed) {
    const existingStep = user.onboarding.completedSteps.find(s => s.step === step);
    if (!existingStep) {
      user.onboarding.completedSteps.push({
        step,
        completedAt: new Date(),
      });
    }
  }

  // Calculate progress percentage
  const totalSteps = 4; // welcome, tour, learning profile, first assessment
  const completedCount = user.onboarding.completedSteps.length;
  user.onboarding.progress = Math.round((completedCount / totalSteps) * 100);

  await user.save();

  console.log(`📚 Onboarding step '${step}' marked as ${completed ? 'completed' : 'pending'} for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: `Onboarding step '${step}' updated`,
    data: {
      step,
      completed,
      progress: user.onboarding.progress,
      timestamp: new Date(),
    },
  });
});

// Helper function to determine next onboarding step
function getNextOnboardingStep(steps) {
  if (!steps.profileComplete) return 'profileComplete';
  if (!steps.learningProfileSet) return 'learningProfileSet';
  if (!steps.firstAssessment) return 'firstAssessment';
  if (!steps.firstCertificate) return 'firstCertificate';
  return null;
}

// Upload avatar/profile image
const uploadAvatar = catchAsync(async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // TODO: Implement actual file upload with cloud storage (AWS S3, Cloudinary, etc.)
  // For now, return a placeholder response
  
  const avatarUrl = req.body.avatarUrl || req.file?.path; // Placeholder
  
  if (avatarUrl) {
    user.profileImage = avatarUrl;
    await user.save();
  }

  console.log(`📸 Avatar upload requested for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Avatar upload will be implemented in a future update',
    data: {
      user: user.toSafeObject(),
      uploadedUrl: avatarUrl || null,
    },
  });
});

module.exports = {
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
};
