// models/LearningAnalytics.js
const mongoose = require('mongoose');

const learningAnalyticsSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Time period for this analytics record
  period: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'],
      required: true,
      default: 'daily',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },

  // Learning engagement metrics
  engagement: {
    totalSessionTime: {
      type: Number,
      default: 0, // in minutes
    },
    averageSessionDuration: {
      type: Number,
      default: 0, // in minutes
    },
    sessionCount: {
      type: Number,
      default: 0,
    },
    interactionRate: {
      type: Number,
      default: 0, // interactions per minute
      min: 0,
      max: 100,
    },
    focusScore: {
      type: Number,
      default: 0, // 0-100 based on session consistency
      min: 0,
      max: 100,
    },
  },

  // Learning progress metrics
  progress: {
    modulesStarted: {
      type: Number,
      default: 0,
    },
    modulesCompleted: {
      type: Number,
      default: 0,
    },
    pathsEnrolled: {
      type: Number,
      default: 0,
    },
    pathsCompleted: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0, // percentage
      min: 0,
      max: 100,
    },
    averageModuleScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Performance patterns
  performance: {
    optimalLearningTime: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday
      },
      confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    strugglePatterns: [{
      category: {
        type: String,
        enum: [
          'Communication & Leadership',
          'Innovation & Creativity', 
          'Technical Skills',
          'Business Strategy',
          'Personal Development',
          'Data & Analytics',
        ],
      },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      },
      strugglingTopics: [String],
      interventionNeeded: {
        type: Boolean,
        default: false,
      },
    }],
    strengthAreas: [{
      category: String,
      proficiencyLevel: {
        type: Number,
        min: 0,
        max: 100,
      },
      consistencyScore: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],
  },

  // AI interaction analytics
  aiInteraction: {
    totalInteractions: {
      type: Number,
      default: 0,
    },
    averageResponseTime: {
      type: Number,
      default: 0, // in seconds
    },
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    personalityUsage: {
      ARIA: {
        type: Number,
        default: 0, // percentage of interactions
      },
      SAGE: {
        type: Number,
        default: 0,
      },
      COACH: {
        type: Number,
        default: 0,
      },
    },
    effectivenessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Learning predictions
  predictions: {
    completionLikelihood: {
      currentPath: {
        type: Number,
        min: 0,
        max: 100,
      },
      nextModule: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    timeToCompletion: {
      currentPath: {
        type: Number, // in days
      },
      estimatedAccuracy: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    riskFactors: [{
      type: {
        type: String,
        enum: ['disengagement', 'difficulty_spike', 'time_constraint', 'motivation_drop'],
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],
  },

  // Recommendation metrics
  recommendations: {
    generated: {
      type: Number,
      default: 0,
    },
    accepted: {
      type: Number,
      default: 0,
    },
    effectiveness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastRecommendation: {
      type: Date,
    },
  },

  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  
  version: {
    type: String,
    default: '1.0',
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for efficient querying
learningAnalyticsSchema.index({ user: 1, 'period.type': 1, 'period.startDate': -1 });
learningAnalyticsSchema.index({ 'period.endDate': 1 }); // For cleanup
learningAnalyticsSchema.index({ calculatedAt: -1 }); // For recent analytics

// Virtual for period duration
learningAnalyticsSchema.virtual('period.duration').get(function() {
  return Math.ceil((this.period.endDate - this.period.startDate) / (1000 * 60 * 60 * 24));
});

// Static method to get user analytics for period
learningAnalyticsSchema.statics.getUserAnalytics = async function(userId, periodType = 'weekly', limit = 12) {
  return this.find({
    user: userId,
    'period.type': periodType,
  })
    .sort({ 'period.startDate': -1 })
    .limit(limit)
    .lean();
};

// Static method to get latest analytics for user
learningAnalyticsSchema.statics.getLatestAnalytics = async function(userId) {
  return this.findOne({
    user: userId,
  })
    .sort({ calculatedAt: -1 })
    .lean();
};

// Static method to get aggregated insights
learningAnalyticsSchema.statics.getAggregatedInsights = async function(userId, days = 30) {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        'period.startDate': { $gte: startDate },
        'period.endDate': { $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSessionTime: { $sum: '$engagement.totalSessionTime' },
        avgSessionDuration: { $avg: '$engagement.averageSessionDuration' },
        totalSessions: { $sum: '$engagement.sessionCount' },
        avgCompletionRate: { $avg: '$progress.completionRate' },
        avgModuleScore: { $avg: '$progress.averageModuleScore' },
        totalAIInteractions: { $sum: '$aiInteraction.totalInteractions' },
        avgSatisfactionScore: { $avg: '$aiInteraction.satisfactionScore' },
        totalRecommendations: { $sum: '$recommendations.generated' },
        acceptedRecommendations: { $sum: '$recommendations.accepted' },
      },
    },
  ]);
};

// Instance method to calculate learning velocity
learningAnalyticsSchema.methods.calculateLearningVelocity = function() {
  const durationInDays = this.period.duration;
  if (durationInDays === 0) return 0;
  
  return (this.progress.modulesCompleted / durationInDays) * 7; // modules per week
};

// Instance method to calculate engagement trend
learningAnalyticsSchema.methods.calculateEngagementTrend = function() {
  const focusWeight = 0.3;
  const sessionWeight = 0.4;
  const interactionWeight = 0.3;
  
  return (
    (this.engagement.focusScore * focusWeight) +
    (Math.min(this.engagement.sessionCount / 5, 1) * 100 * sessionWeight) +
    (Math.min(this.engagement.interactionRate, 1) * 100 * interactionWeight)
  );
};

// Instance method to identify learning patterns
learningAnalyticsSchema.methods.identifyLearningPatterns = function() {
  const patterns = [];
  
  // High engagement pattern
  if (this.engagement.focusScore > 80 && this.engagement.sessionCount > 4) {
    patterns.push({
      type: 'high_engagement',
      confidence: 0.9,
      description: 'Consistent high engagement with frequent learning sessions',
    });
  }
  
  // Optimal time pattern
  if (this.performance.optimalLearningTime.confidence > 70) {
    patterns.push({
      type: 'optimal_timing',
      confidence: this.performance.optimalLearningTime.confidence / 100,
      description: `Best learning time: ${this.performance.optimalLearningTime.hour}:00 on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][this.performance.optimalLearningTime.dayOfWeek]}`,
    });
  }
  
  // Struggle pattern
  if (this.performance.strugglePatterns.some(p => p.interventionNeeded)) {
    patterns.push({
      type: 'needs_intervention',
      confidence: 0.8,
      description: 'Struggling in specific areas, intervention recommended',
    });
  }
  
  return patterns;
};

// Pre-save middleware to validate data consistency
learningAnalyticsSchema.pre('save', function(next) {
  // Ensure completion rate is consistent with modules data
  if (this.progress.modulesStarted > 0) {
    const calculatedCompletionRate = (this.progress.modulesCompleted / this.progress.modulesStarted) * 100;
    if (Math.abs(this.progress.completionRate - calculatedCompletionRate) > 5) {
      this.progress.completionRate = calculatedCompletionRate;
    }
  }
  
  // Ensure personality usage percentages add up to 100 or less
  const totalPersonalityUsage = 
    this.aiInteraction.personalityUsage.ARIA +
    this.aiInteraction.personalityUsage.SAGE +
    this.aiInteraction.personalityUsage.COACH;
  
  if (totalPersonalityUsage > 100) {
    const scale = 100 / totalPersonalityUsage;
    this.aiInteraction.personalityUsage.ARIA *= scale;
    this.aiInteraction.personalityUsage.SAGE *= scale;
    this.aiInteraction.personalityUsage.COACH *= scale;
  }
  
  next();
});

// Static method to cleanup old analytics
learningAnalyticsSchema.statics.cleanupOldAnalytics = async function(daysToKeep = 365) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    'period.endDate': { $lt: cutoffDate },
    'period.type': { $in: ['daily', 'weekly'] }, // Keep monthly/yearly longer
  });
  
  return result.deletedCount;
};

// Export model
module.exports = mongoose.model('LearningAnalytics', learningAnalyticsSchema);