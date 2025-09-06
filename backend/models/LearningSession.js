const mongoose = require('mongoose');

// Activity tracking schema for granular session analysis
const activitySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      enum: [
        'session_start',
        'session_pause',
        'session_resume',
        'session_end',
        'content_view',
        'content_skip',
        'content_replay',
        'content_bookmark',
        'assessment_start',
        'assessment_submit',
        'assessment_review',
        'note_create',
        'note_update',
        'help_request',
        'feedback_submit',
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  { _id: true },
);

// Device and environment information schema
const deviceInfoSchema = new mongoose.Schema(
  {
    userAgent: String,
    platform: String,
    browser: String,
    screenResolution: String,
    timezone: String,
    language: String,
    connectionType: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile', 'unknown'],
      default: 'unknown',
    },
  },
  { _id: false },
);

// Content interaction tracking schema
const contentInteractionSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    materialType: {
      type: String,
      enum: [
        'video',
        'text',
        'image',
        'audio',
        'interactive',
        'document',
        'link',
        'quiz',
      ],
      required: true,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    engagementLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    interactions: [
      {
        type: {
          type: String,
          enum: [
            'play',
            'pause',
            'seek',
            'scroll',
            'click',
            'hover',
            'focus',
            'blur',
          ],
        },
        timestamp: Date,
        position: Number, // position in content (seconds for video, pixels for scroll)
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    skipped: {
      type: Boolean,
      default: false,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedback: String,
  },
  { _id: true },
);

// Learning session schema
const learningSessionSchema = new mongoose.Schema(
  {
    // Session identification
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    // User and content references
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    pathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath',
      default: null,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningModule',
      default: null,
    },

    // Session timing
    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: {
      type: Date,
      default: null,
    },

    totalDuration: {
      type: Number, // in minutes
      default: 0,
    },

    activeDuration: {
      type: Number, // actual engagement time in minutes
      default: 0,
    },

    pauseDuration: {
      type: Number, // time spent paused in minutes
      default: 0,
    },

    // Session status
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'abandoned', 'interrupted'],
      default: 'active',
    },

    completionReason: {
      type: String,
      enum: [
        'natural_end',
        'user_choice',
        'timeout',
        'technical_issue',
        'interruption',
      ],
      default: null,
    },

    // Learning context
    learningObjectives: [
      {
        objective: String,
        achieved: {
          type: Boolean,
          default: false,
        },
        confidenceLevel: {
          type: Number,
          min: 0,
          max: 100,
          default: null,
        },
      },
    ],

    // Content interactions
    contentInteractions: [contentInteractionSchema],

    // Session performance
    performance: {
      engagementScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      focusScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      comprehensionScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      progressMade: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      strugglingIndicators: [
        {
          indicator: {
            type: String,
            enum: [
              'repeated_content',
              'long_pauses',
              'fast_skipping',
              'low_interaction',
              'help_requests',
            ],
          },
          severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
          },
          frequency: Number,
        },
      ],
    },

    // AI adaptations applied during session
    appliedAdaptations: [
      {
        adaptationType: {
          type: String,
          enum: [
            'difficulty_adjust',
            'content_variation',
            'pacing_change',
            'hint_provided',
            'encouragement',
          ],
        },
        trigger: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        effectiveness: {
          type: Number,
          min: 0,
          max: 100,
          default: null,
        },
      },
    ],

    // User state and mood tracking
    userState: {
      initialMood: {
        type: String,
        enum: [
          'motivated',
          'neutral',
          'tired',
          'stressed',
          'excited',
          'frustrated',
        ],
        default: 'neutral',
      },
      finalMood: {
        type: String,
        enum: [
          'satisfied',
          'neutral',
          'frustrated',
          'accomplished',
          'confused',
          'motivated',
        ],
        default: null,
      },
      energyLevel: {
        initial: {
          type: Number,
          min: 1,
          max: 10,
          default: 5,
        },
        final: {
          type: Number,
          min: 1,
          max: 10,
          default: null,
        },
      },
      difficultyPerception: {
        type: String,
        enum: ['too_easy', 'just_right', 'too_hard'],
        default: null,
      },
      pacePreference: {
        type: String,
        enum: ['slower', 'current_pace', 'faster'],
        default: null,
      },
    },

    // Detailed activity log
    activities: [activitySchema],

    // Technical information
    deviceInfo: deviceInfoSchema,

    // Session environment
    environment: {
      location: {
        type: String,
        enum: ['home', 'office', 'library', 'cafe', 'commuting', 'other'],
        default: 'other',
      },
      noiseLevel: {
        type: String,
        enum: ['quiet', 'moderate', 'noisy'],
        default: null,
      },
      distractions: [
        {
          type: String,
          frequency: String,
          impact: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
        },
      ],
    },

    // Notes and annotations created during session
    notes: [
      {
        content: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        materialId: mongoose.Schema.Types.ObjectId,
        materialPosition: Number, // position in material where note was created
        isPrivate: {
          type: Boolean,
          default: true,
        },
        tags: [String],
      },
    ],

    // Help requests and support interactions
    helpRequests: [
      {
        question: String,
        context: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        aiResponse: String,
        userSatisfaction: {
          type: Number,
          min: 1,
          max: 5,
          default: null,
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Session feedback
    feedback: {
      overallSatisfaction: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      contentQuality: {
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
      technicalIssues: [String],
      suggestions: String,
      wouldRecommend: {
        type: Boolean,
        default: null,
      },
    },

    // Achievement and milestone tracking
    achievements: [
      {
        type: {
          type: String,
          enum: [
            'first_session',
            'streak_milestone',
            'focus_achievement',
            'content_mastery',
            'help_others',
          ],
        },
        description: String,
        earnedAt: {
          type: Date,
          default: Date.now,
        },
        points: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Session metadata
    metadata: {
      version: {
        type: String,
        default: '1.0',
      },
      source: {
        type: String,
        enum: ['web', 'mobile', 'api'],
        default: 'web',
      },
      experimentGroups: [String], // for A/B testing
      flags: [String], // feature flags active during session
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance optimization
// Unique index for sessionId is declared at field level
learningSessionSchema.index({ userId: 1, startTime: -1 });
learningSessionSchema.index({ userId: 1, pathId: 1, startTime: -1 });
learningSessionSchema.index({ userId: 1, moduleId: 1, startTime: -1 });
learningSessionSchema.index({ status: 1, startTime: -1 });
learningSessionSchema.index({ startTime: -1 });

// Virtual for session efficiency (active time / total time)
learningSessionSchema.virtual('efficiency').get(function () {
  if (this.totalDuration === 0) return 0;
  return Math.round((this.activeDuration / this.totalDuration) * 100);
});

// Virtual for session quality score
learningSessionSchema.virtual('qualityScore').get(function () {
  const engagementWeight = 0.4;
  const focusWeight = 0.3;
  const progressWeight = 0.3;

  return Math.round(
    this.performance.engagementScore * engagementWeight +
      this.performance.focusScore * focusWeight +
      this.performance.progressMade * progressWeight,
  );
});

// Pre-save middleware to calculate durations and scores
learningSessionSchema.pre('save', function (next) {
  // Calculate total duration if session is ended
  if (this.endTime && this.startTime) {
    this.totalDuration = Math.round(
      (this.endTime - this.startTime) / (1000 * 60),
    ); // minutes
  }

  // Calculate active duration from activities
  if (this.activities && this.activities.length > 0) {
    this.activeDuration =
      this.activities
        .filter(
          (activity) =>
            !['session_pause', 'session_end'].includes(activity.action),
        )
        .reduce((total, activity) => total + (activity.duration || 0), 0) / 60; // convert to minutes
  }

  // Calculate engagement score based on interactions
  if (this.contentInteractions && this.contentInteractions.length > 0) {
    const totalInteractions = this.contentInteractions.length;
    const highEngagementCount = this.contentInteractions.filter(
      (interaction) => interaction.engagementLevel === 'high',
    ).length;

    this.performance.engagementScore = Math.round(
      (highEngagementCount / totalInteractions) * 100,
    );
  }

  // Calculate focus score based on pause frequency and help requests
  const pauseCount = this.activities.filter(
    (activity) => activity.action === 'session_pause',
  ).length;
  const helpRequestCount = this.helpRequests ? this.helpRequests.length : 0;

  // Higher pauses and help requests indicate lower focus
  const focusDeduction = pauseCount * 10 + helpRequestCount * 5;
  this.performance.focusScore = Math.max(0, 100 - focusDeduction);

  next();
});

// Instance method to add activity
learningSessionSchema.methods.addActivity = function (
  action,
  details = {},
  duration = 0,
) {
  this.activities.push({
    timestamp: new Date(),
    action,
    details,
    duration,
  });

  // Update session status based on action
  if (action === 'session_pause') {
    this.status = 'paused';
  } else if (action === 'session_resume') {
    this.status = 'active';
  } else if (action === 'session_end') {
    this.status = 'completed';
    this.endTime = new Date();
  }

  return this;
};

// Instance method to record content interaction
learningSessionSchema.methods.recordContentInteraction = function (
  interactionData,
) {
  const existingInteraction = this.contentInteractions.find(
    (interaction) =>
      interaction.materialId.toString() === interactionData.materialId,
  );

  if (existingInteraction) {
    // Update existing interaction
    existingInteraction.timeSpent += interactionData.timeSpent || 0;
    existingInteraction.completionPercentage = Math.max(
      existingInteraction.completionPercentage,
      interactionData.completionPercentage || 0,
    );
    if (interactionData.interactions) {
      existingInteraction.interactions.push(...interactionData.interactions);
    }
  } else {
    // Add new interaction
    this.contentInteractions.push(interactionData);
  }

  return this;
};

// Instance method to add help request
learningSessionSchema.methods.addHelpRequest = function (
  question,
  context = '',
) {
  this.helpRequests.push({
    question,
    context,
    timestamp: new Date(),
    resolved: false,
  });

  return this;
};

// Instance method to respond to help request
learningSessionSchema.methods.respondToHelpRequest = function (
  requestId,
  aiResponse,
) {
  const helpRequest = this.helpRequests.id(requestId);
  if (helpRequest) {
    helpRequest.aiResponse = aiResponse;
    helpRequest.resolved = true;
  }

  return this;
};

// Instance method to add note
learningSessionSchema.methods.addNote = function (
  content,
  materialId = null,
  position = null,
) {
  this.notes.push({
    content,
    materialId,
    materialPosition: position,
    timestamp: new Date(),
  });

  return this;
};

// Instance method to apply AI adaptation
learningSessionSchema.methods.applyAdaptation = function (
  adaptationType,
  trigger,
) {
  this.appliedAdaptations.push({
    adaptationType,
    trigger,
    timestamp: new Date(),
  });

  // Add activity for adaptation
  this.addActivity('ai_adaptation', { type: adaptationType, trigger });

  return this;
};

// Instance method to calculate struggling indicators
learningSessionSchema.methods.calculateStrugglingIndicators = function () {
  const indicators = {};

  // Check for repeated content viewing
  const contentViews = this.activities.filter(
    (activity) => activity.action === 'content_view',
  );
  const uniqueContent = new Set(
    contentViews.map((view) => view.details.materialId),
  );

  if (contentViews.length > uniqueContent.size * 2) {
    indicators.repeated_content = {
      severity: 'medium',
      frequency: contentViews.length - uniqueContent.size,
    };
  }

  // Check for long pauses
  const pauses = this.activities.filter(
    (activity) => activity.action === 'session_pause',
  );
  const longPauses = pauses.filter((pause) => pause.duration > 300); // 5 minutes

  if (longPauses.length > 2) {
    indicators.long_pauses = {
      severity: 'high',
      frequency: longPauses.length,
    };
  }

  // Check for help requests
  if (this.helpRequests && this.helpRequests.length > 3) {
    indicators.help_requests = {
      severity: 'high',
      frequency: this.helpRequests.length,
    };
  }

  // Update struggling indicators
  this.performance.strugglingIndicators = Object.entries(indicators).map(
    ([indicator, data]) => ({
      indicator,
      severity: data.severity,
      frequency: data.frequency,
    }),
  );

  return this;
};

// Static method to get session analytics for user
learningSessionSchema.statics.getUserSessionAnalytics = function (
  userId,
  timeRange = '30d',
) {
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

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        startTime: { $gte: dateThreshold },
      },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalTime: { $sum: '$totalDuration' },
        avgSessionLength: { $avg: '$totalDuration' },
        avgEngagement: { $avg: '$performance.engagementScore' },
        avgFocus: { $avg: '$performance.focusScore' },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
  ]);
};

// Static method to get trending content interactions
learningSessionSchema.statics.getTrendingContentInteractions = function (
  timeRange = '7d',
) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeRange));

  return this.aggregate([
    { $match: { startTime: { $gte: dateThreshold } } },
    { $unwind: '$contentInteractions' },
    {
      $group: {
        _id: '$contentInteractions.materialType',
        totalInteractions: { $sum: 1 },
        avgEngagement: {
          $avg: {
            $cond: [
              { $eq: ['$contentInteractions.engagementLevel', 'high'] },
              3,
              {
                $cond: [
                  { $eq: ['$contentInteractions.engagementLevel', 'medium'] },
                  2,
                  1,
                ],
              },
            ],
          },
        },
        avgTimeSpent: { $avg: '$contentInteractions.timeSpent' },
      },
    },
    { $sort: { totalInteractions: -1 } },
  ]);
};

const LearningSession = mongoose.model(
  'LearningSession',
  learningSessionSchema,
);

module.exports = LearningSession;
