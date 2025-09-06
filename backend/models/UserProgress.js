const mongoose = require('mongoose');

// Performance metrics schema
const performanceMetricsSchema = new mongoose.Schema({
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  bestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  assessmentScores: [{
    attemptNumber: Number,
    score: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    timeSpent: Number, // in minutes
  }],
  totalAssessmentAttempts: {
    type: Number,
    default: 0,
  },
  strengths: [{
    skill: String,
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
  }],
  weaknesses: [{
    skill: String,
    improvementNeeded: {
      type: Number,
      min: 0,
      max: 100,
    },
    recommendedActions: [String],
  }],
  skillDevelopment: [{
    skill: String,
    initialLevel: Number,
    currentLevel: Number,
    targetLevel: Number,
    progressRate: Number, // skill points per hour
  }],
}, { _id: false });

// AI insights schema
const aiInsightsSchema = new mongoose.Schema({
  personalizedContent: [{
    adaptationType: {
      type: String,
      enum: ['difficulty_adjust', 'learning_style', 'pacing', 'content_format', 'additional_resources'],
    },
    reason: String,
    effectiveness: {
      type: Number,
      min: 0,
      max: 100,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    userFeedback: {
      helpful: Boolean,
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: String,
    },
  }],
  recommendedNextSteps: [{
    type: {
      type: String,
      enum: ['continue', 'review', 'practice', 'advance', 'reassess'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    description: String,
    estimatedImpact: {
      type: Number,
      min: 0,
      max: 100,
    },
  }],
  learningPatterns: {
    preferredStudyTimes: [String], // e.g., ['09:00', '14:00']
    optimalSessionLength: Number, // in minutes
    bestPerformingContentTypes: [String],
    strugglingContentTypes: [String],
    engagementTriggers: [String],
    motivationFactors: [String],
  },
  predictedCompletionDate: {
    type: Date,
    default: null,
  },
  confidenceInterval: {
    type: Number,
    min: 0,
    max: 100,
    default: 80,
  },
  adaptationHistory: [{
    date: {
      type: Date,
      default: Date.now,
    },
    adaptationType: String,
    trigger: String,
    result: String,
    effectiveness: Number,
  }],
}, { _id: false });

// Learning analytics schema
const learningAnalyticsSchema = new mongoose.Schema({
  totalTimeSpent: {
    type: Number,
    default: 0, // in minutes
  },
  activeTimeSpent: {
    type: Number,
    default: 0, // time actually engaging with content
  },
  sessionsCount: {
    type: Number,
    default: 0,
  },
  averageSessionDuration: {
    type: Number,
    default: 0,
  },
  longestSession: {
    type: Number,
    default: 0,
  },
  shortestSession: {
    type: Number,
    default: 0,
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  focusScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  retentionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  consistencyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  weeklyGoalProgress: {
    currentWeek: {
      target: Number, // minutes
      achieved: Number,
      percentage: Number,
    },
    streak: {
      current: Number,
      longest: Number,
      lastActiveDate: Date,
    },
  },
}, { _id: false });

// User progress schema
const userProgressSchema = new mongoose.Schema({
  // User and content references
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    default: null, // null for global progress tracking
  },
  
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule',
    default: null, // null for path-level progress
  },
  
  // Progress tracking
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    timeSpent: {
      type: Number,
      default: 0, // in minutes
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    firstAccessed: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
  },
  
  // Detailed performance metrics
  performance: performanceMetricsSchema,
  
  // AI-generated insights and adaptations
  aiInsights: aiInsightsSchema,
  
  // Comprehensive learning analytics
  analytics: learningAnalyticsSchema,
  
  // Learning milestones and achievements
  milestones: [{
    type: {
      type: String,
      enum: ['started', '25_percent', '50_percent', '75_percent', 'completed', 'mastered', 'assessment_passed'],
    },
    achievedAt: {
      type: Date,
      default: Date.now,
    },
    value: Number, // score, percentage, etc.
    celebrated: {
      type: Boolean,
      default: false,
    },
  }],
  
  // User goals and targets
  goals: {
    targetCompletionDate: {
      type: Date,
      default: null,
    },
    dailyTimeGoal: {
      type: Number,
      default: 30, // minutes
    },
    weeklyTimeGoal: {
      type: Number,
      default: 210, // 30 minutes * 7 days
    },
    skillLevelTarget: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: null,
    },
    customGoals: [{
      description: String,
      targetValue: Number,
      currentValue: Number,
      deadline: Date,
      achieved: Boolean,
    }],
  },
  
  // User feedback and ratings
  feedback: {
    contentRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    difficultyRating: {
      type: String,
      enum: ['too_easy', 'just_right', 'too_hard'],
      default: null,
    },
    paceRating: {
      type: String,
      enum: ['too_slow', 'just_right', 'too_fast'],
      default: null,
    },
    engagementRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comments: String,
    improvementSuggestions: [String],
    wouldRecommend: {
      type: Boolean,
      default: null,
    },
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused', 'abandoned'],
    default: 'not_started',
  },
  
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  
  lastActivityDate: {
    type: Date,
    default: Date.now,
  },
  
  // Adaptive learning settings
  adaptiveSettings: {
    difficultyAdjustment: {
      type: Boolean,
      default: true,
    },
    contentPersonalization: {
      type: Boolean,
      default: true,
    },
    pacingAdjustment: {
      type: Boolean,
      default: true,
    },
    aiRecommendations: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Compound indexes for efficient queries
userProgressSchema.index({ userId: 1, pathId: 1, moduleId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, 'progress.lastAccessed': -1 });
userProgressSchema.index({ userId: 1, status: 1 });
userProgressSchema.index({ pathId: 1, 'progress.completed': 1 });
userProgressSchema.index({ userId: 1, 'progress.completed': 1, completedAt: -1 });
userProgressSchema.index({ userId: 1, 'analytics.engagementScore': -1 });

// Virtual for completion status
userProgressSchema.virtual('isCompleted').get(function() {
  return this.progress.completed;
});

// Virtual for days since enrollment
userProgressSchema.virtual('daysSinceEnrollment').get(function() {
  return Math.floor((new Date() - this.enrollmentDate) / (1000 * 60 * 60 * 24));
});

// Virtual for estimated completion time remaining
userProgressSchema.virtual('estimatedTimeRemaining').get(function() {
  if (this.progress.percentage === 0) return null;
  
  const totalEstimatedTime = this.analytics.totalTimeSpent / (this.progress.percentage / 100);
  return totalEstimatedTime - this.analytics.totalTimeSpent;
});

// Pre-save middleware to update analytics
userProgressSchema.pre('save', function(next) {
  // Update status based on progress
  if (this.progress.percentage === 0) {
    this.status = 'not_started';
  } else if (this.progress.percentage === 100) {
    this.status = 'completed';
    if (!this.progress.completedAt) {
      this.progress.completedAt = new Date();
    }
  } else if (this.progress.percentage > 0) {
    if (this.status === 'not_started') {
      this.status = 'in_progress';
    }
  }
  
  // Update milestones
  this.updateMilestones();
  
  // Update analytics
  this.updateAnalytics();
  
  next();
});

// Instance method to update milestones
userProgressSchema.methods.updateMilestones = function() {
  const percentage = this.progress.percentage;
  const milestoneThresholds = [25, 50, 75, 100];
  
  milestoneThresholds.forEach(threshold => {
    if (percentage >= threshold) {
      const milestoneType = threshold === 100 ? 'completed' : `${threshold}_percent`;
      const existingMilestone = this.milestones.find(m => m.type === milestoneType);
      
      if (!existingMilestone) {
        this.milestones.push({
          type: milestoneType,
          achievedAt: new Date(),
          value: threshold,
        });
      }
    }
  });
};

// Instance method to update analytics
userProgressSchema.methods.updateAnalytics = function() {
  // Update average session duration
  if (this.analytics.sessionsCount > 0) {
    this.analytics.averageSessionDuration = this.analytics.totalTimeSpent / this.analytics.sessionsCount;
  }
  
  // Update engagement score based on various factors
  const timeRatio = this.analytics.activeTimeSpent / Math.max(this.analytics.totalTimeSpent, 1);
  const progressRatio = this.progress.percentage / 100;
  const assessmentPerformance = this.performance.averageScore / 100;
  
  this.analytics.engagementScore = Math.round(
    (timeRatio * 30 + progressRatio * 40 + assessmentPerformance * 30) * 100,
  );
  
  // Update weekly goal progress
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Calculate this week's progress (simplified)
  this.analytics.weeklyGoalProgress.currentWeek.achieved = 
    Math.min(this.analytics.totalTimeSpent, this.goals.weeklyTimeGoal);
  
  this.analytics.weeklyGoalProgress.currentWeek.percentage = 
    (this.analytics.weeklyGoalProgress.currentWeek.achieved / this.goals.weeklyTimeGoal) * 100;
};

// Instance method to record learning session
userProgressSchema.methods.recordSession = function(sessionData) {
  const { timeSpent, engagementScore, activeTime, materialsViewed } = sessionData;
  
  // Update progress metrics
  this.progress.timeSpent += timeSpent;
  this.progress.lastAccessed = new Date();
  this.lastActivityDate = new Date();
  
  // Update analytics
  this.analytics.totalTimeSpent += timeSpent;
  this.analytics.activeTimeSpent += activeTime || timeSpent * 0.8; // Estimate if not provided
  this.analytics.sessionsCount += 1;
  
  if (this.analytics.longestSession < timeSpent) {
    this.analytics.longestSession = timeSpent;
  }
  
  if (this.analytics.shortestSession === 0 || this.analytics.shortestSession > timeSpent) {
    this.analytics.shortestSession = timeSpent;
  }
  
  // Update engagement score
  if (engagementScore) {
    const currentTotal = this.analytics.engagementScore * (this.analytics.sessionsCount - 1);
    this.analytics.engagementScore = (currentTotal + engagementScore) / this.analytics.sessionsCount;
  }
  
  return this.save();
};

// Instance method to record assessment result
userProgressSchema.methods.recordAssessment = function(assessmentData) {
  const { score, timeSpent, attemptNumber } = assessmentData;
  
  this.performance.assessmentScores.push({
    attemptNumber,
    score,
    timeSpent,
    timestamp: new Date(),
  });
  
  this.performance.totalAssessmentAttempts += 1;
  
  // Update best score
  if (score > this.performance.bestScore) {
    this.performance.bestScore = score;
  }
  
  // Recalculate average score
  const totalScore = this.performance.assessmentScores.reduce((sum, attempt) => sum + attempt.score, 0);
  this.performance.averageScore = totalScore / this.performance.assessmentScores.length;
  
  // Add milestone for passing assessment
  if (score >= 70) { // Assuming 70 is passing score
    const existingMilestone = this.milestones.find(m => m.type === 'assessment_passed');
    if (!existingMilestone) {
      this.milestones.push({
        type: 'assessment_passed',
        achievedAt: new Date(),
        value: score,
      });
    }
  }
  
  return this.save();
};

// Instance method to apply AI adaptation
userProgressSchema.methods.applyAIAdaptation = function(adaptationData) {
  const { adaptationType, reason, trigger } = adaptationData;
  
  this.aiInsights.personalizedContent.push({
    adaptationType,
    reason,
    effectiveness: 0, // Will be updated based on user feedback
    appliedAt: new Date(),
  });
  
  this.aiInsights.adaptationHistory.push({
    date: new Date(),
    adaptationType,
    trigger,
    result: 'applied',
    effectiveness: 0,
  });
  
  return this.save();
};

// Instance method to get learning recommendations
userProgressSchema.methods.getRecommendations = function() {
  const recommendations = [];
  
  // Based on engagement score
  if (this.analytics.engagementScore < 60) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      message: 'Try switching to a different learning style or taking breaks between sessions',
      action: 'adjust_learning_style',
    });
  }
  
  // Based on progress pace
  const expectedProgress = Math.min(100, this.daysSinceEnrollment * 5); // 5% per day expected
  if (this.progress.percentage < expectedProgress * 0.7) {
    recommendations.push({
      type: 'pace',
      priority: 'medium',
      message: 'Consider increasing your daily study time to stay on track',
      action: 'increase_daily_goal',
    });
  }
  
  // Based on assessment performance
  if (this.performance.averageScore < 70) {
    recommendations.push({
      type: 'review',
      priority: 'high',
      message: 'Review previous modules to strengthen your foundation',
      action: 'review_content',
    });
  }
  
  return recommendations;
};

// Static method to get user's progress summary
userProgressSchema.statics.getUserProgressSummary = async function(userId) {
  const progressData = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalPaths: { $sum: { $cond: [{ $ne: ['$pathId', null] }, 1, 0] } },
        completedPaths: { $sum: { $cond: ['$progress.completed', 1, 0] } },
        totalTimeSpent: { $sum: '$analytics.totalTimeSpent' },
        averageEngagement: { $avg: '$analytics.engagementScore' },
        totalAssessments: { $sum: '$performance.totalAssessmentAttempts' },
        averageAssessmentScore: { $avg: '$performance.averageScore' },
      },
    },
  ]);
  
  return progressData[0] || {
    totalPaths: 0,
    completedPaths: 0,
    totalTimeSpent: 0,
    averageEngagement: 0,
    totalAssessments: 0,
    averageAssessmentScore: 0,
  };
};

// Static method to get learning analytics for a user
userProgressSchema.statics.getLearningAnalytics = function(userId, timeRange = '30d') {
  const dateThreshold = new Date();
  switch (timeRange) {
  case '7d':
    dateThreshold.setDate(dateThreshold.getDate() - 7);
    break;
  case '30d':
    dateThreshold.setDate(dateThreshold.getDate() - 30);
    break;
  case '90d':
    dateThreshold.setDate(dateThreshold.getDate() - 90);
    break;
  }
  
  return this.find({
    userId,
    lastActivityDate: { $gte: dateThreshold },
  }).populate('pathId', 'title category difficulty')
    .populate('moduleId', 'title difficulty content.type');
};

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;