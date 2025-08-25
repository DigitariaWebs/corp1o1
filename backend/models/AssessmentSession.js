// models/AssessmentSession.js
const mongoose = require("mongoose");

// Answer schema for individual question responses
const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },

    userAnswer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, array, object, or number
      required: true,
    },

    isCorrect: {
      type: Boolean,
      default: null, // null until evaluated
    },

    pointsEarned: {
      type: Number,
      default: 0,
    },

    maxPoints: {
      type: Number,
      required: true,
    },

    // Timing data
    timeSpent: {
      type: Number, // seconds
      default: 0,
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    submitTime: {
      type: Date,
      default: null,
    },

    // AI evaluation for complex questions
    aiEvaluation: {
      score: Number,
      feedback: String,
      keyPointsIdentified: [String],
      improvementSuggestions: [String],
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      requiresHumanReview: {
        type: Boolean,
        default: false,
      },
    },

    // User behavior analytics
    analytics: {
      attempts: {
        type: Number,
        default: 1,
      },
      flaggedForReview: {
        type: Boolean,
        default: false,
      },
      hintsUsed: {
        type: Number,
        default: 0,
      },
      changedAnswer: {
        type: Boolean,
        default: false,
      },
      previousAnswers: [mongoose.Schema.Types.Mixed],
    },
  },
  { _id: true }
);

// Results schema for final assessment results
const resultsSchema = new mongoose.Schema(
  {
    // Scoring
    finalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    totalPointsEarned: {
      type: Number,
      required: true,
    },

    totalPointsPossible: {
      type: Number,
      required: true,
    },

    passingScore: {
      type: Number,
      required: true,
    },

    passed: {
      type: Boolean,
      required: true,
    },

    grade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"],
      default: null,
    },

    // Timing
    totalTimeSpent: {
      type: Number, // seconds
      required: true,
    },

    averageTimePerQuestion: {
      type: Number, // seconds
    },

    // Performance breakdown
    scoreByDifficulty: {
      beginner: { type: Number, default: 0 },
      intermediate: { type: Number, default: 0 },
      advanced: { type: Number, default: 0 },
      expert: { type: Number, default: 0 },
    },

    scoreBySkill: [
      {
        skill: String,
        score: Number,
        maxScore: Number,
        percentage: Number,
      },
    ],

    scoreByQuestionType: [
      {
        type: String,
        score: Number,
        maxScore: Number,
        percentage: Number,
      },
    ],

    // Detailed feedback
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],

    // AI-generated insights
    aiInsights: {
      overallAssessment: String,
      learningGaps: [String],
      nextSteps: [String],
      studyRecommendations: [String],
      estimatedImprovementTime: Number, // hours
      confidenceLevel: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },
  { _id: false }
);

// Main Assessment Session schema
const assessmentSessionSchema = new mongoose.Schema(
  {
    // Session identification
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    // User and assessment references
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Clerk User ID for direct lookup and faster queries
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },

    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },

    // Attempt tracking
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
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

    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Session status
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned", "timeout", "paused"],
      default: "in_progress",
    },

    // User responses
    answers: [answerSchema],

    // Session configuration (snapshot from assessment)
    sessionConfig: {
      hasTimeLimit: Boolean,
      totalTimeMinutes: Number,
      questionTimeMinutes: Number,
      allowReview: Boolean,
      showResults: String,
      adaptiveQuestioning: Boolean,
    },

    // Current progress
    progress: {
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
      completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // Time tracking
    timeTracking: {
      totalTimeSpent: {
        type: Number, // seconds
        default: 0,
      },
      questionTimes: [
        {
          questionId: String,
          timeSpent: Number,
        },
      ],
      pausedTime: {
        type: Number, // total seconds paused
        default: 0,
      },
      timeWarningShown: {
        type: Boolean,
        default: false,
      },
    },

    // Final results (populated when completed)
    results: resultsSchema,

    // User context during assessment
    userContext: {
      deviceType: String,
      browser: String,
      screenSize: String,
      timezone: String,
      learningStyle: String,
      currentLevel: String,
      recentPerformance: Number,
    },

    // Assessment environment
    environment: {
      proctored: {
        type: Boolean,
        default: false,
      },
      allowedResources: [String],
      restrictions: [String],
      securityFlags: [
        {
          type: String,
          timestamp: Date,
          description: String,
        },
      ],
    },

    // AI assistance during assessment (if enabled)
    aiAssistance: {
      hintsProvided: [
        {
          questionId: String,
          hint: String,
          timestamp: Date,
          effectiveness: Number, // user rating 1-5
        },
      ],
      clarificationsRequested: [
        {
          questionId: String,
          question: String,
          response: String,
          timestamp: Date,
        },
      ],
    },

    // Session notes and flags
    notes: {
      userNotes: String,
      systemNotes: String,
      reviewRequired: {
        type: Boolean,
        default: false,
      },
      reviewReason: String,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
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
  }
);

// Indexes for performance
assessmentSessionSchema.index({ userId: 1, assessmentId: 1, startTime: -1 });
// Unique index for sessionId is declared at field level
assessmentSessionSchema.index({ status: 1, lastActivity: -1 });
assessmentSessionSchema.index({ userId: 1, status: 1 });
assessmentSessionSchema.index({ assessmentId: 1, status: 1 });

// Virtual for session duration
assessmentSessionSchema.virtual("duration").get(function () {
  if (this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
  }
  return Math.round((new Date() - this.startTime) / (1000 * 60)); // minutes for active sessions
});

// Virtual for completion status
assessmentSessionSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

// Virtual for pass status
assessmentSessionSchema.virtual("hasPassed").get(function () {
  return this.results?.passed || false;
});

// Instance methods

// Add or update answer for a question
assessmentSessionSchema.methods.addAnswer = function (
  questionId,
  userAnswer,
  questionData
) {
  const existingAnswerIndex = this.answers.findIndex(
    (a) => a.questionId === questionId
  );

  const answerData = {
    questionId,
    userAnswer,
    maxPoints: questionData.points || 10,
    startTime: new Date(),
    submitTime: new Date(),
  };

  if (existingAnswerIndex >= 0) {
    // Update existing answer
    const existingAnswer = this.answers[existingAnswerIndex];
    existingAnswer.analytics.previousAnswers.push(existingAnswer.userAnswer);
    existingAnswer.analytics.changedAnswer = true;
    existingAnswer.analytics.attempts += 1;

    Object.assign(existingAnswer, answerData);
  } else {
    // Add new answer
    this.answers.push(answerData);
    this.progress.questionsAnswered += 1;
  }

  // Update progress
  this.progress.completionPercentage = Math.round(
    (this.progress.questionsAnswered / this.progress.totalQuestions) * 100
  );

  this.lastActivity = new Date();
  return this.save();
};

// Calculate time spent on current question
assessmentSessionSchema.methods.updateQuestionTime = function (
  questionId,
  additionalTime
) {
  const answer = this.answers.find((a) => a.questionId === questionId);
  if (answer) {
    answer.timeSpent += additionalTime;
  }

  // Update in time tracking as well
  const timeEntry = this.timeTracking.questionTimes.find(
    (t) => t.questionId === questionId
  );
  if (timeEntry) {
    timeEntry.timeSpent += additionalTime;
  } else {
    this.timeTracking.questionTimes.push({
      questionId,
      timeSpent: additionalTime,
    });
  }

  this.timeTracking.totalTimeSpent += additionalTime;
  this.lastActivity = new Date();
};

// Check if session should timeout
assessmentSessionSchema.methods.shouldTimeout = function () {
  if (
    !this.sessionConfig.hasTimeLimit ||
    !this.sessionConfig.totalTimeMinutes
  ) {
    return false;
  }

  const timeLimit = this.sessionConfig.totalTimeMinutes * 60 * 1000; // convert to milliseconds
  const elapsed =
    new Date() - this.startTime - this.timeTracking.pausedTime * 1000;

  return elapsed >= timeLimit;
};

// Pause the session
assessmentSessionSchema.methods.pause = function () {
  if (this.status === "in_progress") {
    this.status = "paused";
    this.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Resume the session
assessmentSessionSchema.methods.resume = function () {
  if (this.status === "paused") {
    this.status = "in_progress";
    this.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Complete the session and calculate results
assessmentSessionSchema.methods.complete = async function (
  finalAnswers = null
) {
  if (finalAnswers) {
    // Process any final answers
    for (const [questionId, answer] of Object.entries(finalAnswers)) {
      await this.addAnswer(questionId, answer, { points: 10 }); // Default points
    }
  }

  this.status = "completed";
  this.endTime = new Date();
  this.lastActivity = new Date();

  // Calculate results will be done by the assessment service
  // This just marks the session as complete

  return this.save();
};

// Add security flag
assessmentSessionSchema.methods.addSecurityFlag = function (
  flagType,
  description
) {
  this.environment.securityFlags.push({
    type: flagType,
    timestamp: new Date(),
    description,
  });

  // Mark for review if serious security concern
  const seriousFlags = [
    "tab_switch",
    "copy_paste",
    "unusual_timing",
    "browser_tools",
  ];
  if (seriousFlags.includes(flagType)) {
    this.notes.reviewRequired = true;
    this.notes.reviewReason = `Security flag: ${flagType}`;
  }

  return this.save();
};

// Get session summary
assessmentSessionSchema.methods.getSummary = function () {
  return {
    sessionId: this.sessionId,
    userId: this.userId,
    assessmentId: this.assessmentId,
    attemptNumber: this.attemptNumber,
    status: this.status,
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.duration,
    progress: this.progress,
    results: this.results,
    passed: this.hasPassed,
    needsReview: this.notes.reviewRequired,
  };
};

// Static methods

// Find user's assessment attempts
assessmentSessionSchema.statics.findUserAttempts = function (
  userId,
  assessmentId
) {
  return this.find({
    userId,
    assessmentId,
  })
    .sort({ attemptNumber: -1 })
    .lean();
};

// Get user's best attempt
assessmentSessionSchema.statics.findBestAttempt = function (
  userId,
  assessmentId
) {
  return this.findOne({
    userId,
    assessmentId,
    status: "completed",
  })
    .sort({ "results.finalScore": -1 })
    .lean();
};

// Find sessions requiring review
assessmentSessionSchema.statics.findSessionsForReview = function (
  options = {}
) {
  const query = {
    "notes.reviewRequired": true,
    "notes.reviewedAt": null,
  };

  if (options.assessmentId) {
    query.assessmentId = options.assessmentId;
  }

  return this.find(query)
    .populate("userId", "firstName lastName email")
    .populate("assessmentId", "title type category")
    .sort({ startTime: -1 });
};

// Get assessment session statistics
assessmentSessionSchema.statics.getSessionStatistics = function (
  assessmentId,
  timeRange = "30d"
) {
  const dateThreshold = new Date();
  switch (timeRange) {
    case "7d":
      dateThreshold.setDate(dateThreshold.getDate() - 7);
      break;
    case "30d":
      dateThreshold.setDate(dateThreshold.getDate() - 30);
      break;
    case "90d":
      dateThreshold.setDate(dateThreshold.getDate() - 90);
      break;
  }

  return this.aggregate([
    {
      $match: {
        assessmentId: new mongoose.Types.ObjectId(assessmentId),
        startTime: { $gte: dateThreshold },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgScore: { $avg: "$results.finalScore" },
        avgTime: { $avg: "$timeTracking.totalTimeSpent" },
      },
    },
  ]);
};

// Cleanup abandoned sessions
assessmentSessionSchema.statics.cleanupAbandonedSessions = async function (
  hoursOld = 24
) {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursOld);

  const result = await this.updateMany(
    {
      status: "in_progress",
      lastActivity: { $lt: cutoffTime },
    },
    {
      status: "abandoned",
      endTime: new Date(),
    }
  );

  return result.modifiedCount;
};

const AssessmentSession = mongoose.model(
  "AssessmentSession",
  assessmentSessionSchema
);

module.exports = AssessmentSession;
