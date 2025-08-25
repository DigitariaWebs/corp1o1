// models/RecommendationEngine.js
const mongoose = require("mongoose");

const recommendationEngineSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Recommendation details
    type: {
      type: String,
      enum: [
        "next_module",
        "learning_path",
        "review_content",
        "skill_development",
        "schedule_optimization",
        "difficulty_adjustment",
        "ai_personality",
        "study_break",
        "peer_collaboration",
        "assessment_timing",
      ],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Communication & Leadership",
        "Innovation & Creativity",
        "Technical Skills",
        "Business Strategy",
        "Personal Development",
        "Data & Analytics",
        "General",
      ],
      required: true,
    },

    // Recommendation content
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    actionable: {
      primaryAction: {
        type: String,
        required: true,
        maxlength: 100,
      },
      secondaryActions: [
        {
          type: String,
          maxlength: 100,
        },
      ],
      deepLink: {
        type: String, // URL or route to specific content
        maxlength: 500,
      },
    },

    // Recommendation scoring
    relevanceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },

    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },

    priorityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },

    // Combined recommendation strength
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    // Recommendation context
    context: {
      // Current user state when recommendation was generated
      currentModule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningModule",
      },
      currentPath: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningPath",
      },
      userProgress: {
        overallCompletion: {
          type: Number,
          min: 0,
          max: 100,
        },
        currentPathProgress: {
          type: Number,
          min: 0,
          max: 100,
        },
        strugglingAreas: [String],
        strengths: [String],
      },
      learningPatterns: {
        optimalLearningTime: {
          hour: Number,
          dayOfWeek: Number,
        },
        preferredSessionLength: Number, // minutes
        engagementLevel: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
    },

    // Recommendation targeting
    targeting: {
      // Specific content/module this recommendation relates to
      targetContent: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "targeting.targetContentType",
      },
      targetContentType: {
        type: String,
        enum: ["LearningPath", "LearningModule", "Assessment"],
      },

      // Skills this recommendation aims to develop
      targetSkills: [String],

      // Difficulty level this recommendation addresses
      targetDifficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },

      // Learning style optimization
      learningStyleOptimization: {
        type: String,
        enum: ["visual", "auditory", "kinesthetic", "reading", "adaptive"],
      },
    },

    // Generation details
    generatedBy: {
      algorithm: {
        type: String,
        enum: [
          "collaborative_filtering",
          "content_based",
          "hybrid",
          "ai_driven",
          "rule_based",
        ],
        required: true,
      },
      version: {
        type: String,
        default: "1.0",
      },
      factors: [
        {
          name: String,
          weight: {
            type: Number,
            min: 0,
            max: 1,
          },
          value: Number,
        },
      ],
    },

    // User interaction tracking
    userInteraction: {
      status: {
        type: String,
        enum: [
          "pending",
          "viewed",
          "accepted",
          "declined",
          "dismissed",
          "expired",
        ],
        default: "pending",
      },
      viewedAt: Date,
      respondedAt: Date,
      response: {
        type: String,
        enum: ["accepted", "declined", "maybe_later", "not_interested"],
      },
      feedback: {
        helpfulness: {
          type: Number,
          min: 1,
          max: 5,
        },
        relevance: {
          type: Number,
          min: 1,
          max: 5,
        },
        timing: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
      },
      actionTaken: {
        type: Boolean,
        default: false,
      },
      actionTakenAt: Date,
    },

    // Effectiveness tracking
    effectiveness: {
      // Did this recommendation lead to positive outcomes?
      improvedEngagement: {
        type: Boolean,
        default: false,
      },
      improvedPerformance: {
        type: Boolean,
        default: false,
      },
      completedSuggestedAction: {
        type: Boolean,
        default: false,
      },

      // Measured impact (filled after user follows recommendation)
      impact: {
        engagementChange: {
          type: Number, // percentage change
          min: -100,
          max: 100,
        },
        performanceChange: {
          type: Number, // percentage change
          min: -100,
          max: 100,
        },
        timeToComplete: {
          type: Number, // days to complete suggested action
        },
      },
    },

    // Scheduling and lifecycle
    timing: {
      generatedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },
      validUntil: {
        type: Date,
        required: true,
      },
      suggestedTiming: {
        type: String,
        enum: ["immediate", "today", "this_week", "next_week", "flexible"],
      },
      isUrgent: {
        type: Boolean,
        default: false,
      },
    },

    // Personalization
    personalization: {
      // User preference alignment
      matchesPreferences: {
        type: Number,
        min: 0,
        max: 100,
      },

      // Similar users who benefited from this recommendation
      similarUserSuccess: {
        type: Number,
        min: 0,
        max: 100,
      },

      // Customized messaging based on user profile
      personalizedMessage: {
        type: String,
        maxlength: 300,
      },
    },

    // Metadata
    version: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
recommendationEngineSchema.index({
  user: 1,
  "userInteraction.status": 1,
  "timing.generatedAt": -1,
});
recommendationEngineSchema.index({ type: 1, category: 1 });
recommendationEngineSchema.index({ overallScore: -1 });
recommendationEngineSchema.index({ "timing.validUntil": 1 }); // For cleanup
recommendationEngineSchema.index({ "targeting.targetContent": 1 });

// Virtual for time remaining until expiration
recommendationEngineSchema.virtual("timing.timeRemaining").get(function () {
  const now = new Date();
  const remaining = this.timing.validUntil.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24))); // days
});

// Virtual for recommendation age
recommendationEngineSchema.virtual("timing.age").get(function () {
  const now = new Date();
  const age = now.getTime() - this.timing.generatedAt.getTime();
  return Math.ceil(age / (1000 * 60 * 60 * 24)); // days
});

// Virtual for is expired
recommendationEngineSchema.virtual("timing.isExpired").get(function () {
  return new Date() > this.timing.validUntil;
});

// Calculate overall score before saving
recommendationEngineSchema.pre("save", function (next) {
  // Weight the scores to create overall recommendation strength
  const relevanceWeight = 0.4;
  const confidenceWeight = 0.3;
  const priorityWeight = 0.3;

  this.overallScore = Math.round(
    this.relevanceScore * relevanceWeight +
      this.confidenceScore * confidenceWeight +
      this.priorityScore * priorityWeight
  );

  // Ensure valid until date is set
  if (!this.timing.validUntil) {
    const defaultValidDays =
      this.timing.suggestedTiming === "immediate"
        ? 1
        : this.timing.suggestedTiming === "today"
        ? 2
        : this.timing.suggestedTiming === "this_week"
        ? 7
        : this.timing.suggestedTiming === "next_week"
        ? 14
        : 30;

    this.timing.validUntil = new Date(
      Date.now() + defaultValidDays * 24 * 60 * 60 * 1000
    );
  }

  next();
});

// Static method to get active recommendations for user
recommendationEngineSchema.statics.getActiveRecommendations = async function (
  userId,
  limit = 10
) {
  return this.find({
    user: userId,
    "userInteraction.status": { $in: ["pending", "viewed"] },
    "timing.validUntil": { $gt: new Date() },
  })
    .sort({ overallScore: -1, "timing.generatedAt": -1 })
    .limit(limit)
    .populate("targeting.targetContent")
    .lean();
};

// Static method to get recommendations by type
recommendationEngineSchema.statics.getRecommendationsByType = async function (
  userId,
  type,
  limit = 5
) {
  return this.find({
    user: userId,
    type,
    "userInteraction.status": { $in: ["pending", "viewed"] },
    "timing.validUntil": { $gt: new Date() },
  })
    .sort({ overallScore: -1 })
    .limit(limit)
    .lean();
};

// Static method to get recommendation effectiveness stats
recommendationEngineSchema.statics.getEffectivenessStats = async function (
  timeRange = 30
) {
  const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        "timing.generatedAt": { $gte: startDate },
        "userInteraction.status": { $ne: "pending" },
      },
    },
    {
      $group: {
        _id: "$type",
        totalRecommendations: { $sum: 1 },
        acceptedRecommendations: {
          $sum: {
            $cond: [{ $eq: ["$userInteraction.response", "accepted"] }, 1, 0],
          },
        },
        averageRelevanceScore: { $avg: "$relevanceScore" },
        averageConfidenceScore: { $avg: "$confidenceScore" },
        averageFeedbackHelpfulness: {
          $avg: "$userInteraction.feedback.helpfulness",
        },
        improvedEngagement: {
          $sum: { $cond: ["$effectiveness.improvedEngagement", 1, 0] },
        },
        improvedPerformance: {
          $sum: { $cond: ["$effectiveness.improvedPerformance", 1, 0] },
        },
      },
    },
    {
      $addFields: {
        acceptanceRate: {
          $multiply: [
            { $divide: ["$acceptedRecommendations", "$totalRecommendations"] },
            100,
          ],
        },
      },
    },
  ]);
};

// Instance method to mark as viewed
recommendationEngineSchema.methods.markAsViewed = async function () {
  if (this.userInteraction.status === "pending") {
    this.userInteraction.status = "viewed";
    this.userInteraction.viewedAt = new Date();
    await this.save();
  }
};

// Instance method to record user response
recommendationEngineSchema.methods.recordResponse = async function (
  response,
  feedback = null
) {
  this.userInteraction.response = response;
  this.userInteraction.respondedAt = new Date();

  if (response === "accepted") {
    this.userInteraction.status = "accepted";
  } else if (response === "declined" || response === "not_interested") {
    this.userInteraction.status = "declined";
  } else {
    this.userInteraction.status = "dismissed";
  }

  if (feedback) {
    this.userInteraction.feedback = feedback;
  }

  await this.save();
  return this;
};

// Instance method to record action taken
recommendationEngineSchema.methods.recordActionTaken = async function () {
  this.userInteraction.actionTaken = true;
  this.userInteraction.actionTakenAt = new Date();
  this.effectiveness.completedSuggestedAction = true;
  await this.save();
};

// Instance method to update effectiveness metrics
recommendationEngineSchema.methods.updateEffectiveness = async function (
  impactData
) {
  Object.assign(this.effectiveness.impact, impactData);

  // Determine if recommendation led to improvements
  if (impactData.engagementChange > 5) {
    this.effectiveness.improvedEngagement = true;
  }

  if (impactData.performanceChange > 5) {
    this.effectiveness.improvedPerformance = true;
  }

  await this.save();
};

// Static method to clean up expired recommendations
recommendationEngineSchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    {
      "timing.validUntil": { $lt: new Date() },
      "userInteraction.status": { $in: ["pending", "viewed"] },
    },
    {
      $set: { "userInteraction.status": "expired" },
    }
  );

  return result.modifiedCount;
};

// Static method to generate personalized recommendations
recommendationEngineSchema.statics.generateRecommendations = async function (
  userId,
  context,
  maxRecommendations = 5
) {
  // This would typically integrate with ML models or rule engines
  const User = mongoose.model("User");
  const LearningAnalytics = mongoose.model("LearningAnalytics");

  const user = await User.findById(userId);
  const analytics = await LearningAnalytics.getLatestAnalytics(userId);

  if (!user || !analytics) {
    throw new Error("User or analytics data not found");
  }

  const recommendations = [];

  // Generate different types of recommendations based on user state
  if (analytics.progress.completionRate < 50) {
    recommendations.push({
      type: "schedule_optimization",
      title: "Optimize Your Learning Schedule",
      description:
        "Based on your learning patterns, we recommend adjusting your study schedule for better results.",
      relevanceScore: 85,
      confidenceScore: 70,
      priorityScore: 80,
    });
  }

  if (analytics.engagement.focusScore < 60) {
    recommendations.push({
      type: "difficulty_adjustment",
      title: "Content Difficulty Adjustment",
      description:
        "We notice you might benefit from content that better matches your current skill level.",
      relevanceScore: 90,
      confidenceScore: 75,
      priorityScore: 85,
    });
  }

  if (analytics.aiInteraction.satisfactionScore < 3) {
    recommendations.push({
      type: "ai_personality",
      title: "Try a Different AI Assistant Style",
      description:
        "Switch to a different AI personality that might better match your learning preferences.",
      relevanceScore: 70,
      confidenceScore: 65,
      priorityScore: 60,
    });
  }

  // Create and save recommendation documents
  const createdRecommendations = [];
  for (const rec of recommendations.slice(0, maxRecommendations)) {
    const recommendation = new this({
      user: userId,
      ...rec,
      category: context.category || "General",
      actionable: {
        primaryAction: "View Details",
        deepLink: `/recommendations/${rec.type}`,
      },
      context: {
        currentModule: context.currentModule,
        currentPath: context.currentPath,
        userProgress: {
          overallCompletion: analytics.progress.completionRate,
          currentPathProgress: context.currentPathProgress || 0,
        },
      },
      generatedBy: {
        algorithm: "rule_based",
        version: "1.0",
      },
      timing: {
        suggestedTiming: "this_week",
      },
    });

    await recommendation.save();
    createdRecommendations.push(recommendation);
  }

  return createdRecommendations;
};

module.exports = mongoose.model(
  "RecommendationEngine",
  recommendationEngineSchema
);
