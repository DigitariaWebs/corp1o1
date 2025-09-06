const mongoose = require('mongoose');

// Question schema for individual assessment questions
const questionSchema = new mongoose.Schema(
  {
    // Question identification
    questionId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Question content
    question: {
      type: String,
      required: [true, 'Question text is required'],
      maxlength: [2000, 'Question cannot exceed 2000 characters'],
    },

    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Question type and format
    type: {
      type: String,
      enum: [
        'multiple_choice',
        'multiple_select', 
        'true_false',
        'short_answer',
        'essay',
        'code_review',
        'coding_challenge',
        'scenario_analysis',
        'practical_task',
        'ai_evaluation',
        'file_upload',
        'matching',
        'ordering',
        'fill_blank',
      ],
      required: true,
    },

    format: {
      type: String,
      enum: ['text', 'html', 'markdown', 'code', 'image', 'video', 'interactive'],
      default: 'text',
    },

    // References
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: false, // Questions can exist independently
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillCategory',
      required: true,
    },

    // Question content and media
    content: {
      // Main question text/content
      text: String,
      html: String,
      markdown: String,
      
      // Media attachments
      images: [
        {
          url: String,
          alt: String,
          caption: String,
        },
      ],
      
      videos: [
        {
          url: String,
          thumbnail: String,
          duration: Number, // seconds
          captions: String,
        },
      ],
      
      attachments: [
        {
          name: String,
          url: String,
          type: String, // file type
          size: Number, // bytes
        },
      ],

      // Code-specific content
      codeSnippet: {
        language: String,
        code: String,
        fileName: String,
        lineNumbers: Boolean,
      },

      // Interactive elements
      interactive: {
        type: String,
        config: mongoose.Schema.Types.Mixed,
      },
    },

    // Answer options (for multiple choice, matching, etc.)
    options: [
      {
        id: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        explanation: String,
        feedback: String,
        weight: {
          type: Number,
          default: 1,
        },
        // For matching questions
        matchTarget: String,
        // For ordering questions
        correctOrder: Number,
      },
    ],

    // Correct answers for different question types
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed, // Flexible for different answer types
      default: null,
    },

    // Alternative acceptable answers
    acceptableAnswers: [mongoose.Schema.Types.Mixed],

    // AI evaluation configuration
    aiConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },

      provider: {
        type: String,
        enum: ['openai', 'anthropic', 'gemini', 'custom'],
        default: 'openai',
      },

      model: {
        type: String,
        default: 'gpt-4',
      },

      // Evaluation criteria for AI
      evaluationCriteria: {
        keyPoints: [
          {
            point: String,
            weight: {
              type: Number,
              default: 1,
            },
            required: {
              type: Boolean,
              default: false,
            },
          },
        ],
        
        scoringRubric: [
          {
            criterion: {
              type: String,
              required: true,
            },
            weight: {
              type: Number,
              min: 0,
              max: 1,
              default: 1,
            },
            maxPoints: {
              type: Number,
              required: true,
            },
            description: String,
            levels: [
              {
                score: Number,
                description: String,
                indicators: [String],
              },
            ],
          },
        ],

        // AI prompts
        systemPrompt: String,
        evaluationPrompt: String,
        feedbackPrompt: String,
        
        // Quality control
        requiresHumanReview: {
          type: Boolean,
          default: false,
        },
        
        confidenceThreshold: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.8,
        },
      },

      // Expected answer patterns for AI guidance
      expectedPatterns: [
        {
          pattern: String,
          description: String,
          weight: Number,
        },
      ],

      // Sample answers for AI training
      sampleAnswers: [
        {
          answer: String,
          score: Number,
          explanation: String,
          quality: {
            type: String,
            enum: ['excellent', 'good', 'average', 'poor'],
          },
        },
      ],
    },

    // Question metadata
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },

    complexity: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium',
    },

    cognitiveLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      default: 'understand',
    },

    // Scoring configuration
    scoring: {
      points: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
        default: 10,
      },
      
      weight: {
        type: Number,
        default: 1,
        min: 0,
      },

      partialCredit: {
        enabled: {
          type: Boolean,
          default: true,
        },
        minimumScore: {
          type: Number,
          default: 0,
          min: 0,
        },
      },

      negativeMarking: {
        enabled: {
          type: Boolean,
          default: false,
        },
        penalty: {
          type: Number,
          default: 0.25,
          min: 0,
          max: 1,
        },
      },
    },

    // Time configuration
    timing: {
      estimatedTimeMinutes: {
        type: Number,
        default: 2,
        min: 0.5,
        max: 60,
      },
      
      maxTimeMinutes: {
        type: Number,
        default: null, // null = no limit
      },
      
      showTimer: {
        type: Boolean,
        default: false,
      },
    },

    // Skills and learning objectives
    skills: [
      {
        name: {
          type: String,
          required: true,
        },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          required: true,
        },
        weight: {
          type: Number,
          default: 1,
          min: 0,
        },
      },
    ],

    learningObjectives: [
      {
        objective: String,
        bloomsLevel: {
          type: String,
          enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
        },
      },
    ],

    // Question relationships and dependencies
    relationships: {
      prerequisites: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
      ],
      
      followUpQuestions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
      ],
      
      relatedQuestions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
      ],

      // Adaptive rules
      adaptiveRules: {
        showAfterQuestions: [String], // Question IDs
        skipIfScore: {
          type: Number,
          default: null,
        },
        skipIfAnswers: [String], // Skip if user answers match these
        prerequisiteSkills: [String],
      },
    },

    // Question analytics and performance data
    analytics: {
      // Usage statistics
      timesUsed: {
        type: Number,
        default: 0,
      },
      
      timesAnswered: {
        type: Number,
        default: 0,
      },

      // Performance metrics
      correctPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      
      averageTimeSpent: {
        type: Number,
        default: 0, // seconds
      },
      
      // Difficulty assessment
      perceivedDifficulty: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
      },
      
      discriminationIndex: {
        type: Number,
        default: 0,
        min: -1,
        max: 1,
      },
      
      // User feedback
      userRatings: {
        averageRating: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
        totalRatings: {
          type: Number,
          default: 0,
        },
      },

      // Quality metrics
      flaggedForReview: {
        type: Number,
        default: 0,
      },
      
      reportedIssues: {
        type: Number,
        default: 0,
      },

      // Performance by skill level
      performanceByLevel: {
        beginner: { correct: Number, total: Number },
        intermediate: { correct: Number, total: Number },
        advanced: { correct: Number, total: Number },
        expert: { correct: Number, total: Number },
      },
    },

    // Feedback and explanations
    feedback: {
      correctFeedback: {
        type: String,
        maxlength: [500, 'Feedback cannot exceed 500 characters'],
      },
      
      incorrectFeedback: {
        type: String,
        maxlength: [500, 'Feedback cannot exceed 500 characters'],
      },
      
      hints: [
        {
          hint: String,
          order: Number,
          cost: Number, // points deducted for using hint
        },
      ],
      
      explanation: {
        type: String,
        maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
      },
      
      references: [
        {
          title: String,
          url: String,
          type: {
            type: String,
            enum: ['article', 'book', 'video', 'course', 'documentation'],
          },
        },
      ],
    },

    // Accessibility and inclusivity
    accessibility: {
      altText: String,
      audioDescription: String,
      screenReaderInstructions: String,
      keyboardNavigation: {
        type: Boolean,
        default: true,
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
      languageLevel: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced'],
        default: 'intermediate',
      },
    },

    // Localization
    localization: {
      language: {
        type: String,
        default: 'en',
      },
      
      translations: [
        {
          language: String,
          question: String,
          options: [String],
          feedback: String,
          explanation: String,
        },
      ],
      
      culturalContext: String,
      regionalVariations: [String],
    },

    // Version control and history
    version: {
      type: String,
      default: '1.0.0',
    },
    
    previousVersions: [
      {
        version: String,
        changes: String,
        modifiedAt: Date,
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // Status and lifecycle
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'published', 'archived', 'deprecated'],
      default: 'draft',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    // Quality assurance
    qualityReview: {
      reviewStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'approved', 'rejected', 'needs_revision'],
        default: 'pending',
      },
      
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      
      reviewedAt: Date,
      
      reviewComments: String,
      
      qualityScore: {
        type: Number,
        min: 0,
        max: 100,
      },
    },

    // Metadata and tags
    tags: [String],
    
    categories: [String],
    
    keywords: [String],
    
    // Creation and modification tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    approvedAt: Date,

    // SEO and discoverability
    seoMetadata: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      canonicalUrl: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance optimization
questionSchema.index({ questionId: 1 }, { unique: true });
questionSchema.index({ assessmentId: 1, isActive: 1 });
questionSchema.index({ categoryId: 1, difficulty: 1 });
questionSchema.index({ type: 1, status: 1 });
questionSchema.index({ difficulty: 1, cognitiveLevel: 1 });
questionSchema.index({ 'skills.name': 1, 'skills.level': 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1, isPublic: 1, status: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ 'analytics.correctPercentage': -1 });
questionSchema.index({ 'analytics.averageScore': -1 });

// Compound indexes for common queries
questionSchema.index({ categoryId: 1, difficulty: 1, type: 1 });
questionSchema.index({ assessmentId: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ 'skills.name': 1, difficulty: 1, status: 1 });

// Text index for search functionality
questionSchema.index({
  title: 'text',
  question: 'text',
  description: 'text',
  tags: 'text',
  keywords: 'text',
});

// Pre-save middleware to generate questionId
questionSchema.pre('save', function (next) {
  if (!this.questionId) {
    // Generate unique question ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.questionId = `q_${timestamp}_${random}`;
  }
  next();
});

// Pre-save middleware to validate question type and options
questionSchema.pre('save', function (next) {
  const choiceTypes = ['multiple_choice', 'multiple_select', 'true_false', 'matching'];
  
  if (choiceTypes.includes(this.type)) {
    if (!this.options || this.options.length === 0) {
      next(new Error(`Questions of type '${this.type}' must have options`));
      return;
    }
    
    if (this.type === 'multiple_choice' || this.type === 'true_false') {
      const correctOptions = this.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        next(new Error(`Questions of type '${this.type}' must have exactly one correct option`));
        return;
      }
    }
  }
  
  next();
});

// Virtual for estimated difficulty based on analytics
questionSchema.virtual('estimatedDifficulty').get(function () {
  if (this.analytics.timesAnswered < 10) {
    return this.difficulty; // Not enough data, use assigned difficulty
  }
  
  const correctRate = this.analytics.correctPercentage;
  if (correctRate >= 80) return 'beginner';
  if (correctRate >= 60) return 'intermediate';
  if (correctRate >= 40) return 'advanced';
  return 'expert';
});

// Virtual for quality score
questionSchema.virtual('qualityScore').get(function () {
  let score = 50; // Base score
  
  // Factor in usage statistics
  if (this.analytics.timesUsed > 0) {
    score += Math.min(this.analytics.timesUsed / 10, 20); // Max 20 points for usage
  }
  
  // Factor in correctness percentage (should be between 30-80% for good questions)
  const correctRate = this.analytics.correctPercentage;
  if (correctRate >= 30 && correctRate <= 80) {
    score += 20;
  } else if (correctRate > 80) {
    score += 10; // Too easy
  } else if (correctRate < 30) {
    score += 5; // Too hard
  }
  
  // Factor in user ratings
  if (this.analytics.userRatings.totalRatings > 0) {
    score += (this.analytics.userRatings.averageRating / 5) * 10;
  }
  
  return Math.min(score, 100);
});

// Instance methods

// Check if question is suitable for user level
questionSchema.methods.isSuitableForUser = function (userLevel, userSkills = []) {
  // Check difficulty match
  const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
  const userLevelIndex = levelOrder.indexOf(userLevel);
  const questionLevelIndex = levelOrder.indexOf(this.difficulty);
  
  // Allow questions at user level or one level above/below
  if (Math.abs(userLevelIndex - questionLevelIndex) > 1) {
    return false;
  }
  
  // Check skill requirements
  if (this.skills.length > 0) {
    return this.skills.some(reqSkill => {
      return userSkills.some(userSkill => {
        return userSkill.name === reqSkill.name && 
               levelOrder.indexOf(userSkill.level) >= levelOrder.indexOf(reqSkill.level);
      });
    });
  }
  
  return true;
};

// Evaluate user answer
questionSchema.methods.evaluateAnswer = function (userAnswer, options = {}) {
  let result = {
    isCorrect: false,
    score: 0,
    maxScore: this.scoring.points,
    feedback: '',
    explanation: this.feedback.explanation || '',
  };
  
  switch (this.type) {
  case 'multiple_choice':
  case 'true_false': {
    const correctOption = this.options.find(opt => opt.isCorrect);
    result.isCorrect = userAnswer === correctOption.id;
    result.score = result.isCorrect ? this.scoring.points : 0;
    result.feedback = result.isCorrect ? 
      this.feedback.correctFeedback : 
      this.feedback.incorrectFeedback;
    break;
  }
      
  case 'multiple_select': {
    const correctOptions = this.options.filter(opt => opt.isCorrect).map(opt => opt.id);
    const userSelections = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      
    const correctSelections = userSelections.filter(sel => correctOptions.includes(sel));
    const incorrectSelections = userSelections.filter(sel => !correctOptions.includes(sel));
      
    if (this.scoring.partialCredit.enabled) {
      const partialScore = (correctSelections.length - incorrectSelections.length) / correctOptions.length;
      result.score = Math.max(0, partialScore * this.scoring.points);
      result.isCorrect = partialScore >= 0.7; // 70% threshold for "correct"
    } else {
      result.isCorrect = correctSelections.length === correctOptions.length && incorrectSelections.length === 0;
      result.score = result.isCorrect ? this.scoring.points : 0;
    }
    break;
  }
      
  case 'short_answer':
    if (this.acceptableAnswers && this.acceptableAnswers.length > 0) {
      result.isCorrect = this.acceptableAnswers.some(answer => 
        answer.toLowerCase().trim() === userAnswer.toLowerCase().trim(),
      );
      result.score = result.isCorrect ? this.scoring.points : 0;
    } else {
      // Requires manual or AI evaluation
      result.score = 0;
      result.requiresManualReview = true;
    }
    break;
      
  default:
    // For complex question types, mark for AI/manual evaluation
    result.requiresManualReview = true;
    result.requiresAIEvaluation = this.aiConfig.enabled;
  }
  
  // Apply negative marking if enabled and answer is wrong
  if (!result.isCorrect && this.scoring.negativeMarking.enabled) {
    result.score -= this.scoring.points * this.scoring.negativeMarking.penalty;
    result.score = Math.max(0, result.score); // Don't go below 0
  }
  
  return result;
};

// Update analytics after user response
questionSchema.methods.updateAnalytics = function (userAnswer, timeTaken, isCorrect, userLevel) {
  this.analytics.timesUsed += 1;
  this.analytics.timesAnswered += 1;
  
  // Update correct percentage
  const totalCorrect = (this.analytics.correctPercentage / 100) * (this.analytics.timesAnswered - 1);
  const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
  this.analytics.correctPercentage = (newCorrect / this.analytics.timesAnswered) * 100;
  
  // Update average time
  const totalTime = this.analytics.averageTimeSpent * (this.analytics.timesAnswered - 1);
  this.analytics.averageTimeSpent = (totalTime + timeTaken) / this.analytics.timesAnswered;
  
  // Update performance by level
  if (userLevel && this.analytics.performanceByLevel[userLevel]) {
    this.analytics.performanceByLevel[userLevel].total += 1;
    if (isCorrect) {
      this.analytics.performanceByLevel[userLevel].correct += 1;
    }
  }
  
  return this.save();
};

// Get AI evaluation prompt
questionSchema.methods.getAIEvaluationPrompt = function (userAnswer) {
  if (!this.aiConfig.enabled) {
    return null;
  }
  
  const basePrompt = this.aiConfig.evaluationCriteria.evaluationPrompt || 
    'Evaluate the following answer to this question and provide a score and feedback.';
  
  const questionContext = `
Question: ${this.question}
User Answer: ${userAnswer}
Maximum Points: ${this.scoring.points}
Evaluation Criteria: ${JSON.stringify(this.aiConfig.evaluationCriteria.keyPoints)}
`;
  
  return {
    systemPrompt: this.aiConfig.evaluationCriteria.systemPrompt || 'You are an expert evaluator.',
    evaluationPrompt: basePrompt + '\n\n' + questionContext,
    maxPoints: this.scoring.points,
    criteria: this.aiConfig.evaluationCriteria,
  };
};

// Static methods

// Find questions by criteria
questionSchema.statics.findByCriteria = function (criteria = {}) {
  const query = { isActive: true, status: 'published' };
  
  if (criteria.category) query.categoryId = criteria.category;
  if (criteria.difficulty) query.difficulty = criteria.difficulty;
  if (criteria.type) query.type = criteria.type;
  if (criteria.skills) {
    query['skills.name'] = { $in: criteria.skills };
  }
  
  return this.find(query)
    .populate('categoryId', 'name displayName icon')
    .sort({ 'analytics.qualityScore': -1, createdAt: -1 });
};

// Search questions by text
questionSchema.statics.searchQuestions = function (searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    status: 'published',
  };
  
  if (options.category) query.categoryId = options.category;
  if (options.difficulty) query.difficulty = options.difficulty;
  
  return this.find(query)
    .populate('categoryId', 'name displayName')
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

// Get questions for adaptive assessment
questionSchema.statics.getAdaptiveQuestions = function (userLevel, userSkills, categoryId, count = 10) {
  return this.aggregate([
    {
      $match: {
        categoryId: new mongoose.Types.ObjectId(categoryId),
        isActive: true,
        status: 'published',
      },
    },
    {
      $addFields: {
        suitabilityScore: {
          $switch: {
            branches: [
              { case: { $eq: ['$difficulty', userLevel] }, then: 3 },
              { case: { $eq: ['$difficulty', 'intermediate'] }, then: 2 },
              { case: { $eq: ['$difficulty', 'beginner'] }, then: 1 },
            ],
            default: 1,
          },
        },
      },
    },
    {
      $sort: {
        suitabilityScore: -1,
        'analytics.qualityScore': -1,
        'analytics.discriminationIndex': -1,
      },
    },
    { $limit: count * 2 }, // Get more than needed for randomization
    { $sample: { size: count } }, // Randomize selection
  ]);
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;