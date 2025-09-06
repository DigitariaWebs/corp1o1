// models/OnboardingQuestion.js
const mongoose = require('mongoose');

const onboardingQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      unique: true,
    },

    question: {
      type: String,
      required: true,
      maxlength: 500,
    },

    description: {
      type: String,
      maxlength: 200,
    },

    type: {
      type: String,
      enum: ['multiple_choice', 'multiple_select', 'short_answer', 'essay'],
      required: true,
    },

    category: {
      type: String,
      enum: [
        'learning_style',
        'career_goals', 
        'technical_background',
        'experience_level',
        'interests',
        'motivation',
        'time_availability',
        'preferred_format',
      ],
      required: true,
    },

    // For multiple choice/select questions
    options: [
      {
        id: String,
        text: String,
        value: mongoose.Schema.Types.Mixed, // Can be string, number, or object
        weight: Number, // Weight for scoring
        category: String, // What category this option represents
        nextQuestions: [String], // Question IDs to show based on this answer
      },
    ],

    // For written answers
    expectedLength: {
      min: Number,
      max: Number,
    },

    // AI analysis prompts
    aiAnalysisPrompt: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Scoring and categorization
    scoring: {
      weight: {
        type: Number,
        default: 1,
        min: 0.1,
        max: 5,
      },
      categories: [String], // What categories this question helps determine
    },

    // Question flow control
    flow: {
      order: {
        type: Number,
        required: true,
      },
      required: {
        type: Boolean,
        default: true,
      },
      showIf: {
        questionId: String,
        answerValue: mongoose.Schema.Types.Mixed,
      },
      skipIf: {
        questionId: String,
        answerValue: mongoose.Schema.Types.Mixed,
      },
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },

    version: {
      type: String,
      default: '1.0.0',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
onboardingQuestionSchema.index({ category: 1, flow: { order: 1 } });
onboardingQuestionSchema.index({ isActive: 1 });
onboardingQuestionSchema.index({ questionId: 1 }, { unique: true });

// Static methods
onboardingQuestionSchema.statics.getOnboardingFlow = function () {
  return this.find({ isActive: true })
    .sort({ 'flow.order': 1 })
    .select('-aiAnalysisPrompt -scoring.weight -scoring.categories');
};

onboardingQuestionSchema.statics.getQuestionWithAnalysis = function (questionId) {
  return this.findOne({ questionId, isActive: true });
};

onboardingQuestionSchema.statics.getQuestionsByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ 'flow.order': 1 });
};

const OnboardingQuestion = mongoose.model('OnboardingQuestion', onboardingQuestionSchema);

module.exports = OnboardingQuestion;
