const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authConfig } = require('../config/auth');

// Notification settings schema
const notificationSettingsSchema = new mongoose.Schema(
  {
    learningReminders: {
      type: Boolean,
      default: true,
    },
    achievementNotifications: {
      type: Boolean,
      default: true,
    },
    weeklyProgress: {
      type: Boolean,
      default: true,
    },
    aiInsights: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

// Learning profile schema
const learningProfileSchema = new mongoose.Schema(
  {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'balanced'],
      default: 'balanced',
    },
    preferredPace: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium',
    },
    optimalSessionDuration: {
      type: Number,
      min: 15,
      max: 180,
      default: 45,
    },
    aiPersonality: {
      type: String,
      enum: ['ARIA', 'SAGE', 'COACH'],
      default: 'ARIA',
    },
    adaptiveMode: {
      type: Boolean,
      default: true,
    },
    voiceEnabled: {
      type: Boolean,
      default: false,
    },
    bestLearningHours: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Best learning hours must be in HH:MM format',
        },
      },
    ],
    focusTimeMinutes: {
      type: Number,
      min: 5,
      max: 120,
      default: 45,
    },
    motivationFactors: [
      {
        type: String,
        enum: [
          'progress_tracking',
          'achievements',
          'competition',
          'personal_growth',
          'career_advancement',
        ],
      },
    ],
    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

// Refresh token schema
const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      platform: String,
    },
  },
  { _id: false },
);

// NEW: AI chat message & session sub-schemas
const aiMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { _id: false },
);

const aiSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    aiPersonality: {
      type: String,
      enum: ['ARIA', 'SAGE', 'COACH'],
      default: 'ARIA',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    messages: [aiMessageSchema],
    lastInteraction: Date,
    // lightweight analytics
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

// User schema
const userSchema = new mongoose.Schema(
  {
    // Clerk integration
    clerkUserId: {
      type: String,
      required: [true, 'Clerk User ID is required'],
      unique: true,
    },

    // Basic information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },

    password: {
      type: String,
      required: false, // Not required when using Clerk
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },

    // Clerk sync metadata
    clerkSyncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error'],
      default: 'pending',
    },

    lastClerkSync: {
      type: Date,
      default: Date.now,
    },

    // Profile information
    profileImage: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true,
    },

    timezone: {
      type: String,
      default: 'UTC',
    },

    preferredLanguage: {
      type: String,
      enum: ['en', 'fr', 'es', 'de'],
      default: 'en',
    },

    // Account status
    role: {
      type: String,
      enum: ['user', 'enterprise', 'admin'],
      default: 'user',
    },

    // Company information (for enterprise users)
    company: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters'],
      },
      industry: {
        type: String,
        trim: true,
        maxlength: [50, 'Industry cannot exceed 50 characters'],
      },
      size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      },
      website: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            return /^https?:\/\/.+/.test(v);
          },
          message: 'Website must be a valid URL',
        },
      },
      department: {
        type: String,
        trim: true,
        maxlength: [50, 'Department cannot exceed 50 characters'],
      },
      position: {
        type: String,
        trim: true,
        maxlength: [100, 'Position cannot exceed 100 characters'],
      },
    },

    // Onboarding tracking
    onboarding: {
      hasCompletedWelcome: {
        type: Boolean,
        default: false,
      },
      hasCompletedTour: {
        type: Boolean,
        default: false,
      },
      hasSetLearningProfile: {
        type: Boolean,
        default: false,
      },
      hasCompletedFirstAssessment: {
        type: Boolean,
        default: false,
      },
      completedSteps: [{
        step: String,
        completedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Security
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      select: false,
    },

    // Learning profile
    learningProfile: {
      type: learningProfileSchema,
      default: () => ({}),
    },

    // AI Personalization data
    onboardingData: {
      currentRole: String,
      experience: {
        type: String,
        enum: ['0-1', '2-3', '4-6', '7-10', '10+'],
      },
      industry: String,
      company: String,
      primaryGoal: {
        type: String,
        enum: ['career_growth', 'skill_development', 'career_change', 'certification', 'leadership', 'entrepreneurship'],
      },
      careerGoals: [String],
      timeCommitment: {
        type: String,
        enum: ['15min', '30min', '1hour', 'weekends', 'flexible'],
      },
      preferredLearningStyle: {
        type: String,
        enum: ['hands_on', 'structured', 'bite_sized', 'interactive'],
      },
      currentSkills: [String],
      skillsToImprove: [String],
      preferredDomains: [{
        type: String,
        enum: ['programming', 'design', 'analytics', 'communication', 'leadership', 'business'],
      }],
      assessmentDifficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'adaptive'],
      },
      contentType: {
        type: String,
        enum: ['visual', 'text', 'video', 'interactive', 'mixed'],
      },
      motivationStyle: {
        type: String,
        enum: ['achievement', 'social', 'autonomy', 'mastery', 'purpose'],
      },
      feedbackPreference: {
        type: String,
        enum: ['immediate', 'detailed', 'encouraging', 'direct'],
      },
    },

    // AI-generated personalization
    personalization: {
      personalizedContent: mongoose.Schema.Types.Mixed,
      assessmentPlan: mongoose.Schema.Types.Mixed,
      learningPath: mongoose.Schema.Types.Mixed,
      motivationalProfile: mongoose.Schema.Types.Mixed,
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      behaviorBasedUpdates: mongoose.Schema.Types.Mixed,
    },

    // Onboarding status
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingSkipped: {
      type: Boolean,
      default: false,
    },
    personalizedAt: Date,

    // Authentication tokens
    refreshTokens: [refreshTokenSchema],

    // Subscription information
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free',
      },
      expiresAt: Date,
      features: [
        {
          type: String,
        },
      ],
      plan: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },

    // Skills assessment progress
    skillsProgress: {
      // Overall skill level assessment
      overallLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner',
      },
      
      // Individual skill assessments
      skillAssessments: [
        {
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillCategory',
            required: true,
          },
          categoryName: String, // Denormalized for performance
          currentLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            required: true,
          },
          lastScore: {
            type: Number,
            min: 0,
            max: 100,
          },
          bestScore: {
            type: Number,
            min: 0,
            max: 100,
          },
          attemptCount: {
            type: Number,
            default: 0,
          },
          lastAssessmentAt: Date,
          firstAssessmentAt: Date,
          // Progression tracking
          levelHistory: [
            {
              level: String,
              achievedAt: Date,
              score: Number,
            },
          ],
          // Next recommended assessment
          nextRecommendedLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          },
          // AI insights for this skill
          aiInsights: {
            strengths: [String],
            weaknesses: [String],
            recommendedActions: [String],
            estimatedImprovementTime: Number, // hours
            lastAnalysis: Date,
          },
        },
      ],
      
      // Recent assessment sessions
      recentAssessments: [
        {
          assessmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assessment',
          },
          sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssessmentSession',
          },
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillCategory',
          },
          score: Number,
          passed: Boolean,
          completedAt: Date,
          timeSpent: Number, // minutes
        },
      ],
      
      // Skill improvement tracking
      improvementMetrics: {
        averageScoreImprovement: {
          type: Number,
          default: 0,
        },
        totalAssessmentTime: {
          type: Number,
          default: 0, // minutes
        },
        consistencyScore: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        learningVelocity: {
          type: Number,
          default: 0, // improvements per week
        },
        lastUpdated: Date,
      },
    },

    // Learning preferences based on assessment behavior
    learningBehavior: {
      preferredDifficulty: {
        type: String,
        enum: ['challenge_seeker', 'gradual_learner', 'comfort_zone', 'adaptive'],
        default: 'adaptive',
      },
      averageSessionDuration: {
        type: Number,
        default: 0, // minutes
      },
      peakPerformanceHours: [
        {
          type: Number,
          min: 0,
          max: 23,
        },
      ],
      retakePatterns: {
        averageRetakeTime: Number, // hours between retakes
        retakeSuccessRate: Number, // percentage
        preferredRetakeGap: Number, // days
      },
      // AI-detected learning patterns
      detectedPatterns: [
        {
          pattern: String,
          confidence: Number,
          detectedAt: Date,
        },
      ],
    },

    // Achievement system
    achievements: {
      // Skill-based achievements
      skillMilestones: [
        {
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillCategory',
          },
          milestone: {
            type: String,
            enum: ['first_attempt', 'first_pass', 'level_up', 'mastery', 'perfect_score'],
          },
          achievedAt: Date,
          level: String,
          score: Number,
        },
      ],
      
      // Assessment streaks
      streaks: {
        currentStreak: {
          type: Number,
          default: 0,
        },
        longestStreak: {
          type: Number,
          default: 0,
        },
        lastStreakUpdate: Date,
      },
      
      // Special achievements
      badges: [
        {
          badgeId: String,
          name: String,
          description: String,
          icon: String,
          earnedAt: Date,
          category: String,
        },
      ],
    },

    // Usage statistics
    statistics: {
      totalLoginCount: {
        type: Number,
        default: 0,
      },
      lastLoginAt: Date,
      lastActiveAt: Date,
      totalLearningTime: {
        type: Number,
        default: 0, // in minutes
      },
      pathsEnrolled: {
        type: Number,
        default: 0,
      },
      pathsCompleted: {
        type: Number,
        default: 0,
      },
      certificatesEarned: {
        type: Number,
        default: 0,
      },
      // Assessment-specific statistics
      totalAssessmentsTaken: {
        type: Number,
        default: 0,
      },
      totalAssessmentsPassed: {
        type: Number,
        default: 0,
      },
      averageAssessmentScore: {
        type: Number,
        default: 0,
      },
      totalAssessmentTime: {
        type: Number,
        default: 0, // minutes
      },
    },

    // AI Chat Sessions
    aiChats: [aiSessionSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  },
);

// Indexes for performance
// Unique indexes are declared at field level for clerkUserId and email
userSchema.index({ clerkSyncStatus: 1 });
userSchema.index({ lastClerkSync: -1 });
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ 'refreshTokens.expiresAt': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Assessment-related indexes
userSchema.index({ 'skillsProgress.overallLevel': 1 });
userSchema.index({ 'skillsProgress.skillAssessments.categoryId': 1 });
userSchema.index({ 'skillsProgress.skillAssessments.currentLevel': 1 });
userSchema.index({ 'skillsProgress.skillAssessments.lastAssessmentAt': -1 });
userSchema.index({ 'skillsProgress.recentAssessments.completedAt': -1 });
userSchema.index({ 'achievements.streaks.currentStreak': -1 });
userSchema.index({ 'statistics.totalAssessmentsTaken': -1 });
userSchema.index({ 'statistics.averageAssessmentScore': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to clean expired refresh tokens
userSchema.pre('save', function (next) {
  // Remove expired refresh tokens
  this.refreshTokens = this.refreshTokens.filter(
    (token) => token.expiresAt > new Date() && token.isActive,
  );

  // Limit number of active refresh tokens
  if (this.refreshTokens.length > authConfig.session.maxActiveSessions) {
    this.refreshTokens = this.refreshTokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, authConfig.session.maxActiveSessions);
  }

  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (_err) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate access token
userSchema.methods.generateAccessToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
    algorithm: authConfig.jwt.algorithm,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  });
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function (deviceInfo = {}) {
  const payload = {
    userId: this._id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
    algorithm: authConfig.jwt.algorithm,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  });

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Add refresh token to user's tokens array
  this.refreshTokens.push({
    token,
    expiresAt,
    deviceInfo,
  });

  return token;
};

// Instance method to revoke refresh token
userSchema.methods.revokeRefreshToken = function (token) {
  const tokenIndex = this.refreshTokens.findIndex(
    (t) => t.token === token && t.isActive,
  );

  if (tokenIndex !== -1) {
    this.refreshTokens[tokenIndex].isActive = false;
    return true;
  }

  return false;
};

// Instance method to revoke all refresh tokens
userSchema.methods.revokeAllRefreshTokens = function () {
  this.refreshTokens.forEach((token) => {
    token.isActive = false;
  });
};

// Instance method to handle login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1,
      },
      $set: {
        loginAttempts: 1,
      },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // If we've reached max attempts and it's not locked already, lock account
  if (
    this.loginAttempts + 1 >= authConfig.security.maxLoginAttempts &&
    !this.isLocked
  ) {
    updates.$set = {
      lockUntil: Date.now() + authConfig.security.lockoutTime,
    };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
  });
};

// Instance method to update last active timestamp
userSchema.methods.updateLastActive = function () {
  this.statistics.lastActiveAt = new Date();
  return this.save();
};

// Instance method to get safe user data
userSchema.methods.toSafeObject = function () {
  const safeUser = this.toObject();
  delete safeUser.password;
  delete safeUser.refreshTokens;
  delete safeUser.emailVerificationToken;
  delete safeUser.passwordResetToken;
  delete safeUser.loginAttempts;
  delete safeUser.lockUntil;
  return safeUser;
};

// Assessment-related instance methods

// Update skill assessment after completing an assessment
userSchema.methods.updateSkillAssessment = function (categoryId, categoryName, level, score, sessionData) {
  const existingSkillIndex = this.skillsProgress.skillAssessments.findIndex(
    skill => skill.categoryId.toString() === categoryId.toString(),
  );

  const assessmentData = {
    assessmentId: sessionData.assessmentId,
    sessionId: sessionData.sessionId,
    categoryId: categoryId,
    score: score,
    passed: score >= (sessionData.passingScore || 70),
    completedAt: new Date(),
    timeSpent: sessionData.timeSpent || 0,
  };

  // Add to recent assessments (keep last 10)
  this.skillsProgress.recentAssessments.unshift(assessmentData);
  if (this.skillsProgress.recentAssessments.length > 10) {
    this.skillsProgress.recentAssessments = this.skillsProgress.recentAssessments.slice(0, 10);
  }

  if (existingSkillIndex >= 0) {
    // Update existing skill
    const skill = this.skillsProgress.skillAssessments[existingSkillIndex];
    skill.lastScore = score;
    skill.bestScore = Math.max(skill.bestScore || 0, score);
    skill.attemptCount += 1;
    skill.lastAssessmentAt = new Date();
    
    // Update level if score indicates progression
    const newLevel = this.calculateLevelFromScore(score);
    if (this.isLevelProgression(skill.currentLevel, newLevel)) {
      skill.levelHistory.push({
        level: newLevel,
        achievedAt: new Date(),
        score: score,
      });
      skill.currentLevel = newLevel;
    }
  } else {
    // Create new skill assessment
    this.skillsProgress.skillAssessments.push({
      categoryId: categoryId,
      categoryName: categoryName,
      currentLevel: level,
      lastScore: score,
      bestScore: score,
      attemptCount: 1,
      lastAssessmentAt: new Date(),
      firstAssessmentAt: new Date(),
      levelHistory: [{
        level: level,
        achievedAt: new Date(),
        score: score,
      }],
    });
  }

  // Update overall statistics
  this.statistics.totalAssessmentsTaken += 1;
  if (assessmentData.passed) {
    this.statistics.totalAssessmentsPassed += 1;
  }
  
  // Recalculate average score
  const totalScore = this.statistics.averageAssessmentScore * (this.statistics.totalAssessmentsTaken - 1) + score;
  this.statistics.averageAssessmentScore = totalScore / this.statistics.totalAssessmentsTaken;
  
  this.statistics.totalAssessmentTime += assessmentData.timeSpent;

  return this.save();
};

// Calculate skill level based on score
userSchema.methods.calculateLevelFromScore = function (score) {
  if (score >= 90) return 'expert';
  if (score >= 80) return 'advanced';
  if (score >= 70) return 'intermediate';
  return 'beginner';
};

// Check if level change represents progression
userSchema.methods.isLevelProgression = function (currentLevel, newLevel) {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  return levels.indexOf(newLevel) > levels.indexOf(currentLevel);
};

// Get user's skill level for a specific category
userSchema.methods.getSkillLevel = function (categoryId) {
  const skill = this.skillsProgress.skillAssessments.find(
    skill => skill.categoryId.toString() === categoryId.toString(),
  );
  return skill ? skill.currentLevel : 'beginner';
};

// Get user's best score for a category
userSchema.methods.getBestScore = function (categoryId) {
  const skill = this.skillsProgress.skillAssessments.find(
    skill => skill.categoryId.toString() === categoryId.toString(),
  );
  return skill ? skill.bestScore : 0;
};

// Add achievement
userSchema.methods.addAchievement = function (type, data) {
  if (type === 'skill_milestone') {
    this.achievements.skillMilestones.push({
      categoryId: data.categoryId,
      milestone: data.milestone,
      achievedAt: new Date(),
      level: data.level,
      score: data.score,
    });
  } else if (type === 'badge') {
    this.achievements.badges.push({
      badgeId: data.badgeId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      earnedAt: new Date(),
      category: data.category,
    });
  }
  
  return this.save();
};

// Update assessment streak
userSchema.methods.updateStreak = function (passed) {
  if (passed) {
    this.achievements.streaks.currentStreak += 1;
    this.achievements.streaks.longestStreak = Math.max(
      this.achievements.streaks.longestStreak,
      this.achievements.streaks.currentStreak,
    );
  } else {
    this.achievements.streaks.currentStreak = 0;
  }
  
  this.achievements.streaks.lastStreakUpdate = new Date();
  return this.save();
};

// Get assessment readiness for a category
userSchema.methods.getAssessmentReadiness = function (categoryId) {
  const skill = this.skillsProgress.skillAssessments.find(
    skill => skill.categoryId.toString() === categoryId.toString(),
  );
  
  if (!skill) {
    return {
      ready: true,
      recommendedLevel: 'beginner',
      reason: 'First assessment',
    };
  }

  // Check if user should wait before retaking
  const lastAttempt = skill.lastAssessmentAt;
  const hoursSinceLastAttempt = lastAttempt ? 
    (new Date() - lastAttempt) / (1000 * 60 * 60) : Infinity;
  
  if (hoursSinceLastAttempt < 1) {
    return {
      ready: false,
      reason: 'Please wait before retaking assessment',
      waitTime: Math.ceil(1 - hoursSinceLastAttempt),
    };
  }

  return {
    ready: true,
    recommendedLevel: skill.nextRecommendedLevel || skill.currentLevel,
    currentLevel: skill.currentLevel,
    bestScore: skill.bestScore,
    attemptCount: skill.attemptCount,
  };
};

// Get user's skill summary
userSchema.methods.getSkillsSummary = function () {
  return {
    overallLevel: this.skillsProgress.overallLevel,
    totalSkillsAssessed: this.skillsProgress.skillAssessments.length,
    averageScore: this.statistics.averageAssessmentScore,
    totalAssessments: this.statistics.totalAssessmentsTaken,
    passRate: this.statistics.totalAssessmentsTaken > 0 ? 
      (this.statistics.totalAssessmentsPassed / this.statistics.totalAssessmentsTaken) * 100 : 0,
    currentStreak: this.achievements.streaks.currentStreak,
    longestStreak: this.achievements.streaks.longestStreak,
    recentAssessments: this.skillsProgress.recentAssessments.slice(0, 5),
    skillLevels: this.skillsProgress.skillAssessments.map(skill => ({
      categoryId: skill.categoryId,
      categoryName: skill.categoryName,
      level: skill.currentLevel,
      score: skill.lastScore,
      bestScore: skill.bestScore,
    })),
  };
};

// Static method to find by Clerk ID
userSchema.statics.findByClerkId = async function (clerkUserId) {
  return await this.findOne({ clerkUserId });
};

// Static method to create from Clerk data
userSchema.statics.createFromClerk = async function (clerkUser) {
  // For test events without real email addresses, create a valid test email
  let email;
  if (clerkUser.email_addresses && clerkUser.email_addresses.length > 0) {
    email = clerkUser.email_addresses[0].email_address;
  } else {
    // Generate a valid test email for webhook test events
    email = `test-${clerkUser.id.slice(-8)}@clerk-test.com`;
  }
                
  const userData = {
    clerkUserId: clerkUser.id,
    email: email,
    firstName: clerkUser.first_name || 'Test',
    lastName: clerkUser.last_name || 'User',
    profileImage: clerkUser.profile_image_url || clerkUser.image_url,
    isEmailVerified: clerkUser.email_addresses?.[0]?.verification?.status === 'verified' || false,
    clerkSyncStatus: 'synced',
    lastClerkSync: new Date(),
  };

  return await this.create(userData);
};

// Static method to update from Clerk data
userSchema.statics.updateFromClerk = async function (clerkUser) {
  const updateData = {
    email: clerkUser.email_addresses[0]?.email_address,
    firstName: clerkUser.first_name || '',
    lastName: clerkUser.last_name || '',
    profileImage: clerkUser.profile_image_url,
    isEmailVerified: clerkUser.email_addresses[0]?.verification?.status === 'verified',
    clerkSyncStatus: 'synced',
    lastClerkSync: new Date(),
  };

  return await this.findOneAndUpdate(
    { clerkUserId: clerkUser.id },
    updateData,
    { new: true },
  );
};

// Static method to find by credentials (keep for legacy support)
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select(
    '+password +loginAttempts +lockUntil',
  );

  if (!user) {
    throw new Error('Invalid login credentials');
  }

  // Check if account is locked
  if (user.isLocked) {
    // Increment login attempts and throw error
    await user.incLoginAttempts();
    throw new Error(
      'Account temporarily locked due to too many failed login attempts',
    );
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Increment login attempts on failed login
    await user.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
