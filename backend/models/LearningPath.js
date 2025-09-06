const mongoose = require('mongoose');

// Instructor schema
const instructorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [1000, 'Instructor bio cannot exceed 1000 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    expertise: [
      {
        type: String,
        trim: true,
      },
    ],
    yearsExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

// Learning path metadata schema
const metadataSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    studentsEnrolled: {
      type: Number,
      default: 0,
    },
    studentsCompleted: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    isNewlyAdded: {
      type: Boolean,
      default: false,
    },
    languages: [
      {
        type: String,
        enum: ['en', 'fr', 'es', 'de'],
        default: ['en'],
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { _id: false },
);

// Learning objectives schema
const learningObjectiveSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    measurable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

// Learning path schema
const learningPathSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Learning path title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Learning path description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Communication & Leadership',
        'Innovation & Creativity',
        'Technical Skills',
        'Business Strategy',
        'Personal Development',
        'Data & Analytics',
        'Design & UX',
        'Marketing & Sales',
      ],
    },

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: [true, 'Difficulty level is required'],
    },

    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      min: [0.5, 'Estimated hours must be at least 0.5'],
      max: [200, 'Estimated hours cannot exceed 200'],
    },

    skills: [
      {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Skill name cannot exceed 100 characters'],
      },
    ],

    learningObjectives: [learningObjectiveSchema],

    // References to learning modules (will be populated)
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningModule',
      },
    ],

    // Prerequisites for this path
    prerequisites: [
      {
        pathId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LearningPath',
        },
        title: String,
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // AI enhancement settings
    aiEnhanced: {
      type: Boolean,
      default: true,
    },

    adaptiveContent: {
      type: Boolean,
      default: true,
    },

    personalizedDifficulty: {
      type: Boolean,
      default: true,
    },

    // Instructor information
    instructor: {
      type: instructorSchema,
      required: true,
    },

    // Path metadata and statistics
    metadata: {
      type: metadataSchema,
      default: () => ({}),
    },

    // Content and media
    thumbnail: {
      type: String,
      default: null,
    },

    previewVideo: {
      type: String,
      default: null,
    },

    // Pricing (for future use)
    pricing: {
      type: {
        type: String,
        enum: ['free', 'premium', 'enterprise'],
        default: 'free',
      },
      price: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },

    // Path status and availability
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'under_review'],
      default: 'published',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Publishing information
    publishedAt: {
      type: Date,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Version control
    version: {
      type: String,
      default: '1.0.0',
    },

    // Analytics and optimization
    analytics: {
      viewCount: {
        type: Number,
        default: 0,
      },
      enrollmentConversionRate: {
        type: Number,
        default: 0,
      },
      averageCompletionTime: {
        type: Number,
        default: 0, // in hours
      },
      satisfactionScore: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
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

// Indexes for performance optimization
learningPathSchema.index({
  title: 'text',
  description: 'text',
  skills: 'text',
});
learningPathSchema.index({ category: 1, difficulty: 1 });
learningPathSchema.index({ 'metadata.featured': 1, 'metadata.rating': -1 });
learningPathSchema.index({ 'metadata.trending': 1, createdAt: -1 });
learningPathSchema.index({ status: 1, isActive: 1 });
learningPathSchema.index({ createdAt: -1 });
learningPathSchema.index({ 'metadata.studentsEnrolled': -1 });

// Virtual for module count
learningPathSchema.virtual('moduleCount').get(function () {
  return this.modules ? this.modules.length : 0;
});

// Virtual for completion rate calculation
learningPathSchema.virtual('calculatedCompletionRate').get(function () {
  if (this.metadata.studentsEnrolled === 0) return 0;
  return Math.round(
    (this.metadata.studentsCompleted / this.metadata.studentsEnrolled) * 100,
  );
});

// Pre-save middleware to update lastUpdated
learningPathSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

// Pre-save middleware to set publishedAt
learningPathSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === 'published' &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// Instance method to check if user meets prerequisites
learningPathSchema.methods.checkPrerequisites = function (
  userCompletedPaths = [],
) {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return { met: true, missing: [] };
  }

  const missing = this.prerequisites.filter((prereq) => {
    if (!prereq.required) return false;
    return !userCompletedPaths.includes(prereq.pathId.toString());
  });

  return {
    met: missing.length === 0,
    missing: missing.map((prereq) => ({
      pathId: prereq.pathId,
      title: prereq.title,
    })),
  };
};

// Instance method to calculate difficulty score
learningPathSchema.methods.getDifficultyScore = function () {
  const difficultyScores = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };
  return difficultyScores[this.difficulty] || 1;
};

// Instance method to get personalized recommendation score
learningPathSchema.methods.getPersonalizationScore = function (userProfile) {
  let score = 0;

  // Base rating score (40% weight)
  score += (this.metadata.rating / 5) * 40;

  // Difficulty match (30% weight)
  const userLevel = userProfile.skillLevel || 'beginner';
  const difficultyMatch = this.difficulty === userLevel ? 30 : 15;
  score += difficultyMatch;

  // Category interest (20% weight)
  if (
    userProfile.interestedCategories &&
    userProfile.interestedCategories.includes(this.category)
  ) {
    score += 20;
  }

  // Skills match (10% weight)
  if (userProfile.targetSkills) {
    const skillMatch = this.skills.some((skill) =>
      userProfile.targetSkills.some((targetSkill) =>
        skill.toLowerCase().includes(targetSkill.toLowerCase()),
      ),
    );
    if (skillMatch) score += 10;
  }

  return Math.min(100, Math.round(score));
};

// Instance method to update analytics
learningPathSchema.methods.incrementView = function () {
  this.analytics.viewCount += 1;
  return this.save();
};

// Static method to get featured paths
learningPathSchema.statics.getFeatured = function (limit = 10) {
  return this.find({
    'metadata.featured': true,
    status: 'published',
    isActive: true,
  })
    .sort({ 'metadata.rating': -1, 'metadata.studentsEnrolled': -1 })
    .limit(limit)
    .populate('modules', 'title duration difficulty');
};

// Static method to get trending paths
learningPathSchema.statics.getTrending = function (limit = 10) {
  return this.find({
    'metadata.trending': true,
    status: 'published',
    isActive: true,
  })
    .sort({ 'analytics.viewCount': -1, createdAt: -1 })
    .limit(limit)
    .populate('modules', 'title duration difficulty');
};

// Static method to search paths
learningPathSchema.statics.searchPaths = function (query, filters = {}) {
  const searchQuery = {
    status: 'published',
    isActive: true,
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Apply filters
  if (filters.category) searchQuery.category = filters.category;
  if (filters.difficulty) searchQuery.difficulty = filters.difficulty;
  if (filters.minRating)
    searchQuery['metadata.rating'] = { $gte: filters.minRating };
  if (filters.maxHours) searchQuery.estimatedHours = { $lte: filters.maxHours };
  if (filters.skills && filters.skills.length > 0) {
    searchQuery.skills = { $in: filters.skills };
  }

  return this.find(searchQuery);
};

// Static method to get paths by category
learningPathSchema.statics.getByCategory = function (category, limit = 20) {
  return this.find({
    category,
    status: 'published',
    isActive: true,
  })
    .sort({ 'metadata.rating': -1, 'metadata.studentsEnrolled': -1 })
    .limit(limit)
    .populate('modules', 'title duration difficulty');
};

// Static method to get recommended paths for user
learningPathSchema.statics.getRecommendations = function (
  userProfile,
  limit = 10,
) {
  return this.find({
    status: 'published',
    isActive: true,
  })
    .sort({ 'metadata.rating': -1, 'metadata.studentsEnrolled': -1 })
    .limit(limit * 2) // Get more to filter and sort
    .then((paths) => {
      // Calculate personalization scores and sort
      const scoredPaths = paths.map((path) => ({
        path,
        score: path.getPersonalizationScore(userProfile),
      }));

      return scoredPaths
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.path);
    });
};

const LearningPath = mongoose.model('LearningPath', learningPathSchema);

module.exports = LearningPath;
