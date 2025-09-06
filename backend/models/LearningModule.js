const mongoose = require('mongoose');

// Content material schema
const materialSchema = new mongoose.Schema(
  {
    type: {
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    mimeType: {
      type: String,
      default: null,
    },
    // Adaptive variations for different learning styles
    adaptiveVariations: [
      {
        learningStyle: {
          type: String,
          enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
          required: true,
        },
        content: {
          url: String,
          description: String,
          additionalResources: [String],
          interactionType: {
            type: String,
            enum: ['watch', 'read', 'listen', 'practice', 'explore'],
          },
        },
      },
    ],
    accessibility: {
      hasSubtitles: {
        type: Boolean,
        default: false,
      },
      hasTranscript: {
        type: Boolean,
        default: false,
      },
      hasAudioDescription: {
        type: Boolean,
        default: false,
      },
    },
  },
  { _id: true },
);

// AI adaptation rule schema
const aiAdaptationSchema = new mongoose.Schema(
  {
    triggerCondition: {
      type: String,
      enum: [
        'struggling',
        'excelling',
        'time_pressure',
        'learning_style_mismatch',
        'low_engagement',
      ],
      required: true,
    },
    adaptationType: {
      type: String,
      enum: [
        'difficulty_adjust',
        'content_variation',
        'additional_examples',
        'simplified_explanation',
        'advanced_content',
      ],
      required: true,
    },
    content: {
      description: String,
      materials: [materialSchema],
      instructions: String,
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

// Assessment question schema
const assessmentQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'multiple_choice',
        'true_false',
        'short_answer',
        'essay',
        'practical',
      ],
      required: true,
    },
    options: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
    },
    explanation: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: true },
);

// Learning module schema
const learningModuleSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Module description is required'],
      trim: true,
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },

    // Path relationship
    pathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath',
      required: [true, 'Path ID is required'],
    },

    // Module content
    content: {
      type: {
        type: String,
        enum: [
          'video',
          'interactive',
          'practice',
          'assessment',
          'reading',
          'mixed',
        ],
        required: true,
      },
      duration: {
        type: Number, // in minutes
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute'],
      },
      materials: [materialSchema],
    },

    // Module metadata
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: [true, 'Difficulty is required'],
    },

    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: 0,
    },

    // Prerequisites within the same path
    prerequisites: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LearningModule',
        },
        title: String,
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Learning objectives
    learningObjectives: [
      {
        objective: {
          type: String,
          required: true,
          trim: true,
        },
        measurable: {
          type: Boolean,
          default: true,
        },
        assessable: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Assessment criteria
    assessmentCriteria: [
      {
        criterion: {
          type: String,
          required: true,
          trim: true,
        },
        weight: {
          type: Number,
          min: 0,
          max: 100,
          default: 1,
        },
        passingThreshold: {
          type: Number,
          min: 0,
          max: 100,
          default: 70,
        },
      },
    ],

    // AI adaptations and personalizations
    aiAdaptations: [aiAdaptationSchema],

    // Module assessment
    hasAssessment: {
      type: Boolean,
      default: false,
    },

    assessment: {
      questions: [assessmentQuestionSchema],
      passingScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70,
      },
      maxAttempts: {
        type: Number,
        min: 1,
        max: 10,
        default: 3,
      },
      timeLimit: {
        type: Number, // in minutes
        default: null,
      },
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
      showCorrectAnswers: {
        type: Boolean,
        default: true,
      },
    },

    // Module settings
    isOptional: {
      type: Boolean,
      default: false,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    unlockConditions: [
      {
        type: {
          type: String,
          enum: [
            'module_completion',
            'assessment_score',
            'time_spent',
            'manual',
          ],
          default: 'module_completion',
        },
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LearningModule',
        },
        threshold: Number, // score percentage or minutes
        description: String,
      },
    ],

    // Analytics and optimization
    analytics: {
      averageCompletionTime: {
        type: Number,
        default: 0, // in minutes
      },
      averageEngagementScore: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      difficultyFeedback: {
        tooEasy: {
          type: Number,
          default: 0,
        },
        justRight: {
          type: Number,
          default: 0,
        },
        tooHard: {
          type: Number,
          default: 0,
        },
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      ratingCount: {
        type: Number,
        default: 0,
      },
    },

    // Module status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'under_review'],
      default: 'published',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Version control
    version: {
      type: String,
      default: '1.0.0',
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Personalization metadata
    personalizedContent: {
      hasVisualVariant: {
        type: Boolean,
        default: false,
      },
      hasAuditoryVariant: {
        type: Boolean,
        default: false,
      },
      hasKinestheticVariant: {
        type: Boolean,
        default: false,
      },
      hasReadingVariant: {
        type: Boolean,
        default: false,
      },
      supportsDifficultyAdjustment: {
        type: Boolean,
        default: true,
      },
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

// Indexes for performance
learningModuleSchema.index({ pathId: 1, order: 1 });
learningModuleSchema.index({ pathId: 1, status: 1, isActive: 1 });
learningModuleSchema.index({ title: 'text', description: 'text' });
learningModuleSchema.index({ difficulty: 1, 'content.type': 1 });
learningModuleSchema.index({ createdAt: -1 });

// Virtual for estimated reading time (for text content)
learningModuleSchema.virtual('estimatedReadingTime').get(function () {
  if (this.content.type !== 'reading') return null;

  const wordsPerMinute = 200; // Average reading speed
  const textMaterials = this.content.materials.filter((m) => m.type === 'text');

  if (textMaterials.length === 0) return this.content.duration;

  // This would require content analysis in a real implementation
  return Math.ceil(this.content.duration * 0.8); // Approximation
});

// Virtual for total materials count
learningModuleSchema.virtual('materialsCount').get(function () {
  return this.content.materials ? this.content.materials.length : 0;
});

// Pre-save middleware to update lastUpdated
learningModuleSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

// Instance method to get content for specific learning style
learningModuleSchema.methods.getAdaptedContent = function (
  learningStyle,
  userPerformance = {},
) {
  const adaptedMaterials = this.content.materials.map((material) => {
    // Find learning style variation
    const variation = material.adaptiveVariations.find(
      (v) => v.learningStyle === learningStyle,
    );

    if (variation) {
      return {
        ...material.toObject(),
        adaptedContent: variation.content,
        interactionType: variation.content.interactionType,
      };
    }

    return material;
  });

  // Apply AI adaptations based on user performance
  const activeAdaptations = this.aiAdaptations.filter((adaptation) => {
    if (!adaptation.isActive) return false;

    // Check if trigger condition matches user performance
    switch (adaptation.triggerCondition) {
    case 'struggling':
      return userPerformance.averageScore < 60;
    case 'excelling':
      return userPerformance.averageScore > 90;
    case 'time_pressure':
      return userPerformance.timeSpentRatio < 0.7;
    case 'low_engagement':
      return userPerformance.engagementScore < 50;
    default:
      return false;
    }
  });

  return {
    ...this.content.toObject(),
    materials: adaptedMaterials,
    appliedAdaptations: activeAdaptations,
    personalizedFor: learningStyle,
  };
};

// Instance method to check if user can access this module
learningModuleSchema.methods.checkAccess = function (
  userCompletedModules = [],
) {
  if (!this.isLocked) return { canAccess: true, reason: null };

  // Check unlock conditions
  for (const condition of this.unlockConditions) {
    switch (condition.type) {
    case 'module_completion':
      if (!userCompletedModules.includes(condition.moduleId.toString())) {
        return {
          canAccess: false,
          reason: `Must complete prerequisite module: ${condition.description}`,
        };
      }
      break;
    case 'manual':
      return {
        canAccess: false,
        reason: 'Manual unlock required',
      };
    default:
      break;
    }
  }

  return { canAccess: true, reason: null };
};

// Instance method to calculate personalized difficulty
learningModuleSchema.methods.getPersonalizedDifficulty = function (
  userSkillLevel,
) {
  const baseDifficulty = this.difficulty;
  const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  const baseIndex = difficultyLevels.indexOf(baseDifficulty);
  const userIndex = difficultyLevels.indexOf(userSkillLevel);

  // Adjust difficulty based on user's skill level
  let adjustedIndex = baseIndex;

  if (userIndex < baseIndex - 1) {
    // User is significantly below module difficulty
    adjustedIndex = Math.max(0, baseIndex - 1);
  } else if (userIndex > baseIndex + 1) {
    // User is significantly above module difficulty
    adjustedIndex = Math.min(difficultyLevels.length - 1, baseIndex + 1);
  }

  return {
    originalDifficulty: baseDifficulty,
    personalizedDifficulty: difficultyLevels[adjustedIndex],
    adjustmentReason:
      adjustedIndex !== baseIndex
        ? `Adjusted for ${userSkillLevel} skill level`
        : 'No adjustment needed',
  };
};

// Static method to get modules by path
learningModuleSchema.statics.getByPath = function (
  pathId,
  includeInactive = false,
) {
  const query = { pathId };
  if (!includeInactive) {
    query.status = 'published';
    query.isActive = true;
  }

  return this.find(query).sort({ order: 1 });
};

// Static method to get next module in sequence
learningModuleSchema.statics.getNextModule = function (pathId, currentOrder) {
  return this.findOne({
    pathId,
    order: { $gt: currentOrder },
    status: 'published',
    isActive: true,
  }).sort({ order: 1 });
};

// Static method to get previous module in sequence
learningModuleSchema.statics.getPreviousModule = function (
  pathId,
  currentOrder,
) {
  return this.findOne({
    pathId,
    order: { $lt: currentOrder },
    status: 'published',
    isActive: true,
  }).sort({ order: -1 });
};

// Instance method to generate learning recommendations
learningModuleSchema.methods.getRecommendations = function (userProgress) {
  const recommendations = [];

  // Recommend review if user struggled
  if (userProgress.averageScore < 70) {
    recommendations.push({
      type: 'review',
      priority: 'high',
      message:
        'Consider reviewing this module to strengthen your understanding',
    });
  }

  // Recommend practice if assessment score was low
  if (userProgress.assessmentScore < 80) {
    recommendations.push({
      type: 'practice',
      priority: 'medium',
      message: 'Additional practice exercises could help improve your skills',
    });
  }

  // Recommend advanced content if user excelled
  if (userProgress.averageScore > 95) {
    recommendations.push({
      type: 'advanced',
      priority: 'low',
      message:
        'You might enjoy exploring advanced topics related to this module',
    });
  }

  return recommendations;
};

const LearningModule = mongoose.model('LearningModule', learningModuleSchema);

module.exports = LearningModule;
