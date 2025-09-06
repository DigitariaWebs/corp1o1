// models/AdaptationRule.js
const mongoose = require('mongoose');

const adaptationRuleSchema = new mongoose.Schema(
  {
    // Rule identification
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Rule category and type
    category: {
      type: String,
      enum: [
        'content_difficulty',
        'ai_personality',
        'learning_pace',
        'intervention',
        'recommendation',
        'engagement',
        'assessment_timing',
      ],
      required: true,
    },

    type: {
      type: String,
      enum: ['trigger', 'continuous', 'scheduled', 'manual'],
      required: true,
      default: 'trigger',
    },

    // Trigger conditions
    triggerConditions: {
      // Performance-based triggers
      performance: {
        minCompletionRate: {
          type: Number,
          min: 0,
          max: 100,
        },
        maxCompletionRate: {
          type: Number,
          min: 0,
          max: 100,
        },
        minAverageScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        maxAverageScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        consecutiveFailures: {
          type: Number,
          min: 1,
          max: 10,
        },
        strugglingDuration: {
          type: Number, // days struggling in same area
          min: 1,
          max: 30,
        },
      },

      // Engagement-based triggers
      engagement: {
        minFocusScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        maxFocusScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        minSessionsPerWeek: {
          type: Number,
          min: 0,
          max: 20,
        },
        maxSessionsPerWeek: {
          type: Number,
          min: 0,
          max: 20,
        },
        inactivityDays: {
          type: Number,
          min: 1,
          max: 30,
        },
        minInteractionRate: {
          type: Number,
          min: 0,
          max: 10,
        },
      },

      // AI interaction triggers
      aiInteraction: {
        minSatisfactionScore: {
          type: Number,
          min: 0,
          max: 5,
        },
        maxSatisfactionScore: {
          type: Number,
          min: 0,
          max: 5,
        },
        minEffectivenessScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        consecutiveNegativeFeedback: {
          type: Number,
          min: 1,
          max: 10,
        },
        personalityMismatch: {
          type: Boolean,
          default: false,
        },
      },

      // Time-based triggers
      timing: {
        daysInCurrentModule: {
          type: Number,
          min: 1,
          max: 90,
        },
        daysInCurrentPath: {
          type: Number,
          min: 1,
          max: 365,
        },
        timeOfDay: {
          start: {
            type: Number,
            min: 0,
            max: 23,
          },
          end: {
            type: Number,
            min: 0,
            max: 23,
          },
        },
        dayOfWeek: [
          {
            type: Number,
            min: 0,
            max: 6,
          },
        ],
      },
    },

    // Adaptation actions to take when triggered
    adaptationActions: {
      // Content adaptations
      content: {
        adjustDifficulty: {
          type: String,
          enum: ['increase', 'decrease', 'auto'],
          default: null,
        },
        changeContentFormat: {
          type: String,
          enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'],
          default: null,
        },
        addSupplementaryResources: {
          type: Boolean,
          default: false,
        },
        enableHints: {
          type: Boolean,
          default: false,
        },
      },

      // AI personality adaptations
      aiPersonality: {
        switchTo: {
          type: String,
          enum: ['ARIA', 'SAGE', 'COACH', 'auto'],
          default: null,
        },
        adjustTone: {
          type: String,
          enum: [
            'more_encouraging',
            'more_direct',
            'more_detailed',
            'more_concise',
          ],
          default: null,
        },
        increaseSupport: {
          type: Boolean,
          default: false,
        },
      },

      // Learning pace adaptations
      pace: {
        suggestBreak: {
          type: Boolean,
          default: false,
        },
        adjustSessionLength: {
          type: String,
          enum: ['shorter', 'longer', 'adaptive'],
          default: null,
        },
        recommendSchedule: {
          type: Boolean,
          default: false,
        },
      },

      // Intervention actions
      intervention: {
        sendNotification: {
          type: Boolean,
          default: false,
        },
        scheduleCheckin: {
          type: Boolean,
          default: false,
        },
        offerTutoring: {
          type: Boolean,
          default: false,
        },
        suggestPeerSupport: {
          type: Boolean,
          default: false,
        },
      },

      // Recommendation actions
      recommendations: {
        suggestNewPath: {
          type: Boolean,
          default: false,
        },
        recommendReview: {
          type: Boolean,
          default: false,
        },
        proposeAlternativeModule: {
          type: Boolean,
          default: false,
        },
      },
    },

    // Rule configuration
    configuration: {
      priority: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
      },
      cooldownPeriod: {
        type: Number, // hours before rule can trigger again
        default: 24,
        min: 1,
        max: 168, // 1 week
      },
      maxTriggersPerUser: {
        type: Number,
        default: 10,
        min: 1,
        max: 100,
      },
      effectiveness: {
        successRate: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        totalTriggers: {
          type: Number,
          default: 0,
        },
        successfulAdaptations: {
          type: Number,
          default: 0,
        },
      },
    },

    // Rule status
    isActive: {
      type: Boolean,
      default: true,
    },

    isGlobal: {
      type: Boolean,
      default: true, // applies to all users
    },

    // User-specific rules
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Learning context restrictions
    applicableContexts: {
      categories: [
        {
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
      ],
      difficulties: [
        {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
      ],
      learningStyles: [
        {
          type: String,
          enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
        },
      ],
    },

    // Metadata
    createdBy: {
      type: String,
      default: 'system',
    },

    lastTriggered: {
      type: Date,
    },

    version: {
      type: String,
      default: '1.0',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for efficient querying
adaptationRuleSchema.index({ category: 1, isActive: 1 });
adaptationRuleSchema.index({ 'configuration.priority': -1 });
adaptationRuleSchema.index({ isGlobal: 1, isActive: 1 });
adaptationRuleSchema.index({ lastTriggered: 1 });

// Virtual for success rate calculation
adaptationRuleSchema
  .virtual('configuration.effectiveness.currentSuccessRate')
  .get(function () {
    if (this.configuration.effectiveness.totalTriggers === 0) return 0;
    return (
      (this.configuration.effectiveness.successfulAdaptations /
        this.configuration.effectiveness.totalTriggers) *
      100
    );
  });

// Static method to get active rules by category
adaptationRuleSchema.statics.getActiveRulesByCategory = async function (
  category,
) {
  return this.find({
    category,
    isActive: true,
  }).sort({ 'configuration.priority': -1 });
};

// Static method to get applicable rules for user context
adaptationRuleSchema.statics.getApplicableRules = async function (userContext) {
  const query = {
    isActive: true,
    $or: [{ isGlobal: true }, { targetUsers: userContext.userId }],
  };

  // Add context filters if specified
  if (userContext.category) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { 'applicableContexts.categories': { $size: 0 } },
        { 'applicableContexts.categories': userContext.category },
      ],
    });
  }

  if (userContext.difficulty) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { 'applicableContexts.difficulties': { $size: 0 } },
        { 'applicableContexts.difficulties': userContext.difficulty },
      ],
    });
  }

  if (userContext.learningStyle) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { 'applicableContexts.learningStyles': { $size: 0 } },
        { 'applicableContexts.learningStyles': userContext.learningStyle },
      ],
    });
  }

  return this.find(query).sort({ 'configuration.priority': -1 });
};

// Instance method to check if rule conditions are met
adaptationRuleSchema.methods.checkConditions = function (
  userAnalytics,
  userContext,
) {
  const conditions = this.triggerConditions;

  // Check performance conditions
  if (conditions.performance) {
    const perf = userAnalytics.progress;

    if (
      conditions.performance.minCompletionRate &&
      perf.completionRate < conditions.performance.minCompletionRate
    )
      return false;
    if (
      conditions.performance.maxCompletionRate &&
      perf.completionRate > conditions.performance.maxCompletionRate
    )
      return false;
    if (
      conditions.performance.minAverageScore &&
      perf.averageModuleScore < conditions.performance.minAverageScore
    )
      return false;
    if (
      conditions.performance.maxAverageScore &&
      perf.averageModuleScore > conditions.performance.maxAverageScore
    )
      return false;
  }

  // Check engagement conditions
  if (conditions.engagement) {
    const eng = userAnalytics.engagement;

    if (
      conditions.engagement.minFocusScore &&
      eng.focusScore < conditions.engagement.minFocusScore
    )
      return false;
    if (
      conditions.engagement.maxFocusScore &&
      eng.focusScore > conditions.engagement.maxFocusScore
    )
      return false;
    if (
      conditions.engagement.minSessionsPerWeek &&
      eng.sessionCount < conditions.engagement.minSessionsPerWeek
    )
      return false;
    if (
      conditions.engagement.maxSessionsPerWeek &&
      eng.sessionCount > conditions.engagement.maxSessionsPerWeek
    )
      return false;
  }

  // Check AI interaction conditions
  if (conditions.aiInteraction) {
    const ai = userAnalytics.aiInteraction;

    if (
      conditions.aiInteraction.minSatisfactionScore &&
      ai.satisfactionScore < conditions.aiInteraction.minSatisfactionScore
    )
      return false;
    if (
      conditions.aiInteraction.maxSatisfactionScore &&
      ai.satisfactionScore > conditions.aiInteraction.maxSatisfactionScore
    )
      return false;
    if (
      conditions.aiInteraction.minEffectivenessScore &&
      ai.effectivenessScore < conditions.aiInteraction.minEffectivenessScore
    )
      return false;
  }

  // Check timing conditions
  if (conditions.timing) {
    const now = new Date();

    if (conditions.timing.timeOfDay) {
      const currentHour = now.getHours();
      if (
        currentHour < conditions.timing.timeOfDay.start ||
        currentHour > conditions.timing.timeOfDay.end
      )
        return false;
    }

    if (conditions.timing.dayOfWeek && conditions.timing.dayOfWeek.length > 0) {
      const currentDay = now.getDay();
      if (!conditions.timing.dayOfWeek.includes(currentDay)) return false;
    }
  }

  return true;
};

// Instance method to check cooldown period
adaptationRuleSchema.methods.isInCooldown = function () {
  if (!this.lastTriggered) return false;

  const cooldownMs = this.configuration.cooldownPeriod * 60 * 60 * 1000;
  const timeSinceLastTrigger = Date.now() - this.lastTriggered.getTime();

  return timeSinceLastTrigger < cooldownMs;
};

// Instance method to record successful trigger
adaptationRuleSchema.methods.recordTrigger = async function (
  wasSuccessful = true,
) {
  this.configuration.effectiveness.totalTriggers += 1;
  if (wasSuccessful) {
    this.configuration.effectiveness.successfulAdaptations += 1;
  }
  this.lastTriggered = new Date();

  // Update success rate
  this.configuration.effectiveness.successRate =
    (this.configuration.effectiveness.successfulAdaptations /
      this.configuration.effectiveness.totalTriggers) *
    100;

  await this.save();
};

// Static method to create default adaptation rules
adaptationRuleSchema.statics.createDefaults = async function () {
  const defaultRules = [
    {
      name: 'Low Completion Rate Intervention',
      description: 'Triggers when user completion rate drops below 30%',
      category: 'intervention',
      type: 'trigger',
      triggerConditions: {
        performance: {
          maxCompletionRate: 30,
        },
      },
      adaptationActions: {
        aiPersonality: {
          switchTo: 'COACH',
          increaseSupport: true,
        },
        intervention: {
          sendNotification: true,
          scheduleCheckin: true,
        },
      },
      configuration: {
        priority: 9,
        cooldownPeriod: 48,
      },
    },
    {
      name: 'High Performer Content Boost',
      description: 'Increases difficulty for high-performing users',
      category: 'content_difficulty',
      type: 'trigger',
      triggerConditions: {
        performance: {
          minCompletionRate: 85,
          minAverageScore: 90,
        },
      },
      adaptationActions: {
        content: {
          adjustDifficulty: 'increase',
          addSupplementaryResources: true,
        },
      },
      configuration: {
        priority: 6,
        cooldownPeriod: 72,
      },
    },
    {
      name: 'Low Engagement Recovery',
      description: 'Adapts to re-engage users with low focus scores',
      category: 'engagement',
      type: 'trigger',
      triggerConditions: {
        engagement: {
          maxFocusScore: 40,
          minSessionsPerWeek: 1,
        },
      },
      adaptationActions: {
        aiPersonality: {
          switchTo: 'ARIA',
          adjustTone: 'more_encouraging',
        },
        pace: {
          adjustSessionLength: 'shorter',
        },
      },
      configuration: {
        priority: 8,
        cooldownPeriod: 24,
      },
    },
    {
      name: 'AI Personality Mismatch Detection',
      description: 'Switches AI personality when satisfaction is low',
      category: 'ai_personality',
      type: 'trigger',
      triggerConditions: {
        aiInteraction: {
          maxSatisfactionScore: 2,
          consecutiveNegativeFeedback: 3,
        },
      },
      adaptationActions: {
        aiPersonality: {
          switchTo: 'auto',
          adjustTone: 'more_detailed',
        },
      },
      configuration: {
        priority: 7,
        cooldownPeriod: 48,
      },
    },
    {
      name: 'Struggling Learner Support',
      description: 'Provides additional support for struggling learners',
      category: 'content_difficulty',
      type: 'trigger',
      triggerConditions: {
        performance: {
          maxAverageScore: 60,
          consecutiveFailures: 2,
        },
      },
      adaptationActions: {
        content: {
          adjustDifficulty: 'decrease',
          addSupplementaryResources: true,
          enableHints: true,
        },
        aiPersonality: {
          switchTo: 'SAGE',
          increaseSupport: true,
        },
      },
      configuration: {
        priority: 9,
        cooldownPeriod: 24,
      },
    },
  ];

  for (const rule of defaultRules) {
    await this.findOneAndUpdate({ name: rule.name }, rule, {
      upsert: true,
      new: true,
    });
  }

  return defaultRules.length;
};

// Pre-save middleware to validate conditions
adaptationRuleSchema.pre('save', function (next) {
  // Ensure min/max values are logical
  const perf = this.triggerConditions.performance;
  if (perf && perf.minCompletionRate && perf.maxCompletionRate) {
    if (perf.minCompletionRate >= perf.maxCompletionRate) {
      return next(
        new Error('minCompletionRate must be less than maxCompletionRate'),
      );
    }
  }

  // Ensure priority is within valid range
  if (this.configuration.priority < 1 || this.configuration.priority > 10) {
    this.configuration.priority = Math.max(
      1,
      Math.min(10, this.configuration.priority),
    );
  }

  next();
});

module.exports = mongoose.model('AdaptationRule', adaptationRuleSchema);
