// models/OnboardingSession.js
const mongoose = require("mongoose");

const onboardingAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    answer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, array, or object
      required: true,
    },

    answerType: {
      type: String,
      enum: ["multiple_choice", "multiple_select", "short_answer", "essay"],
      required: true,
    },

    // AI analysis of the answer
    aiAnalysis: {
      score: Number, // 0-100 score
      confidence: Number, // 0-100 confidence
      insights: [String], // Key insights extracted
      categories: [String], // Categories this answer suggests
      recommendations: [String], // AI recommendations
      requiresFollowUp: Boolean, // Whether this needs more questions
    },

    // Metadata
    timeSpent: Number, // seconds
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const onboardingSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clerkUserId: {
      type: String, // Clerk user ID
      required: true,
    },

    // Session status
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },

    // User responses
    answers: [onboardingAnswerSchema],

    // AI-generated profile
    aiProfile: {
      learningStyle: {
        primary: String,
        secondary: String,
        confidence: Number,
        reasoning: String,
      },
      experienceLevel: {
        overall: String,
        technical: String,
        business: String,
        confidence: Number,
        reasoning: String,
      },
      careerGoals: [String],
      interests: [String],
      motivation: String,
      timeAvailability: String,
      preferredFormat: String,
      strengths: [String],
      areasForGrowth: [String],
      recommendedPaths: [String],
    },

    // Generated assessments
    generatedAssessments: [
      {
        assessmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assessment",
        },
        title: String,
        description: String,
        category: String,
        difficulty: String,
        reason: String, // Why this assessment was recommended
        priority: Number, // 1-3 priority level
        questions: [String], // Question IDs for this assessment
      },
    ],

    // Session metadata
    startTime: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    totalTime: Number, // Total time in seconds

    // Progress tracking
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    questionsAnswered: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    // AI processing status
    aiProcessingStatus: {
      profileAnalysis: {
        status: String, // pending, processing, completed, failed
        startedAt: Date,
        completedAt: Date,
        error: String,
      },
      assessmentGeneration: {
        status: String, // pending, processing, completed, failed
        startedAt: Date,
        completedAt: Date,
        error: String,
      },
    },

    // Session notes
    notes: {
      userNotes: String,
      systemNotes: String,
      aiNotes: String,
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
  }
);

// Indexes for performance
onboardingSessionSchema.index({ userId: 1, status: 1 });
onboardingSessionSchema.index({ clerkUserId: 1 });
// Unique index for sessionId is declared at field level
onboardingSessionSchema.index({ status: 1, createdAt: -1 });

// Virtual for completion percentage
onboardingSessionSchema.virtual("completionPercentage").get(function () {
  if (this.totalQuestions === 0) return 0;
  return Math.round((this.questionsAnswered / this.totalQuestions) * 100);
});

// Virtual for session duration
onboardingSessionSchema.virtual("duration").get(function () {
  if (this.completedAt) {
    return Math.round((this.completedAt - this.startTime) / 1000);
  }
  return Math.round((new Date() - this.startTime) / 1000);
});

// Instance methods
onboardingSessionSchema.methods.addAnswer = function (questionId, question, answer, answerType, timeSpent = 0) {
  const existingAnswerIndex = this.answers.findIndex(a => a.questionId === questionId);
  
  const answerData = {
    questionId,
    question,
    answer,
    answerType,
    timeSpent,
    submittedAt: new Date(),
  };

  if (existingAnswerIndex >= 0) {
    // Update existing answer
    this.answers[existingAnswerIndex] = answerData;
  } else {
    // Add new answer
    this.answers.push(answerData);
    this.questionsAnswered += 1;
  }

  this.currentQuestionIndex = Math.min(this.currentQuestionIndex + 1, this.totalQuestions);
  this.lastActivity = new Date();

  return this.save();
};

onboardingSessionSchema.methods.complete = function () {
  this.status = "completed";
  this.completedAt = new Date();
  this.totalTime = this.duration;
  return this.save();
};

onboardingSessionSchema.methods.getNextQuestion = function () {
  if (this.currentQuestionIndex >= this.totalQuestions) {
    return null; // All questions answered
  }
  return this.currentQuestionIndex;
};

onboardingSessionSchema.methods.getProgress = function () {
  return {
    currentQuestion: this.currentQuestionIndex + 1,
    totalQuestions: this.totalQuestions,
    completionPercentage: this.completionPercentage,
    questionsAnswered: this.questionsAnswered,
    status: this.status,
  };
};

// Static methods
onboardingSessionSchema.statics.findByClerkUserId = function (clerkUserId) {
  return this.findOne({ clerkUserId, status: { $ne: "abandoned" } });
};

onboardingSessionSchema.statics.findActiveSession = function (userId) {
  return this.findOne({ userId, status: "in_progress" });
};

onboardingSessionSchema.statics.getUserOnboardingHistory = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

const OnboardingSession = mongoose.model("OnboardingSession", onboardingSessionSchema);

module.exports = OnboardingSession;
