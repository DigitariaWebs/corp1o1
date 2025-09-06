const mongoose = require('mongoose');

// Skill category schema for organizing different types of skills
const skillCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },

    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Category description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    icon: {
      type: String,
      default: 'Code', // Lucide icon name
    },

    color: {
      type: String,
      default: '#22d3ee', // Revolutionary cyan
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    },

    // Category type for organization
    type: {
      type: String,
      enum: ['technical', 'creative', 'business', 'soft-skills', 'language', 'certification'],
      required: true,
    },

    // Difficulty levels available in this category
    difficultyLevels: [
      {
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: String,
        minScore: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
        maxScore: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
      },
    ],

    // Related skills/technologies in this category
    skills: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: String,
        tags: [String],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Prerequisites for assessments in this category
    prerequisites: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SkillCategory',
        },
        minLevel: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        description: String,
      },
    ],

    // Assessment configuration
    assessmentConfig: {
      // Time limits
      defaultTimeLimit: {
        type: Number, // in minutes
        default: 60,
        min: 15,
        max: 180,
      },

      // Question distribution
      questionsPerLevel: {
        beginner: { type: Number, default: 5, min: 1, max: 20 },
        intermediate: { type: Number, default: 5, min: 1, max: 20 },
        advanced: { type: Number, default: 3, min: 1, max: 15 },
        expert: { type: Number, default: 2, min: 1, max: 10 },
      },

      // Scoring configuration
      passingScore: {
        type: Number,
        default: 70,
        min: 50,
        max: 95,
      },

      // AI evaluation settings
      aiEvaluation: {
        enabled: {
          type: Boolean,
          default: true,
        },
        provider: {
          type: String,
          enum: ['openai', 'anthropic', 'gemini'],
          default: 'openai',
        },
        model: {
          type: String,
          default: 'gpt-4',
        },
        promptTemplate: String,
      },

      // Retake policy
      retakePolicy: {
        allowed: {
          type: Boolean,
          default: true,
        },
        cooldownPeriod: {
          type: Number, // in hours
          default: 24,
        },
        maxAttempts: {
          type: Number,
          default: 3,
          min: 1,
          max: 10,
        },
      },
    },

    // Category statistics
    statistics: {
      totalAssessments: {
        type: Number,
        default: 0,
      },
      totalQuestions: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      averageCompletionTime: {
        type: Number, // in minutes
        default: 0,
      },
      popularityRank: {
        type: Number,
        default: 0,
      },
    },

    // Admin settings
    isActive: {
      type: Boolean,
      default: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // Meta information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    version: {
      type: String,
      default: '1.0.0',
    },

    tags: [String],

    metadata: {
      industryRelevance: [String], // Industries where this skill is relevant
      jobRoles: [String], // Job roles that require this skill
      certificationBodies: [String], // External certification providers
      averageSalary: {
        currency: { type: String, default: 'EUR' },
        range: {
          min: Number,
          max: Number,
        },
      },
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

// Indexes for performance
// Unique indexes are declared at field level for name and slug
skillCategorySchema.index({ type: 1 });
skillCategorySchema.index({ isActive: 1, isPublic: 1 });
skillCategorySchema.index({ isFeatured: 1, sortOrder: 1 });
skillCategorySchema.index({ 'skills.name': 1 });
skillCategorySchema.index({ tags: 1 });
skillCategorySchema.index({ createdAt: -1 });

// Virtual for assessment count
skillCategorySchema.virtual('assessmentCount', {
  ref: 'Assessment',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
});

// Virtual for question count
skillCategorySchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
});

// Pre-save middleware to generate slug
skillCategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to validate difficulty levels
skillCategorySchema.pre('save', function (next) {
  if (this.difficultyLevels && this.difficultyLevels.length > 0) {
    for (let level of this.difficultyLevels) {
      if (level.minScore >= level.maxScore) {
        next(new Error('Minimum score must be less than maximum score'));
        return;
      }
    }
  }
  next();
});

// Static method to get categories by type
skillCategorySchema.statics.getByType = function (type, includeInactive = false) {
  const query = { type };
  if (!includeInactive) {
    query.isActive = true;
    query.isPublic = true;
  }
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

// Static method to get featured categories
skillCategorySchema.statics.getFeatured = function () {
  return this.find({
    isFeatured: true,
    isActive: true,
    isPublic: true,
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to search categories
skillCategorySchema.statics.search = function (query, options = {}) {
  const searchQuery = {
    $and: [
      { isActive: true, isPublic: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'skills.name': { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } },
        ],
      },
    ],
  };

  if (options.type) {
    searchQuery.$and.push({ type: options.type });
  }

  return this.find(searchQuery)
    .sort({ popularityRank: -1, name: 1 })
    .limit(options.limit || 20);
};

// Instance method to check if user can take assessment
skillCategorySchema.methods.canUserTakeAssessment = function (userSkills = []) {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return { allowed: true };
  }

  for (let prerequisite of this.prerequisites) {
    const userSkill = userSkills.find(
      (skill) => skill.categoryId.toString() === prerequisite.categoryId.toString(),
    );

    if (!userSkill || !this.meetsLevelRequirement(userSkill.level, prerequisite.minLevel)) {
      return {
        allowed: false,
        reason: `Requires ${prerequisite.minLevel} level in ${prerequisite.categoryId}`,
        missingPrerequisite: prerequisite,
      };
    }
  }

  return { allowed: true };
};

// Helper method to compare skill levels
skillCategorySchema.methods.meetsLevelRequirement = function (userLevel, requiredLevel) {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
};

// Instance method to get recommended difficulty for user
skillCategorySchema.methods.getRecommendedDifficulty = function (userHistory = []) {
  if (userHistory.length === 0) {
    return 'beginner';
  }

  // Calculate average score from recent assessments
  const recentScores = userHistory.slice(-3).map((h) => h.score);
  const averageScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  // Recommend based on performance
  if (averageScore >= 90) return 'expert';
  if (averageScore >= 80) return 'advanced';
  if (averageScore >= 70) return 'intermediate';
  return 'beginner';
};

const SkillCategory = mongoose.model('SkillCategory', skillCategorySchema);

module.exports = SkillCategory;