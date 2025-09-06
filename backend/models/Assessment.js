// models/Assessment.js
const mongoose = require('mongoose');

// Question schema for assessment questions
const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      // unique within the assessment, not globally
    },

    type: {
      type: String,
      enum: [
        'multiple_choice',
        'multiple_select',
        'true_false',
        'short_answer',
        'essay',
        'code_review',
        'scenario_analysis',
        'practical_task',
        'ai_evaluation',
      ],
      required: true,
    },

    question: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    description: {
      type: String,
      maxlength: 500,
    },

    // For multiple choice/select questions
    options: [
      {
        id: String,
        text: String,
        isCorrect: Boolean,
        explanation: String,
      },
    ],

    // Correct answers for different question types
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, array, or object
      default: null,
    },

    // AI-enhanced evaluation criteria
    evaluationCriteria: {
      keyPoints: [String],
      scoringRubric: [
        {
          criterion: String,
          weight: Number,
          maxPoints: Number,
          description: String,
        },
      ],
      aiPrompt: String, // Specific prompt for AI evaluation
      requiresHumanReview: {
        type: Boolean,
        default: false,
      },
    },

    // Difficulty and metadata
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },

    points: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 10,
    },

    estimatedTimeMinutes: {
      type: Number,
      default: 2,
    },

    tags: [String],

    skills: [
      {
        name: String,
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        weight: Number,
      },
    ],

    // Question analytics
    analytics: {
      timesUsed: {
        type: Number,
        default: 0,
      },
      correctPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      averageTimeSpent: {
        type: Number,
        default: 0,
      },
      difficultyRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
      },
    },

    // Adaptive question selection
    adaptiveRules: {
      showAfterQuestions: [String], // Question IDs that must be answered first
      skipIfScore: {
        type: Number,
        default: null, // Skip if user score is above this threshold
      },
      prerequisiteSkills: [String],
      followUpQuestions: [String], // Questions to show based on this answer
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

// Main Assessment schema
const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Assessment description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Assessment configuration
    type: {
      type: String,
      enum: [
        'skill_check',
        'module_completion',
        'path_final',
        'certification',
        'placement',
        'progress_check',
        'ai_adaptive',
      ],
      required: true,
    },

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
      required: true,
    },

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert', 'mixed'],
      required: true,
    },

    // Related learning content
    relatedPaths: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningPath',
      },
    ],

    relatedModules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningModule',
      },
    ],

    // Prerequisites
    prerequisites: {
      completedPaths: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LearningPath',
        },
      ],
      completedModules: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LearningModule',
        },
      ],
      minimumLevel: {
        type: Number,
        min: 1,
        max: 100,
        default: 1,
      },
      requiredSkills: [String],
    },

    // Assessment structure
    questions: [questionSchema],

    // Scoring configuration
    scoring: {
      totalPoints: {
        type: Number,
        required: true,
      },
      passingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      perfectScore: {
        type: Number,
        default: 100,
      },
      weightingMethod: {
        type: String,
        enum: ['equal', 'difficulty_weighted', 'skill_weighted', 'custom'],
        default: 'equal',
      },
      partialCredit: {
        type: Boolean,
        default: true,
      },
    },

    // Time constraints
    timeConstraints: {
      hasTimeLimit: {
        type: Boolean,
        default: false,
      },
      totalTimeMinutes: {
        type: Number,
        default: null,
      },
      questionTimeMinutes: {
        type: Number,
        default: null,
      },
      warningTimeMinutes: {
        type: Number,
        default: 5,
      },
    },

    // Attempt settings
    attemptSettings: {
      maxAttempts: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },
      cooldownHours: {
        type: Number,
        default: 24,
        min: 0,
      },
      showResults: {
        type: String,
        enum: ['immediately', 'after_completion', 'after_review', 'never'],
        default: 'immediately',
      },
      allowReview: {
        type: Boolean,
        default: true,
      },
    },

    // AI-enhanced features
    aiFeatures: {
      adaptiveQuestioning: {
        type: Boolean,
        default: false,
      },
      intelligentScoring: {
        type: Boolean,
        default: true,
      },
      personalizedFeedback: {
        type: Boolean,
        default: true,
      },
      contextualHints: {
        type: Boolean,
        default: false,
      },
    },

    // Assessment analytics
    analytics: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      passRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      averageTimeSpent: {
        type: Number,
        default: 0,
      },
      questionAnalytics: [
        {
          questionId: String,
          correctPercentage: Number,
          averageTime: Number,
          skipPercentage: Number,
        },
      ],
    },

    // Access and visibility
    isPublished: {
      type: Boolean,
      default: false,
    },
    
    isAIGenerated: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    visibility: {
      type: String,
      enum: ['public', 'enrolled_only', 'invitation_only', 'private'],
      default: 'enrolled_only',
    },

    // Certification integration
    certification: {
      issuesCertificate: {
        type: Boolean,
        default: false,
      },
      certificateTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate',
        default: null,
      },
      requiredScore: {
        type: Number,
        default: 80,
        min: 0,
        max: 100,
      },
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tags: [String],

    version: {
      type: String,
      default: '1.0.0',
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
assessmentSchema.index({ category: 1, difficulty: 1, isActive: 1 });
assessmentSchema.index({ type: 1, isPublished: 1 });
assessmentSchema.index({ relatedPaths: 1 });
assessmentSchema.index({ relatedModules: 1 });
assessmentSchema.index({ tags: 1 });
assessmentSchema.index({ createdAt: -1 });

// Virtual for question count
assessmentSchema.virtual('questionCount').get(function () {
  return this.questions.length;
});

// Virtual for estimated duration
assessmentSchema.virtual('estimatedDuration').get(function () {
  const questionTime = this.questions.reduce(
    (sum, q) => sum + (q.estimatedTimeMinutes || 2),
    0,
  );
  return this.timeConstraints.totalTimeMinutes || questionTime;
});

// Instance methods

// Get questions adapted for specific user
assessmentSchema.methods.getAdaptiveQuestions = function (
  userLevel = 'intermediate',
  userSkills = [],
) {
  let questions = this.questions.filter((q) => q.isActive);

  if (!this.aiFeatures.adaptiveQuestioning) {
    return questions; // Return all questions if not adaptive
  }

  // Filter by user level and skills
  questions = questions.filter((q) => {
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const userLevelIndex = levelOrder.indexOf(userLevel);
    const questionLevelIndex = levelOrder.indexOf(q.difficulty);

    // Include questions at or slightly above user level
    return questionLevelIndex <= userLevelIndex + 1;
  });

  // Sort by adaptive rules and difficulty
  questions.sort((a, b) => {
    // Prioritize questions with no prerequisites first
    if (
      a.adaptiveRules.showAfterQuestions.length === 0 &&
      b.adaptiveRules.showAfterQuestions.length > 0
    ) {
      return -1;
    }

    // Then by difficulty
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    return levelOrder.indexOf(a.difficulty) - levelOrder.indexOf(b.difficulty);
  });

  return questions;
};

// Calculate user's readiness for this assessment
assessmentSchema.methods.checkUserEligibility = async function (userId) {
  const UserProgress = require('./UserProgress');

  const userProgress = await UserProgress.find({ userId }).populate(
    'pathId moduleId',
  );

  // Check completed paths
  const completedPaths = userProgress
    .filter((p) => p.progress.completed && p.pathId)
    .map((p) => p.pathId._id.toString());

  const requiredPaths = (this.prerequisites?.completedPaths || []).map((id) =>
    id.toString(),
  );
  const hasRequiredPaths = requiredPaths.every((reqPath) =>
    completedPaths.includes(reqPath),
  );

  // Check completed modules
  const completedModules = userProgress
    .filter((p) => p.progress.completed && p.moduleId)
    .map((p) => p.moduleId._id.toString());

  const requiredModules = (this.prerequisites?.completedModules || []).map(
    (id) => id.toString(),
  );
  const hasRequiredModules = requiredModules.every((reqMod) =>
    completedModules.includes(reqMod),
  );

  // Check minimum level
  const averageProgress =
    userProgress.reduce((sum, p) => sum + p.progress.percentage, 0) /
      (userProgress.length || 1);
  const minimumLevel = this.prerequisites?.minimumLevel ?? 0;
  const hasMinimumLevel = averageProgress >= minimumLevel;

  return {
    eligible: hasRequiredPaths && hasRequiredModules && hasMinimumLevel,
    reasons: {
      missingPaths: !hasRequiredPaths,
      missingModules: !hasRequiredModules,
      belowMinimumLevel: !hasMinimumLevel,
    },
  };
};

// Update question analytics
assessmentSchema.methods.updateQuestionAnalytics = function (
  questionId,
  isCorrect,
  timeSpent,
) {
  const question = this.questions.id(questionId);
  if (!question) return;

  question.analytics.timesUsed += 1;

  // Update correct percentage
  const totalCorrect =
    (question.analytics.correctPercentage / 100) *
    (question.analytics.timesUsed - 1);
  const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
  question.analytics.correctPercentage =
    (newCorrect / question.analytics.timesUsed) * 100;

  // Update average time
  const totalTime =
    question.analytics.averageTimeSpent * (question.analytics.timesUsed - 1);
  question.analytics.averageTimeSpent =
    (totalTime + timeSpent) / question.analytics.timesUsed;

  return this.save();
};

// Static methods

// Find assessments by user eligibility
assessmentSchema.statics.findEligibleAssessments = async function (
  userId,
  options = {},
  limit = 20,
  offset = 0,
) {
  // Fetch a window of assessments first to avoid scanning entire collection
  const baseQuery = this.find({
    isActive: true,
    isPublished: true,
    ...options,
  })
    .sort({ createdAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit) * 3) // overfetch to account for ineligible ones
    .populate('relatedPaths relatedModules')
    .lean();

  const candidates = await baseQuery;

  const results = await Promise.all(
    candidates.map(async (doc) => {
      const model = new this(doc);
      const eligibility = await model.checkUserEligibility(userId);
      return eligibility.eligible ? { ...doc, eligibility } : null;
    }),
  );

  return results.filter(Boolean).slice(0, parseInt(limit));
};

// Get assessment analytics
assessmentSchema.statics.getAssessmentAnalytics = function (
  assessmentId,
  timeRange = '30d',
) {
  const AssessmentSession = require('./AssessmentSession');

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

  return AssessmentSession.aggregate([
    {
      $match: {
        assessmentId: new mongoose.Types.ObjectId(assessmentId),
        startTime: { $gte: dateThreshold },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$results.finalScore' },
        averageTime: { $avg: '$results.totalTimeSpent' },
        passCount: {
          $sum: {
            $cond: [
              { $gte: ['$results.finalScore', '$results.passingScore'] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $addFields: {
        passRate: {
          $multiply: [{ $divide: ['$passCount', '$totalAttempts'] }, 100],
        },
      },
    },
  ]);
};

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
